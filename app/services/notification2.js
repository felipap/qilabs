
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
var bunyan = require('app/config/bunyan')
var redisc = require('app/config/redis')

var logger = bunyan({ service: 'NotificationService' })

var Notification = mongoose.model('Notification2')
var User = mongoose.model('User')
var Comment = mongoose.model('Comment')
var Post = mongoose.model('Post')
var Follow = mongoose.model('Follow')

/*
* Notification generators create old notifications of a certain type
* for a certain user.
* Each generator is a pair of genFactories() and genDestructor() methods.
*
* genFactories() returns a list of functions that create a notification, and
* that notification's relative time stamp that notification should have been
* generated on.
* Eg:
* 	[{
* 			timestamp: 1433181542526,
* 			factory: function(){ NotificationService.create(follower, user, ...) }
* 	}, ...]
*
* genDestructor() returns asynchronously a destructor function to be called
* AFTER the new notifications have been created, that destroys notification
* items or instances within notification items that genFactories will have
* re-created.
*/
function genDestructorOfType(type) {
	if (Notification.Types.indexOf(type) === -1) {
		throw new Error('Invalid notification type '+type)
	}
	return function(user, cb) {
		// Get notifications of this type that exist now, before new ones are
		// created.
		Notification.find({ type: type, receiver: user }, '_id', (err, olds) => {
			if (err) {
				throw err
			}
			// Create a destructor of olds
			cb(null, function(cb) {
				logger.info('Executing destructor of '+type+' to receiver '+user._id)
				async.map(olds, (item, next) => {
					logger.trace('Removing old notification %s', item._id)
					Notification.findOneAndRemove({ _id: item._id }, (err, removed) => {
						if (err) {
							throw err
						}
						next(null, removed)
					})
				}, cb)
			})
		})
	}
}


var generators = {

	/* Generate follow notifications to a user. */
	Follow: {
		genFactories: function(user, cb) {
			please({$model:User},'$fn',arguments)
			logger.info('Follow.genFactories()')

			Follow.find({ followee: user._id }, (err, docs) => {
				if (err) {
					throw err
				}
				if (docs.length === 0) {
					cb(null, [])
				}
				async.map(docs, (follow, next) => {
					User.findOne({ _id: follow.follower }, (err, follower) => {
						if (err) {
							throw err
						}
						if (!follower) {
							req.logger.warn('User %s (followee in %s) not found. Skipping.',
								follow.follower, follow.id)
							return
						}
						next(null, {
							timestamp: follow.created_at,
							factory: (cb) => {
								NotificationService.create(follower, user, 'Follow',
									{ follow: follow }, cb)
							}
						})
					})
				}, (err, creators) => {
					if (err) {
						throw err
					}
					cb(null, creators)
				})
			})
		},
		genDestructor: genDestructorOfType('Follow'),
	},

	/* Generate a Welcome to QI Labs notification to a user. */
	Welcome: {
		genFactories: function(user, cb) {
			please({$model:User},'$fn',arguments)
			logger.info('Welcome.genFactories()')

			cb(null, [{
				timestamp: user.meta.created_at,
				factory: (cb) => {
					NotificationService.create(null, user, 'Welcome', {},
						function(err, doc) {
						if (err) {
							cb(err)
							return
						}
						cb(null, [doc])
					})
				}
			}])
		},
		genDestructor: genDestructorOfType('Welcome'),
	}

}

