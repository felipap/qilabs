
# TODO:
# - detect duplicate ids
# - test valid guides ids: /[a-z\-]{3,}/
# - alert not specified attributes

_  = require 'underscore'
async = require 'async'
marked = require 'marked'
assert = require 'assert'
bunyan = require 'bunyan'
fs = require 'fs'
pathLib = require 'path'

mongoose = require 'mongoose'
Resource = mongoose.model('Resource')
User = Resource.model('User')

# Folder with markdown files
MD_LOCATION = 'texts'

renderer = new marked.Renderer

renderer.html = (html) ->
	# Remove markdown comments
	if html.match(/^\s*<!--([\s\S]*?)-->\s*$/)
		return ''
	return html

marked.setOptions({
	renderer: renderer
})

###
This routine does two very important things:
- makes the rmap (relative map) keys into their absolute path
- adds the old maps keys to the nodes as their 'id' attribute
###
absolutify = (rmap) ->

	checkValidPath = (path) ->
		true

	checkValidNode = (node) ->
		assert node.name, "A name attribute must be provided. "+JSON.stringify(node)
		true

	map = {}
	updateChildren = (pre, children) ->
		return {} unless children
		cs = {} 
		for k, v of children
			checkValidPath(pathLib.join(pre, k))
			checkValidNode(v)
			cs[pathLib.join(pre, k)] = _.extend(v, {
				id: k
				children: updateChildren(pathLib.join(pre, k), v.children)
			})
		return cs

	for k, v of rmap
		if k[0] isnt '/' then k = '/'+k

		checkValidPath(k)
		checkValidNode(v)

		map[k] = _.extend(v, {
			id: k
			children: updateChildren(k, v.children)
		})
	return map

# A nested tree of the guide pages, having their absolute path as keys
guideMap = absolutify(require './texts/map.js')
# 
guideData = {}

###
## Process map.js to open markdown files and save their html in guideData
###
openMap = (map, cb) ->
	data = {}

	q = async.queue ((item, next) ->
		for gpath, childVal of item.children
			q.push _.extend(childVal, {
				parentPath: pathLib.join(item.parentPath, item.id)
				path: pathLib.join('/guias', gpath)
			})

		if item.redirect # No need to process redirect nodes
			return next()

		obj = _.clone(item)

		readNotes = (cb) ->
			unless item.notes
				return cb()
			filePath = pathLib.resolve(__dirname, MD_LOCATION, item.notes)
			fs.readFile filePath, 'utf8', (err, fileContent) ->
				if not fileContent
					throw "WTF, file #{filePath} from id #{item.id} wasn't found"
				obj.notes = marked(fileContent)
				cb()

		readFile = (cb) ->
			unless item.file
				throw "Node #{item} doesn't have a file attribute."
			filePath = pathLib.resolve(__dirname, MD_LOCATION, item.file)
			fs.readFile filePath, 'utf8', (err, fileContent) ->
				if not fileContent
					throw "WTF, file #{filePath} from id #{item.id} wasn't found"
				obj.html = marked(fileContent)
				cb()

		readUsers = (cb) ->
			if item.contributors
				async.map item.contributors, ((id, done) ->
					User.findOne({ _id: id })
						.select('username name avatar_url profile')
						.exec (err, user) ->
							if not err and not user
								console.log("Couldn't find contributor with id:", id)
							done(err, user)
				), (err, results) ->
					if err
						console.error(err)
					cnts = []
					for user in results
						if user
							cnts.push(user.toJSON())
					obj.contributors = cnts
					cb()
			else
				cb()

		async.series [readFile, readUsers, readNotes], (err, results) ->
			data[pathLib.join(item.parentPath, item.id)] = obj
			next()

	), 3

	for id, val of guideMap
		q.push(_.extend({
			id:id,
			parentPath:'/',
			path: pathLib.join('/guias',id)
		}, val))
	
	q.drain = () -> cb(data)

###
## Process map.js to generate nested routes
###
genChildrenRoutes = (children) ->
	routes = {}
	
	isParentPath = (testParent, gpath) ->
		# console.log 'gpath', gpath
		# console.log 'parent', testParent
		(gpath+'/').lastIndexOf(testParent+'/', 0) is 0

	getRootPath = (gpath) ->
		gpath.match(/^\/?[\w-]+/)[0]

	getParentPath = (gpath) ->
		pathLib.normalize(gpath+'/..')

	for gpath, value of children
		routes[gpath] = do (gpath, value) ->
			(req, res) ->
				if value.redirect
					return res.redirect pathLib.join('/guias', value.redirect)

				# Not root node ('/vestibular', '/olimpiadas', ...)
				if getParentPath(gpath) not in ['', '/']
					# Hack to deep clone object (_.clone doesn't)
					pathTree = JSON.parse(JSON.stringify(guideData[getRootPath(gpath)].children))
					_.each pathTree, (e, k, l) ->
						e.hasChildren = !_.isEmpty(e.children)
						if isParentPath(k, gpath)
							e.isOpen = k isnt gpath
						else
							e.isOpen = false
				else
					pathTree = JSON.parse(JSON.stringify(guideData[gpath].children))
					_.each pathTree, (e, k, l) ->
						e.hasChildren = !_.isEmpty(e.children)

				res.render 'guides/page', {
					guideData: guideData,
					guideNode: guideData[gpath],
					root: guideData[getRootPath(gpath)]
					tree: pathTree
				}
		if value.children
			_.extend(routes, genChildrenRoutes(value.children))

	return routes

module.exports = (app) ->
	logger = app.get('logger').child({child: 'Guides'})
	logger.info "Registering guide routes"

	guides = require('express').Router()

	logger.info "Opening map of guides"
	openMap guideMap, (data) ->
		guideData = data

	guides.get '/', (req, res) ->
		res.render 'guides/home', {}
		
	guides.get '/contribua', (req, res) ->
		if req.user
			return res.render 'guides/contribute', {}
		res.redirect('/#auth')

	for path, func of genChildrenRoutes(guideMap)
		guides.get(path, func)

	return guides