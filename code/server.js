//general todos
//TODO:  may want to more specifically tie in one timer per client...
	//presently the single timer seems to be working the way
	//we want but hard to tell at this point

//-----------------------------------------
//setup..
//-----------------------------------------

//static variables
var GLOBAL_GRID_SIZE = 17

var RED = 1;
var ORANGE = 2;
var YELLOW = 3;
var GREEN = 4;
var CYAN = 5;
var PURPLE = 6;
var PINK = 7;
var GREY = 8;

var SQUARE = 1;
var L_SHAPE = 2;
var BACKWARDS_L_SHAPE = 3;
var LINE = 4;
var T_SHAPE = 5;
var Z_SHAPE = 6;
var BACKWARDS_Z_SHAPE = 7;

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


//--------------------------------------
//Global variables
//--------------------------------------
//timer object
var interval;
//(when someone connects, add these event handlers to that client)
var clientArray = [];

//globalGrid keeps track of all pieces, moving and set
//make 2 dimensional GLOBAL_GRID_SIZExGLOBAL_GRID_SIZE array
var globalGrid = new Array(GLOBAL_GRID_SIZE);
for (var i = 0; i < GLOBAL_GRID_SIZE; i++) {
	globalGrid[i] = new Array(GLOBAL_GRID_SIZE);
}

//background keeps track of fallen/set pieces only
var backgroundGrid = new Array(GLOBAL_GRID_SIZE);
for (var i = 0; i < GLOBAL_GRID_SIZE; i++) {
						//initialize all values to 0
	backgroundGrid[i] = Array.apply(null, new Array(GLOBAL_GRID_SIZE)).
										map(Number.prototype.valueOf,0);;
}


//--------------------------------------
//Socket io  and event listeners
//--------------------------------------


// Tells socket.io to listen to an event called 'connection'.
// This is a built-in event that is triggered when a client connects to the
// server. At that time, the function (the 2nd argument) will be called with an
// object representing the client.
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

			//CLIENT ATTRIBUTES------------------------------------------------------------------
			client.set('piece', new Piece((Math.floor(Math.random() * 7) + 1), client));
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
		
			//TIMER----------------------------------------------------------------------------
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
	
	
	//LISTENERS------------------------------------------------------------------------

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
		
		//io.sockets.emit('syncUpdate', globalGrid);
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
		//io.sockets.emit('syncUpdate', globalGrid);
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
											client.get('piece', function(err, piece){
												piece.moveDown();
											});
										}, 1000);
								});
							}
						);
					}
			}));
		//io.sockets.emit('syncUpdate', globalGrid);
	});

});


//-----------------------------------------
//Main code
//-----------------------------------------

//make sure globalGrid is up to date
function updateGlobalGrid() {
	for (var i = 0; i < clientArray.length; ++i)
	{
	    client = clientArray[i];
		//debug
		//console.log("updateGlobalGrid: clientArray[" + i +
		//			"] == " + client);
		client.get('piece', function(err, result) 
		{
			if (result){
				for (var x = 0; x < GLOBAL_GRID_SIZE; x++) {
					for (var y = 0; y < GLOBAL_GRID_SIZE; y++) {
						for (var i = 0; i < result.locations.length; i++){
							if (result.lastLocations[i].x == x && result.lastLocations[i].y == y) 
							{
								globalGrid[x][y] = 0;
							}
							if (backgroundGrid[x][y] > 0)
							{
								globalGrid[x][y] = backgroundGrid[x][y];
							}
						};
					};
				};
				for (var x = 0; x < GLOBAL_GRID_SIZE; x++) {
					for (var y = 0; y < GLOBAL_GRID_SIZE; y++) {
						for (var i = 0; i < result.locations.length; i++){
							if (result.locations[i].x == x && result.locations[i].y == y)
							{
								globalGrid[x][y] = result.color;
								//debug
								//console.log('Last: ' + result.lastLocations[0].x + ',' + result.lastLocations[0].y);
							};
						};
					};
				};
			}
			else
			{
				console.log(err);
			};
			//debug
			console.log("locations at update: (" +
						result.locations[0].x + "," + result.locations[0].y + ") , (" +
						result.locations[1].x + "," + result.locations[1].y + ") , (" +
						result.locations[2].x + "," + result.locations[2].y + ") , (" +
						result.locations[3].x + "," + result.locations[3].y + ") , (");
		});
	};
	
	io.sockets.emit('syncUpdate', globalGrid);
};