// Register behavior of different types of Notifications.
// Some additional information is added by the Handler class.
var typeHandlers = {

	Follow: {
		canAggregate: true,

		toItemData: function(receiver, data, agent) {
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

		toItemData: function(receiver) {
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

// TODO: #rename
// Handler is an interface to handle the methods for distinct notification
// types.
class Handler {

	constructor(type, agent, receiver) {
		please({$in:typeHandlers},'$skip',{$model:User},arguments)
		this.type = type
		this.agent = agent
		this.handler = typeHandlers[type]
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
	getAggregateData(old, newd) {
		if (!this.canAggregate) {
			throw new Error('You shouldn\'t try to aggregate notifications of type '+
				this.type+'.')
		}

		return {
			instances: old.instances.concat(newd.instances || []),
			// Data related to the notification may have changed.
			data: newd.data,
			// Push old.updated forward if newd was 'created' after
			updated: newd.created > (old.updated || 0) ? newd.created : old.updated,
			// Push old.created backwards if newd was 'created' before
			created: newd.created < old.created ? newd.created : old.created,
		}
	}

	shouldAggregate(newd, old) {
		// If old notification was CREATED a lot earlier than newd notification,
		// don't aggregate.
		// IFf we used old.updated, we would allow instances to be accumulated
		// indefinitely.
		var delta = new Date(newd.created) - new Date(old.created)
		// Magic number ahead!
		if (1*delta < 1000*60*60*24*7*10) { // Less than a week of diff. → aggregate!
			return true
		}
		return false
	}

	get canAggregate() {
		return this.handler.canAggregate || false
	}
}

function updateUserLastSeen(user, cb) {
	please({$model:User},'$fn', arguments)

	Notification
		.findOne({ receiver: user }).sort('-updated')
		.exec((err, doc) => {
			if (err) {
				throw err
			}
			// redisc.set({})
			cb()
		})
}

class NotificationService {

	static create(agent, receiver, type, data, cb) {
		please('$skip',{$model:User},{$in:typeHandlers},'$object','$fn',arguments)

		if (agent !== null && !(agent instanceof User)) {
			throw new Error('First argument must be either a User model or null.')
		}

		var nHandler = new Handler(type, agent, receiver)
		var normd = nHandler.makeItem(data) // Create notification item from data.

		logger.debug('Notifying user '+receiver.username+' at '+normd.created+
			' by '+(agent && agent.username || '--'))

		function makeNewNotification() {
			console.log('make new notification of type', normd.type)
			normd.save((err, doc) => {
				if (err) {
					throw err // Throw Mongoose Error Right Away!
				}

				updateUserLastSeen(receiver, () => cb(null, doc))
			})
		}

		function tryAggregate() {
			// TODO: cache this!
			// Aggregate if one notification of the same type is found in the five
			// latest notifications to a user.
			Notification
				.find({ receiver: receiver }).limit(5).sort('-updated')
				.exec((err, docs) => {
					if (err) {
						throw err
					}
					var similar = _.find(docs, {
						type: type,
						identifier: normd.identifier
					})
					// console.log('similar', similar)
					if (!similar || !nHandler.shouldAggregate(normd, similar)) {
						makeNewNotification()
						return
					}

					logger.info('similar of type '+type+' id:'+similar.id+' with '+
						similar.instances.length+' instances found. aggregate')

					// Green light to aggregate!
					Notification.findOneAndUpdate({
							_id: similar.id
						},
						nHandler.getAggregateData(similar, normd),
						(err, doc) => {
							if (err) {
								throw err
							}
							updateUserLastSeen(receiver, () => {
								cb(null, doc)
							})
						})
				})
		}

		if (nHandler.canAggregate) {
			tryAggregate()
		} else {
			makeNewNotification()
		}
	}

	static undo(agent, receiver, type, data, cb) {
		please('$skip',{$model:User},{$in:typeHandlers},'$object','$fn',arguments)

		if (agent !== null && !(agent instanceof User)) {
			throw new Error('First argument must be either a User model or null.')
		}

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
							// console.log('\n', notif, 'novodoc', doc, '\n')
							next(null, doc)
						})
					}, (err, results) => {
						if (err) {
							throw err
						}

						// console.log('RESULTSTSTS!', results)
						cb(null, results.length)
					})
				})
		}
	}

	/* Artifically recreate one user's notifications. */
	static redoUser(user, cb) {
		please({$model:User},'$fn',arguments)

		//
		// The process of redoing one user's notifications works as follows:
		//
		// 1. call generator.genFactories for each generator to create notification
		// 		factories. Each factory creates one notification item, and has an
		// 		associated time stamp attribute, corresponding to the time that
		// 		notification should have been created _in natura_.
		// 2. call generator.genDestructor for each generator to create a destructor
		// 		that removes notifications that "will have been re-created" by
		// 		factories generated in of (1).
		// 3. call execDestructors().
		//  	This must be done before execFactories, otherwise aggregation will
		//  	be chaotic.
		// 4. call execFactories(): execute the factories created by all generators,
		// 		sorted by ascending time stamp values.
		// 		This way, we guarantee that notification aggregation ends up more or
		// 		less as it would naturally be.
		// 		Consequences of this should be further explored!
		//

		var destructors = [];
		var factories = [];

		function genDestructors() {
			return new Promise(function(resolve, reject) {
				logger.info('genDestructors()')

				async.map(_.pairs(generators), (pair, next) => {
					var gen = pair[1]
					if (typeof gen.genDestructor === 'undefined') {
						logger.trace('genDestructor not defined for generator '+pair[0]+'.')
						next()
						return
					}
					logger.trace('Calling genDestructor for generator '+pair[0])
					gen.genDestructor(user, (err, d) => {
						if (err) {
							throw err
						}
						next(err, d)
					})
				}, (err, ds) => {
					if (err) {
						throw err
					}
					destructors = ds
					resolve()
				})
			})
		}

		function genFactories() {
			return new Promise(function(resolve, reject) {
				logger.info('genFactories()')

				async.map(_.pairs(generators), (pair, next) => {
					var gen = pair[1]
					if (typeof gen.genFactories === 'undefined') {
						logger.trace('genFactories not defined for generator '+pair[0]+'.')
						next()
						return
					}
					logger.trace('Calling genFactories for generator '+pair[0])
					gen.genFactories(user, (err, fs) => {
						if (err) {
							throw err
						}
						next(null, fs)
					})
				}, (err, fss) => {
						if (err) {
							throw err
						}
						factories = _.flatten(fss)
						resolve()
					})
			})
		}

		function execDestructors() {
			return new Promise(function(resolve, reject) {
				logger.info('execDestructors()')

				async.series(destructors, (err, results) => {
					if (err) {
						throw err
					}
					resolve()
				})
			})
		}

		function execFactories() {
			return new Promise(function(resolve, reject) {
				logger.info('execFactories()')

				factories = _.sortBy(factories, 'timestamp')
				async.series(_.pluck(factories, 'factory'), (err, results) => {
					if (err) {
						throw err
					}
					console.log("factories executed!!")
					resolve()
				})
			})
		}

		genFactories()
			.then(genDestructors)
			.then(execDestructors)
			.then(execFactories)
			.then((results) => {
				console.log('finished!!!!')
				cb()
			}, (err) => {
				console.trace()
				logger.error("Error thrown!", err, err.stack)
				cb(err)
			})

	}

}

module.exports = NotificationService