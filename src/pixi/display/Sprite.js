/**
 * @author Mat Groves http://matgroves.com/ @Doormat23
 */

PIXI.blendModes = {};
PIXI.blendModes.NORMAL = 0;
PIXI.blendModes.SCREEN = 1;


/**
 * The SPrite object is the base for all textured objects that are rendered to the screen
 *
 * @class Sprite
 * @extends DisplayObjectContainer
 * @constructor
 * @param texture {Texture} The texture for this sprite
 * @type String
 */
PIXI.Sprite = function(texture)
{
	PIXI.DisplayObjectContainer.call( this );

	/**
	 * The anchor sets the origin point of the texture.
	 * The default is 0,0 this means the textures origin is the top left
	 * Setting than anchor to 0.5,0.5 means the textures origin is centered
	 * Setting the anchor to 1,1 would mean the textures origin points will be the bottom right
	 *
     * @property anchor
     * @type Point
     */
	this.anchor = new PIXI.Point();

	/**
	 * The texture that the sprite is using
	 *
	 * @property texture
	 * @type Texture
	 */
	this.texture = texture;

	/**
	 * The blend mode of sprite.
	 * currently supports PIXI.blendModes.NORMAL and PIXI.blendModes.SCREEN
	 *
	 * @property blendMode
	 * @type Number
	 */
	this.blendMode = PIXI.blendModes.NORMAL;

	/**
	 * The width of the sprite (this is initially set by the texture)
	 *
	 * @property _width
	 * @type Number
	 * @private
	 */
	this._width = 0;

	/**
	 * The height of the sprite (this is initially set by the texture)
	 *
	 * @property _height
	 * @type Number
	 * @private
	 */
	this._height = 0;

	/**
	 * Holds vertex information; maybe at a later point this will be cached
	 * with a dirty flag. 
	 * 
	 * @property _vertices
	 * @type {Float32Array}
	 * @private
	 */
	this._vertices = new Float32Array(PIXI.Sprite.VERTEX_SIZE * 4);

	/**
	 * If true, we will attempt to cull this sprite and its children if it's
	 * transformed quad lies outside of the stage bounds. This requires
	 * stage.cullingRect to be set (a Rectangle object). Right now this
	 * only supports axis-aligned rectangles, so if your sprite is a massive
	 * and rotated box that is much larger than the stage, but *should* intersect
	 * it, the culling might not work as expected. In that case, you can set
	 * cullingEnabled to false.
	 * 
	 * @property cullingEnabled
	 * @type {Boolean}
	 */
	this.cullingEnabled = true;

	if(texture.baseTexture.hasLoaded)
	{
		this.updateFrame = true;
	}
	else
	{
		this.onTextureUpdateBind = this.onTextureUpdate.bind(this);
		this.texture.addEventListener( 'update', this.onTextureUpdateBind );
	}

	this.renderable = true;
};

// constructor
PIXI.Sprite.prototype = Object.create( PIXI.DisplayObjectContainer.prototype );
PIXI.Sprite.prototype.constructor = PIXI.Sprite;

PIXI.Sprite.VERTEX_SIZE = (2 + 2 + 1);

/**
 * The width of the sprite, setting this will actually modify the scale to acheive the value set
 *
 * @property width
 * @type Number
 */
Object.defineProperty(PIXI.Sprite.prototype, 'width', {
    get: function() {
        return this.scale.x * this.texture.frame.width;
    },
    set: function(value) {
    	this.scale.x = value / this.texture.frame.width
        this._width = value;
    }
});

/**
 * The height of the sprite, setting this will actually modify the scale to acheive the value set
 *
 * @property height
 * @type Number
 */
Object.defineProperty(PIXI.Sprite.prototype, 'height', {
    get: function() {
        return  this.scale.y * this.texture.frame.height;
    },
    set: function(value) {
    	this.scale.y = value / this.texture.frame.height
        this._height = value;
    }
});

/**
 * Sets the texture of the sprite
 *
 * @method setTexture
 * @param texture {Texture} The PIXI texture that is displayed by the sprite
 */
