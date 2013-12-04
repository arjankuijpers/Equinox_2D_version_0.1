// 
// Javascript document.
//
// ////////////////////
// Name: Equinox
// Date: dd-mm-yyyy 25-08-2013
// location: Eindhoven, The Netherlands / Helmond, The Netherlands
// Author: Arjan Kuijpers
//
// 	Licensing: 
//		This Engine is available under the creative Commons license 3.0
//		http://creativecommons.org/licenses/by-sa/3.0/nl/legalcode
//
// Copyright Arjan Kuijpers
//
///////////////////////

//Namespaces
var _Engine;
var Game;

// end of Namespaces

var Engine = function(config)
{
	this.version = "0.1.0";
	this.type = "engine";
	if(_Engine)
	{
		Dev.alert('Engine', 'Instance of engine is already running, \nCant instantiate more instances');
		this.error = "Instance of engine is already running, delete this object it is useless";
	}
	else
	{	
		Dev.log('Engine', 'New instance of engine');
		_Engine = this;
		this.Physics = {};
		this.Script = {};
		this.Time = {};
		
		if(!config)
			Dev.error('Engine', 'No config defined when constructing Engine');

		if(config.dev)
			Dev.enabled = true;
		else
			Dev.log('Development', 'Debug disabled', true);

		this.init = function()
		{
			Dev.time("Engine Initializing");
			Dev.log('Engine', 'Initializing Engine');

			Dev.group("setting up main variables");
			this.exitCode = 0;
			this.updateQueue = [];
			this.Physics.updateQueue = [];
			this.Script.updateQueue = [];
			this.Physics.enabled = true;
			this.Script.enabled = true;
			this.Time.delta = 0;
			this.Time.current = 0;
			this.Time.lastTime = 0;
			this.Time._timeScale = 1;
			this.useGamepad = config.useGamepad || false;
			Dev.log("Engine", "Done setting up main variables");
			Dev.groupEnd();

			Dev.group("Creating math functions");
			this.setMathFunctions();
			Dev.log("Engine", "math function DONE")
			Dev.groupEnd();

			Dev.group("Game namespace");
			Dev.log("Engine","Creating Game Namspace");
			this._gameNS();
			Dev.groupEnd();

			Dev.group("checking supported API's and functions");
			this.performanceTimer = this._setPerformanceTimerSupport();
			Dev.groupEnd();

			Dev.group("creating container");
			this._container = document.getElementById(config.container);
			this._canvasWidth =config.width;
			this._canvasHeight = config.height;
			Dev.log('Engine', 'Done creating container');
			Dev.groupEnd();

			Dev.group("loading callback");
			this.loadingCallback = config.callback;
			Dev.groupEnd();

			Dev.group("Init input");
			this._input();
			Dev.groupEnd("Init input");

			Dev.group('Initializing Audio');
			Audio.init();
			Dev.groupEnd();

			Dev.group('Loading Assets');
			this._loadImages();
			this._loadAudio();
			Dev.groupEnd();

			Dev.log('Engine', 'Done initializing Engine');
			Dev.timeEnd("Engine Initializing");
		}

		this.setMathFunctions = function()
		{
			Math.lerp = function(from, to, time)
			{
				var result = from + (to-from) *time;
				return result;
			}
			this.lerp = Math.lerp();

			this.random = function(min,max, round, negative)
			{
				var result = min+Math.random()*(max-min);
				if(round)
					result = Math.round(result);
				if(negative)
					result *= -1;
				return result;
			}

		}

		this._gameNS = function()
		{
			if(!Game)
				Game = {};
		}

		this._loadImages = function()
		{	
			Dev.time("Engine loading images");
			if(!config.textures)
				config.textures = [];

			this._loadImages.assetsToLoad = config.textures.length;
			this._loadImages.assetsLoaded = 0;
			this.images = {};

			this._loadImages.imageLoader = function(imageData)
			{
				var image = new Image();
				image.src = config.texturePath + imageData.name + '.png';
				image.onload = function() 
				{
					_Engine._loadImages.assetsLoaded++;
					Dev.log('Engine.Image Loader', 'Done loading image: ' + _Engine._loadImages.assetsLoaded);
					if(_Engine._loadImages.assetsLoaded >=  _Engine._loadImages.assetsToLoad)
					{
						_Engine._loadImages_done();
					}
				}
				return image;
			}

			if(this._loadImages.assetsToLoad > 0)
			{
				for(i in config.textures)
				{
					this.images[config.textures[i].name] = this._loadImages.imageLoader(config.textures[i]);
				}
			}
			else
			{
				_Engine._loadImages_done();
				Dev.log('Engine._loadImages', 'No images to load.');
			}
		}
		this._loadImages_done = function()
		{
			Dev.log('Engine.Image Loader', ' done Loading all image assets');
			Dev.timeEnd("Engine loading images");
			this.imageLoading = true;
			if(this.imageLoading && this.audioLoading)
			{
				if(this.loadingCallback)
					this.loadingCallback();
				else
					Dev.warn('Engine', 'callback is empty, no callback');
			}
		}

		this._loadAudio = function()
		{
			Dev.time("Engine loading audiofiles");
			this.audio = {};

			if(!config.audio)
				config.audio = [];

			this._loadAudio.assetsToLoad = config.audio.length;
			this._loadAudio.assetsLoaded = 0;

			// Gets audio data and returns 
			this._loadAudio.audioLoader = function(audioData)
			{
				var audio = document.createElement('audio');
				audio.src = config.audioPath + audioData.name + '.mp3';
				document.body.appendChild(audio);
				audio.load();
				audio.addEventListener('canplaythrough', function() 
				{
					Dev.log('Engine.Audio Loader', 'Done loading audio: ' + _Engine._loadAudio.assetsLoaded);
					_Engine._loadAudio.assetsLoaded++;
					if(_Engine._loadAudio.assetsLoaded >= _Engine._loadAudio.assetsToLoad)
					{
						_Engine._loadAudio_done();
					}
				}, false);
				if(Audio.waSupport)
				{
					var source = Audio.context.createMediaElementSource(audio); //create the source
					return source;
				}
				else
					return audio;
				
			}

			if(this._loadAudio.assetsToLoad > 0)
			{
				for(i in config.audio)
				{
					this.audio[config.audio[i].name] = this._loadAudio.audioLoader(config.audio[i]);
				}
			}
			else
			{
				_Engine._loadAudio_done();
				Dev.log('Engine._loadAudio', 'No audio to load.');
			}
			
		}
		this._loadAudio_done = function()
		{
			Dev.log('Engine.Audio Loader', ' done Loading all Audio assets');
			Dev.timeEnd("Engine loading audiofiles");
			this.audioLoading = true;
			if(this.imageLoading && this.audioLoading)
			{
				if(this.loadingCallback)
					this.loadingCallback();
				else
					Dev.warn('Engine', 'callback is empty, no callback');
			}
		}

		this.Time.setTimeScale = function(timeScale)
		{
			if(!timeScale)
				timeScale = 1;

			Dev.log("Engine", "timeScale change: " +timeScale);
			_Engine.Time._timeScale = timeScale;

			if(Audio.Music.currentPlaying)
				Audio.Music.playbackRate(timeScale);
		}

		this._setPerformanceTimerSupport = function()
		{
			if(performance.now)
			{
				Dev.log('Engine', 'Performance timer is supported');
				return true;
			}
			else
			{
				Dev.warn('Engine', 'No support for Performance timer, fallback to Date.now(reference)');
				performance.now = Date.now;
				return false;
			}
		}

		this._input = function()
		{
			Dev.log('Engine', 'initializing Input');
			this.Input = {};
			this.Input.key = [];

			// Controllers //

			if(this.useGamepad)
			{
				Dev.log("Engine", "Gamepads are activated");

				//Try Webkit support
				if(navigator.webkitGetGamepads)
				{
					//Using webkit implementation.

					Dev.log('Engine', 'Gamepad: using webkit implementation');
					this.gamepadSupported = true;
					_Engine.Input.Gamepad = navigator.webkitGetGamepads();
					_Engine.Input.gamepadsLastConnected = 0;
					_Engine.Input.gamepadsCurrentConnected = 0;
					this.Input.update = function()
					{
						_Engine.Input.gamepadsCurrentConnected = 0;
						_Engine.Input.gamepad = navigator.webkitGetGamepads();

						for (var i = 0; i < _Engine.Input.Gamepad.length; i++) {
							if(_Engine.Input.Gamepad[i])
								_Engine.Input.gamepadsCurrentConnected++;
						};

						if(_Engine.Input.gamepadsLastConnected < _Engine.Input.gamepadsCurrentConnected)
						{
							Dev.log("Engine", "Gamepad has been connected");
							if(Game.gamepadConnected)
								Game.gamepadConnected();
						}
						else if(_Engine.Input.gamepadsLastConnected > _Engine.Input.gamepadsCurrentConnected)
						{
							Dev.log("Engine", "Gamepad has been disconnected");
							if(Game.gamepadDisconnected)
								Game.gamepadDisconnected();
						}

						_Engine.Input.gamepadsLastConnected = _Engine.Input.gamepadsCurrentConnected;
						
					}
					this.Input.getGamepadAxe = function(gamepadID, axe)
					{
						if(_Engine.Input.gamepad[gamepadID])
							return _Engine.Input.gamepad[gamepadID].axes[axe];
						else
							return false;
					}
					this.Input.getGamepadButton = function(gamepadID, button)
					{
						if(_Engine.Input.gamepad[gamepadID])
							return _Engine.Input.gamepad[gamepadID].buttons[button];
						else
							return false;
					}
				}
				else // Only chrome supports gamepads right now
				{
					Dev.warn('Engine', 'Gamepad:  browser not supported');
					this.gamepadSupported = false;
				}		

			}
			else
				Dev.log("Engine", "Controller is disabled");

			//Keyboard
			document.addEventListener('keydown',function(e) 
			{
				//Dev.log("Engine", "keyCode: " + e.keyCode);
				_Engine.Input.key[e.keyCode] = true;
				_Engine.Input.key[999] = true;
			});
			document.addEventListener('keyup',function(e) 
			{
				_Engine.Input.key[e.keyCode] = false;
				_Engine.Input.key[999] = false;
			});

			this.Input.isKeyDown = function(virtual_key)
			{
				switch(virtual_key)
				{
					case "w":
						if(_Engine.Input.key[87])
							return true;
						else
							return false;
						break;
					case "s":
						if(_Engine.Input.key[83])
							return true;
						else
							return false;
						break;
					case "a":
						if(_Engine.Input.key[65])
							return true;
						else
							return false;
						break;
					case "d":
						if(_Engine.Input.key[68])
							return true;
						else
							return false;
						break;
					case "q":
						if(_Engine.Input.key[81])
							return true;
						else
							return false;
						break;
					case "e":
						if(_Engine.Input.key[69])
							return true;
						else
							return false;
						break;
					case "shift":
						if(_Engine.Input.key[16])
							return true;
						else
							return false;
						break;
					case "control":
						if(_Engine.Input.key[17])
							return true;
						else
							return false;
						break;
					case "alt":
						if(_Engine.Input.key[18])
							return true;
						else
							return false;
						break;
					case "r":
						if(_Engine.Input.key[82])
							return true;
						else
							return false;
						break;
					case "f":
						if(_Engine.Input.key[18])
							return true;
						else
							return false;
						break;
					case "z":
						if(_Engine.Input.key[90])
							return true;
						else
							return false;
						break;
					case "x":
						if(_Engine.Input.key[88])
							return true;
						else
							return false;
						break;
					case "c":
						if(_Engine.Input.key[67])
							return true;
						else
							return false;
						break;
					case "v":
						if(_Engine.Input.key[18])
							return true;
						else
							return false;
						break;
					case "b":
						if(_Engine.Input.key[66])
							return true;
						else
							return false;
						break;
					case "i":
						if(_Engine.Input.key[73])
							return true;
						else
							return false;
						break;
					case "j":
						if(_Engine.Input.key[74])
							return true;
						else
							return false;
						break;
					case "k":
						if(_Engine.Input.key[75])
							return true;
						else
							return false;
						break;
					case "l":
						if(_Engine.Input.key[76])
							return true;
						else
							return false;
						break;
					case "u":
						if(_Engine.Input.key[85])
							return true;
						else
							return false;
						break;
					case "o":
						if(_Engine.Input.key[79])
							return true;
						else
							return false;
						break;
					case "space":
						if(_Engine.Input.key[32])
							return true;
						else
							return false;
						break;
					case "alt":
						if(_Engine.Input.key[18])
							return true;
						else
							return false;
						break;
					case "enter":
						if(_Engine.Input.key[13])
							return true;
						else
							return false;
						break;
					case "escape":
						if(_Engine.Input.key[27])
							return true;
						else
							return false;
						break;
					case "esc":
						if(_Engine.Input.key[27])
							return true;
						else
							return false;
						break;
					case "leftArrow":
						if(_Engine.Input.key[37])
							return true;
						else
							return false;
						break;
					case "upArrow":
						if(_Engine.Input.key[38])
							return true;
						else
							return false;
						break;
					case "rightArrow":
						if(_Engine.Input.key[39])
							return true;
						else
							return false;
						break;
					case "downArrow":
						if(_Engine.Input.key[40])
							return true;
						else
							return false;
						break;
					case "anyKey":
						if(_Engine.Input.key[999])
							return true;
						else
							return false;
						break;
					default:
						Dev.warn('engine.input', 'is not a standart keypress, use Input.key[]');
				}
			}



			this.Input.isKeyUp = function(virtual_key)
			{
				switch(virtual_key)
				{
					case "w":
						if(!_Engine.Input.key[87])
							return true;
						else
							return false;
						break;
					case "s":
						if(!_Engine.Input.key[83])
							return true;
						else
							return false;
						break;
					case "a":
						if(!_Engine.Input.key[65])
							return true;
						else
							return false;
						break;
					case "d":
						if(!_Engine.Input.key[68])
							return true;
						else
							return false;
						break;
					case "q":
						if(!_Engine.Input.key[81])
							return true;
						else
							return false;
						break;
					case "e":
						if(!_Engine.Input.key[69])
							return true;
						else
							return false;
						break;
					case "shift":
						if(!_Engine.Input.key[16])
							return true;
						else
							return false;
						break;
					case "control":
						if(!_Engine.Input.key[17])
							return true;
						else
							return false;
						break;
					case "alt":
						if(!_Engine.Input.key[18])
							return true;
						else
							return false;
						break;
					case "r":
						if(!_Engine.Input.key[82])
							return true;
						else
							return false;
						break;
					case "f":
						if(!_Engine.Input.key[18])
							return true;
						else
							return false;
						break;
					case "z":
						if(!_Engine.Input.key[90])
							return true;
						else
							return false;
						break;
					case "x":
						if(!_Engine.Input.key[88])
							return true;
						else
							return false;
						break;
					case "c":
						if(!_Engine.Input.key[67])
							return true;
						else
							return false;
						break;
					case "v":
						if(!_Engine.Input.key[18])
							return true;
						else
							return false;
						break;
					case "b":
						if(!_Engine.Input.key[66])
							return true;
						else
							return false;
						break;
					case "i":
						if(!_Engine.Input.key[73])
							return true;
						else
							return false;
						break;
					case "j":
						if(!_Engine.Input.key[74])
							return true;
						else
							return false;
						break;
					case "k":
						if(!_Engine.Input.key[75])
							return true;
						else
							return false;
						break;
					case "l":
						if(!_Engine.Input.key[76])
							return true;
						else
							return false;
						break;
					case "u":
						if(!_Engine.Input.key[85])
							return true;
						else
							return false;
						break;
					case "o":
						if(!_Engine.Input.key[79])
							return true;
						else
							return false;
						break;
					case "space":
						if(!_Engine.Input.key[32])
							return true;
						else
							return false;
						break;
					case "alt":
						if(!_Engine.Input.key[18])
							return true;
						else
							return false;
						break;
					case "enter":
						if(!_Engine.Input.key[13])
							return true;
						else
							return false;
						break;
					case "escape":
						if(!_Engine.Input.key[27])
							return true;
						else
							return false;
						break;
					case "esc":
						if(!_Engine.Input.key[27])
							return true;
						else
							return false;
						break;
					case "leftArrow":
						if(!_Engine.Input.key[37])
							return true;
						else
							return false;
						break;
					case "upArrow":
						if(!_Engine.Input.key[38])
							return true;
						else
							return false;
						break;
					case "rightArrow":
						if(!_Engine.Input.key[39])
							return true;
						else
							return false;
						break;
					case "downArrow":
						if(!_Engine.Input.key[40])
							return true;
						else
							return false;
						break;
					case "anyKey":
						if(!_Engine.Input.key[999])
							return true;
						else
							return false;
						break;
					default:
						Dev.warn('engine.input', 'is not a standart keypress, use Input.key[]');
				}
			}
		}

		this.add = function(obj)
		{
			if(obj.type == "layer")
			{
				Dev.log('Engine', 'adding object to main Queue');
				obj.Parent = this;
				this.updateQueue.push(obj);
			}
			else
				Dev.error('Engine', 'You cant add an object direct to the main Queue, use Layer');
			
		}
		this.remove = function(obj)
		{
			Dev.log('Engine', 'removing Layer from main Queue');
			_Engine._container.removeChild(obj._canvas);
			this.updateQueue.splice(this.updateQueue.indexOf(obj),1);
			obj = null;
		}
		this.removeChildren = function()
		{
			Dev.log('Engine', 'remove all children from main Queue');
			for (var i = 0; i < this.updateQueue; i++) {
				_Engine._container.removeChild(this.updateQueue[i]._canvas);
			};
			this.updateQueue = [];
		}



		this.Node = function(type)
		{
			if(type != "layer" || type != "particleSystem" || type != "sprite")
			{
				this.draw = function(config)
				{
					if(!config)
					{
						config = {};
					}
					if(this.opacity * config.opacity != 0)
					{
						switch(this.type)
					{
						case 'image':
								this.Parent.ctx.save();
								this.Parent.ctx.globalAlpha = this.opacity * config.opacity || this.opacity * this.Parent.opacity;
								this.Parent.ctx.translate(this.x + (this.width /2), this.y + (this.height /2) );
								this.Parent.ctx.rotate(this.rotation);
								this.Parent.ctx.scale(this.scale.x, this.scale.y);

								if(this.crop == undefined)
									this.Parent.ctx.drawImage(this.image, 0,0,this.image.width,this.image.height, -this.width/2, -this.height/2, this.width, this.height);	
								else
									this.Parent.ctx.drawImage(this.image, this.crop.x, this.crop.y, this.crop.width, this.crop.height, -this.width/2, -this.height/2, this.width, this.height);

								this.Parent.ctx.restore();
							break;

						case 'text':
								this.Parent.ctx.save();
							
								this.Parent.ctx.globalAlpha = this.opacity * config.opacity;
								//this.Parent.ctx.translate(this.x + (this.width /2), this.y + (this.height /2) );
								//this.Parent.ctx.rotate(this.rotation);
								this.Parent.ctx.scale(this.scale.x, this.scale.y);

								this.Parent.ctx.font = this.fontSize * (this.scale.x + this.scale.y) /2 + "px " + "\""+ this.font + "\"";
		     					this.Parent.ctx.fillStyle = this.fillStyle;
		     					this.Parent.ctx.fillText(this.text, this.x, this.y + this.fontSize);

								this.Parent.ctx.restore();
							break;

						case 'rect':
								this.Parent.ctx.save();
							
								this.Parent.ctx.globalAlpha = this.opacity * this.Parent.opacity;
								this.Parent.ctx.translate(this.x + (this.width /2), this.y + (this.height /2) );
								this.Parent.ctx.rotate(this.rotation);
								this.Parent.ctx.scale(this.scale.x, this.scale.y);

								this.ctx.beginPath();
      							this.ctx.rect(-this.width/2, -this.height/2, this.width, this.height);
      							this.ctx.fillStyle = this.color;
      							this.ctx.fill();
      							if(this.lineWidth)
							    	this.Parent.ctx.lineWidth = this.lineWidth || 0;
      							this.ctx.strokeStyle = this.lineColor;
      							this.ctx.stroke();
								
								this.Parent.ctx.restore();
							break;
						case 'circle':
								this.Parent.ctx.save();

								this.Parent.ctx.globalAlpha = this.opacity * this.Parent.opacity;
								this.Parent.ctx.translate(this.x + (this.width /2), this.y + (this.height /2) );
								this.Parent.ctx.rotate(this.rotation);
								this.Parent.ctx.scale(this.scale.x, this.scale.y);


								this.Parent.ctx.beginPath();
							    this.Parent.ctx.arc(this.x +this.radius, this.y + this.radius, this.radius, this.startAngle, this.endAngle, false);
							    this.Parent.ctx.fillStyle = this.color;
							    this.Parent.ctx.fill();
							    if(this.lineWidth)
							    	this.Parent.ctx.lineWidth = this.lineWidth || 0;
							    this.Parent.ctx.strokeStyle = this.lineColor;
							    this.Parent.ctx.stroke();

								this.Parent.ctx.restore();
							break;
					}
					}
				}
			}

			this.moveToTop = function()
			{
				var nodeObject = this.Parent.queue.splice(this.Parent.queue.indexOf(this), 1);
				this.Parent.queue.push(nodeObject[0]);
			}
			this.moveToBottom = function()
			{
				var nodeObject = this.Parent.queue.splice(this.Parent.queue.indexOf(this), 1);
				this.Parent.queue.unshift(nodeObject[0]);
			}
			
			this.setX = function(x)
			{
				this.x = x;
			}
			this.getX = function()
			{
				return this.x;
			}
			this.setY = function(y)
			{
				this.y = y;
			}
			this.getY = function()
			{
				return this.y;
			}
			this.setPosition = function(x,y)
			{
				this.x = x;
				this.y = y;
			}
			this.getPosition = function()
			{
				return {x: this.x, y:this.y};
			}

			this.setScale = function(scaleX, scaleY)
			{
				this.scale.x = scaleX;
				this.scale.y = scaleY;
			}
			this.getScale = function()
			{
				return {x:this.scale.x, y:this.scale.y};
			}
			this.setScaleX = function(scaleX)
			{
				this.scale.x = scaleX;
			}
			this.getScaleX = function()
			{
				return this.scale.x;
			}
			this.setScaleY = function(scaleY)
			{
				this.scale.y = scaleY;
			}
			this.getScaleY = function()
			{
				return this.scale.y;
			}

			this.setRotation = function(rotation)
			{
				this.rotation = rotation;
			}
			this.getRotation = function()
			{
				return this.rotation;
			}
			this.setOpacity = function(opacity)
			{
				this.opacity = opacity;
			}
			this.getOpacity = function()
			{
				return this.opacity;	
			}

			if(type == "image" || type == "rect")
			{
				this.setWidth = function(width)
				{
					this.width = width;
				}
				this.getWidth = function()
				{
					return this.width;
				}
				this.setHeight = function(height)
				{
					this.height = height;
				}
				this.getHeight = function()
				{
					return this.height;
				}
			}


			if(type == "image")
			{
				this.setImage = function(image)
				{
					this.image = image;
					this.width = this.image.width;
					this.height = this.image.height;
				}
				this.getImage = function()
				{
					return this.image;
				}

				this.setCrop = function(config)
				{
					this.Crop.x = config.x;
					this.Crop.y = config.y;
					this.Crop.width = config.width;
					this.Crop.height = config.height;
				}
				this.getCrop = function()
				{
					return {x: this.CropX, y: this.CropY, width: this.CropWidth, height:this.CropHeight};
				}
				this.setCropX = function(cropX)
				{
					this.Crop.x = cropX;
				}
				this.getCropX = function()
				{
					return this.Crop.x;
				}
				this.setCropY = function(cropY)
				{
					this.Crop.y = cropY;
				}
				this.getCropY = function()
				{
					return this.Crop.y;
				}
				this.setCropWidth = function(cropWidth)
				{
					this.Crop.width = cropWidth;
				}
				this.getCropWidth = function()
				{
					return this.Crop.width;
				}
				this.setCropHeight = function(cropHeight)
				{
					this.Crop.height = cropHeight;
				}
				this.getCropHeight = function()
				{
					return this.Crop.height;
				}
			}

			if(type == "sprite")
			{
				this.setImage = function(image)
				{
					this.image = image;
				}
				this.getImage = function()
				{
					return this.image;
				}
				this.setFrameRate = function(frameRate)
				{
					this.frameRate = frameRate;
				}
				this.getFrameRate = function()
				{
					return this.frameRate;
				}
				this.setIndex = function(index)
				{
					this.index = index;
				}
				this.getIndex = function()
				{
					return this.index;
				}

				this.setAnimation = function(anim)
				{
					this.animation = anim;
					this.index = 0;
				}
				this.getAnimation = function()
				{
					return this.animation;
				}
				this.setAnimations = function(animations)
				{
					this.animations = animations;
					this.index = 0;
				}
				this.getAnimations = function()
				{
					return this.animations;
				}
			}

			if(type == "text")
			{
				this.setText = function(text)
				{
					this.text = text;

					this.ctx.font = this.fontSize * (this.scale.x + this.scale.y) /2 + "px " + "\""+ this.font + "\"";
					this.width = this.ctx.measureText(this.text).width;
					this.height = this.fontSize * 1.5;
				}
				this.getText = function()
				{
					return this.text;
				}
				this.setFont = function(font)
				{
					this.font = font;
					this.ctx.font = this.fontSize * (this.scale.x + this.scale.y) /2 + "px " + "\""+ this.font + "\"";
					this.width = this.ctx.measureText(this.text).width;
					this.height = this.fontSize * 1.5;
				}
				this.getFont = function()
				{
					return this.font;
				}
				this.setFontSize = function(fontSize)
				{
					this.fontSize = fontSize;
					this.ctx.font = obj.fontSize * (obj.scale.x + obj.scale.y) /2 + "px " + "\""+ obj.font + "\"";
					obj.width = this.ctx.measureText(obj.text).width;
					obj.height = fontSize * 1.5;
				}
				this.getFontSize = function()
				{
					return this.fontSize;
				}
				this.setColor = function(value)
				{
					this.fillStyle = value;
				}
				this.getColor = function()
				{
					return this.fillStyle;
				}
				this.getWidth = function()
				{
					return this.width;
				}
				this.getHeight = function()
				{
					return this.height;
				}
			}
			if(type == "rect" || type == "circle")
			{
				this.setColor = function(colorValue)
				{
					this.color = colorValue;
				}
				this.getColor = function()
				{
					return this.color;
				}
				this.setLineColor = function(colorValue)
				{
					this.lineColor = colorValue;
				}
				this.getLineColor = function()
				{
					return this.lineColor;
				}
				this.setLineWidth = function(lineWidth)
				{
					this.lineWidth = lineWidth;
				}
				this.getLineWidth = function()
				{
					return this.lineWidth;
				}
			}
			if(type == "circle")
			{
				this.setRadius = function(radius)
				{
					this.radius = radius;
				}
				this.getRadius = function()
				{
					return this.radius;
				}
			}
		}

		

		this.Layer = function(config)
		{
			if(!config)
				config ={};

			this._canvas = document.createElement("canvas");
			this._canvas.style.position = "absolute";
			this._canvas.style.background = "transparent";
			_Engine._container.appendChild(this._canvas);

			this._canvas.width = _Engine._canvasWidth;
			this._canvas.height = _Engine._canvasHeight;
			this.ctx = this._canvas.getContext("2d");

			this.type = "layer";
			this.queue = [];
			this.dynamic = config.dynamic || false;
			this.x = config.x || 0;
			this.y = config.y || 0;
			this.width = config.width ||this._canvas.width;
			this.height = config.height || this._canvas.height;
			this.scale = config.scale || {x:1, y:1};
			this.rotation = config.rotation || 0;
			
			if(config.opacity === undefined)
				this.opacity = 1;
			else
				this.opacity = config.opacity;

			this.draw = function(config)
			{
				this.ctx.clearRect(0,0,this._canvas.width, this._canvas.height);
				for (i in this.queue)
				{
								this.ctx.save();
								this.ctx.translate(this.x + this.width /2, this.y + this.height /2);
								this.ctx.rotate(this.rotation);
								this.ctx.translate(-(this.width /2), -(this.height /2));
								this.ctx.scale(this.scale.x, this.scale.y);
								this.queue[i].draw({x:this.x, y:this.y,rotation:this.rotation,opacity:this.opacity,scale:this.scale,ctx: this.ctx});
								this.ctx.restore();
				}
			}
			this.add = function(obj)
			{
				if(obj.type === undefined)
				{
					Dev.error('Engine', 'Layer: TYPE of object you are trying to add is not defined');
				}
				else if(obj.type == "particleSystem")
					{
						Dev.log('Engine', 'Layer: adding particleSystem');
						obj.Parent = this;
						obj.ctx = this.ctx;
						this.queue.push(obj);
				}
				else if(obj.type == "text")
				{
					Dev.log("Engine", "Layer: adding text");
					obj.Parent = this;
					obj.ctx = this.ctx;
					this.queue.push(obj);

					this.ctx.font = obj.fontSize * (obj.scale.x + obj.scale.y) /2 + "px " + "\""+ obj.font + "\"";
					obj.width = this.ctx.measureText(obj.text).width;
					obj.height = obj.fontSize * 1.5;
				}
				else if(obj.type != "layer")
				{
					Dev.log('Engine', 'Layer: adding object');
					obj.Parent = this;
					obj.ctx = this.ctx;
					this.queue.push(obj);
					_Engine.Script.updateQueue.push(obj);
					_Engine.Physics.updateQueue.push(obj);
				}
				else
				{
					Dev.error('Engine', 'cant add a layer to another layer');
				}
				
			}
			this.remove = function(obj)
			{
				Dev.log('Engine', 'Layer: remove child');
				obj.Parent = null;
				this.queue.splice(this.queue.indexOf(obj),1);
			}
			this.removeChildren = function()
			{
				Dev.log('Engine', 'Layer: remove all children')
				this.queue = [];
			}
			this.destroy = function()
			{
				_Engine.remove(this);
			}
		}
		this.Layer.prototype = new this.Node("layer");	

		this.Group = function(config)
		{
			if(!config)
				config ={};
			this.type = "group";
			this.queue = [];

			this.x = config.x || 0;
			this.y = config.y || 0;
			this.width = config.width || 0;
			this.height = config.height || 0;
			this.scale = config.scale || {x: 1, y:1};

			this.rotation = config.rotation || 0;
			
			if(config.opacity === undefined)
				this.opacity = 1;
			else
				this.opacity = config.opacity;

			this.draw = function(config)
			{
				this.ctx.save();
				this.ctx.translate(this.x + (this.width /2), this.y + (this.height /2));
				this.ctx.rotate(this.rotation);
				this.ctx.translate(-(this.width /2), -(this.height /2));
				this.ctx.scale(this.scale.x, this.scale.y);
				for (var i = this.queue.length - 1; i >= 0; i--) {
					this.queue[i].draw({x:this.x, y:this.y,rotation:this.rotation, opacity:this.opacity * this.Parent.opacity, scale:this.scale,ctx: this.ctx});
				};
				this.ctx.restore();
			}
			this.add = function(obj)
			{
				if(obj.type === undefined)
				{
					Dev.error('Engine', 'Group: TYPE of object you are trying to add is not defined');
				}
				else if(obj.type == "text")
				{
					Dev.log("Engine", "Group: adding text");
					obj.Parent = this;
					obj.ctx = this.ctx;
					this.queue.push(obj);

					this.ctx.font = obj.fontSize * (obj.scale.x + obj.scale.y) /2 + "px " + "\""+ obj.font + "\"";
					obj.width = this.ctx.measureText(obj.text).width;
					obj.height = obj.fontSize * 1.5;
				}
				else if(obj.type != "layer" && obj.type != "engine")
				{
					Dev.log("Engine", "Group: adding object");
					obj.Parent = this;
					obj.ctx = this.ctx;
					this.queue.push(obj);
				}
				else
					Dev.log("Engine", "you cant add the engine or layer to group");
			}
			this.remove = function(obj)
			{
				Dev.log('Engine', 'Group: remove child');
				obj.Parent = null;
				this.queue.splice(this.queue.indexOf(obj),1);
			}
			this.removeChildren	= function()
			{
				Dev.log('Engine', 'Group: remove all children')
				this.queue = [];
			}

		}
		this.Group.prototype = new this.Node("group");
		

		this.Image = function(config)
		{	
			if(!config)
				config ={};

			this.type = 'image';

			this.image = config.image;
			
			if(this.image === undefined)
			{
				Dev.error("Engine", "No valid image set, pleas set {image}");
			}
			

			this.x = config.x || 0;
			this.y = config.y || 0;
			this.width = config.width || this.image.width;
			this.height = config.height || this.image.height;
			this.rotation = config.rotation || 0;
			this.scale = config.scale || {x:1, y:1};
			this.crop = config.crop;

			if(config.opacity === undefined)
				this.opacity = 1;
			else
				this.opacity = config.opacity;
		}
		this.Image.prototype = new this.Node("image");


		this.Text = function(config)
		{
			if(!config)
				config ={};

			this.type = 'text';

			this.x = config.x || 0;
			this.y = config.y || 0;
			this.rotation = config.rotation || 0;
			this.scale = config.scale || {x:1, y:1};

			if(config.opacity === undefined)
				this.opacity = 1;
			else
				this.opacity = config.opacity;

			

			this.text = config.text || "insert text";
			this.fontSize = config.fontSize || 10;
			this.font = config.font || "Toledo";
			this.fillStyle = config.color || 'red';
		}
		this.Text.prototype = new this.Node("text");


		this.Rect = function(config)
		{
			if(!config)
				config ={};

			this.type= 'rect';

			this.x = config.x || 0;
			this.y = config.y || 0;
			this.width = config.width || 20;
			this.height = config.height || 20;
			this.rotation = config.rotation || 0;
			this.scale = config.scale || {x:1, y:1};
			
			if(config.opacity === undefined)
				this.opacity = 1;
			else
				this.opacity = config.opacity;

			this.color = config.color || 'red';
			this.lineColor = config.lineColor || "yellow";
			this.lineWidth = config.lineWidth;

			
		}
		this.Rect.prototype = new this.Node("rect");


		this.Circle = function(config)
		{
			if(!config)
				config ={};

			this.type = 'circle';

			this.x = config.x || 0;
			this.y = config.y || 0;
			this.scale = config.scale || {x:1,y:1};
			this.rotation = config.rotation || 0;
			this.lineWidth = config.lineWidth;
			this.lineColor = config.lineColor || "#9F9F9F";

			if(config.opacity === undefined)
				this.opacity = 1;
			else
				this.opacity = config.opacity;


			
			this.color = config.color || 'red';
			this.radius = config.radius || 5;
			this.startAngle = config.startAngle || 0;
			this.endAngle = config.endAngle || 2 * Math.PI;
			this.counterClockwise = config.counterClockwise || false;
		}
		this.Circle.prototype = new this.Node("circle");


		this.Sprite = function(config)
		{
			if(!config)
				config = {};

			this.type = "sprite";
			this.image = config.image;

			this.x = config.x || 0;
			this.y = config.y || 0;

			this.rotation = config.rotation || 0;
			this.scale = config.scale || {x:1, y:1};

			if(config.opacity === undefined)
				this.opacity = 1;
			else
				this.opacity = config.opacity;

			this.animations = config.animations || {};
			this.animation = config.animation;

			if(config.animations && config.animation)
			{
				this.width = config.width || config.animations[config.animation].width;
				this.height = config.height || config.animations[config.animation].height;
			}
			else 
			{
				this.width = config.width || this.image.width;
				this.height = config.height || this.image.height;
			}

			this.frameRate = config.frameRate || 5;
			this.index = config.index || 0;

			this.isRunning = false;
			this.timer = 0;
		}
		this.Sprite.prototype = new this.Node("sprite");

		this.Sprite.prototype.draw = function(config)
		{
			if(this.isRunning)
			{
				if(this.timer > 1000/this.frameRate)
				{
					this.timer = 0;
					
					if(this.index < this.animations[this.animation].frames -1)
					{
						this.index++;
					}
					else
					{
						this.index = 0;
					}
				}
				else
				{
					this.timer += _Engine.Time.delta;
				}
				
			}

			this.width = this.animations[this.animation].width;
			this.height = this.animations[this.animation].height;

			this.sourceX = this.index * this.animations[this.animation].width;
			this.sourceY = this.animations[this.animation].row * this.animations[this.animation].height || 0;


			this.Parent.ctx.save();

			this.Parent.ctx.globalAlpha = this.opacity * config.opacity || this.opacity * this.Parent.opacity;
			this.Parent.ctx.translate(this.x + (this.width /2), this.y + (this.height /2) );
			this.Parent.ctx.rotate(this.rotation);
			this.Parent.ctx.scale(this.scale.x, this.scale.y);

			this.Parent.ctx.drawImage(this.image, this.sourceX, this.sourceY, this.width, this.height, -this.width/2, -this.height/2, this.width, this.height);

			this.Parent.ctx.restore();

			if(this.afterFrameIndex && this.afterFrameIndex <= this.index)
			{
				this.afterFrameIndex = undefined;
				this.afterFrameFunction();
				this.afterFrameFunction = undefined;
			}
	}
		this.Sprite.prototype.afterFrame = function(indexFrame, func)
		{
			this.afterFrameIndex = indexFrame;
			this.afterFrameFunction = func;
		}

		this.Sprite.prototype.start = function()
		{
			this.isRunning = true;
		}
		this.Sprite.prototype.stop = function()
		{
			this.isRunning = false;
		}



		// End of Sprite
		//////////////////////////////

		// PARTICLE SYSTEM
		//////////////////////////////

		this.ParticleSystem = function(config)
		{
			this.type = 'particleSystem';

			this.updateQueue = [];
			this.image = config.image;

			this.isRunning = false;
			this.runningTime = 0;
			this.systemLifeTime = config.systemLifeTime || '%';
			this.spawnTimer = 0;

			this.x = config.x || 0;
			this.y = config.y || 0;
			this.rotation = config.rotation || 0;

			this.spawnRate = config.spawnRate || 20; // Time between particle spawns
			this.spawnRadius = config.spawnRadius || 0;
			this.lifeTime = config.lifeTime || 500;
			this.angle = config.angle || 0;
			this.speed = config.speed || 0.5;
			this.fadeOverLifeTime = config.fadeOverLifeTime || true;

			this.Particle = function(config)
			{

				this.ctx = config.ctx;
				this.image = config.image;

				this.lifeTime = config.lifeTime || 500;
				this.totalLifeTime = this.lifeTime;

				this.fadeOverLifeTime = config.fadeOverLifeTime;

				this.position = {
					x: config.x || 0,
					y: config.y || 0
				}

				var angle = config.angle || 0;
				var angleInRadians = angle * Math.PI /180;
				this.velocity = {
					x: config.speed * Math.cos(angleInRadians),
					y: -config.speed * Math.sin(angleInRadians)
				}

				this.opacity = 1;
				this.scale = 1;
			}

			this.Particle.prototype.update = function(dt)
			{
				this.lifeTime -= dt;
				var lifePercentage = this.lifeTime / this.totalLifeTime;

				if(this.lifeTime > 0)
				{
					this.position.x += (this.velocity.x * dt) * _Engine.Time._timeScale;
					this.position.y += (this.velocity.y * dt) * _Engine.Time._timeScale;

					if(this.fadeOverLifeTime)
						this.opacity = lifePercentage;
					if(this.scaleOverLifeTime)
						this.scale = lifePercentage;
				}	
			}

			this.Particle.prototype.draw = function(dt)
			{
				this.ctx.save();

				this.ctx.globalAlpha = this.opacity;
				this.ctx.drawImage(this.image, this.position.x,this.position.y);

				this.ctx.restore();
			}

			this.init();
		}


		this.ParticleSystem.prototype = new this.Node("particleSystem");
		
		this.ParticleSystem.prototype.init = function()
		{
			Dev.log('Engine', 'Initializing ParticleSystem');
		}
		this.ParticleSystem.prototype.draw = function()
		{
			if(this.isRunning)
			{
				if(this.spawnTimer >= this.spawnRate && this.spawnRate != false)
				{
					this.updateQueue.push(new this.Particle({x:this.x, y:this.y, ctx:this.ctx, image:this.image, speed: this.speed,
						angle: this.angle, lifeTime: this.lifeTime, fadeOverLifeTime: this.fadeOverLifeTime}));

					this.spawnTimer = 0;
				}
				else
					this.spawnTimer += _Engine.Time.delta;

				for (var i = this.updateQueue.length - 1; i >= 0; i--) {
					if(this.updateQueue[i].lifeTime > 0)
					{
						this.updateQueue[i].update(_Engine.Time.delta);
						this.updateQueue[i].draw(_Engine.Time.delta);
					}
					else
					{
						this.updateQueue.splice(i,1);
					}
					
				};
			}		
		}
		this.ParticleSystem.prototype.start = function()
		{
			this.isRunning = true;
		}
		this.ParticleSystem.prototype.stop = function()
		{
			this.isRunning = false;
		}

		// End of particle system
		/////////////////////////////
		/////////////////////////////////////////////////



		this.Physics.update = function(dt)
		{
			for (var i = _Engine.Physics.updateQueue.length - 1; i >= 0; i--) {
				//Do Physics
			};
		}

		this.Script.update = function(dt)
		{
			for (var i = _Engine.Script.updateQueue.length - 1; i >= 0; i--) {
				if(_Engine.Script.updateQueue[i].update)
				_Engine.Script.updateQueue[i].update();
			};
			
		}



		// Engine Update, updates the draw physics, script systems
		this.update = function()
		{	
			_Engine.Time.current = performance.now();
			_Engine.Time.delta = _Engine.Time.current - _Engine.Time.lastTime;
			_Engine.Time.lastTime = _Engine.Time.current;
		
			if(_Engine.Input.update)
				_Engine.Input.update();

			_Engine.Physics.update();
			_Engine.Script.update(_Engine.Time.delta);

			if(Game.update)
				Game.update(_Engine.Time.delta);
			

			_Engine.draw(_Engine.Time.delta);
			
			if(_Engine.running)
				requestAnimationFrame(_Engine.update);
		}

		//Engine Draw to canvas
		this.draw = function(dt)
		{
			for(i in this.updateQueue)
			{
				if(this.updateQueue[i].dynamic)
					this.updateQueue[i].draw(dt);
			}
		}


		this.start = function()
		{
			Dev.log('Engine', 'engine started');
			this.running = true;
			this.Time.current = performance.now();
			this.Time.lastTime = this.Time.current;

			this.update();
		}
		this.stop = function()
		{
			Dev.log('Engine', 'engine stopped, exitCode: '+ this.exitCode);
			this.running = false;
		}
		
	// End of Engine
	}
}


