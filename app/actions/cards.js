
var mongoose = require('mongoose')
var _ = require('lodash')

var User = mongoose.model('User')
var Post = mongoose.model('Post')
var Inbox = mongoose.model('Inbox')
var Problem = mongoose.model('Problem')

function formatMDBody(text) {
	var noimg = text.replace(/(?:!\[.*?\]\()(.+?)\)/gi, '')
	if (noimg.length < 200) {
		return noimg
	}

	for (var i=200; i>0; --i) {
		if (/\s/.test(noimg[i])) {
			return noimg.slice(0,i)+'...'
		}
	}

	console.log("what the actual fuck")
	return noimg.slice(0, 200)
}

module.exports.workPostCards = function(user, _docs) {
	var docs = []
	_docs.forEach((i) => {
		if (i) {
			var json = i.toJSON()
			json._meta = {
				liked: false,
				watching: false,
			}

			if (user) {
				json._meta.liked = !!~i.votes.indexOf(user.id)
				json._meta.watching = !!~i.users_watching.indexOf(user.id)
			}

			delete json.content.body
			json.content.cardBody = formatMDBody(i.content.body)
			docs.push(json)
		}
	})
	return docs
}

module.exports.workPsetCards = function(user, _docs) {
	return _docs
}

module.exports.workProblemCards = function(user, _docs) {
	var docs = []
	_docs.forEach((i) => {
		if (i) {
			var json = i.toJSON()

			json._meta = {
				liked: false,
				tries: false,
				solved: false,
				watching: false,
			}

			if (user) {
				var utries = _.find(i.userTries, { user: user.id })
				json._meta = {
					liked: !!~i.votes.indexOf(user.id),
					tries: utries && utries.tries || 0,
					solved: !!_.find(i.hasAnswered, { user: user.id }),
					watching: !!~i.users_watching.indexOf(user.id),
				}
			}

			delete json.content.body
			json.content.cardBody = formatMDBody(i.content.body)
			docs.push(json)
		}
	})

	return docs
}