PIXI.Sprite.prototype.setTexture = function(texture)
{
	// stop current texture;
	if(this.texture.baseTexture != texture.baseTexture)
	{
		this.textureChange = true;
		this.texture = texture;
	
		if(this.__renderGroup)
		{
			this.__renderGroup.updateTexture(this);
		}
	}
	else
	{
		this.texture = texture;
	}
	
	this.anchor.x = texture.anchor.x;
	this.anchor.y = texture.anchor.y;

	this.updateFrame = true;
}

/**
 * When the texture is updated, this event will fire to update the scale and frame
 *
 * @method onTextureUpdate
 * @param event
 * @private
 */
PIXI.Sprite.prototype.onTextureUpdate = function(event)
{
	//this.texture.removeEventListener( 'update', this.onTextureUpdateBind );

	// so if _width is 0 then width was not set..
	if(this._width)this.scale.x = this._width / this.texture.frame.width;
	if(this._height)this.scale.y = this._height / this.texture.frame.height;

	this.updateFrame = true;
}

// some helper functions..

/**
 *
 * Helper function that creates a sprite that will contain a texture from the TextureCache based on the frameId
 * The frame ids are created when a Texture packer file has been loaded
 *
 * @method fromFrame
 * @static
 * @param frameId {String} The frame Id of the texture in the cache
 * @return {Sprite} A new Sprite using a texture from the texture cache matching the frameId
 */
PIXI.Sprite.fromFrame = function(frameId)
{
	var texture = PIXI.TextureCache[frameId];
	if(!texture)throw new Error("The frameId '"+ frameId +"' does not exist in the texture cache" + this);
	return new PIXI.Sprite(texture);
}

/**
 *
 * Helper function that creates a sprite that will contain a texture based on an image url
 * If the image is not in the texture cache it will be loaded
 *
 * @method fromImage
 * @static
 * @param imageId {String} The image url of the texture
 * @return {Sprite} A new Sprite using a texture from the texture cache matching the image id
 */
PIXI.Sprite.fromImage = function(imageId)
{
	var texture = PIXI.Texture.fromImage(imageId);
	return new PIXI.Sprite(texture);
}

PIXI.Sprite.prototype._updateVertices = function(width, height) {
	//TODO: cache; when a container moves/rotates flag its children as dirty
	var texture = this.texture;
	var frame = texture.frame;
	var tw = texture.baseTexture.width;
	var th = texture.baseTexture.height;
	
	var worldTransform, width, height, aX, aY, w0, w1, h0, h1;
	var color = this.worldAlpha;

	//size of texture region
	width = width || frame.width;
	height = height || frame.height;

	// TODO trim??
	aX = this.anchor.x;// - displayObject.texture.trim.x
	aY = this.anchor.y; //- displayObject.texture.trim.y
	w0 = width * (1-aX);
	w1 = width * -aX;

	h0 = height * (1-aY);
	h1 = height * -aY;

	worldTransform = this.worldTransform;

	a = worldTransform[0];
	b = worldTransform[3];
	c = worldTransform[1];
	d = worldTransform[4];
	tx = worldTransform[2];
	ty = worldTransform[5];
	
	var x1, x2, x3, x4,
		y1, y2, y3, y4;

	x1 = a * w1 + c * h1 + tx;
	y1 = d * h1 + b * w1 + ty;
	x2 = a * w0 + c * h1 + tx; 
	y2 = d * h1 + b * w0 + ty; 
	x3 = a * w0 + c * h0 + tx; 
	y3 = d * h0 + b * w0 + ty; 
	x4 = a * w1 + c * h0 + tx; 
	y4 = d * h0 + b * w1 + ty; 

	//xy
	var idx = 0, out = this._vertices;
	out[idx++] = x1; 
	out[idx++] = y1;
	//uv
	out[idx++] = frame.x / tw;
	out[idx++] = frame.y / th;
	//color
	out[idx++] = color;

	//xy
	out[idx++] = x2;
	out[idx++] = y2;
	//uv
	out[idx++] = (frame.x + frame.width) / tw;
	out[idx++] = frame.y / th;
	//color
	out[idx++] = color;

	//xy
	out[idx++] = x3;
	out[idx++] = y3;
	//uv
	out[idx++] = (frame.x + frame.width) / tw;
	out[idx++] = (frame.y + frame.height) / th; 
	//color
	out[idx++] = color;

	//xy
	out[idx++] = x4;
	out[idx++] = y4;
	//uv
	out[idx++] = frame.x / tw;
	out[idx++] = (frame.y + frame.height) / th;
	//color
	out[idx++] = color;
	return out;
};

