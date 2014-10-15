
// server.js
// for QI Labs
// This is the main server script.
// Set up everything.

require('coffee-script/register');

// Absolute imports.
// See https://gist.github.com/branneman/8048520#6-the-hack
process.env.NODE_PATH = '.';
require('module').Module._initPaths();

var nconf = require('./config/nconf')

// Nodetime stats
if (nconf.get('NODETIME_ACCOUNT_KEY')) {
	require('nodetime').profile({
		accountKey: nconf.get('NODETIME_ACCOUNT_KEY'),
		appName: 'QI LABS', // optional
	});
}

/*-------------------------------------------------------------------------------------**/

// Utils
var _
, 	path 	= require('path')
,	cluster = require('cluster')
;

if (nconf.get('env') === 'production') {
	require('newrelic');
}

// Logging.
// Create before app is used as arg to modules.
var logger = require('src/core/bunyan')();
logger.level(nconf.get('BUNYAN_LVL') || 'debug');

// module.exports.ga = require('universal-analytics')(nconf.get('GA_ID'));

// Create kue on main thread
if (nconf.get('CONSUME_MAIN') && !nconf.get('__CLUSTERING')) {
	logger.info('Calling consumer from web process.');
	require('./consumer');
}

/*-------------------------------------------------------------------------------------**/
/*-------------------------------------------------------------------------------------**/

// Server-related libraries
var __
,	express = require('express')
,	helmet 	= require('helmet')
, 	bParser	= require('body-parser')
,	passport= require('passport')
, 	http 	= require('http')
, 	st 		= require('st')
;

var app = express();

var toobusy = require('toobusy');
app.use(function(req, res, next) {
  if (toobusy()) res.send(503, 'Servidor ocupado. Tente novamente.');
  else next();
});

app.set('logger', logger);
app.use(function (req, res, next) {
	req.logger = logger;
	next();
});

var mongoose = require('./config/mongoose')(logger);
require('./config/s3');
require('./core/passport')(app);

/*
** Template engines and static files. **/
var swig = require('./core/swig')
app.engine('html', swig.renderFile);
app.set('view engine', 'html'); 			// make '.html' the default
app.set('views', nconf.get('viewsRoot')); 	// set views for error and 404 pages

if (nconf.get('env') === 'development') {
	app.set('view cache', false);
	swig.setDefaults({ cache: false });
}

app.use(require('compression')());
app.use('/robots.txt', express.static(path.join(nconf.get('staticRoot'), 'robots.txt')));
app.use('/humans.txt', express.static(path.join(nconf.get('staticRoot'), 'humans.txt')));
app.use(require('serve-favicon')(path.join(nconf.get('staticRoot'), 'favicon.ico')));
app.use(st({
	path: nconf.get('staticRoot'),
	url: nconf.get('staticUrl'),
	cache: nconf.get('env') === 'production',
	passthrough: false,
}));

/*-------------------------------------------------------------------------------------**/
/* BEGINNING of a DO_NOT_TOUCH_ZONE ---------------------------------------------------**/
app.use(helmet.defaults());
app.use(bParser.urlencoded({ extended: true }));
app.use(bParser.json());
app.use(require('method-override')());
app.use(require('express-validator')());
app.use(require('cookie-parser')());
/** END of a DO_NOT_TOUCH_ZONE --------------------------------------------------------**/
/**------------------------------------------------------------------------------------**/


/*-------------------------------------------------------------------------------------**/
/** BEGINNING of a SHOULD_NOT_TOUCH_ZONE ----------------------------------------------**/
var session = require('express-session');
app.use(session({
	store: new (require('connect-mongo')(session))({ db: mongoose.connection.db }),
	// store: new (require('connect-redis')(session))({ url: nconf.get('REDISTOGO_URL') || '' }),
	secret: nconf.get('SESSION_SECRET') || 'mysecretes',
	cookie: {
		httpOnly: true,
		secure: false,
		// expires: new Date(Date.now() + 24*60*60*1000),
		maxAge: 24*60*60*1000,
	},
	rolling: true,
	resave: true,
	saveUninitialized: true,
}));
app.use(require('csurf')());
app.use(function(req, res, next){
	res.locals.token = req.csrfToken();	// Add csrf token to views's locals.
	next();
});
app.use(require('connect-flash')()); 	// Flash messages middleware
app.use(passport.initialize());
app.use(passport.session());
/** END of a SHOULD_NOT_TOUCH_ZONE ----------------------------------------------------**/
/**------------------------------------------------------------------------------------**/

app.use(require('./core/middlewares/flash_messages'));
app.use(require('./core/middlewares/local_user'));
app.use(require('express-domain-middleware'));
app.use(require('./core/reqExtender'));
app.use(require('./core/resExtender'));
require('./core/locals/all')(app);

// Install app, guides and api controllers. The app must be kept for last, because it
// works on / so its middlewares would match every 404 call passing through.
app.use('/api', require('./controllers/api')(app));
app.use('/guias', require('./controllers/guides')(app));
app.use('/', require('./controllers')(app));

app.use(require('./core/middlewares/handle_404')); // Handle 404, in case none catched it
app.use(require('./core/middlewares/handle_500')); // Handle 500 (and log)

// Will this work?
// Reference needed in handle_500, in order to shutdown server.
app.preKill = function (time) {
	var killtimer = setTimeout(function() { // make sure we close down within 10 seconds
		logger.fatal({worker: process.pid}, 'Forcing process kill');
		process.exit(1);
	}, time || 10 * 1000);
	// Ignore the call if we do close before that.
	killtimer.unref();
	// stop taking new requests
	server.close();
	logger.fatal({worker: process.pid}, 'Closed server on worker');
	// Let master know we're dead.
	logger.fatal({worker: process.pid}, 'Signaling disconnect to master');
	cluster.worker.disconnect();
	logger.fatal({worker: process.pid}, 'Killing process normally');
	process.exit(0); // Is this OK?!
}

/**------------------------------------------------------------------------------------**/

var server = http.createServer(app);

process.on('exit', function() {
	logger.info({worker: process.pid}, 'Exit process');
});

function listen() {
	server.listen(nconf.get('PORT') || 3000, function () {
		logger.info('Server on port %d in mode %s', nconf.get('PORT') || 3000, nconf.get('env'));
	});
}

if (mongoose.connection.readyState == 2) // connecting → wait
	mongoose.connection.once('connected', listen)
else if (mongoose.connection.readyState == 1)
	listen()
else
	throw "Unexpected mongo readyState of "+mongoose.connection.readyState

module.exports = server;