//Namespaces

Dev = {};
Dev.Supported = {};
Dev.Console = {}; // Legacy
(function(){
	if(console.time)
		Dev.Supported.time = true;
	else
	{
		console.warn('Dev.time is not supported');
		Dev.Supported.time = false;
	}

	if(console.group)
		Dev.Supported.group = true;
	else
	{
		console.warn('Dev.group is not supported');
		Dev.Supported.group = false;
	}

	if(console.trace)
		Dev.Supported.trace = true;
	else
	{
		console.warn('Dev.trace is not supported');
		Dev.Supported.trace = false;
	}

})();

// end of Namespaces

// log messages in console
Dev.log = function(func, text, overwrite)
 {
	if(Dev.enabled || overwrite)
	 {
		console.log('\n['+ func + ']' + text + '\n==================================');	
	 }
 }

Dev.warn = function(func, text, overwrite)
 {
	if(Dev.enabled || overwrite)
	 {
		console.warn('\n['+ func + ']' + ' WARNING: ' +text + '\n==================================\n');	
	 }
 }

Dev.error = function(func, text, overwrite)
 {
	if(Dev.enabled || overwrite)
	 {
		console.error('\n['+ func + ']' + ' ERROR: ' +text + '\n==================================\n');	
	 }
 }
 Dev.alert = function(func, text, overwrite)
 {
 	if(Dev.enabled || overwrite)
 	{
 		alert('['+ func + ']' + ' ALERT: ' +text);
 		console.warn('\n['+ func + ']' + ' ALERT: ' +text + '\n==================================\n');
 	}
 }

