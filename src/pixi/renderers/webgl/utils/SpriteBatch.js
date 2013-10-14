/**
 * @author Matt DesLauriers <mattdesl> https://github.com/mattdesl/
 * 
 * Heavily inspired by LibGDX's SpriteBatch:
 * https://github.com/libgdx/libgdx/blob/master/gdx/src/com/badlogic/gdx/graphics/g2d/SpriteBatch.java
 */


/**
 * A low-level utility for batching 2D textures. Modular enough that it can be used
 * for more manual rendering of scene sprites (i.e. without any scene graph).
 *
 * A sprite is made up of 4 (indexed) vertices, each with the following layout:
 *
 *     { x, y, u, v, alpha }
 * 
 * @class SpriteBatch
 * @constructor
 *
 *
 *
 * @param size {Number} the default max size of the batch, in sprites
 * @default 0
 */
PIXI.SpriteBatch = function(gl, size)
{
	this.initialize(gl);
	this.size = size || 500;
	this.currentShader = null;

	// 32767 is max index, so 32767 / 6 - (32767 / 6 % 3) = 5460.
	if (this.size > 5460) 
		throw "Can't have more than 5460 sprites per batch: " + this.size;

	//the total number of floats in our batch
	var numVerts = this.size * 4 * PIXI.SpriteBatch.SPRITE_VERTEX_SIZE;
	//the total number of indices in our batch
	var numIndices = this.size * 6;


	this.blendMode = PIXI.blendModes.NORMAL;

	this.vertices = new Float32Array(numVerts);
	this.indices = new Uint16Array(numIndices); 
	
	for (var i=0, j=0; i < numIndices; i += 6, j += 4) 
	{
		this.indices[i + 0] = j + 0; 
		this.indices[i + 1] = j + 1;
		this.indices[i + 2] = j + 2;
		this.indices[i + 3] = j + 0;
		this.indices[i + 4] = j + 2;
		this.indices[i + 5] = j + 3;
	};

	//upload the index data
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

	//null means "use the default"
	this.currentShader = null;

	this.idx = 0;
	this.drawing = false;
	this.baseTexture = null; //NOTE: this is a BaseTexture
}; 

//5 floats per vertex (position, UV, alpha)
PIXI.SpriteBatch.SPRITE_VERTEX_SIZE = 5;

// constructor
PIXI.SpriteBatch.constructor = PIXI.SpriteBatch;

//TODO: implement...
PIXI.SpriteBatch.prototype.setBlendMode = function(blendMode)
{
	//... TODO: flush and swap blend modes...
	//Implementation should be renderer agnostic or at least 
	//done in a way to remove duplicate code between this and WebGLRenderGroup / WebGLRenderBatch.
	this.blendMode = blendMode;
};

PIXI.SpriteBatch.prototype.begin = function(projection) 
{
	if (this.drawing)
		throw "SpriteBatch.end() must be called before begin";

	//update any textures before trying to render..
	PIXI.WebGLRenderer.updateTextures();
	
	var gl = this.gl;
	projection = projection || PIXI.projection;

	//disable depth mask
	gl.depthMask(false);

	//activate texture0
	gl.activeTexture(gl.TEXTURE0);

	//bind the shader
	PIXI.activateDefaultShader();

	//upload projection uniform
	gl.uniform2f(PIXI.shaderProgram.projectionVector, projection.x, projection.y);

	//premultiplied alpha
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); 

	this.drawing = true;
};

PIXI.SpriteBatch.prototype.end = function(projection) 
{
	if (!this.drawing)
		throw "SpriteBatch.begin() must be called before end";
	if (this.idx > 0)
		this.flush();
	this.baseTexture = null;
	this.drawing = false;

	var gl = this.gl;
	gl.depthMask(true); //reset to default WebGL state
};

PIXI.SpriteBatch.prototype.flush = function() 
{
	if (this.idx===0)
		return;
	if (this.baseTexture === null) 
		return;

    var gl = this.gl;
    
    //bind the current texture
    gl.bindTexture(gl.TEXTURE_2D, this.baseTexture._glTexture);

	//bind our vertex buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

	//upload the new data.. we are not changing the size as that may allocate new memory
	gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

	//setup our vertex attributes
	var shaderProgram = PIXI.shaderProgram;
	var numComponents = PIXI.SpriteBatch.SPRITE_VERTEX_SIZE;
	var stride = numComponents * 4;
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, stride, 0);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, stride, 2 * 4);
	gl.vertexAttribPointer(shaderProgram.colorAttribute, 1, gl.FLOAT, false, stride, 4 * 4);

	//number of sprites in batch
	var spriteCount = (this.idx / (numComponents * 4));
 	
 	//draw the sprites
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    this.idx = 0;
};