//must be called after _updateVertices()
//returns false if stage does not exist, or culling is disabled/not set
PIXI.Sprite.prototype._isCulled = function() 
{
	//TODO: cache the result
	//		and let users access with isShowing()
		
	if (!this.stage || !this.stage.cullingRect || !this.cullingEnabled)
		return false;

	var b = this.stage.cullingRect;

	var x1 = this._vertices[0];
	var y1 = this._vertices[1];

	var x2 = this._vertices[5];
	var y2 = this._vertices[6];

	var x3 = this._vertices[10];
	var y3 = this._vertices[11];

	var x4 = this._vertices[15];
	var y4 = this._vertices[16];

	var minX = Math.min(x1, x2, x3, x4);
	var minY = Math.min(y1, y2, y3, y4);
	var maxX = Math.max(x1, x2, x3, x4);
	var maxY = Math.max(y1, y2, y3, y4);

	return !(minX <= (b.x + b.width) &&
          b.x <= maxX &&
          minY <= (b.y + b.height) &&
          b.y <= maxY);
};


//pass function "renderFunc"
//call like so: renderFunc( this )  => passing the sprite
//on GL side:
//   renderFunc(sprite)
//   	spriteBatch.setBlendMode(sprite.blendMode);
//   	spriteBatch.drawSprite(sprite)
//on canvas side:
//	 renderFunc(sprite)
//	 	... trololo ..
//	 	
//	not really good for many different render types though !!
//	using CustomRenderer type of thing would be better
//	or a mix... allow generic renderable to draw with SpriteBatch
//	OR allow them to perform custom draw ops?

PIXI.Sprite.prototype._glDraw = function(renderer, projection) 
{	
	//don't draw anything if not visible!
	if (!this.isShowing())
		return;
	if (this.texture && this.texture.baseTexture && this.texture.baseTexture._glTexture) {

		this._updateVertices();

		if (this._isCulled()) {
			return;
		}


		//set new blend mode (this will flush batch if different)
		renderer.spriteBatch.setBlendMode(this.blendMode);
		//draw the object (batch will be flushed if the texture is different)
		renderer.spriteBatch.drawVertices(this.texture, this._vertices, 0);

	}
	//draw any children we might have in this sprite..
	this._glDrawChildren(renderer, projection);
};


PIXI.Sprite.prototype._canvasDraw = function(renderer, projection) 
{	
	//don't draw anything if not visible!
	if (!this.isShowing())
		return;
	if (this.texture && this.texture.baseTexture && this.texture.baseTexture._glTexture) {
		
		this._updateVertices();

		if (this._isCulled()) {
			return;
		}


		//set new blend mode (this will flush batch if different)
		//....
		
		//draw the object (batch will be flushed if the texture is different)
		// var frame = displayObject.texture.frame;
		// // 
		// if(frame && frame.width && frame.height)
		// {
		// 	context.globalAlpha = displayObject.worldAlpha;

		// 	context.setTransform(transform[0], transform[3], transform[1], transform[4], transform[2], transform[5]);

		// 	context.drawImage(displayObject.texture.baseTexture.source,
		// 					   frame.x,
		// 					   frame.y,
		// 					   frame.width,
		// 					   frame.height,
		// 					   (displayObject.anchor.x) * -frame.width,
		// 					   (displayObject.anchor.y) * -frame.height,
		// 					   frame.width,
		// 					   frame.height);
		// }
	}
	//draw any children we might have in this sprite..
	this._canvasDrawChildren(renderer, projection);
};