Dev.group = function(groupName, overwrite)
{
	if(Dev.Supported.group)
	{
		if(Dev.enabled || overwrite)
		{
			console.group(groupName);
		}
	}	
}
Dev.groupEnd = function(overwrite)
{
	if(Dev.Supported.group)
	{
		if(Dev.enabled || overwrite)
		{
			console.groupEnd();
		}
	}
}

 //  Trace time
 Dev.time = function(name, overwrite)
 {
 	if(Dev.Supported.time)
 	{
 		if(Dev.enabled || overwrite)
 			console.time(name);
 	}
 	
 }

 Dev.timeEnd = function(name, overwrite)
{
	if(Dev.Supported.time)
 	{
 		if(Dev.enabled || overwrite)
			console.timeEnd(name);
 	}
}

// Stack trace
Dev.trace = function()
{
	if(Dev.Supported.trace)
	{
		if(Dev.enabled || overwrite)
			console.trace();
	}
}









// Legacy Dev.Console deprecated for Dev.*
/////////////////////////////////
///
/////////////////////////////////

Dev.Console.log = function(func, text)
 {
	if(Dev.enabled)
	 {
		console.log('\n['+ func + ']' + text + '\n==================================');	
	 }
 }

Dev.Console.warn = function(func, text)
 {
	if(Dev.enabled)
	 {
		console.warn('\n['+ func + ']' + ' WARNING: ' +text + '\n==================================\n');	
	 }
 }

