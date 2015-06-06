
var mongoose = require('mongoose')

var Types = [
	'PostComment',
	'Follow',
	'CommentReply',
	'CommentMention',
	'Welcome',
]

var NotificationSchema = new mongoose.Schema({
	receiver: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
	// Notifications with the same identifier MAY be aggregated.
	identifier: { type: String, required: true },
	type:	{ type: String, enum: Types, required: true },
	data: { }, // name, thumbnail, path...

	instances: {
		type: [{
			key: 		{ type: String, required: true },
			data: 	{ }, // name, avatarUrl?
			created:{ type: Date, default: Date.now },
		}],
		required: false,
	},

	created: { type: Date },
	updated: { type: Date, index: true },
}, {
	// autoIndex: false
})

NotificationSchema.index({ identifier: 1, receiver: 1 })

NotificationSchema.pre('save', function (next) {
	if (!this.created) {
		this.created = new Date()
	}
	if (!this.updated) {
		this.updated = this.created
	}
	next()
})

NotificationSchema.statics.Types = Types

module.exports = NotificationSchema