/**
 * Adds a single display object (with no children) to this batch.
 */
PIXI.SpriteBatch.prototype.drawDisplayObject = function(displayObject) 
{
	if (!this.drawing)
		throw "Illegal State: trying to draw a SpriteBatch before begin()";
	var texture = displayObject.texture;
	
	if (this.baseTexture != texture.baseTexture) {
		//new texture.. flush previous data
		this.flush();
		this.baseTexture = texture.baseTexture;
	} else if (this.idx == vertices.length) {
		this.flush(); //we've reached our max, flush before pushing more data
	}

	// console.log(texture._glTexture);

	var worldTransform, width, height, aX, aY, w0, w1, h0, h1;
	var frame = texture.frame;
	var tw = texture.baseTexture.width;
	var th = texture.baseTexture.height;
	var color = displayObject.worldAlpha;


	//size of texture region
	width = frame.width;
	height = frame.height;

	// TODO trim??
	aX = displayObject.anchor.x;// - displayObject.texture.trim.x
	aY = displayObject.anchor.y; //- displayObject.texture.trim.y
	w0 = width * (1-aX);
	w1 = width * -aX;

	h0 = height * (1-aY);
	h1 = height * -aY;

	worldTransform = displayObject.worldTransform;

	a = worldTransform[0];
	b = worldTransform[3];
	c = worldTransform[1];
	d = worldTransform[4];
	tx = worldTransform[2];
	ty = worldTransform[5];
	// console.log(a, b,c , d, tx, ty);

	//xy
	this.vertices[this.idx++] = a * w1 + c * h1 + tx; 
	this.vertices[this.idx++] = d * h1 + b * w1 + ty;
	//uv
	this.vertices[this.idx++] = frame.x / tw;
	this.vertices[this.idx++] = frame.y / th;
	//color
	this.vertices[this.idx++] = color;

	//xy
	this.vertices[this.idx++] = a * w0 + c * h1 + tx; 
	this.vertices[this.idx++] = d * h1 + b * w0 + ty; 
	//uv
	this.vertices[this.idx++] = (frame.x + frame.width) / tw;
	this.vertices[this.idx++] = frame.y / th;
	//color
	this.vertices[this.idx++] = color;

	//xy
	this.vertices[this.idx++] = a * w0 + c * h0 + tx; 
	this.vertices[this.idx++] = d * h0 + b * w0 + ty; 
	//uv
	this.vertices[this.idx++] = (frame.x + frame.width) / tw;
	this.vertices[this.idx++] = (frame.y + frame.height) / th; 
	//color
	this.vertices[this.idx++] = color;

	//xy
	this.vertices[this.idx++] = a * w1 + c * h0 + tx; 
	this.vertices[this.idx++] = d * h0 + b * w1 + ty; 
	//uv
	this.vertices[this.idx++] = frame.x / tw;
	this.vertices[this.idx++] = (frame.y + frame.height) / th;
	//color
	this.vertices[this.idx++] = color;
};

/**
 * Initializes the buffers, replacing the old ones, i.e. on context restoration.
 * Does not delete old buffers -- use destroy() for that.
 * 
 * @method initialize
 */
PIXI.SpriteBatch.prototype.initialize = function(gl)
{
	this.gl = gl;
	this.vertexBuffer = gl.createBuffer();
	this.indexBuffer = gl.createBuffer();
};

/**
 * Destroys the batch, deleting its buffers. Trying to use this
 * batch after destroying it can lead to unpredictable behaviour.
 *
 * @method destroy
 */
PIXI.SpriteBatch.prototype.destroy = function()
{
	this.vertices = [];
	this.indices = [];
	this.baseTexture = null;
	this.size = this.maxVertices = 0;
	if (this.vertexBuffer !== null)
		this.gl.deleteBuffer(this.vertexBuffer);
	if (this.indexBuffer !== null)
		this.gl.deleteBuffer(this.indexBuffer);
};