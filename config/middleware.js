'use strict';

const env = require('./env/env.js');

module.exports = {

	// Throw error
	throwErr: (err,req=null)=>{
		console.error(`❌️ ${err.stack}`);
		if (req){
			if (env.mode==='production') {
				req.flash('danger', 'An error occured. <br>Would you like to <a href="https://github.com/Tracman-org/Server/issues/new">report it</a>?');
			} else { // development
				req.flash('danger', err.message);
			}
		}
	},

	// Capitalize the first letter of a string
	capitalize: (str)=>{
		return str.charAt(0).toUpperCase() + str.slice(1);
	},

	// Ensure authentication
	ensureAuth: (req,res,next)=>{
		if (req.isAuthenticated()) { return next(); }
		else { res.redirect('/login'); }
	},

	// Ensure administrator
	ensureAdmin: (req,res,next)=>{
		if (req.user.isAdmin){ return next(); }
		else { 
			let err = new Error("Unauthorized");
			err.status = 401;
			next(err);
		}
		//TODO: test this by logging in as !isAdmin and go to /admin
	}

};