/**
 * @author Matt DesLauriers <mattdesl> https://github.com/mattdesl/
 * 
 * Heavily inspired by LibGDX's WebGLSpriteBatch:
 * https://github.com/libgdx/libgdx/blob/master/gdx/src/com/badlogic/gdx/graphics/g2d/WebGLSpriteBatch.java
 */

PIXI.WebGLSpriteBatch = function(gl, size)
{
	//constructor
	PIXI.AbstractBatch.call(this, gl, size);

	//the currently bound texture
	this.baseTexture = null;
};

// reparent constructor
PIXI.WebGLSpriteBatch.prototype = Object.create( PIXI.AbstractBatch.prototype );
PIXI.WebGLSpriteBatch.prototype.constructor = PIXI.WebGLSpriteBatch;


PIXI.WebGLSpriteBatch.prototype.getVertexSize = function()
{
	return PIXI.Sprite.VERTEX_SIZE; //5 floats per vertex
};


PIXI.WebGLSpriteBatch.prototype.begin = function(projection) 
{
	PIXI.AbstractBatch.prototype.begin.call(this, projection);

	var gl = this.gl;

	//activate texture0
	gl.activeTexture(gl.TEXTURE0);

	//bind the default shader
	PIXI.activateDefaultShader();
	
	//upload projection uniform
	gl.uniform2f(PIXI.shaderProgram.projectionVector, projection.x, projection.y);

	
	//setup vertex attribs
	var shaderProgram = PIXI.shaderProgram;
	var numComponents = this.getVertexSize();
	var stride = numComponents * 4; //in bytes..

    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, stride, 0);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, stride, 2 * 4);
	gl.vertexAttribPointer(shaderProgram.colorAttribute, 1, gl.FLOAT, false, stride, 4 * 4);
};

PIXI.WebGLSpriteBatch.prototype.end = function() 
{
	PIXI.AbstractBatch.prototype.end.call(this);

	//clear the current texture
	this.baseTexture = null;
};

/** 
 * Called before rendering to bind new textures and setup
 * vertex attribute pointers. 
 */
PIXI.WebGLSpriteBatch.prototype._bind = function() 
{
	var gl = this.gl;
    //bind the current texture
    gl.bindTexture(gl.TEXTURE_2D, this.baseTexture._glTexture);
};


PIXI.WebGLSpriteBatch.prototype.flush = function() 
{
	if (this.baseTexture === null)
		return;

	PIXI.AbstractBatch.prototype.flush.call(this);
};



/**
 * Adds a single display object (with no children) to this batch.
 */
PIXI.WebGLSpriteBatch.prototype.drawSprite = function(sprite) 
{
	if (!this.drawing)
		throw "Illegal State: trying to draw a WebGLSpriteBatch before begin()";
	var texture = sprite.texture;

	//don't draw anything if GL tex doesn't exist..
	if (!texture || !texture.baseTexture || !texture.baseTexture._glTexture)
		return;

	if (this.baseTexture != texture.baseTexture) {
		//new texture.. flush previous data
		this.flush();
		this.baseTexture = texture.baseTexture;
	} else if (this.idx == this.vertices.length) {
		this.flush(); //we've reached our max, flush before pushing more data
	}

	var verts =	sprite._updateVertices();
	// TODO: we can remove this duplicate code with drawVertices
	
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
PIXI.WebGLSpriteBatch.prototype.drawVertices = function(texture, verts, off) 
{
	if (!this.drawing)
		throw "Illegal State: trying to draw a batch before begin()";
	
	//don't draw anything if GL tex doesn't exist..
	if (!texture || !texture.baseTexture || !texture.baseTexture._glTexture)
		return;
	
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