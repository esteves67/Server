'use strict';

// Imports
const mw = require('./middleware.js'),
	User = require('./models.js').user;

// Check for tracking clients
function checkForUsers(io, user) {
	//console.log(`Checking for clients receiving updates for ${user}`);
	
	// Checks if any sockets are getting updates for this user
	//TODO: Use Object.values() after upgrading to node v7
	if (Object.keys(io.sockets.connected).map( (id)=>{
		return io.sockets.connected[id];
	}).some( (socket)=>{
		return socket.gets==user;
	})) {
		//console.log(`Activating updates for ${user}.`);
		io.to(user).emit('activate','true');
	} else {
		//console.log(`Deactivating updates for ${user}.`);
		io.to(user).emit('activate', 'false');
	}
}

module.exports = {
	
	checkForUsers: checkForUsers,
	
	init: (io)=>{
		io.on('connection', (socket)=>{
			//console.log(`${socket.id} connected.`);
			
			/* Log */
			//socket.on('log', (text)=>{
				//console.log(`LOG: ${text}`);
			//});
			
			// This socket can set location (app)
			socket.on('can-set', (userId)=>{
				//console.log(`${socket.id} can set updates for ${userId}.`);
				socket.join(userId, ()=>{
					//console.log(`${socket.id} joined ${userId}`);
				});
				checkForUsers( io, userId );
			});
			
			// This socket can receive location (map)
			socket.on('can-get', (userId)=>{
				socket.gets = userId;
				//console.log(`${socket.id} can get updates for ${userId}.`);
				socket.join(userId, ()=>{
					//console.log(`${socket.id} joined ${userId}`);
					socket.to(userId).emit('activate', 'true');
				});
			});
			
			// Set location
			socket.on('set', (loc)=>{
				//console.log(`${socket.id} set location for ${loc.usr}`);
				loc.time = Date.now();
				
				// Check for sk32 token
				if (!loc.tok) { mw.throwErr(new Error(`⛔️ !loc.tok for loc: ${loc}`)) }
				else {
					
					// Get loc.usr
					User.findById(loc.usr, (err,user)=>{
						if (err) { mw.throwErr(err); }
						if (user) {
							
							// Confirm sk32 token
							if (loc.tok!=user.sk32) { mw.throwErr(new Error(`⛔️ loc.tok!=user.sk32\n\t${loc.tok} != ${user.sk32}`)); }
							else {
								
								// Broadcast location
								io.to(loc.usr).emit('get', loc);
								//console.log(`Broadcasting ${loc.lat}, ${loc.lon} to ${loc.usr}`);
								
								// Save in db as last seen
								user.last = {
									lat: parseFloat(loc.lat),
									lon: parseFloat(loc.lon),
									dir: parseFloat(loc.dir||0),
									spd: parseFloat(loc.spd||0),
									time: loc.time
								};
								user.save( (err)=>{
									if (err) { mw.throwErr(err); }
								} );
								
							}
						}
					});
				
				}
			});
			
			// Shutdown (check for remaining clients)
			socket.on('disconnect', (reason)=>{
				//console.log(`${socket.id} disconnected because of a ${reason}.`);
				
				// Check if client was receiving updates
				if (socket.gets){
					//console.log(`${socket.id} left ${socket.gets}`);
					checkForUsers( io, socket.gets );
				}
				
			});
			
			// Log errors
			socket.on('error', (err)=>{
				mw.throwErr(err);
			});
			
		});
	}
	
};