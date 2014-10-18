
// Move resources (models discriminated as Resource) to their own collections.

var async = require('async')
var mongoose = require('mongoose')
var mongo = require('mongo')
var mongodb = require('mongodb')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

var ResourceStr = "Follow";

jobber = require('./jobber.js')(function (e) {

	var ThatResource = mongoose.model('Resource').model(ResourceStr)
	var Other = mongoose.model(ResourceStr, ThatResource.schema)
	var news = [];

	function onContinueDeleteOld () {
		ThatResource.remove({}, function (err, num) {
			if (err) {
				console.log("ERRO.", err);
			}
			e.quit();
		})
	}

	function onContinueCreateEntries () {
		async.map(news, function (obj, done) {
			console.log("Creating ", obj._id)
			obj.save(done)
		}, function (err, results) {
			if (err) {
				console.log("Error:", err)
			} else {
				console.log("DONE")
				// console.log("About to delete old records. Make sure you have a backup in case something goes wrong.");
				// e.checkContinue(onContinueDeleteOld)
			}
		});
	}

	ThatResource.find({}, function (err, probs) {
		// Array of objects of non-Resource objects
		console.log(""+probs.length+" objects found for model "+ThatResource.modelName);
		// Create new non-Resource from every Resource, lol
		async.map(probs, function (item, next) {
			news.push(new Other(item.toObject()))
			next()
		}, function (err, results) {
			console.log("About to create new entries. ("+probs.length+")");
			e.checkContinue(onContinueCreateEntries);
		});
	});
}).start()