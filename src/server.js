
// server.js
// for QiLabs.org
// This is the main server script.
// Set up everything.

// https://gist.github.com/branneman/8048520#6-the-hack
process.env.NODE_PATH = '.';
require('module').Module._initPaths();

// Import environment keys (if in development)
try { require('./config/env.js') } catch (e) {}

// Libraries
var _
,	express = require('express')				// framework
,	helmet 	= require('helmet')					// middlewares with security headers
, 	bParser	= require('body-parser') 			// 
,	passport= require('passport') 				// authentication framework
,	swig 	= require('./core/swig.js')		// template language processor
// ,	expressWinston = require('express-winston') // Logging
// ,	winston = require('winston')
// , 	morgan 	= require('morgan')
, 	bunyan 	= require('bunyan')
// Utils
,	pathLib = require('path')
// Configuration
,	app = module.exports = express()
,	mongoose = require('./config/mongoose.js') 	// Set-up mongoose
;

if (app.get('env') === 'production') {
	require('newrelic');
}

require('./config/config.js')(app);
require('./config/s3.js');
require('./core/passport.js')(app);

// Create kue on main thread
require('./consumer.js')(app);

/*
** Template engines and static files. **/
app.engine('html', swig.renderFile);
app.set('view engine', 'html'); 			// make '.html' the default
app.set('views', app.config.viewsRoot); 	// set views for error and 404 pages
app.set('view cache', false);
app.use(require('compression')());
app.use(express.static(pathLib.join(app.config.staticRoot, 'robots.txt')));
app.use(express.static(pathLib.join(app.config.staticRoot, 'people.txt')));
app.use(require('serve-favicon')(pathLib.join(app.config.staticRoot, 'favicon.ico')));

if (app.get('env') === 'development') {
	swig.setDefaults({ cache: false });
}

/******************************************************************************/
/* BEGINNING of a DO_NOT_TOUCH_ZONE *******************************************/
app.use(helmet.defaults());
app.use(bParser.urlencoded({ extended: true }));
app.use(bParser.json());
app.use(require('method-override')());
app.use(require('express-validator')());
app.use(app.config.staticUrl, express.static(app.config.staticRoot));
app.use(require('cookie-parser')());
/** END of a DO_NOT_TOUCH_ZONE ----------------------------------------------**/
/**--------------------------------------------------------------------------**/


/******************************************************************************/
/** BEGINNING of a SHOULD_NOT_TOUCH_ZONE **************************************/

// logme = require('express-winston').logger({
// 	transports: [
// 		new winston.transports.Console({
// 			json: true,
// 			colorize: true,
// 		})
// 	],
// 	meta: false,
// 	msg: "<{{(req.user && req.user.username) || 'anonymous' + '@' + req.connection.remoteAddress}}>: HTTP {{req.method}} {{req.url}}"
// })
// app.use(require('./config/bunyan.js')({
// 	logger: app.get('logger'),
// 	format: ':remote-address - - :method :url HTTP/:http-version :status-code :response-time ms',
// 	// format: ':remote-address - - :method :url HTTP/:http-version :status-code :res-headers[content-length] :referer :user-agent[family] :user-agent[major].:user-agent[minor] :user-agent[os] :response-time ms',
// 	// excludes: ['*']
// }));
// app.use(require('express-bunyan-logger')({
//     format: "oiem",
// }));

// app.use(require('./config/bunyan.js').errorLogger({
// 	format: ':remote-address - - :method :url',
// }));


// use https://github.com/villadora/express-bunyan-logger???
var logger = bunyan.createLogger({
	name: 'QI',
	serializers: { // add serializers for req, res and err
		req: bunyan.stdSerializers.req, req: bunyan.stdSerializers.res, err: bunyan.stdSerializers.err,
	}
});
app.set('logger', logger);
app.use(function (req, res, next) {
	req.logger = logger;
	next();
});
var session = require('express-session');
app.use(session({
	store: new (require('connect-mongo')(session))({ db: mongoose.connection.db }),
	// store: new (require('connect-redis')(session))({ url: process.env.REDISTOGO_URL || '' }),
	secret: process.env.SESSION_SECRET || 'mysecretes',
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
/** END of a SHOULD_NOT_TOUCH_ZONE ------------------------------------------**/
/**--------------------------------------------------------------------------**/

app.use(require('./core/middlewares/flash_messages.js'));
app.use(require('./core/middlewares/local_user.js'));
app.use(require('./core/reqExtender.js'));
app.use(require('./core/resExtender.js'));
require('./core/locals/all.js')(app);

/**--------------------------------------------------------------------------**/

var router = require('./lib/router.js')(app); // Pass routes through router.js

// Install app, guides and api controllers.
app.use('/', require('./app/controllers.js')(app));
app.use('/guias', require('./guides/controllers.js')(app));
app.use('/api', require('./api/controllers.js')(app));

app.use(require('./core/middlewares/handle_404.js')); // Handle 404
app.use(require('./core/middlewares/handle_500.js')); // Handle 500 (and log)

var s = app.listen(process.env.PORT || 3000);
logger.info('Server on port %d in %s mode', s.address().port, app.settings.env);