
'use strict'

var mongoose = require('mongoose')
var pathLib = require('path')
var assert = require('assert')
var bunyan = require('bunyan')
var async = require('async')
var clone = require('clone')
var fs = require('fs')
var _ = require('lodash')

var labs = require('app/static/labs')

var User = mongoose.model('User')

var logger = global.logger.mchild()

// Folder with markdown files
const MD_LOCATION = pathLib.normalize(__dirname+'/../static/guias')

class Renderer {
	constructor() {
		this.marked = require('marked')
		var renderer = new this.marked.Renderer()

		renderer.html = function (html) {
			// Remove markdown comments
			if (html.match(/^\s*<!--([\s\S]*?)-->\s*$/)) {
				return ''
			}
			return html
		}

		this.marked.setOptions({
			renderer: renderer
		})
	}

	render(content) {
		return this.marked(content)
	}
}

var renderer = new Renderer;


/*
 * This routine does two very important things:
 * 1. makes the relative map keys into their absolute path
 * 2. adds the old maps keys to the nodes as their 'id' attribute
*/
function absolutify(rmap) {

	function checkValidPath(path) {
		return true
	}

	function checkValidNode(node) {
		assert(node.name, "A name attribute must be provided. "+
			JSON.stringify(node))
		return true
	}

	function updateChildren(pre, children) {
		if (!children) {
			return {}
		}
		var cs = {}
		for (k in children) {
			var v = children[k]
			checkValidPath(pathLib.join(pre, k))
			checkValidNode(v)
			cs[pathLib.join(pre, k)] = _.extend(v, {
				id: k,
				children: updateChildren(pathLib.join(pre, k), v.children),
			})
		}
		return cs
	}

	var map = {}
	for (var k in rmap) {
		var value = rmap[k]
		if (k[0] !== '/') {
			k = '/'+k
		}

		checkValidPath(k)
		checkValidNode(value)

		map[k] = _.extend(value, {
			id: k,
			children: updateChildren(k, value.children),
		})
	}

	return map
}

/*
 * Process map.js to open markdown files and save their html in guideData
 */
function buildGuideData(map, cb) {
	logger.info("Opening map of guides")
	var data = {}

	var q = async.queue(function(item, next) {
		for (var gpath in item.children) {
			var childVal = item.children[gpath]
			q.push(_.extend(childVal, {
				parentPath: pathLib.join(item.parentPath, item.id),
				path: childVal.file ? pathLib.join('/guias', gpath) : undefined
			}))
		}

		if (!item.file) { // Nodes with children may not have a file.
			return next()
		}

		if (item.redirect) { // No need to process redirect nodes
			return next()
		}

		var obj = clone(item)

		function readLab(cb) {
			if (item.parentPath === '/' && obj.labId) {
				// item.parentPath is '/' and console.log obj.name, obj.labId
				if (!(obj.labId in labs)) {
					throw new Error('Referenced labId \''+obj.labId+'\' in guide \''+
						obj.name+'\' doesn\'t exist.')
				}
				obj.lab = _.pick(labs[obj.labId], ['name', 'path', 'icon', 'background'])
			}
			cb()
		}

		function readNotes(cb) {
			if (!item.notes) {
				return cb()
			}
			var filePath = pathLib.resolve(__dirname, MD_LOCATION, item.notes)
			fs.readFile(filePath, 'utf8', function(err, fileContent) {
				if (!fileContent) {
					throw 'WTF, file '+filePath+' from id '+item.id+' wasn\'t found'
				}
				obj.notes = renderer.render(fileContent)
				cb()
			})
		}

		function readFile(cb) {
			if (!item.file && !item.children) {
				throw 'Node '+item+' doesn\'t have a file attribute.'
			}
			var filePath = pathLib.resolve(__dirname, MD_LOCATION, item.file)
			fs.readFile(filePath, 'utf8', function(err, fileContent) {
				if (!fileContent) {
					throw 'WTF, file '+filePath+' from id '+item.id+' wasn\'t found'
				}
				obj.html = renderer.render(fileContent)
				obj.linkSource = "https://github.com/QI-Labs/guias/tree/master/"+item.file
				cb()
			})
		}

		function readUsers(cb) {
			if (item.contributors) {
				async.map(item.contributors, function(id, done) {
					User.findOne({ _id: id })
						.select('username name avatar_url avatarUrl profile')
						.exec(function(err, user) {
							if (err) {
								throw err
							}
							if (!user) {
								logger.warn("Couldn't find contributor with id:", id)
							}
							done(err, user)
						})
				}, function(err, results) {
					if (err) {
						console.error(err)
					}
					obj.contributors = _.map(_.filter(results, i => i), u => u.toJSON())
					cb()
				})
			} else {
				cb()
			}
		}

		function readAuthor(cb) {
			if (item.author) {
				User.findOne({ _id: item.author })
					.select('username name avatar_url avatarUrl profile')
					.exec(function(err, user) {
						if (err) {
							throw err
						}
						if (!user) {
							logger.warn("Couldn't find author with id:", id)
						} else {
							obj.author = user.toJSON()
							cb()
						}
					})
			} else {
				cb()
			}
		}

		async.series([readFile, readUsers, readAuthor, readLab, readNotes],
			function(err, results) {
				data[pathLib.join(item.parentPath, item.id)] = obj
				next()
			})
	}, 3)

	q.drain = function() {
		cb(data)
	}

	for (var id in map) {
		var val = map[id]
		q.push(_.extend({
			id:id,
			parentPath:'/',
			path: pathLib.join('/guias', id)
		}, val))
	}
}

