
# TODO:
# - detect duplicate ids
# - test valid guides ids: /[a-z\-]{3,}/
# - alert not specified attributes

_  = require 'underscore'
async = require 'async'
marked = require 'marked'
assert = require 'assert'

mongoose = require 'mongoose'
Resource = mongoose.model('Resource')
User = Resource.model('User')

fs = require 'fs'
path = require 'path'

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
	joinIds = path.join
	updateChildren = (pre, children) ->
		return {} unless children
		cs = {} 
		for k, v of children
			checkValidPath(joinIds(pre, k))
			checkValidNode(v)
			cs[joinIds(pre, k)] = _.extend(v, {
				id: k
				children: updateChildren(joinIds(pre, k), v.children)
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
	join = path.join

	q = async.queue ((item, next) ->
		# console.log "<queue> processing item:", item.id

		for gpath, childVal of item.children
			q.push _.extend(childVal, {
				parentPath: join(item.parentPath, item.id)
				path: join('/guias', gpath)
			})

		if item.redirect
			# No need to process redirect nodes
			next()
			return

		obj = _.clone(item)

		readNotes = (cb) ->
			unless item.notes
				cb()
				return
			filePath = path.resolve(__dirname, MD_LOCATION, item.notes)
			fs.readFile filePath, 'utf8', (err, fileContent) ->
				if not fileContent
					throw "WTF, file #{filePath} from id #{item.id} wasn't found"
				obj.notes = marked(fileContent)
				cb()

		readFile = (cb) ->
			unless item.file
				throw "Node #{item} doesn't have a file attribute."
			filePath = path.resolve(__dirname, MD_LOCATION, item.file)
			fs.readFile filePath, 'utf8', (err, fileContent) ->
				if not fileContent
					throw "WTF, file #{filePath} from id #{item.id} wasn't found"
				obj.html = marked(fileContent)
				cb()

		readUsers = (cb) ->
			if item.contributors
				cnts = []
				User.find {_id: { $in: item.contributors }}
					.select 'facebookId username avatarUrl name id'
					.exec (err, docs) ->
						if err
							console.error(err)
						for user in docs
							cnts.push(user.toJSON())
						obj.contributors = cnts
						cb()
			else
				cb()

		async.series [readFile, readUsers, readNotes], (err, results) ->
			data[join(item.parentPath, item.id)] = obj
			next()

	), 3

	for id, val of guideMap
		q.push(_.extend({
			id:id,
			parentPath:'/',
			path: join('/guias',id)
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
		path.normalize(gpath+'/..')

	for gpath, value of children
		routes[gpath] = {
			name: 'guide_'+gpath.replace('/','_')
			get: do (gpath, value) ->
				(req, res) ->
					# console.log "AQUI", gpath, JSON.stringify(guideData[gpath], null, 4), '\n\n\n'
					# console.log 'gpath', gpath, getParentPath(gpath), getRootPath(gpath)

					if value.redirect
						res.redirect path.join('/guias', value.redirect)
						return

					# Not root node ('/vestibular', '/olimpiadas', ...)
					if getParentPath(gpath) not in ['', '/']
						# console.log 'here', guideData[gpath]
						# Hack to deep clone object (_.clone doesn't)
						# console.log "kk", gpath, getRootPath(gpath), guideData
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

					# console.log 'tree', JSON.stringify(pathTree, null, 4)
					# console.log guideData[getRootPath(gpath)]

					res.render 'guides/page', {
						guideData: guideData,
						guideNode: guideData[gpath],
						root: guideData[getRootPath(gpath)]
						tree: pathTree
					}
			}
		if value.children
			_.extend(routes, genChildrenRoutes(value.children))

	return routes

# console.log 'map', JSON.stringify(guideMap, null, 4), '\n\n'
# console.log 'daaaaaaaaaaaaaaaaaaa', JSON.stringify(pages.children, null, 4), '\n\n'

pages = {
	'/guias': {
		name: 'guides_page'
		get: (req, res) ->
			res.render 'guides/home', {}
		children: genChildrenRoutes(guideMap)
	}
	'/guias/contribua': {
		name: 'guide_contribute',
		get: (req, res) ->
			if req.user
				res.render 'guides/contribute', {}
			else
				res.redirect('/#auth')
	}
}

openMap guideMap, (data) ->
	guideData = data

# console.log pages
module.exports = pages