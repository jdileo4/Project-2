//-----------------------------------------
//setup..
//-----------------------------------------

// The node.js HTTP server.
var app = require('http').createServer(handler);

// The socket.io WebSocket server, running with the node.js server.
var io = require('socket.io').listen(app);

// Allows access to local file system.
var fs = require('fs')

// Listen on a high port.
app.listen(30303);


// Handles HTTP requests.
function handler(request, response) {
  // This will read the file 'index.html', and call the function (the 2nd
  // argument) to process the content of the file.
  // __dirname is a preset variable pointing to the folder of this file.
  fs.readFile(
    __dirname + '/../Bitris.html',
    function(err, content) {
      if (err) {
        // If an error happened when loading 'index.html', return a 500 error.
        response.writeHead(500);
        return response.end('Error loading index.html!');
      }
      // If no error happened, return the content of 'index.html'
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.end(content);
    });
}


// Tells socket.io to listen to an event called 'connection'.
// This is a built-in event that is triggered when a client connects to the
// server. At that time, the function (the 2nd argument) will be called with an
// object representing the client.

//(when someone connects, add these event handlers to that client)
io.sockets.on(
  'connection',
  function(client) {
    // Send a welcome message first.
    client.emit('welcome', 'Welcome to my chat room!');

    // Listen to an event called 'login'. The client should emit this event when
    // it wants to log in to the chat room.
    client.on(
      'login',
      function(message) {
        // This function extracts the user name from the login message, stores
        // it to the client object, sends a login_ok message to the client, and
        // sends notifications to other clients.
        if (message && message.user_name) {
          client.set('user_name', message.user_name);
          client.emit('login_ok');
          // client.broadcast.emits() will send to all clients except the
          // current client. See socket.io FAQ for more examples.
          client.broadcast.emit('notification',
                                message.user_name + ' entered the room.');
			
			//added------------------------------
			//adding piece to client
			//TODO
			
          return
        }
        // When something is wrong, send a login_failed message to the client.
        client.emit('login_failed');
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

var player1Piece = Piece();
var player2Piece = Piece();

//make sure globalGrid is up to date
var updateGlobalGrid = function()
{
	for (var x = 0; x<17; x++)
	{
		for (var y = 0; y < 17; y++)
		{
			if ( player1Piece.lastLocations[0].x = x &&
					player1Piece.lastLocations[0].y = y)
			{
				globalGrid[x][y] = 0;
			}
			if ( player1Piece.locations[0].x = x &&
					player1Piece.locations[0].y = y)
			{
				globalGrid[x][y] = player1Piece.color;
			}
		}
	}
}


//listeners.............

socket.on(
	'moveLeft',
	function()
	{
	//how do we know which player is emitting this event?
		//if 'moveLeft' came from player1
		player1Piece.moveLeft();
		//if 'moveLeft' came from player2
		//player2Piece.moveLeft()
		socket.broadcast.emit('syncUpdate', globalGrid);
	};
);


socket.on(
	'moveRight',
	function()
	{
	//how do we know which player is emitting this event?
		//if 'moveRight' came from player1
		
		player1Piece.moveRight();
		//if 'moveRight' came from player2
		//player2Piece.moveRight()
		socket.broadcast.emit('syncUpdate', globalGrid);
	};
);
socket.on(
	'moveDown',
	function()
	{
	//how do we know which player is emitting this event?
		//if 'moveDown' came from player1
		player1Piece.moveDown();
		//if 'moveDown' came from player2
		//player2Piece.moveDown()
		socket.broadcast.emit('syncUpdate', globalGrid);
	};
);


//-------------------------------------------
//Piece class
//-------------------------------------------

function Piece(){
	this.color = 1;
	if(this.locations)
	{
		this.lastLocations = this.locations;
	}
	else
	{
		this.lastLocations = [];
	}
	this.locations = [];
	this.locations[0] = {
	//just over top right of play area
		x: 13,
		//y increases downward
		y: 0
	}
	
	updateGlobalGrid();
	
	
}

Piece.prototype.moveLeft = function()
{
	this.lastLocations[0] = this.locations[0];
	this.locations[0].x--;
	updateGlobalGrid();
}

Piece.prototype.moveRight = function()
{
	this.lastLocations[0] = this.locations[0];
	this.locations[0].x++;
	updateGlobalGrid();
}

Piece.prototype.moveDown = function()
{
	this.lastLocations[0] = this.locations[0];
	this.locations[0].y++;
	//TODO reset clock
	updateGlobalGrid();
}

