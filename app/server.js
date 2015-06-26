
// server.js
// Set up a server.

if (require.main === module) {
	throw new Error("Wrong usage of server.js. Call the master file on root.");
}

/*---------------------------------------------------------------------------**/
// server.js specifics below

// Utils
var
	cluster = require('cluster')
,	path = require('path')
, nconf = require('nconf')
;

/**
 * Nodetime stats.
 */
if (nconf.get('NODETIME_ACCOUNT_KEY')) {
	require('nodetime').profile({
		accountKey: nconf.get('NODETIME_ACCOUNT_KEY'),
		appName: 'QI LABS',
	});
}

// Server-related libraries
var
	bParser	= require('body-parser')
, mongoose= require('mongoose')
,	passport= require('passport')
,	express = require('express')
,	helmet 	= require('helmet')
, http 		= require('http')
, st 			= require('st')
;

var app = express();

// var toobusy = require('toobusy');
// app.use(function(req, res, next) {
//   if (toobusy()) res.status(503).send('Servidor ocupado. Tente novamente.');
//   else next();
// });

if (!global.logger) {
	throw new Error("Global logger object not found.");
}
app.set('logger', logger);
app.use(function (req, res, next) {
	req.logger = logger;
	next();
});

require('./config/s3')(app);
require('./config/passport')(app);

/**
 * Template engines and static files.
 */
var swig = require('./config/swig')
app.engine('html', swig.renderFile);
app.set('view engine', 'html'); 			// make '.html' the default
app.set('views', nconf.get('viewsRoot')); 	// set views for error and 404 pages

if (nconf.get('env') === 'development') {
	app.set('view cache', false);
	swig.setDefaults({ cache: false });
}

var staticRoot = nconf.get('localStaticRoot');

app.use(require('compression')());
app.use('/robots.txt', express.static(path.join(staticRoot, 'robots.txt')));
app.use('/humans.txt', express.static(path.join(staticRoot, 'humans.txt')));
app.use(require('serve-favicon')(path.join(staticRoot, 'favicon.ico')));
app.use(st({
	path: staticRoot,
	url: nconf.get('staticUrl'),
	cache: nconf.get('env') === 'production',
	passthrough: false,
}));

/*---------------------------------------------------------------------------**/
/* BEGINNING of a DO_NOT_TOUCH_ZONE -----------------------------------------**/
app.use(helmet.defaults());
app.use(bParser.urlencoded({ extended: true }));
app.use(bParser.json());
app.use(require('method-override')());
app.use(require('express-validator')());
app.use(require('cookie-parser')());
/** END of a DO_NOT_TOUCH_ZONE ----------------------------------------------**/
/**--------------------------------------------------------------------------**/


/*---------------------------------------------------------------------------**/
/** BEGINNING of a SHOULD_NOT_TOUCH_ZONE ------------------------------------**/
var session = require('express-session');
app.use(session({
	store: new (require('connect-mongo')(session))({
		mongooseConnection: mongoose.connection
	}),
	// store: new (require('connect-redis')(session))({
	// 	url: nconf.get('REDISCLOUD_URL') || ''
	// }),
	secret: nconf.get('SESSION_SECRET') || 'mysecretes',
	cookie: {
		httpOnly: true,
		secure: false,
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
/** END of a SHOULD_NOT_TOUCH_ZONE ------------------------------------------**/
/**--------------------------------------------------------------------------**/

app.use(require('./middlewares/flash_messages'));
app.use(require('./middlewares/local_user'));
app.use(require('express-domain-middleware'));
app.use(require('./middlewares/reqExtender'));
app.use(require('./middlewares/resExtender'));
require('./middlewares/locals.js')(app);

// Install app, guides and api controllers. The app must be kept for last,
// because it works on / so its middlewares would match every 404 call passing
// through.

function colorFromText(text, ip) {
	var colors = require('colors/safe');

	function hashCode(text) {
		// http://stackoverflow.com/a/7616484/396050
		var hash = 0, i, chr, len;
		if (text.length == 0) {
			return hash;
		}
		for (i = 0, len = text.length; i < len; i++) {
			chr = text.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	}

	var CS = ['red','green','yellow','blue','magenta','cyan','white','gray'];
	// Won't work if the length of CS isn't 8.
	var ccolor = CS[hashCode(ip)&0x7];
	return colors.bold(colors[ccolor](text));
}

app.use(function (req, res, next) {
	req.logger = logger
	var ip = req.connection.remoteAddress
	if (req.user) {
		var identification = colorFromText(req.user.username+'@'+ip, ip)
	} else {
		var identification = colorFromText('anonymous@'+ip, ip)
	}
	logger.info('<'+identification+'>: HTTP '+req.method+' '+req.url)
	next()
})

app.use('/api', require('./controllers/api')(app));
if (nconf.get('env') !== 'development') {
	app.use('/guias', require('./controllers/guides')(app));
}
app.use('/', require('./controllers')(app));

// Handle 404, in case nothing catched it
app.use(require('./middlewares/handle_404'));
// Handle next(err)'s
app.use(require('./middlewares/errorHandler'));

// Will this work?
// Reference needed in errorHandler, in order to shutdown server.
app.preKill = function (time) {
	// make sure we close down within 10 seconds
	var killtimer = setTimeout(function() {
		logger.fatal({ worker: process.pid }, 'Forcing process kill');
		process.exit(1);
	}, time || 10 * 1000);
	// Ignore the call if we do close before that.
	killtimer.unref();
	// stop taking new requests
	server.close();
	logger.fatal({ worker: process.pid }, 'Closed server on worker');
	// Let master know we're dead.
	logger.fatal({ worker: process.pid }, 'Signaling disconnect to master');
	cluster.worker.disconnect();
	logger.fatal({ worker: process.pid }, 'Killing process normally');
	process.exit(0); // Is this OK?!
}

/**--------------------------------------------------------------------------**/

var server = http.createServer(app);

process.on('exit', function() {
	logger.info({ worker: process.pid }, 'Exit process');
});

function listen() {
	server.listen(nconf.get('PORT') || 3000, function () {
		logger.info('Server on port %d in mode %s', nconf.get('PORT') || 3000,
			nconf.get('env'));
	});
}

module.exports = server;
module.exports.start = listen;