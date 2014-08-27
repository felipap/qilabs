var MD_LOCATION, Resource, User, absolutify, assert, async, bunyan, fs, genChildrenRoutes, guideData, guideMap, marked, mongoose, openMap, pathLib, renderer, _;

_ = require('underscore');

async = require('async');

marked = require('marked');

assert = require('assert');

bunyan = require('bunyan');

fs = require('fs');

pathLib = require('path');

mongoose = require('mongoose');

Resource = mongoose.model('Resource');

User = Resource.model('User');

MD_LOCATION = 'texts';

renderer = new marked.Renderer;

renderer.html = function(html) {
  if (html.match(/^\s*<!--([\s\S]*?)-->\s*$/)) {
    return '';
  }
  return html;
};

marked.setOptions({
  renderer: renderer
});


/*
This routine does two very important things:
- makes the rmap (relative map) keys into their absolute path
- adds the old maps keys to the nodes as their 'id' attribute
 */

absolutify = function(rmap) {
  var checkValidNode, checkValidPath, k, map, updateChildren, v;
  checkValidPath = function(path) {
    return true;
  };
  checkValidNode = function(node) {
    assert(node.name, "A name attribute must be provided. " + JSON.stringify(node));
    return true;
  };
  map = {};
  updateChildren = function(pre, children) {
    var cs, k, v;
    if (!children) {
      return {};
    }
    cs = {};
    for (k in children) {
      v = children[k];
      checkValidPath(pathLib.join(pre, k));
      checkValidNode(v);
      cs[pathLib.join(pre, k)] = _.extend(v, {
        id: k,
        children: updateChildren(pathLib.join(pre, k), v.children)
      });
    }
    return cs;
  };
  for (k in rmap) {
    v = rmap[k];
    if (k[0] !== '/') {
      k = '/' + k;
    }
    checkValidPath(k);
    checkValidNode(v);
    map[k] = _.extend(v, {
      id: k,
      children: updateChildren(k, v.children)
    });
  }
  return map;
};

guideMap = absolutify(require('./texts/map.js'));

guideData = {};


/*
 *# Process map.js to open markdown files and save their html in guideData
 */

openMap = function(map, cb) {
  var data, id, q, val;
  data = {};
  q = async.queue((function(item, next) {
    var childVal, gpath, obj, readFile, readNotes, readUsers, _ref;
    _ref = item.children;
    for (gpath in _ref) {
      childVal = _ref[gpath];
      q.push(_.extend(childVal, {
        parentPath: pathLib.join(item.parentPath, item.id),
        path: pathLib.join('/guias', gpath)
      }));
    }
    if (item.redirect) {
      return next();
    }
    obj = _.clone(item);
    readNotes = function(cb) {
      var filePath;
      if (!item.notes) {
        return cb();
      }
      filePath = pathLib.resolve(__dirname, MD_LOCATION, item.notes);
      return fs.readFile(filePath, 'utf8', function(err, fileContent) {
        if (!fileContent) {
          throw "WTF, file " + filePath + " from id " + item.id + " wasn't found";
        }
        obj.notes = marked(fileContent);
        return cb();
      });
    };
    readFile = function(cb) {
      var filePath;
      if (!item.file) {
        throw "Node " + item + " doesn't have a file attribute.";
      }
      filePath = pathLib.resolve(__dirname, MD_LOCATION, item.file);
      return fs.readFile(filePath, 'utf8', function(err, fileContent) {
        if (!fileContent) {
          throw "WTF, file " + filePath + " from id " + item.id + " wasn't found";
        }
        obj.html = marked(fileContent);
        return cb();
      });
    };
    readUsers = function(cb) {
      if (item.contributors) {
        return async.map(item.contributors, (function(id, done) {
          return User.findOne({
            _id: id
          }).select('username name avatar_url profile').exec(function(err, user) {
            if (!err && !user) {
              console.log("Couldn't find contributor with id:", id);
            }
            return done(err, user);
          });
        }), function(err, results) {
          var cnts, user, _i, _len;
          if (err) {
            console.error(err);
          }
          cnts = [];
          for (_i = 0, _len = results.length; _i < _len; _i++) {
            user = results[_i];
            if (user) {
              cnts.push(user.toJSON());
            }
          }
          obj.contributors = cnts;
          return cb();
        });
      } else {
        return cb();
      }
    };
    return async.series([readFile, readUsers, readNotes], function(err, results) {
      data[pathLib.join(item.parentPath, item.id)] = obj;
      return next();
    });
  }), 3);
  for (id in guideMap) {
    val = guideMap[id];
    q.push(_.extend({
      id: id,
      parentPath: '/',
      path: pathLib.join('/guias', id)
    }, val));
  }
  return q.drain = function() {
    return cb(data);
  };
};


/*
 *# Process map.js to generate nested routes
 */

genChildrenRoutes = function(children) {
  var getParentPath, getRootPath, gpath, isParentPath, routes, value;
  routes = {};
  isParentPath = function(testParent, gpath) {
    return (gpath + '/').lastIndexOf(testParent + '/', 0) === 0;
  };
  getRootPath = function(gpath) {
    return gpath.match(/^\/?[\w-]+/)[0];
  };
  getParentPath = function(gpath) {
    return pathLib.normalize(gpath + '/..');
  };
  for (gpath in children) {
    value = children[gpath];
    routes[gpath] = (function(gpath, value) {
      return function(req, res) {
        var pathTree, _ref;
        if (value.redirect) {
          return res.redirect(pathLib.join('/guias', value.redirect));
        }
        if ((_ref = getParentPath(gpath)) !== '' && _ref !== '/') {
          pathTree = JSON.parse(JSON.stringify(guideData[getRootPath(gpath)].children));
          _.each(pathTree, function(e, k, l) {
            e.hasChildren = !_.isEmpty(e.children);
            if (isParentPath(k, gpath)) {
              return e.isOpen = k !== gpath;
            } else {
              return e.isOpen = false;
            }
          });
        } else {
          pathTree = JSON.parse(JSON.stringify(guideData[gpath].children));
          _.each(pathTree, function(e, k, l) {
            return e.hasChildren = !_.isEmpty(e.children);
          });
        }
        return res.render('guides/page', {
          guideData: guideData,
          guideNode: guideData[gpath],
          root: guideData[getRootPath(gpath)],
          tree: pathTree
        });
      };
    })(gpath, value);
    if (value.children) {
      _.extend(routes, genChildrenRoutes(value.children));
    }
  }
  return routes;
};

module.exports = function(app) {
  var func, guides, logger, path, _ref;
  logger = app.get('logger').child({
    controller: 'Guides'
  });
  logger.info("Registering guide routes");
  guides = require('express').Router();
  logger.info("Opening map of guides");
  openMap(guideMap, function(data) {
    return guideData = data;
  });
  guides.get('/', function(req, res) {
    return res.render('guides/home', {});
  });
  guides.get('/contribua', function(req, res) {
    if (req.user) {
      return res.render('guides/contribute', {});
    }
    return res.redirect('/#auth');
  });
  _ref = genChildrenRoutes(guideMap);
  for (path in _ref) {
    func = _ref[path];
    guides.get(path, func);
  }
  return guides;
};
