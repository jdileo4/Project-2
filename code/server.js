//general todos
//TODO:  may want to more specifically tie in one timer per client...
	//presently the single timer seems to be working the way
	//we want but hard to tell at this point

//-----------------------------------------
//setup..
//-----------------------------------------
//var jQuery = document.createElement('script');
//jQuery.src = "//ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js";

// The node.js HTTP server.
var app = require('http').createServer(handler);

// The socket.io WebSocket server, running with the node.js server.
var io = require('socket.io').listen(app);
//lower level of debug log messages
io.set('log level', 1);

// Allows access to local file system.
var fs = require('fs');

var url = require('url');

// Listen on a high port.
app.listen(30303);

// Handles HTTP requests.
function handler(request, response) {
	// This will read the file 'index.html', and call the function (the 2nd
	// argument) to process the content of the file.
	// __dirname is a preset variable pointing to the folder of this file.
	var req = url.parse(request.url, true);
	var action = req.pathname;
	
	if(action == '/'){
		fs.readFile(__dirname + '/../Bitris.html', function(err, content) {
			if (err) {
				// If an error happened when loading 'Bitris.html', return a 500 error.
				response.writeHead(500);
				return response.end('Error loading Bitris.html!');
			}
			// If no error happened, return the content of 'Bitris.html'
			response.writeHead(200, {
				'Content-Type' : 'text/html'
			});
			response.end(content);
		});
	} else {
		fs.readFile(__dirname + '/..' + action, function(err, content) {
		if (err) {
			// If an error happened when loading 'index.html', return a 500 error.
			response.writeHead(500);
			return response.end('Error loading other file!');
		}
		// If no error happened, return the content of whatever's being asked for
		var type = action.substr(-3);
		if(type == 'png'){
			response.writeHead(200, {
				'Content-Type' : 'image/png'
			});
		} else if(type == 'jpg'){
			response.writeHead(200, {
				'Content-Type' : 'image/jpg'
			});
		}
		response.end(content);
	});
	}
}

// Tells socket.io to listen to an event called 'connection'.
// This is a built-in event that is triggered when a client connects to the
// server. At that time, the function (the 2nd argument) will be called with an
// object representing the client.

//timer object
var interval;
//(when someone connects, add these event handlers to that client)
var clientArray = [];
io.sockets.on('connection', function(client) {
	// Send a welcome message first.
	client.emit('welcome', 'Welcome to Bitris!');
	
	
	client.set('loggedIn', false);

	// Listen to an event called 'login'. The client should emit this event when
	// it wants to log in to the chat room.
	client.on('login', function(message) {
		
		//debug
		//console.log("login sent from html and picked up by listener in server");
		
		// This function extracts the user name from the login message, stores
		// it to the client object, sends a login_ok message to the client, and
		// sends notifications to other clients.
		if (message && message.user_name) {
			client.set('user_name', message.user_name);
			client.emit('login_ok');
			//// client.broadcast.emits() will send to all clients except the
			//// current client. See socket.io FAQ for more examples.
			//client.broadcast.emit('notification', message.user_name + ' entered the room.');
			
			//add client to list of sockets
			clientArray.push(client);

			//adding attributes------------------------------
			client.set('piece', new Piece());
			client.set('loggedIn', true);
			client.set('interval', {interval : 0, client : client});
			if (clientArray.length > 1)
			{
				client.set('rotated', true);
				//debug
				console.log("client is rotated");
			}
			else
			{
				client.set ('rotated', false);
				//debug
				console.log("client is NOT rotated");
			}
			
			//debug
			console.log("Login successful: " + message.user_name);
		
			//upon login of both clients, begin timer.
			//TODO: have this instead under client.on('ready')
			if (clientArray.length == 2){
				for (var i = 0; i < clientArray.length; ++i){
					clientArray[i].get('interval', function(err, result){
						if (result)
						{
							
							result.interval = 
								setInterval(function(){
									result.client.get('piece', function(err, result1){
											//debug
											result.client.get('user_name', function(err, userName){
													console.log("interval count (" + userName +
														"): login");
											});
											result1.moveDown();
									});
								}, 1000);
						}
						else
						{
							console.log(err);
						}
						
					});
				}
			}
			return;
		}
		// When something is wrong, send a login_failed message to the client.
		client.emit('login_failed');
		//debug
		console.log("login failed");
	});
	
	
	//listeners.............

	//TODO is it socket.on or something else?  or this?
	client.on('moveLeft', function() {
		//debug
		//console.log("moveLeft sent from html and picked up by listener in server");
		
		if(client.get('loggedIn', function(err, loggedIn)
			{	
				//debug
				//console.log("logged in = " + loggedIn);
				if (loggedIn == true)
				{
					client.get('piece',
							function(err, result)
							{
								result.moveLeft();
							}
						);
				}
			}));
		
		io.sockets.emit('syncUpdate', globalGrid);
	});

	client.on('moveRight', function() {		
		if(client.get('loggedIn', function(err, loggedIn)
			{	
				//debug
				//console.log("logged in = " + loggedIn);
				if (loggedIn == true)
				{
					client.get('piece', 
						function(err, result)
						{
							result.moveRight();
						}
					);
				}
			}));
		io.sockets.emit('syncUpdate', globalGrid);
	});

	client.on('moveDown', function() {
		if(client.get('loggedIn', function(err, loggedIn)
				{	
					//debug
					//console.log("logged in = " + loggedIn);
					if (loggedIn == true)
					{
						client.get('piece', 
							function(err, result)
							{
								result.moveDown();
								
								//clear current interval object and set new one
								client.get('interval', function(err, result){
									clearInterval(result.interval);
									result.interval = 
										setInterval(function(){
											//debug
											console.log("interval count: moveDown");
											client.get('piece', function(err, result1){
												result1.moveDown();
											});
										}, 1000);
								});
							}
						);
					}
			}));
		io.sockets.emit('syncUpdate', globalGrid);
	});

});