//---------------------------------------------------------------------------------------------
//Piece
//---------------------------------------------------------------------------------------------

function Piece(type, client) {
	//properties
	this.client = client;
	this.color = type;
	this.locations = [];
	this.lastLocations = [];
	//piece shape
	switch (type)
	{
		case SQUARE:						//square
			this.locations[0] = {
				//just over top right of play area
				x : GLOBAL_GRID_SIZE - 4,
				//y increases downward
				y : 0
			};
			this.locations[1] = {
				x : GLOBAL_GRID_SIZE - 5,
				y : 0
			}
			this.locations[2] = {
				x : GLOBAL_GRID_SIZE - 4,
				y : 1
			}
			this.locations[3] = {
				x : GLOBAL_GRID_SIZE - 5,
				y : 1
			}
			break;
		
		case L_SHAPE:						//L-shape
			this.locations[0] = {
				//just over top right of play area
				x : GLOBAL_GRID_SIZE - 4,
				//y increases downward
				y : 0
			};
			this.locations[1] = {
				x : GLOBAL_GRID_SIZE - 5,
				y : 0
			}
			this.locations[2] = {
				x : GLOBAL_GRID_SIZE - 4,
				y : 1
			}
			this.locations[3] = {
				x : GLOBAL_GRID_SIZE - 4,
				y : 2
			}
			break;
		
		case BACKWARDS_L_SHAPE:						//Backwards L shape
			this.locations[0] = {
				//just over top right of play area
				x : GLOBAL_GRID_SIZE - 4,
				//y increases downward
				y : 0
			};
			this.locations[1] = {
				x : GLOBAL_GRID_SIZE - 5,
				y : 0
			}
			this.locations[2] = {
				x : GLOBAL_GRID_SIZE - 5,
				y : 1
			}
			this.locations[3] = {
				x : GLOBAL_GRID_SIZE - 5,
				y : 2
			}
			break;
		
		case LINE:						//line
			this.locations[0] = {
				//just over top right of play area
				x : GLOBAL_GRID_SIZE - 4,
				//y increases downward
				y : 0
			};
			this.locations[1] = {
				x : GLOBAL_GRID_SIZE - 4,
				y : 1
			}
			this.locations[2] = {
				x : GLOBAL_GRID_SIZE - 4,
				y : 2
			}
			this.locations[3] = {
				x : GLOBAL_GRID_SIZE - 4,
				y : 3
			}
			break;
		
		case T_SHAPE:						//T-shape
			this.locations[0] = {
				//just over top right of play area
				x : GLOBAL_GRID_SIZE - 4,
				//y increases downward
				y : 0
			};
			this.locations[1] = {
				x : GLOBAL_GRID_SIZE - 5,
				y :0
			}
			this.locations[2] = {
				x : 11,
				y : 0
			}
			this.locations[3] = {
				x : GLOBAL_GRID_SIZE - 5,
				y : 1
			}
			break;
		
		case Z_SHAPE:						//Z-shape
			this.locations[0] = {
				//just over top right of play area
				x : GLOBAL_GRID_SIZE - 4,
				//y increases downward
				y : 0
			};
			this.locations[1] = {
				x : GLOBAL_GRID_SIZE - 4,
				y : 1
			}
			this.locations[2] = {
				x : GLOBAL_GRID_SIZE - 5,
				y : 1
			}
			this.locations[3] = {
				x : GLOBAL_GRID_SIZE - 5,
				y : 2
			}
			break;
		
		case BACKWARDS_Z_SHAPE:					//Backwards Z-shape
			this.locations[0] = {
				//just over top right of play area
				x : GLOBAL_GRID_SIZE - 5,
				//y increases downward
				y : 0
			};
			this.locations[1] = {
				x : GLOBAL_GRID_SIZE - 5,
				y : 1
			}
			this.locations[2] = {
				x : GLOBAL_GRID_SIZE - 4,
				y : 1
			}
			this.locations[3] = {
				x : GLOBAL_GRID_SIZE - 4,
				y : 2
			}
			break;
			
		default:
			console.log("Error, Piece created of type: " + type);
			break;
	}
	
	
	this.lastLocations = JSON.parse(JSON.stringify(this.locations));
	
		
	//update globalGrid
	for (var x = 0; x < GLOBAL_GRID_SIZE; x++) {
		for (var y = 0; y < GLOBAL_GRID_SIZE; y++) {
			for (var i = 0; i < this.locations.length; i++){
				if (this.lastLocations[i].x == x && this.lastLocations[i].y == y) {
					globalGrid[x][y] = 0;
				}
				if (this.locations[i].x == x && this.locations[i].y == y) {
					globalGrid[x][y] = this.color;			
				}
			}
		}
	}
	
	//debug
	console.log("'piece' created");
}

