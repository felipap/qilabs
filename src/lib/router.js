
/*
** router.js
** for qilabs.org
** by @f03lipe
**
** Route an object with many pages.
**
** Usage:
** routePages({
**    'path': {
**        name: 'name', // Optional, to be used with app.locals.getPageUrl
**        permissions: [required.login,] // Decorators to attach to all children
**        get: function (req, res) { ... }
**        ...
**        children: { ... } // same structure, but with relative paths
**    }
** });
*/

var _ = require('underscore');

function absPathToUrlName (url) {
	// var parts = url.match(/($(\/)?|\/)[\w_]+/gi)
	return url.split('/').join('_');
}

function expectArray (obj) {
	if (typeof obj === 'undefined')
		return [];
	if (obj instanceof Array)
		return obj;
	return [obj];
}

module.exports = function Router (app) {

	var joinPath = require('path').join.bind(require('path'));
	// app.locals.urls = (app.locals && app.locals.urls) || {};

	function routePath (path, name, routerNode, middlewares) {
		// if (app.locals.urls[name]) {
		// 	console.warn("Overriding path of name "+name+". "+app.locals.urls[name]+" → "+path+".");
		// }
		// app.locals.urls[name] = path;
		var httpMethods = routerNode.methods;
		
		// Use app[get/post/put/...] to route methods in routerNode
		var HTTP_METHODS = ['get', 'post', 'delete', 'put'];
		for (var i=0; i<HTTP_METHODS.length; i++) {
			var method = HTTP_METHODS[i];
			if (routerNode[method]) {
				var calls = routerNode[method];
				app[method].apply(app, [path].concat(middlewares||[]).concat(calls));
			}
		}
	}

	function routeChildren(parentPath, childs, middlewares) {
		if (!childs) return {};
		middlewares = middlewares || [];
		// Type-check just to make sure.
		console.assert(middlewares instanceof Array, middlewares);

		for (var relpath in childs)
		if (childs.hasOwnProperty(relpath)) {
			// Join with parent's path to get abspath.
			var abspath = joinPath(parentPath, relpath);
			// Name is self-assigned or path with dashed instead of slashes.
			var name = childs[relpath].name || absPathToUrlName(abspath);
			// Permissions are parent's + child's ones
			// Make sure they are unique. Why call the same permission multiple times?
			var newMiddlewares = _.uniq(middlewares
				.concat(expectArray(childs[relpath].permissions))
				.concat(expectArray(childs[relpath].use)));
			
			routePath(abspath, name, childs[relpath], newMiddlewares);
			routeChildren(abspath, childs[relpath].children, newMiddlewares);
		}
	}

	return function (object) {
		var middlewares = _.uniq(expectArray(object.use).concat(expectArray(object.permissions)));
		routeChildren('/', object, middlewares);
	}
}