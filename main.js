// declare references to main canvas
var canvas = document.getElementById("game_window");
var context = canvas.getContext("2d");
context.font = "16px Arial";
var scalex = canvas.width / canvas.width;
var scaley = canvas.height / canvas.height;
// canvas.style.cursor = "none";

// if in portrait mode, set to fill the screen
if (window.innerWidth < window.innerHeight) {
	if (canvas.width != window.innerWidth || canvas.height != window.innerHeight) {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		canvas.style.width = window.innerWidth + "px";
		canvas.style.height = window.innerHeight + "px";
		console.log("canvas w/h: " + canvas.width + ", " + canvas.height);
		console.log("scroll w/h: " + canvas.scrollWidth + ", " + canvas.scrollHeight);
		console.log("client w/h: " + canvas.clientWidth + ", " + canvas.clientHeight);
	}
}
else {
	canvas.width = 377;
	canvas.height = 600;
	canvas.style.width = window.innerWidth + "px";
	canvas.style.height = window.innerHeight + "px";
}

// get game resources
var player_sprite = new Image();
player_sprite.src = "ship.png";
var shield_sprite = new Image();
shield_sprite.src = "shield.png";
var stun_sprite = new Image();
stun_sprite.src = "stun_shield.png";
var star_sprite = new Image();
star_sprite.src = "star.png";
var ball_sprite = new Image();
ball_sprite.src = "ball.png";
var enemy_bullet_sprite = new Image();
enemy_bullet_sprite.src = "enemy_bullet.png";

// enemy sprites
var enemy1_sprite = new Image();
enemy1_sprite.src = "enemy1.png";

// backboard sprites
var back = [];
for (a = 0; a < 3; a++) {
	back.push(new Image());
}
back[0].src = "green_box.png";
back[1].src = "yellow_box.png";
back[2].src = "red_box.png";
var health_index = 0;
var health_indicator = new Object(0, canvas.height - 50, back[health_index], true);
// WARNING: sprite width and height are 0 for some reason
// this is because the image hasn't actually loaded yet
// gonna need some js voodoo to make this all work
// screw it, just hardcode the sprite width

// background parallax layer
var bg_layer = new ParallaxLayer(100, 250);

// player object
// var player = new Collider(0,0, player_sprite, true, 16);
var player = new Player(0,0, player_sprite, true, .15);
var shield = new Shield(0,0, shield_sprite, true, 16);

// ball object
var ball = new Ball(canvas.width/2, 100, ball_sprite, true, 250, 250, 16);
// console.log("Init Ball Pos: " + ball.x + ", " + ball.y);

// enemy ships
var spawn_range = [2.0, 3.0]; // seconds
var next_spawn = 1.0;

// track game time
var fps = 30; // might not use this
var last_time = new Date();

// score
var score = 0;

// gameover setting
var gameover = false;

// stun stuff
var stun_timer = 0;

// register mouse position and move through the update function
var mousex = canvas.width / 2;
var mousey = canvas.height * .75;

// init onload
window.onload = init();

// get mouse events
function init() {
	console.log("Initializing...");
	canvas.addEventListener("pointermove", canvasMove, false);

	// fill parallax layer
	for (a=0; a<20; a++) {
		randx = randInt(0, canvas.width);
		randy = randInt(0, canvas.height);
		bg_layer.addElem(randx, randy, star_sprite);
	}
}

// main loop
var frame_counter = 0;
function mainLoop() {
	// only do things if not in gameover mode
	if (!gameover) {
		// get time diff
		let curr_time = new Date();
		let dt = curr_time - last_time; // returns milliseconds
		dt /= 1000; // in seconds
		last_time = curr_time;
		// run main game functions
		spawn(dt);
		update(dt);
		render();
		// console.log("Frame: " + frame_counter++);
	}
	else {
		// set black
		context.fillStyle = "black";
		context.fillRect(0,0,canvas.width,canvas.height);
		// show game over
		context.fillStyle = "red";
		context.textAlign = "center";
		context.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2);
	}
	requestAnimationFrame(mainLoop);
}

// Start things off
requestAnimationFrame(mainLoop);

// spawn new enemies
function spawn(dt) {
	// countdown timer
	next_spawn -= dt;
	if (next_spawn <= 0) {
		next_spawn = randFloat(spawn_range[0], spawn_range[1]);
		// spawn new enemy
		let sprite = enemy1_sprite;
		let rx = randInt(0, canvas.width - sprite.width * 2);
		let ry = randInt(sprite.height*2, canvas.height / 3);
		let new_enemy = new Enemy(rx, -16, sprite, true, 16, 0, ry, .15);
		// console.log("Spawned new enemy: " + rx + ", " + ry);
	}
}

// update everything
function update(dt) {
	// update
	bg_layer.update(dt);
	for (a = 0; a < col_list.length; a++) {
		col_list[a].update(dt);
	}
	player.update(dt);
	shield.update(dt);
	ball.update(dt);
	for (a = 0; a <hazard_list.length; a++) {
		hazard_list[a].update(dt);
		// destroy if off the canvas
		if (hazard_list[a].y > canvas.height) {
			delete hazard_list[a];
			hazard_list.splice(a,1);
			a - 1;
		}
	}
}

// draw things in order
function render() {
	// draw back to front
	context.fillStyle = "black";
	context.fillRect(0,0,canvas.width,canvas.height);
	bg_layer.draw();
	health_indicator.draw();
	player.draw();
	for (a = 0; a < col_list.length; a++) {
		col_list[a].draw();
	}
	ball.draw();
	for (a = 0; a < hazard_list.length; a++) {
		hazard_list[a].draw();
	}
	context.fillStyle = "white";
	context.textAlign = "start";
	context.fillText("Score: " + score, 20, 20);
}

// react to movement
function canvasMove(event) {
	// get mouse position
	var x = -1;
	var y = -1;
	// check browser specifics
	if (event.layerX || event.layerX == 0) {
		// firefox
		x = event.layerX;
		y = event.layerY;
	}
	else if (event.offsetX || event.offsetX == 0) {
		// opera
		x = event.offsetX;
		y = event.offsetY;
	}

	// update player position // if not stunned
	mousex = x;
	mousey = y;
}

// draw a scale rectified sprite on the screen
function scaledDraw(sprite, x, y) {
	context.drawImage(sprite, Math.round(x * scalex), Math.round(y * scaley), sprite.width * scalex, sprite.height * scaley);
}

// because javascript lets you put the wrong stuff into a function
// and doesn't throw any errors, it just ignores them (WHY THOUGH?)
function randFloat(low, high) {
	return (Math.random() * high) + low;
}
function randInt(low, high) {
	return Math.round(randFloat(low, high));
}

// a blocking sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// swaps to gameover screen
function set_gameover() {
	gameover = true;
	console.log("Set Gameover");
	// not doing anything here anymore
}