//-----------------------------------------
//main code
//-----------------------------------------

//make 2 dimensional 17x17 array
var globalGrid = new Array(17);
for (var i = 0; i < 17; i++) {
	globalGrid[i] = new Array(17);
}


//make sure globalGrid is up to date
function updateGlobalGrid() {
	
	//
	
	for (var i = 0; i < clientArray.length; ++i)
	{
	    client = clientArray[i];
		//debug
		//console.log("updateGlobalGrid: clientArray[" + i +
		//			"] == " + client);
		client.get('piece', function(err, result) 
		{
			if (result){
				for (var x = 0; x < 17; x++) {
					for (var y = 0; y < 17; y++) {
						if (result.lastLocations[0].x == x && result.lastLocations[0].y == y) 
						{
							globalGrid[x][y] = 0;
						};
						if (result.locations[0].x == x && result.locations[0].y == y) 
						{
							globalGrid[x][y] = result.color;
							//debug
							//console.log('Last: ' + result.lastLocations[0].x + ',' + result.lastLocations[0].y);
						};
					};
				};
			}
			else
			{
				console.log(err);
			};
		});
	};
	
	io.sockets.emit('syncUpdate', globalGrid);
};


//-------------------------------------------
//Piece class
//-------------------------------------------

function Piece() {
	this.color = 1;
	this.locations = [];
	this.lastLocations = [];
	this.locations[0] = {
		//just over top right of play area
		x : 13,
		//y increases downward
		y : 0
	};
	
	this.lastLocations[0] = {
		x : 13,
		y : 0
	};
	
		
	//update globalGrid
	for (var x = 0; x < 17; x++) {
		for (var y = 0; y < 17; y++) {
			if (this.lastLocations[0].x == x && this.lastLocations[0].y == y) {
				globalGrid[x][y] = 0;
			}
			if (this.locations[0].x == x && this.locations[0].y == y) {
				globalGrid[x][y] = this.color;			
			}
		}
	}
	
	//debug
	console.log("'piece' created");
}

//move functions

Piece.prototype.moveLeft = function() {
	var temp = JSON.parse(JSON.stringify(this.locations[0]));
	this.lastLocations[0] = temp;
	
	//debug
	console.log("moveLeft");
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	this.locations[0].x--;
	//debug
	//console.log("after this.locations[0].x--");
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	updateGlobalGrid();
};

Piece.prototype.moveRight = function() {
	var temp = JSON.parse(JSON.stringify(this.locations[0]));
	this.lastLocations[0] = temp;
	//debug
	console.log("moveRight");
	//debug
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	this.locations[0].x++;
	//debug
	//console.log("after this.locations[0].x--");
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	updateGlobalGrid();
};

Piece.prototype.moveDown = function() {
	var temp = JSON.parse(JSON.stringify(this.locations[0]));
	this.lastLocations[0] = temp;
	//debug
	console.log("moveDown");
	
	//debug
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	
	this.locations[0].y++;
	
	//debug
	//console.log("after this.locations[0].x--");
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	
	updateGlobalGrid();
};


function hack(){
	this.loggedIn = false;
}
