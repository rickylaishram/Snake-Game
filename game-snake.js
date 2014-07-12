(function(d3){
var settings = {
		boardSize: 600, 	// Height, Width of the playable board (always square)
		boxSize: 10,		// Heigh, width of a box

		initialSnakeLength: 5, // Length of the snake at the start
		maxHealth: 3,
	},

	container = {
		board: null,

		drawBoard: function(){
			this.board = d3.select('.game-container')
							.append('svg')
							.attr('id', 'game-container')
							.attr('width', settings.boardSize)
							.attr('height', settings.boardSize);
		},
		drawGrid: function() {
			var i = 1
				c = i*settings.boxSize;

			while(settings.boardSize/c > 1) {
				// The vertical line
				this.board.append('line')
						.attr('class', 'grid-line')
						.attr('x1', c)
						.attr('x2', c)
						.attr('y1', 0)
						.attr('y2', settings.boardSize);
				// The horizontal line
				this.board.append('line')
						.attr('class', 'grid-line')
						.attr('y1', c)
						.attr('y2', c)
						.attr('x1', 0)
						.attr('x2', settings.boardSize);
				i++;
				c = i*settings.boxSize
			}
		},
	},

	snake = {
		degreeOfFreedom: ['up', 'down', 'left', 'right'],
		bodyData: [],
		health: settings.maxHealth,
		body: null,
		heading: null, 		// Direction the snake is heading towards
		grewLastTurn: false,

		die: function() {
			this.body.transition()
				.duration(250)
				.attr('fill', 'rgba(255,0,0,1)');
		},

		draw: function() {
			this.body.attr('x', function(d) { return d.x; })
					.attr('y', function(d) { return d.y; })
					.attr('width', settings.boxSize)
					.attr('height', settings.boxSize)
					.attr('fill', function(d,i) { return (i != 0) ? 'rgba(0,255,0,0.5)' : 'rgba(0,255,0,1)';})
					.attr('class', 'snake-body');
		},

		grow: function() {
			var tail = this.bodyData[this.bodyData.length-1];
			this.bodyData.push({x: tail.x, y: tail.y});
			grewLastTurn = true;
			this.body.remove();
			this.body = container.board.selectAll('.snake-body')
							.data(this.bodyData)
							.enter()
							.append('rect');
			this.draw();
		},

		move: function() {
			var length = this.bodyData.length - 1;
			if(this.grewLastTurn) {
				length --;
				this.grewLastTurn = false;
			}
			for (var i = length; i >= 1; i--) {
				this.bodyData[i].x = this.bodyData[i-1].x;
				this.bodyData[i].y = this.bodyData[i-1].y;
			};
			switch (this.heading) {
				case 'up':
					this.bodyData[0].y -= settings.boxSize;
					break;
				case 'down':
					this.bodyData[0].y += settings.boxSize;
					break;
				case 'right':
					this.bodyData[0].x += settings.boxSize;
					break;
				case 'left':
					this.bodyData[0].x -= settings.boxSize;
					break;
			}
			this.draw();
		},

		reset: function() {
			if(this.body != null)
				this.body.remove();
			this.bodyData = [];
			this.body = null;
			this.heading = null;
			this.grewLastTurn = false;
			this.health = settings.maxHealth;
		},

		// Initialize the snake
		init: function() {
			// Generate the initial snake body
			var vertical = (Math.random() > 0.5) ? true : false, // 50-50 chance of snake starting vertically of horizontally
				x = Math.floor(Math.floor(Math.random()*(settings.boardSize/3) + (settings.boardSize/3))/settings.boxSize)*settings.boxSize,
				y = Math.floor(Math.floor(Math.random()*(settings.boardSize/3) + (settings.boardSize/3))/settings.boxSize)*settings.boxSize;

			for (var i = 0; i < settings.initialSnakeLength; i++) {
				this.bodyData.push({
					x: (vertical ? x : (x + i*settings.boxSize)),
					y: (vertical ? (y + i*settings.boxSize) : y)
				});
			};

			// Direction snake is heading
			this.heading = vertical ? 'up' : 'left';

			// The snake body
			this.body = container.board.selectAll('.snake-body')
							.data(this.bodyData)
							.enter()
							.append('rect');
			this.draw();
		}
	},

	food = {
		types: {
			purple: {points: 50, life: Math.floor(settings.boardSize/(8*settings.boxSize)), multiplier: 1.0},
			yellow: {points: 25, life: Math.floor(settings.boardSize/(4*settings.boxSize)), multiplier: 0.25}, 
			blue: {points: 10, life: Math.floor(settings.boardSize/(2*settings.boxSize)), multiplier: 0.125},
		},
		color: null,
		life: 0,
		points: 0,
		multiplier: 0,
		position: {x:0, y:0},
		item: null,

		removeOld: function() {
			if (this.item != null) {
				this.item.remove();
			};
		},

		makeNew: function() {
			var valid = false,
				x = 0,
				y = 0,
				randomizer = Math.random();
			// Generate new loaction for fruit
			while(!valid) {
				x = Math.floor(Math.floor(Math.random()*(settings.boardSize/3) + (settings.boardSize/3))/settings.boxSize)*settings.boxSize,
				y = Math.floor(Math.floor(Math.random()*(settings.boardSize/3) + (settings.boardSize/3))/settings.boxSize)*settings.boxSize;

				// Make sure food isn't where snake is
				for (var i = snake.bodyData.length - 1; i >= 0; i--) {
					if ((x == snake.bodyData[i].x) && (y == snake.bodyData[i].y)) {
						valid = false;
						break;
					} else {
						valid = true;
					}
				};
				
			}

			this.position.x = x;
			this.position.y = y;

			// Generate type of food
			if (randomizer > 0.25) {
				this.color = 'blue';
			} else if(randomizer > 0.05) {
				this.color = 'yellow';
			} else {
				this.color = 'purple';
			}
			this.life = this.types[this.color].life;
			this.points = this.types[this.color].points;
			this.multiplier = this.types[this.color].multiplier;
			console.log(this.types);

			// Draw new fruit
			this.item = container.board.append('rect')
							.attr('x', this.position.x)
							.attr('y', this.position.y)
							.attr('width', settings.boxSize)
							.attr('height', settings.boxSize)
							.attr('class', 'fruit')
							.attr('fill', function() {
								if(food.color == 'blue') {
									return 'rgba(0,0,255,1)';
								} else if (food.color == 'yellow') {
									return 'rgba(255,255,0,1)';
								} else {
									return 'rgba(128,0,128,1)';
								}
							});
		},
		animate: function() {
			this.life --;
			if(this.life < 0) {
				this.removeOld();
				this.makeNew();
				score.streak = 1.0;
				snake.health --;
				score.show();
			} else if(physics.isFoodEaten()) {
				if(snake.health < settings.maxHealth)
					snake.health ++;
				score.add((this.points + this.life), this.multiplier);
				this.removeOld();
				this.makeNew();
				snake.grow();
				document.getElementById('sound-pickup').play();
			}
		},
		reset: function() {
			this.removeOld();
			this.life = 0;
			this.points = 0;
			this.color = null;
		},
	},

	controller = {
		run: function() {
			// Change direction snake is heading
			// up-down-left-right or WASD
			d3.select('body')
				.on('keydown', function() {
					d3.event.preventDefault();
					switch (d3.event.keyCode) {
						case 38:
						case 87:
							if( (snake.heading != 'up') && (snake.heading != 'down')) {
								snake.heading = 'up';
							};
							break;
						case 40:
						case 83:
							if( (snake.heading != 'up') && (snake.heading != 'down')) {
								snake.heading = 'down';
							};
							break;
						case 37:
						case 65:
							if( (snake.heading != 'left') && (snake.heading != 'right')) {
								snake.heading = 'left';
							};
							break;
						case 39:
						case 68:
							if( (snake.heading != 'left') && (snake.heading != 'right')) {
								snake.heading = 'right';
							};
							break;
						default:
							break;
					}
				});
		},
	},

	/* Check for border, self and obstacle collison */
	physics = {
		isFoodEaten: function() {
			if((snake.bodyData[0].x == food.position.x) && (snake.bodyData[0].y == food.position.y)) {
				return true;
			}
			return false;
		},
		// Check if head of snake collide with border of game area
		borderCollison: function() {
			var head = snake.bodyData[0];
			if( (head.x < 0) || (head.y < 0) || (head.x > settings.boardSize) || (head.y > settings.boardSize ) ) {
				return true;
			} else {
				return false;
			}
		},
		// Check if head of snake collide wit its own body
		selfCollison: function() {
			var head = snake.bodyData[0];
			for (var i = snake.bodyData.length - 1; i >= 3; i--) {
				var body = snake.bodyData[i];
				if( (head.x == body.x) && (head.y == body.y)) {
					return true;
				}
			};
			return false;
		},

		run: function() {
			if(this.borderCollison() || this.selfCollison()) {
				return false;
			} else {
				return true;
			}
		},
	},

	animate = {
		run: function() {
			snake.move();
			food.animate();
		},
	},

	timer = {
		started: false,
		run: function() {
			timer.started = true;
			if(timer.thread == null) {
				setTimeout(function() {
					animate.run();
					if(physics.run() && (snake.health > 0)) {
						timer.run();
					} else {
						timer.started = false;
						snake.die();
						document.getElementById('sound-hurt').play();
					}
				}, 200);
			}
		},
	},

	score = {
		highScoreAchieved: false,
		highScore: 0,
		streak: 1.0,
		points: 0,
		length: settings.initialSnakeLength,

		show: function() {
			d3.select('#game-hiscore').text(this.highScore);
			d3.select('#game-score').text(this.points);
			d3.select('#game-length').text(this.length);
			d3.select('#game-multiplier').text(this.streak);
			d3.select('#game-life').html(function(){
				var hearts = '';
				for (var i = 0; i < snake.health; i++) {
					hearts += '<span class="glyphicon glyphicon-heart"></span>';
				};
				return hearts;
			});
		},
		add: function(points, multiplier) {
			this.length += 1;
			this.streak += multiplier;
			this.points += Math.floor(this.streak*points);
			if(this.points > this.highScore) {
				this.highScore = this.points;
				this.setHighScore();

				if(!this.highScoreAchieved) {
					document.getElementById('sound-powerup').play();
					this.highScoreAchieved = true;
				}
			}
			this.show();
		},
		reset: function() {
			this.highScoreAchieved = false;
			this.points = 0;
			this.streak = 1.0;
			this.length = settings.initialSnakeLength;
			this.getHighScore();
		},
		getHighScore: function() {
			if(typeof(localStorage) != "undefined") {
				var hiscore = localStorage.getItem('hiscore');
				score.highScore = (hiscore == "null") ? 0 : hiscore;
			}
		},
		setHighScore: function() {
			if(typeof(localStorage) != "undefined") {
				localStorage.setItem('hiscore', score.points);
			}
		}
	},

	startGame = function() {
		score.reset();
		food.reset();
		snake.reset();

		snake.init();
		controller.run();
		score.reset();
		score.show(0);
		if(!timer.started)
			timer.run();
	},
	drawBackground = function() {
		container.drawBoard();
		container.drawGrid();
	},
	init = function() {
		d3.select('.start-game')
			.on('click', function(){
				startGame();
			});
	};
	drawBackground();
	init();
})(d3);