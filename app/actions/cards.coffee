
mongoose = require 'mongoose'
_ = require 'lodash'

User 	= mongoose.model 'User'
Post  = mongoose.model 'Post'
Inbox = mongoose.model 'Inbox'
Problem = mongoose.model 'Problem'

formatMDBody = (text) ->
	noimg = text.replace(/(?:!\[.*?\]\()(.+?)\)/gi, '')
	if noimg.length < 200
		return noimg
	for i in [200..0]
		if /\s/.test(noimg[i])
			return noimg.slice(0,i)+'...'
	console.log("what the actual fuck")
	return noimg.slice(0, 200)

module.exports.workPostCards = (user, _docs) ->
	docs = []
	_docs.forEach (i) ->
		if i
			data = _.extend(i.toJSON(), {
				_meta: {
					liked: user and !!~i.votes.indexOf(user.id)
					watching: user and !!~i.users_watching.indexOf(user.id)
				}
			})
			delete data.content.body
			data.content.cardBody = formatMDBody(i.content.body)
			docs.push(data)
	return docs

module.exports.workPsetCards = (user, _docs) ->
	return _docs

module.exports.workProblemCards = (user, _docs) ->
	docs = []
	_docs.forEach (i) ->
		if i
			data = _.extend(i.toJSON(), {
				_meta: {
					liked: user and !!~i.votes.indexOf(user.id)
					tries: user and _.find(i.userTries, { user: user.id })?.tries or 0
					solved: user and !!_.find(i.hasAnswered, { user: user.id })
					watching: user and !!~i.users_watching.indexOf(user.id)
				}
			})
			delete data.content.body
			data.content.cardBody = formatMDBody(i.content.body)
			docs.push(data)
	return docs