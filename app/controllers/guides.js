
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

var marked = require('marked')
var renderer = new marked.Renderer()

renderer.html = function (html) {
	// Remove markdown comments
	// console.log('html, dude', html)
	if (html.match(/^\s*<!--([\s\S]*?)-->\s*$/)) {
		return ''
	}
	return html
}

function removeComments(content) {
	return content.replace(/\s*<!--[\S\s]*-->/, '')
}


function renderMarkdown(content) {
	return marked(removeComments(content), {
		renderer: renderer,
	})
}


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

		var isRoot = node.absolutePath.slice(1).indexOf('/') === -1;

		if (!node.file) { // Nodes with children may not have a file.
			next()
			return
		}

		if (node.redirect) { // No need to process redirect nodes
			next()
			return
		}

		var obj = clone(node)

		obj.url = '/guias'+obj.absolutePath;

		function readLab(cb) {
			if (isRoot && obj.labId) {
				if (!(obj.labId in labs)) {
					throw new Error('Referenced labId \''+obj.labId+'\' in guide \''+
						obj.name+'\' doesn\'t exist.')
				}
				obj.lab = _.pick(labs[obj.labId], ['name', 'path', 'icon'])
				obj.background = obj.background || labs[obj.labId].background;
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
				obj.notes = renderMarkdown(fileContent)
				cb()
			})
		}

		function readFile(cb) {
			if (!node.file) {
				throw new Error('Node '+node.id+' doesn\'t own a file.')
			}

			var filePath = pathLib.resolve(__dirname, MD_LOCATION, node.file)
			fs.readFile(filePath, 'utf8', function(err, fileContent) {
				if (!fileContent) {
					throw new Error('File '+filePath+' from node '+node.id+' not found.')
				}
				obj.html = renderMarkdown(fileContent)
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

	function getRootId(gpath) {
		return gpath.match(/^\/?([\w-]+)/)[1]
	}

	function getParentPath(gpath) {
		return pathLib.normalize(gpath+'/..')
	}

	if (!children) {
		return {}
	}

	children.forEach((node) => {
		if (node.children) {
			_.extend(routes, genChildrenRoutes(node.children))
		}

		if (!node.redirect && !node.file) {
			// console.log(node.id)
			return;
			throw new Error("No redirect and no file? WTF?");
		}

		if (node.redirect) {
			routes[node.absolutePath] = function(req, res) {
				res.redirect(pathLib.join('/guias', node.redirect))
			}
		}

		routes[node.absolutePath] = function(req, res) {
			var parent = getParentPath(node.absolutePath)

			res.render('guides/page', {
				gpath: node.absolutePath,
				guidePage: guideData[node.absolutePath],
				guideRoot: guideData[getRootPath(node.absolutePath)],
			})
		}
	})

	return routes
}

// A nested tree of the guide pages, having their absolute path as keys
var guideMap = absolutify(require('app/static/guias/map.js'))
var guideData = {}

module.exports = function(app) {
	logger.info("Registering guide routes")

	var router = require('express').Router()
	var frontPageData = []

	buildGuideData(guideMap, function(data) {
		guideData = data

		// Generate frontPageData
		for (let url in data) {
			if (url.slice(1).indexOf('/') !== -1) {
				// Ignore all but root-level urls
				continue;
			}

			let gdata = data[url]
			if (!gdata.hide) {
				var newone = _.pick(gdata,
					['id', 'lab', 'url', 'name', 'contributors', 'background']);
				frontPageData.push(newone);
			}
		}
	})

	router.get('/', function(req, res) {
		res.render('guides/index', {
			guides: frontPageData
		})
	})

	var routes = genChildrenRoutes(guideMap)
	for (let path in routes) {
		router.get(path, routes[path])
	}

	router.get('/contribua', function(req, res) {
		if (req.user) {
			return res.redirect('/links/contribua')
		}
		res.redirect('/#auth')
	})

	return router
}