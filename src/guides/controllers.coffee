
# TODO:
# - detect duplicate ids
# - test valid guides ids: /[a-z\-]{3,}/

_  = require 'underscore'
async = require 'async'
showdown = require 'showdown'
assert = require 'assert'
fs = require 'fs'
path = require 'path'

# Folder with markdown files
MD_LOCATION = 'texts'

processMap = (_map) ->
	# This routine does two very important things:
	# - makes the map keys their absolute path
	# - adds the old maps keys as the 'id' attribute 

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

	for k, v of _map
		if k[0] isnt '/' then k = '/'+k

		checkValidPath(k)
		checkValidNode(v)

		map[k] = _.extend(v, {
			id: k
			children: updateChildren(k, v.children)
		})
	return map

guideMap = processMap(require './texts/map.js')
guideData = {}

join = path.join

####
## Process map.js to create routes

isParentPath = (testParent, gpath) ->
	console.log 'gpath', gpath
	console.log 'parent', testParent
	(gpath+'/').lastIndexOf(testParent+'/', 0) is 0

getRootPath = (gpath) ->
	gpath.match(/^\/?[\w-]+/)[0]

getParentPath = (gpath) ->
	path.normalize(gpath+'/..')

getChildrenRoutes = (children) ->
	routes = {}

	for gpath, value of children
		routes[gpath] = {
			name: 'guide_'+gpath.replace('/','_')
			get: do (gpath, value) ->
					(req, res) ->
						console.log JSON.stringify(guideData[gpath], null, 4), '\n\n\n'
						# console.log 'gpath', gpath, getParentPath(gpath), getRootPath(gpath)

						# Not root node ('/vestibular', '/olimpiadas', ...)
						if getParentPath(gpath) not in ['', '/']
							console.log 'here', guideData[gpath]
							pathTree = _.clone(guideData[getRootPath(gpath)].children)
							_.each pathTree, (e, k, l) ->
								if isParentPath(k, gpath)
									console.log 'gpath', gpath, 'k', k, isParentPath(k, gpath)
									[]
								else
									delete e.children
						else
							pathTree = _.clone(guideData[gpath].children)
							_.each pathTree, (e, k, l) -> delete e.children

						console.log 'tree', JSON.stringify(pathTree, null, 4)

						res.render 'guides/page', {
							guideData: guideData,
							guide: guideData[gpath],
							tree: pathTree
						}
			}
		if value.children
			_.extend(routes, getChildrenRoutes(value.children))

	return routes

pages = {
	'/guias': {
		name: 'guides_page'
		get: (req, res) ->
			# res.endJson req.app.routes
			res.render 'guides/home', {}
		children: getChildrenRoutes(guideMap)
	}
}

# console.log 'map', JSON.stringify(guideMap, null, 4), '\n\n'
# console.log 'daaaaaaaaaaaaaaaaaaa', JSON.stringify(pages.children, null, 4), '\n\n'

#### 
## Process map.js to open markdown files and save their html in guideData

converter = new showdown.converter()

q = async.queue ((item, cb) ->
	# console.log "<queue> processing item:", item.id

	for gpath, childVal of item.children
		q.push _.extend(childVal, {
			parentPath: join(item.parentPath, item.id)
			path: join('/guias', gpath)
		})

	absPath = path.resolve(__dirname, MD_LOCATION, item.file)
	fs.readFile absPath, 'utf8', (err, fileContent) ->
		if not fileContent
			throw "WTF, file #{item.id} of path #{absPath} wasn't found"
		guideData[join(item.parentPath, item.id)] = _.extend({
			html: converter.makeHtml(fileContent)
		}, item)
		cb()
), 3

q.drain = () ->

for id, val of guideMap
	q.push(_.extend({id:id, parentPath:'/'}, val))

# console.log pages
module.exports = pages