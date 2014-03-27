//-----------------------------------------
//setup
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
    __dirname + '/index.html',
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

//-----------------------------------------
//main code
//-----------------------------------------

var globalGrid = [][];

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


//listeners

socket.on(
	'moveLeft',
	function()
	{
		player1Piece.moveLeft()
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

