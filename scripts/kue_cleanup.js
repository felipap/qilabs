// adapted from https://gist.github.com/niravmehta/6112330

var kue = require('kue')
var util = require('util')

CLEANUP_MAX_FAILED_TIME = 1000 * 60 * 60 * 24 * 10;  // 10 days
CLEANUP_MAX_ACTIVE_TIME = 1000 * 60 * 60 * 24 * 1;  // 1 day
CLEANUP_MAX_INACTIVE_TIME = 1000 * 60 * 60 * 1 * 1;  // 1 hour
CLEANUP_MAX_COMPLETE_TIME = 1000 * 60 * 60 * 24 * 5; // 5 days
CLEANUP_INTERVAL = 1000 * 60 * 5; // 5 minutes

var noop = function() {};

// this is a simple log action
function QueueActionLog(message) {
	this.message = message || 'QueueActionLog :: got an action for job id(%s)';

	this.apply = function(job) {
		console.log(util.format(this.message, job.id));
		return true;
	};
}

// remove item action
function QueueActionRemove(age) {
	this.age = age;
	this.apply = function(job) {
		job.remove(noop);
		return true;
	};
}

// filter by age
function QueueFilterAge(age) {
	this.now = new Date().getTime();
	this.age = age;

	this.test = function(job) {
			var created = parseInt(job.created_at);
			var age = this.now - created;
			return age > this.age;
	};
	this.now = new Date();
	this.age = age;
}

// the queue iterator
var queueIterator = function(ids, queueFilterChain, queueActionChain) {
	ids.forEach(function(id, index) {
		// get the kue job
		kue.Job.get(id, function(err, job) {
			if (err || !job) return;
			var filterIterator = function(filter) { return filter.test(job) };
			var actionIterator = function(filter) { return filter.apply(job) };

			// apply filter chain
			if(queueFilterChain.every(filterIterator)) {

				// apply action chain
				queueActionChain.every(actionIterator);
			}
		});
	});
};

jobber = require('./lib/jobber.js')(function (e) {
	var nconf = require('app/config/nconf')

	if (nconf.get('REDISCLOUD_URL')) {
		var url = require('url')
		var redisUrl = url.parse(nconf.get('REDISCLOUD_URL'))
		var ki = new kue({
			redis: {
				port: redisUrl.port,
				host: redisUrl.hostname,
				auth: redisUrl.auth && redisUrl.auth.split(':')[1],
				createClient: function () {
					return redis
				}
			}
		});
	} else {
		var ki = new kue();
	}

	console.log("Performing cleanup.");

	ki.failed(function(err, ids) {
		if (!ids) {
			console.log("No ids for failed jobs.");
			return;
		}
		queueIterator(
			ids,
			[new QueueFilterAge(CLEANUP_MAX_FAILED_TIME)],
			[new QueueActionLog('About to remove job id(%s): FAILED for too long.'),
				new QueueActionRemove()]
		);
	});

	ki.active(function(err, ids) {
		if (!ids) {
			console.log("No ids for active jobs.");
			return;
		}
		queueIterator(
			ids,
			[new QueueFilterAge(CLEANUP_MAX_ACTIVE_TIME)],
			[new QueueActionLog('About to remove job id(%s): ACTIVE for too long.'),
				new QueueActionRemove()]
		);
	});

	ki.inactive(function(err, ids) {
		if (!ids) {
			console.log("No ids for inactive jobs.");
			return;
		}
		queueIterator(
			ids,
			[new QueueFilterAge(CLEANUP_MAX_INACTIVE_TIME)],
			[new QueueActionLog('About to remove job id(%s): INACTIVE for too long.'),
				new QueueActionRemove()]
		);
	});

	ki.complete(function(err, ids) {
		if (!ids) {
			console.log("No ids for completed jobs.");
			return;
		}
		queueIterator(
			ids,
			[new QueueFilterAge(CLEANUP_MAX_COMPLETE_TIME)],
			[new QueueActionLog('About to remove job id(%s): COMPLETE for too long.'),
				new QueueActionRemove()]
		);
	});

}).start()