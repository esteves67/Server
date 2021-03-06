'use strict';
/* global navigator $ socket userid token mapuser toggleMaps */

$(function(){
	
	var wpid, newloc;
	
	// Set location
	$('#set-loc').click(function(){
		if (!userid===mapuser._id){ alert('You are not logged in! '); }
		else { if (!navigator.geolocation){ alert('Geolocation not enabled. '); }
		
		else { navigator.geolocation.getCurrentPosition(
				
			// Success callback
			function(pos){
				var newloc = {
					tok: token,
					usr: userid,
					lat: pos.coords.latitude,
					lon: pos.coords.longitude,
					spd: (pos.coords.speed||0)
				};
				socket.emit('set', newloc);
				toggleMaps(newloc);
				console.log('⚜ Set location:',newloc.lat+", "+newloc.lon);
			},
			
			// Error callback
			function(err) {
				alert("Unable to set location.");
				console.error('❌️',err.message);
			},
			
			// Options
			{ enableHighAccuracy:true }
		
		); } }
		
	});
	
	// Track location
	$('#track-loc').click(function(){
		if (!userid===mapuser._id) { alert('You are not logged in! '); }
		else {
			
			// Start tracking
			if (!wpid) {
				if (!navigator.geolocation) { alert('Unable to track location. '); }
				else {
					$('#track-loc').html('<i class="fa fa-crosshairs fa-spin"></i>Stop').prop('title',"Click here to stop tracking your location. ");
					wpid = navigator.geolocation.watchPosition(
					
						// Success callback
						function(pos) {
							newloc = {
								tok: token,
								usr: userid,
								lat: pos.coords.latitude,
								lon: pos.coords.longitude,
								spd: (pos.coords.speed||0)
							}; socket.emit('set',newloc);
							toggleMaps(newloc);
							console.log('⚜ Set location:',newloc.lat+", "+newloc.lon);
						},
						
						// Error callback
						function(err){
							alert("Unable to track location.");
							console.error(err.message);
						},
						
						// Options
						{ enableHighAccuracy:true }
						
					);
				}
				
			}
			
			// Stop tracking
			else {
				$('#track-loc').html('<i class="fa fa-crosshairs"></i>Track').prop('title',"Click here to track your location. ");
				navigator.geolocation.clearWatch(wpid);
				wpid = undefined;
			}
			

			
		}
	});
	
	// Clear location
	$('#clear-loc').click(function(){
		if (!userid===mapuser._id) { alert('You are not logged in! '); }
		else {
			// Stop tracking
			if (wpid) {
				$('#track-loc').html('<i class="fa fa-crosshairs"></i>&emsp;Track');
				navigator.geolocation.clearWatch(wpid);
				wpid = undefined;
			}
			
			// Clear location
			newloc = {
				tok: token,
				usr: userid,
				lat:0, lon:0, spd:0
			}; socket.emit('set',newloc);
			
			// Turn off map
			toggleMaps(newloc);
			console.log('⚜ Cleared location');
		}
	});

});