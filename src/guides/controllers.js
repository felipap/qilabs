var MD_LOCATION, assert, async, converter, fs, getChildrenRoutes, getParentPath, getRootPath, guideData, guideMap, id, isParentPath, join, pages, path, processMap, q, showdown, val, _;

_ = require('underscore');

async = require('async');

showdown = require('showdown');

assert = require('assert');

fs = require('fs');

path = require('path');

MD_LOCATION = 'texts';

processMap = function(_map) {
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
  for (k in _map) {
    v = _map[k];
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

guideMap = processMap(require('./texts/map.js'));

guideData = {};

join = path.join;

isParentPath = function(testParent, gpath) {
  console.log('gpath', gpath);
  console.log('parent', testParent);
  return (gpath + '/').lastIndexOf(testParent + '/', 0) === 0;
};

getRootPath = function(gpath) {
  return gpath.match(/^\/?[\w-]+/)[0];
};

getParentPath = function(gpath) {
  return path.normalize(gpath + '/..');
};

getChildrenRoutes = function(children) {
  var gpath, routes, value;
  routes = {};
  for (gpath in children) {
    value = children[gpath];
    routes[gpath] = {
      name: 'guide_' + gpath.replace('/', '_'),
      get: (function(gpath, value) {
        return function(req, res) {
          var pathTree, _ref;
          console.log(JSON.stringify(guideData[gpath], null, 4), '\n\n\n');
          if ((_ref = getParentPath(gpath)) !== '' && _ref !== '/') {
            console.log('here', guideData[gpath]);
            pathTree = _.clone(guideData[getRootPath(gpath)].children);
            _.each(pathTree, function(e, k, l) {
              if (isParentPath(k, gpath)) {
                console.log('gpath', gpath, 'k', k, isParentPath(k, gpath));
                return [];
              } else {
                return delete e.children;
              }
            });
          } else {
            pathTree = _.clone(guideData[gpath].children);
            _.each(pathTree, function(e, k, l) {
              return delete e.children;
            });
          }
          console.log('tree', JSON.stringify(pathTree, null, 4));
          return res.render('guides/page', {
            guideData: guideData,
            guide: guideData[gpath],
            tree: pathTree
          });
        };
      })(gpath, value)
    };
    if (value.children) {
      _.extend(routes, getChildrenRoutes(value.children));
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
    children: getChildrenRoutes(guideMap)
  }
};

converter = new showdown.converter();

q = async.queue((function(item, cb) {
  var absPath, childVal, gpath, _ref;
  _ref = item.children;
  for (gpath in _ref) {
    childVal = _ref[gpath];
    q.push(_.extend(childVal, {
      parentPath: join(item.parentPath, item.id),
      path: join('/guias', gpath)
    }));
  }
  absPath = path.resolve(__dirname, MD_LOCATION, item.file);
  return fs.readFile(absPath, 'utf8', function(err, fileContent) {
    if (!fileContent) {
      throw "WTF, file " + item.id + " of path " + absPath + " wasn't found";
    }
    guideData[join(item.parentPath, item.id)] = _.extend({
      html: converter.makeHtml(fileContent)
    }, item);
    return cb();
  });
}), 3);

q.drain = function() {};

for (id in guideMap) {
  val = guideMap[id];
  q.push(_.extend({
    id: id,
    parentPath: '/'
  }, val));
}

module.exports = pages;
