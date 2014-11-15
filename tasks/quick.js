
var async = require('async')
var mongoose = require('mongoose')
var _ = require('lodash')
var ObjectId = mongoose.Types.ObjectId

jobber = require('./jobber.js')(function (e) {

	Post = mongoose.model('Post');

	var those = [
	  {
				"last_access" : ISODate("2014-10-18T16:08:49.636Z"),
				"_id" : ObjectId("542caf96dc734102009ff85f"),
				"name" : "Victor Vidal"
		}, {
				"last_access" : ISODate("2014-10-20T01:25:16.435Z"),
				"_id" : ObjectId("5444647ccb00780200e6e55e"),
				"name" : "Léo Oliveira"
		}, {
				"last_access" : ISODate("2014-10-22T18:41:01.984Z"),
				"_id" : ObjectId("54085c056884aa020064175c"),
				"name" : "Carlos Ribeiro"
		}, {
				"last_access" : ISODate("2014-10-22T19:52:51.993Z"),
				"_id" : ObjectId("53220653a5ac700200847752"),
				"name" : "João Guio"
		}, {
				"last_access" : ISODate("2014-10-26T05:26:51.123Z"),
				"_id" : ObjectId("53c84babe041df02002f30ed"),
				"name" : "Franco Severo"
		}, {
				"last_access" : ISODate("2014-10-27T21:08:57.547Z"),
				"_id" : ObjectId("5401c71debbc8a020055730b"),
				"name" : "Matheus Neves"
		}, {
				"last_access" : ISODate("2014-10-27T23:37:13.355Z"),
				"_id" : ObjectId("5438837184f3440200279afe"),
				"name" : "André Costa"
		}, {
				"last_access" : ISODate("2014-11-01T17:33:00.913Z"),
				"_id" : ObjectId("54011fcad5f418020058d49b"),
				"name" : "Alexandre Vartuli"
		}, {
				"last_access" : ISODate("2014-11-07T03:35:06.272Z"),
				"_id" : ObjectId("53712efeffc814020084a958"),
				"name" : "Vinícius Costa"
		}, {
				"last_access" : ISODate("2014-11-07T23:38:56.739Z"),
				"_id" : ObjectId("5401b8e3ebbc8a0200557309"),
				"name" : "Herllan Vieira"
		}, {
				"last_access" : ISODate("2014-11-08T00:26:28.206Z"),
				"_id" : ObjectId("542cb29ddc734102009ff860"),
				"name" : "Lucas Hagemaister"
		}, {
				"last_access" : ISODate("2014-11-11T05:48:44.121Z"),
				"_id" : ObjectId("5320fd8ab6172102003081b9"),
				"name" : "Michelle Malher"
		}, {
				"last_access" : ISODate("2014-11-11T06:05:03.298Z"),
				"_id" : ObjectId("53f55242601d930200f03c1d"),
				"name" : "Tiago Marinho"
		}, {
				"last_access" : ISODate("2014-11-12T12:14:11.168Z"),
				"_id" : ObjectId("533791d92fcb660200efcb49"),
				"name" : "Fernando Leal"
		}, {
				"last_access" : ISODate("2014-11-12T18:59:19.146Z"),
				"_id" : ObjectId("5321477b2816f6020050cb90"),
				"name" : "Felipe Aragão"
		},]

	as

	User.find({ participations: { $ne: null } }, function (err, posts) {

		async.map(posts.slice(0,1), function (post, done) {
			var participations = post.participations.slice();
			console.log('post', participations)
			post.participations = [];
			post.update({ participations: participations });
			post.save(function () {
				console.log("SAVED?", arguments)
				console.log(post)
				done();
			})
		}, function (err, results) {
			e.quit();
		});
	});

}).start()