Dev.Console.error = function(func, text)
 {
	if(Dev.enabled)
	 {
		console.error('\n['+ func + ']' + ' ERROR: ' +text + '\n==================================\n');	
	 }
 }


//Namespaces

//change this namespace its already in use by system
Audio = {};
Audio.Music = {};
Audio.Ambience = {};
Audio.Fx = {};

// end of Namespaces


Audio.init = function(bufferLength)
{
	if(bufferLength == null || bufferLength == undefined || isNaN(bufferLength) )
		bufferLength = 1;

  	try {
    	// Fix up for prefixing
    	window.AudioContext = window.AudioContext||window.webkitAudioContext ||window.mozAudioContext;
    	Audio.context = new AudioContext();
    	Dev.log('Engine', 'Audio: Web Audio is supported');
    	Audio.init_nodes();
    	Audio.waSupport = true;
  	 }
  	catch(e) {
  		Audio.waSupport = false;
     	Dev.warn('Engine', 'Audio: Web Audio API is not supported in this browser ');
  	 }
}

Audio.init_nodes = function()
{


	Dev.Console.log('Audio.init_nodes' , 'initializing nodes');
	Audio.Node = {};

	Audio.Node.masterGain = Audio.context.createGainNode(); //create node
	Audio.Node.masterGain.connect(Audio.context.destination);

	Audio.Node.ambienceGain = Audio.context.createGainNode();
	Audio.Node.ambienceGain.connect(Audio.Node.masterGain);

	Audio.Node.musicGain = Audio.context.createGainNode();
	Audio.Node.musicGain.connect(Audio.Node.masterGain);

	Audio.Node.fxGain = Audio.context.createGainNode();
	Audio.Node.fxGain.connect(Audio.Node.masterGain);

	Audio.Node.fx_lowGain = Audio.context.createGainNode();
	Audio.Node.fx_lowGain.connect(Audio.Node.fxGain);
	Audio.Node.fx_lowGain.gain.value = 0.5;

	Audio.Node.fx_highGain = Audio.context.createGainNode();
	Audio.Node.fx_highGain.connect(Audio.Node.fxGain);

	if(Dev)
		if(Dev.enabled)
		{
			Dev.log("Engine", "Audio mute music, development mode");
			Audio.Node.musicGain.gain.value = 0;
		}
}

