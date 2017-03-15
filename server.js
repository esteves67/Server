'use strict';

/* IMPORTS */ { var 
	express = require('express'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	cookieSession = require('cookie-session'),
	mongoose = require('mongoose'),
	nunjucks = require('nunjucks'),
	passport = require('passport'),
	flash = require('connect-flash'),
	secret = require('./config/secrets.js'),
	User = require('./config/models/user.js'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	sockets = require('./config/sockets.js');
}

/* SETUP */ {
	/* Database */ mongoose.connect(secret.mongoSetup, {
		server:{socketOptions:{
			keepAlive:1, connectTimeoutMS:30000 }},
		replset:{socketOptions:{
			keepAlive:1, connectTimeoutMS:30000 }}
	});
	
	/* Templates */ nunjucks.configure(__dirname+'/views', {
		autoescape: true,
		express: app
	});
	
	/* Session */ {
		app.use(cookieParser(secret.cookie));
		// app.use(expressSession({
		app.use(cookieSession({
			cookie: {maxAge:60000},
			secret: secret.session,
			saveUninitialized: true,
			resave: true
		}));
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({
			extended: true
		}));
		app.use(flash());
	}
	
	/* Auth */ {
		app.use(passport.initialize());
		app.use(passport.session());
		require('./config/auth.js');
		passport.serializeUser(function(user,done) {
			done(null, user.id);
		});
		passport.deserializeUser(function(id,done) {
			User.findById(id, function(err, user) {
				if(!err) done(null, user);
				else done(err, null);
			});
		});
	}
	
	/* Routes	*/ {
		app.get('/favicon.ico', function(req,res){
			res.redirect('/static/img/icon/by/16-32-48.ico');
		});
		app.use('/', 
			require('./config/routes/index.js'),
			require('./config/routes/auth.js'),
			require('./config/routes/misc.js')
		);
		app.use(['/map','/trac'], require('./config/routes/map.js'));
		app.use('/admin', require('./config/routes/admin.js'));
		app.use('/static', express.static(__dirname+'/static'));
	}
	
	/* Errors */	{
		// Catch-all for 404s
		app.use(function(req,res,next) {
			if (!res.headersSent) {
				var err = new Error('404: Not found: '+req.url);
				err.status = 404;
				next(err);
			}
		});
		
		// Handlers
		if (secret.env=='production') {
			app.use(function(err,req,res,next) {
				if (res.headersSent) { return next(err); }
				res.status(err.status||500);
				res.render('error.html', {
					code: err.status
				});
			});
		}
		else /* Development */{
			app.use(function(err,req,res,next) {
				console.log(err);
				if (res.headersSent) { return next(err); }
				res.status(err.status||500);
				res.render('error.html', {
					code: err.status,
					message: err.message,
					error: err
				});
			});
		}
	}
	
	/* Sockets */ {
		sockets.init(io);
	}
	
}

/* RUNTIME */ {
	
	// Listen
	http.listen(secret.port, function(){
		console.log(
			'==========================================\n'+
			'Listening at '+secret.url+
			'\n=========================================='
		);
		
		// Check for clients for each user
		User.find({}, function(err, users){
			if (err) { console.log(`DB error finding all users: ${err.message}`); }
			users.forEach( function(user){
				sockets.checkForUsers( io, user.id );
			});
		});
		
	});
}

module.exports = app;