/*
 * Process map.js to generate nested express routes
 */
function genChildrenRoutes(children) {
	var routes = {}

	function isParentPath(testParent, gpath) {
		return (gpath+'/').lastIndexOf(testParent+'/', 0) === 0
	}

	function getRootPath(gpath) {
		return gpath.match(/^\/?[\w-]+/)[0]
	}

	function getParentPath(gpath) {
		return pathLib.normalize(gpath+'/..')
	}

	if (!children) {
		return {}
	}

	for (let gpath in children) {
		let value = children[gpath]

		if (value.children) {
			_.extend(routes, genChildrenRoutes(value.children))
		}

		if (!value.redirect && !value.file) {
			continue
		}

		if (value.redirect) {
			return function(req, res) {
				res.redirect(pathLib.join('/guias', value.redirect))
			}
		}

		routes[gpath] = function(req, res) {
			var parent = getParentPath(gpath)
			if (parent === '' && parent === '/') {
				// Is root node ('/vestibular', '/olimpiadas', ...)
				// pathTree = JSON.parse(JSON.stringify(guideData[gpath].children))
				var pathTree = _.cloneDeep(guideData[gpath].children)
				_.each(pathTree, function(e, k, l) {
					e.hasChildren = !_.isEmpty(e.children)
				})
			} else {
				// Hack to deep clone object (_.clone doesn't)
				// pathTree = JSON.parse(JSON.stringify(guideData[getRootPath(gpath)].children))
				var pathTree = _.cloneDeep(guideData[getRootPath(gpath)].children)
				_.each(pathTree, function(e, k, l) {
						e.hasChildren = !_.isEmpty(e.children)
						if (isParentPath(k, gpath)) {
							e.isOpen = k !== gpath
						} else {
							e.isOpen = false
						}
					})
			}

			res.render('guides/page', {
				guideData: guideData,
				guideNode: guideData[gpath],
				root: guideData[getRootPath(gpath)],
				tree: pathTree,
			})
		}
	}

	return routes
}

// A nested tree of the guide pages, having their absolute path as keys
var guideMap = absolutify(require('app/static/guias/map.js'))
var guideData = {}

module.exports = function(app) {
	logger.info("Registering guide routes")

	var guides = require('express').Router()
	var frontPageData = []

	buildGuideData(guideMap, function(data) {
		guideData = data

		// Generate frontPageData
		for (let url in data) {
			// Ignore all but root-level urls
			if (url.slice(1).indexOf('/') !== -1) {
				continue
			}
			let gdata = data[url]
			if (!gdata.hide) {
				var newone = _.pick(gdata, ['id','path','lab', 'name','contributors'])
				newone.id = newone.id.slice(1)
				frontPageData.push(newone)
			}
		}
	})

	guides.use(function(req, res, next) {
		logger.info("<"+(req.user && req.user.username || 'anonymous@'+
			req.connection.remoteAddress)+">: HTTP "+req.method+" /guias"+req.url)
		next()
	})

	guides.get('/', function(req, res) {
		res.render('guides/index', {
			guides: frontPageData
		})
	})

	var routes = genChildrenRoutes(guideMap)
	for (let path in routes) {
		guides.get(path, routes[path])
	}

	guides.get('/contribua', function(req, res) {
		if (req.user) {
			return res.redirect('/links/contribua')
		}
		res.redirect('/#auth')
	})

	return guides
}