Audio.Music.play =function(source, loop) {
	if(!Audio.Music.temporary_playing)
	{
		Audio.Music.currentPlaying = source;
		if(Audio.waSupport)
		{
			source.connect(Audio.Node.musicGain);
  			source.mediaElement.play();
  			if(loop)                          
  				source.mediaElement.loop = true;
		}
		else
		{
			source.volume = 0.5;
			source.play();	
			if(loop)
				source.loop = true;	
		}
  		
  	}
}


//Playlist



Audio.Music.pause = function()
{
	if(Audio.waSupport)
		Audio.Music.currentPlaying.mediaElement.pause();
	else
		Audio.Music.currentPlaying.pause();
}

Audio.Music.resume = function()
{
	if(Audio.waSupport)
		Audio.Music.currentPlaying.mediaElement.play();
	else
		Audio.Music.currentPlaying.play();
}

Audio.Music.stop = function() 
{
	if(Audio.waSupport)
	{
		Audio.Music.currentPlaying.mediaElement.currentTime = 0;
		Audio.Music.currentPlaying.mediaElement.pause();
		Audio.Music.currentPlaying = null;
	}
	else
	{
		Audio.Music.currentPlaying.currentTime = 0;
		Audio.Music.currentPlaying.pause();
		Audio.Music.currentPlaying = null;
	}
}

	// For temporary playing other music, and remind old music.
