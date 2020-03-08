class Object {
	constructor(x, y, sprite, visible) {
		this.x = x;
		this.y = y;
		this.sprite = sprite;
		this.show = visible; // true or false bool
	}
	// draws a scale-rectified image
	draw() {
		if (this.show) {
			scaledDraw(this.sprite, this.x, this.y);
		}	
	}
}
class Player extends Object {
	constructor(x, y, sprite, visible, lerpSpeed) {
		super(x, y, sprite, visible);
		this.lerpSpeed = lerpSpeed;
	}
	update(dt) {
		// check stun timer
		if (stun_timer <= 0) {
			let diffx = (mousex - this.sprite.width / 2) - this.x;
			let diffy = (mousey - this.sprite.height / 2) - this.y;
			this.x += this.lerpSpeed * diffx;
			this.y += this.lerpSpeed * diffy;
		}
		// console.log("Player Pos: " + this.x + ", " + this.y);
	}
}

// collideables
var col_list = [];
class Collider extends Object{
	constructor(x, y, sprite, visible, radius) {
		super(x,y,sprite,visible);
		this.radius = radius;
		col_list.push(this);
	}
	update(dt) {
		// empty
	}
}
class Enemy extends Collider {
	constructor(x, y, sprite, visible, radius, targetx, targety, lerpSpeed) {
		super(x, y, sprite, visible, radius);
		this.targetx = targetx;
		this.targety = targety;
		this.lerpSpeed = lerpSpeed;
		this.shoot_timer = randFloat(1.0, 3.0);
	}
	// movement // actually, let the ball destroy the enemy
	update(dt) {
		// only do a y lerp for now
		let diffy = this.targety - this.y;
		this.y += this.lerpSpeed * diffy;

		// shoot
		this.shoot_timer -= dt;
		if (this.shoot_timer <= 0) {
			this.shoot_timer = randFloat(1.0, 3.0);
			let temp = new Hazard(this.x + this.radius, this.y + this.radius, enemy_bullet_sprite, true, 8, 100);
		}
	}
}
hazard_list = [];
class Hazard extends Object {
	constructor(x, y, sprite, visible, radius, vely) {
		super(x,y,sprite,visible);
		this.radius = radius;
		this.vely = vely;
		hazard_list.push(this);
	}
	update(dt) {
		this.y += dt * this.vely;
		// do garbage collection in main loop's update
	}
}

// really just a class with velocity physics
class Particle extends Object{
	constructor(x, y, sprite, visible, velx, vely) {
		super(x,y,sprite,visible);
		this.velx = velx;
		this.vely = vely;
	}
	// moves the particle
	update(dt) {
		this.x += this.velx * dt;
		this.y += this.vely * dt;
	}
}

