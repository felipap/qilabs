var MD_LOCATION, absolutify, assert, async, fs, genChildrenRoutes, guideData, guideMap, openMap, pages, path, showdown, _;

_ = require('underscore');

async = require('async');

showdown = require('showdown');

assert = require('assert');

fs = require('fs');

path = require('path');

MD_LOCATION = 'texts';


/*
This routine does two very important things:
- makes the rmap (relative map) keys into their absolute path
- adds the old maps keys to the nodes as their 'id' attribute
 */

absolutify = function(rmap) {
  var checkValidNode, checkValidPath, joinIds, k, map, updateChildren, v;
  checkValidPath = function(path) {
    return true;
  };
  checkValidNode = function(node) {
    assert(node.name, "A name attribute must be provided. " + JSON.stringify(node));
    return true;
  };
  map = {};
  joinIds = path.join;
  updateChildren = function(pre, children) {
    var cs, k, v;
    if (!children) {
      return {};
    }
    cs = {};
    for (k in children) {
      v = children[k];
      checkValidPath(joinIds(pre, k));
      checkValidNode(v);
      cs[joinIds(pre, k)] = _.extend(v, {
        id: k,
        children: updateChildren(joinIds(pre, k), v.children)
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
  var converter, data, id, join, q, val;
  data = {};
  converter = new showdown.converter();
  join = path.join;
  q = async.queue((function(item, next) {
    var absPath, childVal, gpath, _ref;
    _ref = item.children;
    for (gpath in _ref) {
      childVal = _ref[gpath];
      q.push(_.extend(childVal, {
        parentPath: join(item.parentPath, item.id),
        path: join('/guias', gpath)
      }));
    }
    if (!item.file) {
      if (item.redirect) {
        next();
        return;
      }
      throw "Node " + item + " doesn't have a file attribute.";
    }
    absPath = path.resolve(__dirname, MD_LOCATION, item.file);
    return fs.readFile(absPath, 'utf8', function(err, fileContent) {
      if (!fileContent) {
        throw "WTF, file " + absPath + " from id " + item.id + " wasn't found";
      }
      data[join(item.parentPath, item.id)] = _.extend({
        html: converter.makeHtml(fileContent)
      }, item);
      return next();
    });
  }), 3);
  for (id in guideMap) {
    val = guideMap[id];
    q.push(_.extend({
      id: id,
      parentPath: '/'
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
    return path.normalize(gpath + '/..');
  };
  for (gpath in children) {
    value = children[gpath];
    routes[gpath] = {
      name: 'guide_' + gpath.replace('/', '_'),
      get: (function(gpath, value) {
        return function(req, res) {
          var pathTree, _ref;
          if (value.redirect) {
            res.redirect(path.join('/guias', value.redirect));
            return;
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
      })(gpath, value)
    };
    if (value.children) {
      _.extend(routes, genChildrenRoutes(value.children));
    }
  }
  return routes;
};

pages = {
  '/guias': {
    name: 'guides_page',
    get: function(req, res) {
      return res.render('guides/home', {});
    },
    children: genChildrenRoutes(guideMap)
  }
};

openMap(guideMap, function(data) {
  return guideData = data;
});

module.exports = pages;