Audio.Music.temp_play = function(source, loop)
{
	Audio.Music.temporary_playing = true;

	if(Audio.waSupport)
	{
		Audio.Music.currentPlaying.mediaElement.pause();
		Audio.Music.temporary_music= source;

		//play the music
		Audio.Music.temporary_music.connect(Audio.Node.musicGain);
	  	Audio.Music.temporary_music.mediaElement.play();

	  	Audio.Music.temporary_music.mediaElement.addEventListener("ended",function(){ Audio.Music.currentPlaying.mediaElement.play(); });
	}
	else
	{
		Audio.Music.currentPlaying.pause();
		Audio.Music.temporary_music= source;
		Audio.Music.temporary_music.play();
		Audio.Music.temporary_music.volume = 0.5;

		Audio.Music.temporary_music.addEventListener("ended",function(){ Audio.Music.currentPlaying.play(); });
	}
	

	//add an event handler when sound is finished if not want to loop
}
Audio.Music.temp_stop = function(source)
{	
	Audio.Music.temporary_playing = false;

	if(Audio.waSupport)
	{
		Audio.Music.temporary_music.mediaElement.currentTime = 0;
		Audio.Music.temporary_music.mediaElement.pause();
		Audio.Music.temporary_music = null;
		
		Audio.Music.currentPlaying.mediaElement.play();
	}
	else
	{
		Audio.Music.temporary_music.currentTime = 0;
		Audio.Music.temporary_music.pause();
		Audio.Music.temporary_music = null;
		Audio.Music.currentPlaying.play();
	}
}

