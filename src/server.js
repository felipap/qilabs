
// server.js
// for QILabs.org
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
,	swig 	= require('./config/swig.js')		// template language processor
,	expressWinston = require('express-winston') // Logging
,	winston = require('winston')
// Utils
,	pathLib = require('path')
// Configuration
,	app = module.exports = express()
,	mongoose = require('./config/mongoose.js') 	// Set-up mongoose
;

require('./config/config.js')(app);
require('./config/passport.js')(app);

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
/* BEGINNING of a DO_NOT_TOUCH_ZONE ********************************************/
app.use(helmet.defaults());
app.use(bParser.urlencoded({ extended: true }));
app.use(bParser.json());
app.use(require('method-override')());
app.use(require('express-validator')());
app.use(app.config.staticUrl, express.static(app.config.staticRoot));
app.use(require('cookie-parser')());
/** END of a DO_NOT_TOUCH_ZONE -----------------------------------------------**/
/**--------------------------------------------------------------------------**/

/******************************************************************************/
/** BEGINNING of a SHOULD_NOT_TOUCH_ZONE **************************************/
var session = require('express-session');
app.use(session({
	secret: process.env.SESSION_SECRET || 'mysecretes',
	maxAge: new Date(Date.now() + 3600000),
	store: new (require('connect-mongo')(session))({ db: mongoose.connection.db }),
	cookie: { httpOnly: true }, // secure: true},
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

app.use(require('./config/middlewares/flash_messages.js'));
app.use(require('./config/middlewares/local_user.js'));
app.use(require('./config/requestExtender.js'));
require('./config/locals/all.js')(app);

/******************************************************************************/
app.use(expressWinston.logger({
	transports: [
		new winston.transports.Console({
			json: true,
			colorize: true,
		})
	],
	meta: false,
	msg: "<{{(req.user && req.user.username) || 'anonymous' + '@' + req.connection.remoteAddress}}>: HTTP {{req.method}} {{req.url}}"
}));
/**--------------------------------------------------------------------------**/

var router = require('./lib/router.js')(app); // Pass routes through router.js

// Install app, guides and api controllers.
router(require('./app/controllers.js'));
router(require('./guides/controllers.js'));
router(require('./api/controllers.js'));

app.use(require('./config/middlewares/handle_404.js')); // Handle 404 after routes
app.use(require('./config/middlewares/handle_500.js')); // Handle 500 before routes

var s = app.listen(process.env.PORT || 3000);
console.log('Server on port %d in %s mode', s.address().port, app.settings.env);