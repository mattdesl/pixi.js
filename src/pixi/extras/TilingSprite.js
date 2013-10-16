/**
 * @author Mat Groves http://matgroves.com/
 */

/**
 * A tiling sprite is a fast way of rendering a tiling image
 *
 * @class TilingSprite
 * @extends DisplayObjectContainer
 * @constructor
 * @param texture {Texture} the texture of the tiling sprite
 * @param width {Number}  the width of the tiling sprite
 * @param height {Number} the height of the tiling sprite
 */
PIXI.TilingSprite = function(texture, width, height)
{
	PIXI.DisplayObjectContainer.call( this );

	/**
	 * The texture that the sprite is using
	 *
	 * @property texture
	 * @type Texture
	 */
	this.texture = texture;

	/**
	 * The width of the tiling sprite
	 *
	 * @property width
	 * @type Number
	 */
	this.width = width;

	/**
	 * The height of the tiling sprite
	 *
	 * @property height
	 * @type Number
	 */
	this.height = height;

	/**
	 * The scaling of the image that is being tiled
	 *
	 * @property tileScale
	 * @type Point
	 */
	this.tileScale = new PIXI.Point(1,1);

	//TODO: these should inherit from Sprite
	this.anchor = new PIXI.Point();
	this._vertices = new Float32Array(PIXI.Sprite.VERTEX_SIZE * 4);

	/**
	 * The offset position of the image that is being tiled
	 *
	 * @property tilePosition
	 * @type Point
	 */
	this.tilePosition = new PIXI.Point(0,0);

	this.renderable = true;

	this.blendMode = PIXI.blendModes.NORMAL
}

// constructor
PIXI.TilingSprite.prototype = Object.create( PIXI.DisplayObjectContainer.prototype );
PIXI.TilingSprite.prototype.constructor = PIXI.TilingSprite;

/**
 * Sets the texture of the tiling sprite
 *
 * @method setTexture
 * @param texture {Texture} The PIXI texture that is displayed by the sprite
 */
PIXI.TilingSprite.prototype.setTexture = function(texture)
{
	//TODO SET THE TEXTURES
	//TODO VISIBILITY

	// stop current texture
	this.texture = texture;
	this.updateFrame = true;
}

/**
 * When the texture is updated, this event will fire to update the frame
 *
 * @method onTextureUpdate
 * @param event
 * @private
 */
PIXI.TilingSprite.prototype.onTextureUpdate = function(event)
{
	this.updateFrame = true;
}

//Really this should be a subclass of Sprite instead of duplicating code... 
//but Sprite is not very extendible right now

PIXI.TilingSprite.prototype._glDraw = function(renderer, projection) 
{	
	//don't draw anything if not visible!
	if (!this.isShowing())
		return;

	if (this.texture && this.texture.baseTexture) {
		//this is pretty darn nasty... should be managed by a WebGLTexture utility
		if(!this.texture.baseTexture._powerOf2 && this.texture.baseTexture._glTexture) {
			var gl = renderer.gl;
	    	gl.bindTexture(gl.TEXTURE_2D, this.texture.baseTexture._glTexture);
	    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			this.texture.baseTexture._powerOf2 = true;
		} else {
			this.texture.baseTexture._powerOf2 = true;
		}

		if (this.texture.baseTexture._glTexture) {
			this._updateVertices();

			if (this._isCulled()) {
				return;
			}

			//set new blend mode (this will flush batch if different)
			renderer.spriteBatch.setBlendMode(this.blendMode);
			//draw the object (batch will be flushed if the texture is different)
			renderer.spriteBatch.drawVertices(this.texture, this._vertices, 0);
		}
	}
	//draw any children we might have in this sprite..
	this._glDrawChildren(renderer, projection);
};

PIXI.TilingSprite.prototype._isCulled = function() {
	return PIXI.Sprite.prototype._isCulled.call(this);
};

PIXI.TilingSprite.prototype._updateVertices = function() {
	var out = PIXI.Sprite.prototype._updateVertices.call(this, this.width, this.height);

	var tilePosition = this.tilePosition;
	var tileScale = this.tileScale;
	
	var offsetX =  tilePosition.x/this.texture.baseTexture.width;
	var offsetY =  tilePosition.y/this.texture.baseTexture.height;
	
	var scaleX =  (this.width / this.texture.baseTexture.width)  / tileScale.x;
	var scaleY =  (this.height / this.texture.baseTexture.height) / tileScale.y;
 	
	out[2] = 0 - offsetX;
	out[3] = 0 - offsetY;
	
	out[7] = (1 * scaleX)  -offsetX;
	out[8] = 0 - offsetY;
	
	out[12] = (1 *scaleX) - offsetX;
	out[13] = (1 *scaleY) - offsetY;
	
	out[17] = 0 - offsetX;
	out[18] = (1 *scaleY) - offsetY;

	return out;
};