Audio.Music.playbackRate = function(value)
{
	if(Audio.waSupport)
	{
		if(!value)
			return Audio.Music.currentPlaying.mediaElement.playbackRate;
		else
			Audio.Music.currentPlaying.mediaElement.playbackRate = value;
	}
	else
	{
		if(!value)
			return Audio.Music.currentPlaying.playbackRate
		else
			Audio.Music.currentPlaying.playbackRate = value;
	}
}

Audio.Music.getCurrentPlaying = function()
{
	if(Audio.waSupport)
	{
		return Audio.Music.currentPlaying.mediaElement;
	}
	else
	{
		return Audio.Music.currentPlaying;
	}
}

	// Play ambience sounds
Audio.Ambience.play = function(source)
{
	if(Audio.waSupport)
	{
		source.connect(Audio.Node.ambienceGain);
	  	source.mediaElement.play();
	  	source.mediaElement.loop = true;
	}
	else
	{
		source.play();
		source.loop = true;
	}
}

Audio.Ambience.pause = function()
{
	if(Audio.waSupport)
		source.mediaElement.pause();
}

Audio.Fx.play = function(source, priority, loop)
{
	if(Audio.waSupport)
	{
		if(priority == "high")
		{
			source.connect(Audio.Node.fx_highGain);
		}
		else if(priority == "low")
		{
			source.connect(Audio.Node.fx_lowGain);
		}
		else
		{
			Dev.Console.error('Audio.Fx.play', 'Sounds doesnt have a priority, played with high');
			source.connect(Audio.Node.fx_highGain);
		}

		if(loop)
		{
			source.mediaElement.loop = true;
		}

		source.mediaElement.play();
	}
	else
	{
		source.play();
		if(loop)
			source.loop = true;
	}
	
	return source;
}

