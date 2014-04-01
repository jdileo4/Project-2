//-----------------------------------------
//setup..
//-----------------------------------------

// The node.js HTTP server.
var app = require('http').createServer(handler);

// The socket.io WebSocket server, running with the node.js server.
var io = require('socket.io').listen(app);

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

//(when someone connects, add these event handlers to that client)
var allsockets = [];
io.sockets.on('connection', function(client) {
	allsockets.push(client);
	// Send a welcome message first.
	client.emit('welcome', 'Welcome to Bitris!');

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
			// client.broadcast.emits() will send to all clients except the
			// current client. See socket.io FAQ for more examples.
			client.broadcast.emit('notification', message.user_name + ' entered the room.');

			//added------------------------------
			client.set('piece', new Piece());

			return;
		}
		// When something is wrong, send a login_failed message to the client.
		client.emit('login_failed');
	});
	
	
	//listeners.............

	//TODO is it socket.on or something else?  or this?
	client.on('moveLeft', function() {
		//debug
		console.log("moveLeft sent from html and picked up by listener in server");
		
		//TODO  is this right?  does this detect 'moveLeft' from
		//either client then access the piece from only that client
		//that sent the message 'moveLeft'?
		client.get('piece',
				function(err, result)
				{
					result.moveLeft();
				}
			);
		io.sockets.emit('syncUpdate', globalGrid);
	});

	client.on('moveRight', function() {
		//TODO  is this right?  does this detect 'moveRight' from
		//either client then access the piece from only that client
		//that sent the message 'moveRight'?
		client.get('piece', 
			function(err, result)
			{
				result.moveRight();
			}
		);
		io.sockets.emit('syncUpdate', globalGrid);
	});

	client.on('moveDown', function() {
		//TODO  is this right?  does this detect 'moveDown' from
		//either client then access the piece from only that client
		//that sent the message 'moveDown'?
		client.get('piece', 
			function(err, result)
			{
				result.moveDown();
			}
		);
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

	for (var i = 0; i < allsockets.length; ++i)
	{
	    client = allsockets[i];
		client.get('piece', function(err, result) 
		{
			for (var x = 0; x < 17; x++) {
				for (var y = 0; y < 17; y++) {
					if (result.lastLocations[0].x == x && result.lastLocations[0].y == y) 
					{
						globalGrid[x][y] = 0;
					};
					if (result.locations[0].x == x && result.locations[0].y == y) 
					{
						globalGrid[x][y] = result.color;
					};
				};
			};
		});
	};
};


//-------------------------------------------
//Piece class
//-------------------------------------------

function Piece() {
	this.color = 1;
	this.locations = [];
	this.locations[0] = {
		//just over top right of play area
		x : 13,
		//y increases downward
		y : 0
	};
	
	this.lastLocations = this.locations;

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
}

//move functions

Piece.prototype.moveLeft = function() {
	this.lastLocations[0] = this.locations[0];
	this.locations[0].x--;
	updateGlobalGrid();
};

Piece.prototype.moveRight = function() {
	this.lastLocations[0] = this.locations[0];
	this.locations[0].x++;
	updateGlobalGrid();
};

Piece.prototype.moveDown = function() {
	this.lastLocations[0] = this.locations[0];
	this.locations[0].y++;
	//future... reset clock
	updateGlobalGrid();
};

