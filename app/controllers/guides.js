
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

var renderer = new Renderer

/*
 * This routine adds a absolutePath attribute to each guides node.
 */
function absolutify(rmap) {

	function assertPathIsValid(path) {
		return true
	}

	function assertNodeIsValid(node) {
		assert(node.name, "A name attribute must be provided. "+
			JSON.stringify(node))
		return true
	}

	function updateChildren(node) {
		if (!node.children || node.children.length === 0) {
			return []
		}

		node.children.forEach((childNode) => {
			var apath = pathLib.join(node.absolutePath, childNode.id)
			assertPathIsValid(apath)
			childNode.absolutePath = apath
			updateChildren(childNode)
		})
	}

	rmap.forEach((guideNode) => {
		assertNodeIsValid(guideNode)

		guideNode.absolutePath = '/'+guideNode.id
		updateChildren(guideNode)
	})

	return rmap
}

/*
 * Process map.js to open markdown files and save their html in guideData
 */
function buildGuideData(map, cb) {
	logger.info("Opening map of guides")

	var data = {}

	var q = async.queue(function(node, next) {

		if (node.children) {
			node.children.forEach((cnode) => q.push(cnode))
		}

		// node.children.forEach()
		// for (var gpath in item.children) {
		// 	var childVal = item.children[gpath]
		// 	q.push(_.extend(childVal, {
		// 		parentPath: pathLib.join(item.parentPath, item.id),
		// 		path: childVal.file ? pathLib.join('/guias', gpath) : undefined
		// 	}))
		// }

		if (!node.file) { // Nodes with children may not have a file.
			return next()
		}

		if (node.redirect) { // No need to process redirect nodes
			return next()
		}

		var obj = clone(node)

		function readLab(cb) {
			if (node.parentPath === '/' && obj.labId) {
				// node.parentPath is '/' and console.log obj.name, obj.labId
				if (!(obj.labId in labs)) {
					throw new Error('Referenced labId \''+obj.labId+'\' in guide \''+
						obj.name+'\' doesn\'t exist.')
				}
				obj.lab = _.pick(labs[obj.labId], ['name', 'path', 'icon', 'background'])
			}
			cb()
		}

		function readNotes(cb) {
			if (!node.notes) {
				return cb()
			}
			var filePath = pathLib.resolve(__dirname, MD_LOCATION, node.notes)
			fs.readFile(filePath, 'utf8', function(err, fileContent) {
				if (!fileContent) {
					throw 'WTF, file '+filePath+' from id '+node.id+' wasn\'t found'
				}
				obj.notes = renderer.render(fileContent)
				cb()
			})
		}

		function readFile(cb) {
			if (!node.file && !node.children) {
				throw 'Node '+node+' doesn\'t have a file attribute.'
			}
			var filePath = pathLib.resolve(__dirname, MD_LOCATION, node.file)
			fs.readFile(filePath, 'utf8', function(err, fileContent) {
				if (!fileContent) {
					throw 'WTF, file '+filePath+' from id '+node.id+' wasn\'t found'
				}
				obj.html = renderer.render(fileContent)
				obj.linkSource = "https://github.com/QI-Labs/guias/tree/master/"+node.file
				cb()
			})
		}

		function readUsers(cb) {
			if (node.contributors) {
				async.map(node.contributors, function(id, done) {
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
			if (node.author) {
				User.findOne({ _id: node.author })
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
				data[node.absolutePath] = obj
				next()
			})
	}, 3)

	q.drain = function() {
		console.log(data)
		cb(data)
	}

	map.forEach((guideNode) => {
		q.push(guideNode)
	})
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
			// if (parent === '' && parent === '/') {
			// 	// Is root node ('/vestibular', '/olimpiadas', ...)
			// 	// pathTree = JSON.parse(JSON.stringify(guideData[gpath].children))
			// 	var pathTree = _.cloneDeep(guideData[gpath].children)
			// 	_.each(pathTree, function(e, k, l) {
			// 		e.hasChildren = !_.isEmpty(e.children)
			// 	})
			// } else {
			// 	// Hack to deep clone object (_.clone doesn't)
			// 	// pathTree = JSON.parse(JSON.stringify(guideData[getRootPath(gpath)].children))
			// 	var pathTree = _.cloneDeep(guideData[getRootPath(gpath)].children)
			// 	_.each(pathTree, function(e, k, l) {
			// 			e.hasChildren = !_.isEmpty(e.children)
			// 			if (isParentPath(k, gpath)) {
			// 				e.isOpen = k !== gpath
			// 			} else {
			// 				e.isOpen = false
			// 			}
			// 		})
			// }

			res.render('guides/page', {
				gpath: gpath,
				guideData: guideData,
				guideNode: guideData[gpath],
				groot: guideData[getRootPath(gpath)],
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