Audio.Fx.stop = function(source)
{	
	if(Audio.waSupport)
	{
		source.mediaElement.pause();
		source.mediaElement.currentTime = 0;
	}
	else
	{
		source.pause();
		source.currentTime = 0;
	}	
}


	// Volume of Nodes.
Audio.masterVolume = function(volume) {
	if(Audio.waSupport)
	{
		if(!volume)
			return Audio.Node.masterGain.gain.value;
		else
			Audio.Node.masterGain.gain.value = volume;
	}
	else
		Dev.warn('Engine', 'Audio: no WA support, no volume control');
}

Audio.ambienceVolume = function(volume) {
	if(Audio.waSupport)
	{
		if(!volume)
			return Audio.Node.ambienceGain.gain.value;
		else
			Audio.Node.ambienceGain.gain.value = volume;
	}
	else
		Dev.warn('Engine', 'Audio: no WA support, no volume control');
}

Audio.musicVolume = function(volume) {
	if(Audio.waSupport)
	{
		if(!volume)
			return Audio.Node.musicGain.gain.value;
		else
			Audio.Node.musicGain.gain.value = volume;
	}
	else
		Dev.warn('Engine', 'Audio: no WA support, no volume control');
}

Audio.fxVolume = function(volume) {
	if(Audio.waSupport)
	{
		if(!volume)
			return Audio.Node.fxGain.gain.value;
		else
			Audio.Node.fxGain.gain.value = volume;
	}
	else
		Dev.warn('Engine', 'Audio: no WA support, no volume control');
}