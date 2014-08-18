
# src/models/problem

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'

please = require 'src/lib/please.js'
please.args.extend(require('./lib/pleaseModels.js'))

Notification = mongoose.model 'Notification'
Resource = mongoose.model 'Resource'
Garbage = mongoose.model 'Garbage'
Inbox = mongoose.model 'Inbox'

################################################################################
## Schema ######################################################################

ObjectId = mongoose.Schema.ObjectId

ProblemSchema = new Resource.Schema {
	author: {
		id: String,
		username: String,
		path: String,
		avatarUrl: String,
		name: String,
	}
	
	updated:	{ type: Date }
	published:	{ type: Date, indexed: 1, default: Date.now }
	subject:	{ type: String }
	topics:		{ type: [{ type: String }] }

	content: {
		title:	{ type: String }
		body:	{ type: String, required: true }
		source:	{ type: String }
		image:  { type: String }
		answer: {
			value: 0,
			options: [],
			is_mc: { type: Boolean, default: true },
		}
	}

	watching: 	[] # for discussions
	canSeeAnswers: [] # for problems

	votes: 		{ type: [{ type: String, ref: 'User', required: true }], default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

ProblemSchema.virtual('voteSum').get ->
	@votes.length

ProblemSchema.virtual('path').get ->
	if @parentProblem
		"/problems/"+@parentProblem+"#"+@id
	else
		"/problems/{id}".replace(/{id}/, @id)

ProblemSchema.virtual('apiPath').get ->
	"/api/posts/{id}".replace(/{id}/, @id)

################################################################################
## Middlewares #################################################################

ProblemSchema.pre 'remove', (next) ->
	next()
	Notification.find { resources: @ }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of Problem #{@id}"
		docs.forEach (doc) ->
			doc.remove()

ProblemSchema.pre 'remove', (next) ->
	next()
	Problem.find { parentProblem: @ }, (err, docs) ->
		docs.forEach (doc) ->
			doc.remove()

ProblemSchema.pre 'remove', (next) ->
	next()
	Inbox.remove { resource: @id }, (err, doc) =>
		console.log "Removing #{err} #{doc} inbox of Problem #{@id}"

ProblemSchema.pre 'remove', (next) ->
	next()
	@addToGarbage (err) ->
		console.log "#{err} - moving Problem #{@id} to garbage"

ProblemSchema.pre 'remove', (next) ->
	next()
	# Do this last, so that the status isn't rem
	# Decrease author stats.
	if not @parentProblem
		User = Resource.model('User')
		User.findById @author.id, (err, author) ->
			author.update {$inc:{'stats.Problems':-1}}, (err) ->
				if err
					console.err "Error in decreasing author stats: "+err


################################################################################
## Methods #####################################################################

ProblemSchema.methods.addToGarbage = (cb) ->
	# http://mathias-biilmann.net/Problems/2011/07/12/garbage-collection
	console.log('adding to garbage', @content.body)
	obj = @toJSON()
	# delete obj.id
	# delete obj._id
	obj.old_id = ''+@id
	obj.deleted_at = Date.now()
	deleted = new Garbage(obj)
	deleted.save(cb)

ProblemSchema.methods.getComments = (cb) ->
	Problem.find { parentProblem: @id }
		# .populate 'author', '-memberships'
		.exec (err, docs) ->
			cb(err, docs)

ProblemSchema.methods.stuff = (cb) ->
	@fillChildren(cb)

ProblemSchema.methods.fillChildren = (cb) ->
	if @type not in _.values(Types)
		return cb(false, @toJSON())

	Problem.find {parentProblem:@}
		# .populate 'author'
		.exec (err, children) =>
			async.map children, ((c, done) =>
				if c.type in [Types.Answer]
					c.fillChildren(done)
				else
					done(null, c)
			), (err, popChildren) =>
				cb(err, _.extend(@toJSON(), {children:_.groupBy(popChildren, (i) -> i.type)}))

################################################################################
## Statics #####################################################################

ProblemSchema.statics.countList = (docs, cb) ->
	please.args({$isA:Array}, '$isCb')

	async.map docs, (Problem, done) ->
		if Problem instanceof Problem
			Problem.count {type:'Comment', parentProblem:Problem}, (err, ccount) ->
				Problem.count {type:'Answer', parentProblem:Problem}, (err, acount) ->
					done(err, _.extend(Problem.toJSON(), {childrenCount:{Answer:acount,Comment:ccount}}))
		else done(null, Problem.toJSON)
	, (err, results) ->
		cb(err, results)


ProblemSchema.statics.fromObject = (object) ->
	new Problem(undefined, undefined, true).init(object)

ProblemSchema.plugin(require('./lib/hookedModelPlugin'))

module.exports = Problem = Resource.discriminator('Problem', ProblemSchema)