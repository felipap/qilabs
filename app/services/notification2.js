
'use strict'

/*
 * Notifications of the same type can be aggregated.
 *
 */

var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var assert = require('assert')

var please = require('app/lib/please')
var Chunker = require('./chunker')
var TMERA = require('app/lib/tmera')
var Logger = require('app/config/bunyan')
var redisc = require('app/config/redis')

var logger = Logger({ service: 'NotificationService' })

var Notification = mongoose.model('Notification2')
var User = mongoose.model('User')
var Comment = mongoose.model('Comment')
var Post = mongoose.model('Post')
var Follow = mongoose.model('Follow')

var generators = {

	Welcome: {

	}

}

// Register behavior of different types of Notifications.
// Some additional information is added by the Handler class.
var handlers = {

	Follow: {
		canAggregate: true,

		toItemData: function (receiver, data, agent) {
			please({$model:User},{follow:{$model:Follow}},{$model:User},arguments)

			return {
				identifier: receiver.id,
				instances: [{
					key: receiver.id+','+agent.id,
					created: data.follow.created_at,
					data: {
						follow: {
							id: data.follow.id,
							created: data.follow.created_at,
						},
						follower: User.toAuthorObject(agent),
					}
				}],
				created: data.follow.created_at,
			}
		},
	},


	Welcome: {
		canAggregate: false,

		toItemData: function (receiver) {
			please({$model:User},arguments)

			return {
				identifier: receiver.id,
				data: {
					userName: receiver.name,
				},
				created: receiver.meta.created_at,
			}
		},
	}

}

// Handler is an interface to handler the methods for distinct notification
// types.
class Handler {

	constructor(type, agent, receiver) {
		please({$in:handlers},{$model:User},{$model:User},arguments)
		this.type = type
		this.agent = agent
		this.handler = handlers[type]
		this.receiver = receiver
	}

	makeItem(_data) {
		var data = this.handler.toItemData(this.receiver, _data, this.agent)
		return new Notification(_.extend(data,
			{
				identifier: this.type+':'+data.identifier,
				type: this.type,
				receiver: this.receiver._id,
			}))
	}

	/*
	 * Aggregate two notification items.
	 */
	aggregate(old, newd) {
		if (!this.canAggregate) {
			throw new Error("You shouldn't try to aggregate notifications of type "+
				this.type+".")
		}

		old.data = newd.data // Data related to the notification may have changed.
		old.instances = old.instances.concat(newd.instances)

		if (newd.created > old.updated) {
			// Push old.updated forward if newd was "created" after
			old.updated = newd.updated
		} else if (newd.created < old.created) {
			// Push old.created backwards if newd was "created" before
			old.created = newd.created
		}
		return old
	}

	shouldAggregate(newd, old) {
		// If old notification was CREATED a lot earlier than newd notification,
		// don't aggregate.
		// IFf we used old.updated, we would allow instances to be accumulated
		// indefinitely.
		var delta = new Date(newd.created) - new Date(old.created)
		// Magic number ahead!
		return true
		if (1*delta < 1000*60*60*24*7) { // Less than a week of diff. → aggregate!
			return true
		}
		return false
	}

	get canAggregate() {
		return this.handler.canAggregate || false
	}


}

class NotificationService {

	static create(agent, receiver, type, data, cb) {
		please({$model:User},{$model:User},{$in:handlers},'$object','$fn',arguments)

		var nHandler = new Handler(type, agent, receiver)
		var normd = nHandler.makeItem(data) // Create notification item from data.

		function makeNewNotification() {
			console.log('make new notification', normd)
			normd.save((err, doc) => {
				if (err) {
					throw err // Throw Mongoose Error Right Away!
				}

				console.log("doc!", doc)
				cb(null, doc)
			})
		}

		function tryAggregate() {
			// Aggregate if one notification of the same type is found in the five
			// latest notifications to a user.
			// TODO: cache this!
			Notification
				.find({ receiver: receiver }).limit(5).sort('-updated')
				.exec(TMERA((docs) => {
					var similar = _.find(docs, {
						type: 'Follow',
						identifier: normd.identifier
					})
					console.log('similar', similar)
					if (!similar || !nHandler.shouldAggregate(normd, similar)) {
						makeNewNotification()
						return
					}

					// Green light to aggregate!
					var merger = nHandler.aggregate(similar, normd)
					merger.save((err, doc) => {
						if (err) {
							throw err
						}
						cb(null, doc)
					})
				}))
		}

		if (nHandler.canAggregate) {
			tryAggregate()
		} else {
			makeNewNotification()
		}
	}

	static undo(agent, receiver, type, data, cb) {
		please({$model:User},{$model:User},{$in:handlers},'$object','$fn',arguments)

		var nHandler = new Handler(type, agent, receiver)
		var normd = nHandler.makeItem(data) // Create notification item from data.

		// If this type of notification can't be aggregated, find items with
		// normd.identifier and remove them. Otherwise, remove instances with
		// key normd.instances[0].key in these items.
		if (!nHandler.canAggregate) {
			Notification.remove({ type: type, identifier: normd.identifier },
				(err, count) => {
					if (err) {
						throw err
					}
					console.log('count! ', count)
					cb(null, true)
				})
		} else {
			Notification.find({ type: type, identifier: normd.identifier },
				(err, docs) => {
					if (err) {
						throw err
					}

					async.map(docs, (notif, next) => {
						if (!_.find(notif.instances, { key: normd.instances[0].key })) {
							// No instance with the same key here. Moving on.
							next()
							return
						}
						_.remove(notif.instances, { key: normd.instances[0].key })

						// The notification is now empty. Remove it.
						if (notif.instances.length === 0) {
							notif.remove((err, count) => {
								if (err) {
									throw err
								}
								next()
							})
							return
						}

						console.log('updated', _.max(_.pluck(notif.instances, 'created')),
							'\n created', _.min(_.pluck(notif.instances, 'created')))

						Notification.findOneAndUpdate({
							_id: notif._id
						}, {
							instances: notif.instances,
							// When aggregating to a notification, some values outside the
							// instances array are also updated.
							// We must recalculate notif.updated and notif.created, in order
							// to make it consistent with the current instances, as if those
							// we just removed never existed.
							updated: _.max(_.pluck(notif.instances, 'created')),
							created: _.min(_.pluck(notif.instances, 'created')),
						}, (err, doc) => {
							if (err) {
								throw err
							}
							console.log('\n', notif, 'novodoc', doc, '\n')
							next(null, doc)
						})
					}, (err, results) => {
						if (err) {
							throw err
						}

						console.log('RESULTSTSTS!', results)
						cb(null, results.length)
					})
				})
		}
	}

}

module.exports = NotificationService