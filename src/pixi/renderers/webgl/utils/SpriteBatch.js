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
	var numVerts = this.size * 4 * PIXI.Sprite.VERTEX_SIZE;
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

	this.boundsCheck = true;

	this.idx = 0;
	this.drawing = false;
	this.baseTexture = null; //NOTE: this is a BaseTexture
}; 

PIXI.SpriteBatch.totalRenderCalls = 0;

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

PIXI.SpriteBatch.prototype.begin = function(projection, bounds) 
{
	if (this.drawing)
		throw "SpriteBatch.end() must be called before begin";

	this.bounds = bounds;

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
    
    PIXI.SpriteBatch.totalRenderCalls++;
    
    //bind the current texture
    gl.bindTexture(gl.TEXTURE_2D, this.baseTexture._glTexture);

	//bind our vertex buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

	//upload the new data.. we are not changing the size as that may allocate new memory
	gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

	//setup our vertex attributes
	var shaderProgram = PIXI.shaderProgram;
	var numComponents = PIXI.Sprite.VERTEX_SIZE;
	var stride = numComponents * 4;
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, stride, 0);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, stride, 2 * 4);
	gl.vertexAttribPointer(shaderProgram.colorAttribute, 1, gl.FLOAT, false, stride, 4 * 4);

	//number of sprites in batch
	var spriteCount = (this.idx / (numComponents * 4));
 	
 	//draw the sprites
    gl.drawElements(gl.TRIANGLES, spriteCount * 6, gl.UNSIGNED_SHORT, 0);
    
    this.idx = 0;
};



/**
 * Adds a single display object (with no children) to this batch.
 */
PIXI.SpriteBatch.prototype.drawSprite = function(sprite) 
{
	if (!this.drawing)
		throw "Illegal State: trying to draw a SpriteBatch before begin()";
	var texture = sprite.texture;

	if (this.baseTexture != texture.baseTexture) {
		//new texture.. flush previous data
		this.flush();
		this.baseTexture = texture.baseTexture;
	} else if (this.idx == this.vertices.length) {
		this.flush(); //we've reached our max, flush before pushing more data
	}

	var verts =	sprite._updateVertices();
	 
///TODO: loop ?
	var off = 0;
	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//color
	this.vertices[this.idx++] = verts[off++];
	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//color
	this.vertices[this.idx++] = verts[off++];
	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//color
	this.vertices[this.idx++] = verts[off++];
	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//color
	this.vertices[this.idx++] = verts[off++];
}

/**
 * Adds a single set of vertices to this sprite batch (20 floats).
 */
PIXI.SpriteBatch.prototype.drawVertices = function(texture, verts, off) 
{
	if (!this.drawing)
		throw "Illegal State: trying to draw a SpriteBatch before begin()";
	
	if (this.baseTexture != texture.baseTexture) {
		//new texture.. flush previous data
		this.flush();
		this.baseTexture = texture.baseTexture;
	} else if (this.idx == this.vertices.length) {
		this.flush(); //we've reached our max, flush before pushing more data
	}

	off = off || 0;

	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//color
	this.vertices[this.idx++] = verts[off++];
	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//color
	this.vertices[this.idx++] = verts[off++];
	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//color
	this.vertices[this.idx++] = verts[off++];
	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//color
	this.vertices[this.idx++] = verts[off++];
};


// PIXI.SpriteBatch.prototype._drawVertices = function(
// 		baseTexture,
// 		x1, y1, u1, v1, c1,
// 		x2, y2, u2, v2, c2,
// 		x3, y3, u3, v3, c3,
// 		x4, y4, u4, v4, c4)  
// {
// 	if (!this.drawing)
// 		throw "Illegal State: trying to draw a SpriteBatch before begin()";
// 	if (this.baseTexture != baseTexture) {
// 		//new texture.. flush previous data
// 		this.flush();
// 		this.baseTexture = texture.baseTexture;
// 	} else if (this.idx == this.vertices.length) {
// 		this.flush(); //we've reached our max, flush before pushing more data
// 	}

// };

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