class Ball extends Particle {
	constructor(x, y, sprite, visible, velx, vely, radius) {
		super(x,y,sprite,visible,velx,vely);
		this.radius = radius;
		this.speed = this.magnitude(this.velx, this.vely);
		console.log("Init Ball: " + this.radius + ", " + this.speed);
	}
	magnitude(x, y) {
		return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
	}
	dist(otherx, othery) {
		let diffx = otherx - this.x;
		let diffy = othery - this.y;
		return Math.sqrt(Math.pow(diffx, 2) + Math.pow(diffy, 2));
	}
	bounce(x, y) {
		// get angle
		let diffx = this.x - x;
		let diffy = this.y - y;
		let angle = Math.atan2(diffy, diffx);

		// change velx, vely but maintain speed
		this.velx = this.speed * Math.cos(angle);
		this.vely = this.speed * Math.sin(angle);
	}
	wall_bounce() {
		// check for wall bounce
		// left,right (remember: x,y is the top_left of the sprite)
		if (this.x < 0 || this.x + this.radius * 2 > canvas.scrollWidth) {
			this.velx = -this.velx;
			if (this.x < 0) {
				this.x = 0;
			}
			else {
				this.x = canvas.scrollWidth - this.radius * 2;
			}
			// console.log("Side Wall Bounce: " + this.x + "|" + canvas.scrollWidth);
		}
		// up,down
		if (this.y < 0 || this.y + this.radius * 2 > canvas.scrollHeight) {
			this.vely = -this.vely;
			if (this.y < 0) {
				this.y = 0;
			}
			else {
				this.y = this.canvas.scrollHeight - this.radius*2;
			}
			// console.log("Updown Wall Bounce: " + this.y + "|" + canvas.scrollHeight);
		}
		// bouncing off of the health indicator
		if (this.y + this.radius * 2 >= health_indicator.y) {
			this.vely = -this.vely;
			this.y = health_indicator.y - this.radius * 2;
			// update health indicator
			health_index += 1;
			if (health_index < back.length) {
				health_indicator.sprite = back[health_index];
			}
			else {
				// gameover
				set_gameover();
			}
		}
	}
	collision() {
		// check col_list
		for (a = 0; a < col_list.length; a++) {
			// check collision distance
			let otherx = col_list[a].x;
			let othery = col_list[a].y;
			let min_dist = this.radius + col_list[a].radius;
			if (this.dist(otherx, othery) <= min_dist) {
				// bounce off object
				this.bounce(otherx, othery);
				// destroy if enemy
				if (col_list[a] instanceof Enemy) {
					delete col_list[a];
					col_list.splice(a,1);
					a - 1;
					score += 1;
					// console.log("Destroyed an Enemy");
				}
			}
		}
	}
	update(dt) {
		// check for collisions
		this.collision();
		this.wall_bounce();

		// use particle's update method
		super.update(dt);
	}
}
class Shield extends Collider {
	constructor(x, y, sprite, visible, radius) {
		super(x, y, sprite, visible, radius);
	}
	// dist to other
	dist(otherx, othery) {
		let diffx = otherx - (this.x + this.sprite.width / 2);
		let diffy = othery - (this.y + this.sprite.height / 2);
		return Math.sqrt(Math.pow(diffx, 2) + Math.pow(diffy, 2));
	}
	// hazard collision
	hazard_collision() {
		for (a = 0; a < hazard_list.length; a++) {
			let min_dist = this.radius + hazard_list[a].radius;
			console.log("Min_dist: " + min_dist);
			let otherx = hazard_list[a].x + hazard_list[a].width / 2;
			let othery = hazard_list[a].y + hazard_list[a].height / 2;
			if (this.dist(otherx, othery) <= min_dist) {
				// destroy bullet
				delete hazard_list[a];
				hazard_list.splice(a,1);
				a - 1;

				// get stunned if not already stunned
				if (stun_timer < -0.5) {
					stun_timer = 1.0;
				}
			}
		}
	}
	// movement // actually, let the ball destroy the enemy
	update(dt) {
		// check for collisions with hazards
		this.hazard_collision();

		// check for stunner
		if (stun_timer > 0) {
			// change to stun sprite
			this.sprite = stun_sprite;
		}
		else {
			this.sprite = shield_sprite;
		}
		stun_timer -= dt;

		// follow player
		this.x = player.x + player.sprite.width / 2 - this.sprite.width / 2;
		this.y = player.y + player.sprite.height / 2 - this.sprite.height / 2;

		// use parent's update
		super.update(dt);
	}
}

class ParallaxLayer {
	constructor(low, high) {
		this.range = [low, high];
		this.elems = [];
	}
	addElem(x, y, sprite) {
		this.elems.push(new Particle(x, y,sprite, true, 0, randInt(this.range[0], this.range[1])));
	}
	update(dt) {
		for (a = 0; a < this.elems.length; a++) {
			this.elems[a].update(dt);
			// check if out of bounds
			if (this.elems[a].y > canvas.scrollHeight) {
				// reset
				this.elems[a].y = 0;
				this.elems[a].x = randInt(0,canvas.scrollWidth);
			}
		}
	}
	draw() {
		// draw each particle
		for (a = 0; a < this.elems.length; a++) {
			this.elems[a].draw();
		}
	}
}