//move functions-----------------------------------

Piece.prototype.moveLeft = function() {
	//TODO  check if can move:
		//can move if: x > 1 && for each locations[]: backgroundGrid [locations[i].x - 1] [locations[i].y] == 0
	var temp = JSON.parse(JSON.stringify(this.locations));
	this.lastLocations = temp;
	
	//debug
	console.log("moveLeft");
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	for (var i = 0; i < this.locations.length; i++){
		this.locations[i].x--;
		//TODO possible debug here reporting locations
	}
	//debug
	//console.log("after this.locations[0].x--");
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	updateGlobalGrid();
};

Piece.prototype.moveRight = function() {
	//TODO  check if can move:
		//can move if: x < 16 && for each locations[]: backgroundGrid [locations[i].x + 1] [locations[i].y] == 0
	var temp = JSON.parse(JSON.stringify(this.locations));
	this.lastLocations = temp;
	//debug
	console.log("moveRight");
	//debug
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	for (var i = 0; i < this.locations.length; i++){
		this.locations[i].x++;
	}
	//debug
	//console.log("after this.locations[0].x--");
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	updateGlobalGrid();
};

Piece.prototype.moveDown = function() {
	var temp = JSON.parse(JSON.stringify(this.locations));
	this.lastLocations = temp;
	//debug
	console.log("moveDown");
	
	//debug
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	
	//if invalid move, set piece and exit function
	for (var i = 0; i < this.locations.length; i++){
		if( (this.locations[i].y >= GLOBAL_GRID_SIZE - 1) ||
			(backgroundGrid[this.locations[i].x][this.locations[i].y + 1] != 0))
		{
			this.setPiece();
			updateGlobalGrid();
			return;
		};
	};
	//else... valid move, move the piece
	for (var i = 0; i < this.locations.length; i++){
		this.locations[i].y++;
	};
	//debug
	//console.log("after this.locations[0].x--");
	//console.log("Last location: (" + this.lastLocations[0].x + "," + this.lastLocations[0].y + "); This location: (" + this.locations[0].x + "," + this.locations[0].y + ")."); 
	
	updateGlobalGrid();
};


//HELPER FUNCTIONS--------------------------------------------------------------------------------------


Piece.prototype.setPiece = function() {
	//add piece to background grid
	for (var i = 0; i < this.locations.length; i++)
	{
		//debug
		console.log("setting locations[" + i + "] : ");
		console.log(this.locations[i]);
		backgroundGrid[this.locations[i].x][this.locations[i].y] = GREY;
	}
	//create new client piece
	this.client.set('piece', new Piece((Math.floor(Math.random() * 7) + 1), this.client));
}

//TODO remove this
function hack(){
	this.loggedIn = false;
}
