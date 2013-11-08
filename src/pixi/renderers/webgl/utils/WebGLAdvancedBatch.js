
// See here:
// http://webglsamples.googlecode.com/hg/sprites/readme.html

// batches up to four textures together into a single draw call
PIXI.WebGLAdvancedBatch = function(gl, size)
{
	PIXI.AbstractBatch.call(this, gl, size);


	this.textureStack = [];

	this.texturePointer = 0;

	this.shaderProgram = this._createShader();
};

// reparent constructor
PIXI.WebGLAdvancedBatch.prototype = Object.create( PIXI.AbstractBatch.prototype );
PIXI.WebGLAdvancedBatch.prototype.constructor = PIXI.WebGLAdvancedBatch;

//Maximum 4 textures bound at a time
PIXI.WebGLAdvancedBatch.MAX_TEXTURES = 4;
PIXI.WebGLAdvancedBatch.VERTEX_SIZE = (2 + 2 + 1 + 1); 

PIXI.WebGLAdvancedBatch.FRAG_SRC = [
	"precision mediump float;",
	"varying vec2 vTextureCoord;",
	"varying float vColor;",
	"varying float vTexUnit;",

	"uniform sampler2D uSampler0;",
	"uniform sampler2D uSampler1;",
	"uniform sampler2D uSampler2;",
	"uniform sampler2D uSampler3;",

	"void main(void) {",
		"if (vTexUnit < 1.0)",
			"gl_FragColor = texture2D(uSampler0, vTextureCoord) * vColor;",
		"else if (vTexUnit < 2.0)",
			"gl_FragColor = texture2D(uSampler1, vTextureCoord) * vColor;",
		"else if (vTexUnit < 3.0)",
			"gl_FragColor = texture2D(uSampler2, vTextureCoord) * vColor;",
		"else", // vTexUnit < 4
			"gl_FragColor = texture2D(uSampler3, vTextureCoord) * vColor;",
	"}"
];

PIXI.WebGLAdvancedBatch.VERT_SRC = [
	"attribute vec2 aVertexPosition;",
	"attribute vec2 aTextureCoord;",
	"attribute float aTexUnit;",
	"attribute float aColor;",

	"uniform vec2 projectionVector;",

	"varying vec2 vTextureCoord;",
	"varying float vTexUnit;",
	"varying float vColor;",

	"void main(void) {",
		"vTextureCoord = aTextureCoord;",
		"vColor = aColor;",
		"vTexUnit = aTexUnit;",
		"gl_Position = vec4( aVertexPosition.x / projectionVector.x -1.0, aVertexPosition.y / -projectionVector.y + 1.0 , 0.0, 1.0);",		
	"}"
];

PIXI.WebGLAdvancedBatch.prototype._createShader = function()
{
	var attribLocations = {
		"aVertexPosition": 0,
		"aTextureCoord": 1,
		"aTexUnit": 2,
		"aColor": 3
	}; // <-- only necessary if we want to introduce shader switching

	var shader = PIXI.compileProgram(
						PIXI.WebGLAdvancedBatch.VERT_SRC, 
		  				PIXI.WebGLAdvancedBatch.FRAG_SRC,
		  				attribLocations);

	var gl = this.gl;	

    gl.useProgram(shader);

    //attributes
    shader.vertexPositionAttribute = gl.getAttribLocation(shader, "aVertexPosition");
    shader.textureCoordAttribute   = gl.getAttribLocation(shader, "aTextureCoord");
	shader.texUnitAttribute 	   = gl.getAttribLocation(shader, "aTexUnit");
	shader.colorAttribute 		   = gl.getAttribLocation(shader, "aColor");


	//uniforms
	shader.projectionVector = gl.getUniformLocation(shader, "projectionVector");
    
	//samplers
    var samplers = [];
    for (var i=0; i<PIXI.WebGLAdvancedBatch.MAX_TEXTURES; i++) {
    	var loc = gl.getUniformLocation(shader, "uSampler" + i);
    	samplers.push( loc );

    	//upload index
    	gl.uniform1i(loc, i);
    }
    shader.samplers = samplers;
    

	return shader;
};


PIXI.WebGLAdvancedBatch.prototype.getVertexSize = function()
{
	return PIXI.WebGLAdvancedBatch.VERTEX_SIZE; //5 floats per vertex
};

PIXI.WebGLAdvancedBatch.prototype.begin = function(projection) 
{
	//super method
	PIXI.AbstractBatch.prototype.begin.call(this, projection);

	var gl = this.gl;
	var shaderProgram = this.shaderProgram;

	//bind our shader
	gl.useProgram(shaderProgram);
	
	//upload projection uniform
	gl.uniform2f(shaderProgram.projectionVector, projection.x, projection.y);

	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
	gl.enableVertexAttribArray(shaderProgram.texUnitAttribute);
	gl.enableVertexAttribArray(shaderProgram.colorAttribute);


	//setup vertex attribs
	var numComponents = this.getVertexSize();
	var stride = numComponents * 4; //in bytes..	
	
	
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, stride, 0 * 4);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, stride, 2 * 4);
	gl.vertexAttribPointer(shaderProgram.texUnitAttribute, 1, gl.FLOAT, false, stride, 4 * 4);
	gl.vertexAttribPointer(shaderProgram.colorAttribute, 1, gl.FLOAT, false, stride, 5 * 4);
};

PIXI.WebGLAdvancedBatch.prototype.end = function() 
{
	PIXI.AbstractBatch.prototype.end.call(this);

	//clear the current texture
	this._resetStack();

	var gl = this.gl;
	var shaderProgram = this.shaderProgram;
	gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
	gl.disableVertexAttribArray(shaderProgram.texUnitAttribute);
	gl.disableVertexAttribArray(shaderProgram.colorAttribute);
};

/** 
 * Called before rendering to bind new textures and setup
 * vertex attribute pointers. 
 */
PIXI.WebGLAdvancedBatch.prototype._bind = function() 
{
	this._bindTextures();

};


PIXI.WebGLAdvancedBatch.prototype.flush = function() 
{
	//ignore render if we have no textures
	if (this.textureStack.length === 0 || this.textureStack[0] === null)
		return;


	PIXI.AbstractBatch.prototype.flush.call(this);
};

//TODO: depending on PIXI's target, just use Array.indexOf
PIXI.WebGLAdvancedBatch.__lastIndexOf = function(array, element) 
{
	var i = array.length;
	while (i--) {
		if (array[i] === element)
			return i;
	}
	return -1;
};


PIXI.WebGLAdvancedBatch.prototype._bindTextures = function() //only call if stack is non empty
{
	var stack = this.textureStack;
	var i = Math.min(stack.length, this.texturePointer); //stack size
	var gl = this.gl;
	while (i--) { //bind in reverse so that the last active will be TEXTURE_0
		gl.activeTexture(gl.TEXTURE0 + i)
		gl.bindTexture(gl.TEXTURE_2D, stack[i]);
	}
};

//clears the texture stack and replaces the first element with the given optional param, or null
PIXI.WebGLAdvancedBatch.prototype._resetStack = function(firstElement)
{
	var stack = this.textureStack;
	var i = stack.length;
	while (i--) {
		stack[i] = null;
	}
	this.texturePointer = 0;
};


/**
 * Adds a single display object (with no children) to this batch.
 */
PIXI.WebGLAdvancedBatch.prototype.drawSprite = function(sprite) 
{
	var verts =	sprite._updateVertices();
	var off = 0;
	this.drawVertices(sprite.texture, verts, off);
};
	 

PIXI.WebGLAdvancedBatch.prototype.drawVertices = function(texture, verts, off)
{
	if (!this.drawing)
		throw "Illegal State: trying to draw batch before begin()";

	//don't draw anything if GL tex doesn't exist..
	if (!texture || !texture.baseTexture || !texture.baseTexture._glTexture)
		return;

	var glTex = texture.baseTexture._glTexture;

	/////// first we check if we should flush because of vert max.
	if (this.idx == this.vertices.length) {
		this.flush(); //we've reached our max, flush before pushing more data
	}

	/////// now we check if we should flush because of texture switch
	//if we have textures left, push this sprite onto the stack.
	//if we don't have textures left, check to see if the new texture
	//is one in textureStack (and use it). If not, flush the batch
	//pointer increases so old textures get popped off

	//is the texture already in the set?
	var cachedIndex = PIXI.WebGLAdvancedBatch.__lastIndexOf(this.textureStack, glTex);
	// console.log(cachedIndex)
	
	//it's a NEW texture
	if (cachedIndex == -1) {


		//we are still under 4 textures.. so just add this texture to the stack
		if (this.texturePointer < PIXI.WebGLAdvancedBatch.MAX_TEXTURES) {
			//the index of the texture for this sprite
			cachedIndex = this.texturePointer;

			//put into stack
			this.textureStack[this.texturePointer] = glTex;
			
			//increment for subsequent calls
			this.texturePointer++;
		} 
		//the stack is full.. we need to flush the batch and reset the counter before drawing
		else {
			//flush old batch
			this.flush();

			//clear the stack
			this._resetStack();
			
			//update current index after clearing stack
			this.texturePointer = 1;

			//set first texture...
			this.textureStack[0] = glTex;

			//the index of the texture for this sprite
			cachedIndex = 0;
		}

		//textures have changed, bind the new one
		
	}
	
	//vertex format:
	//	{ x, y, u, v, tex, rgba }
	//texUnit is a vec4 coefficient that specifies the target, where:
	// tex < 1 --> tex 0
	// tex < 2 --> tex 1
	// tex < 3 --> tex 2
	// tex < 4 --> tex 3


	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];

	//tex unit
	this.vertices[this.idx++] = cachedIndex;

	//color
	this.vertices[this.idx++] = verts[off++];

	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];

	//tex unit
	this.vertices[this.idx++] = cachedIndex;

	//color
	this.vertices[this.idx++] = verts[off++];

	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];

	//tex unit
	this.vertices[this.idx++] = cachedIndex;

	//color
	this.vertices[this.idx++] = verts[off++];

	//xy
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];
	//uv
	this.vertices[this.idx++] = verts[off++];
	this.vertices[this.idx++] = verts[off++];

	//tex unit
	this.vertices[this.idx++] = cachedIndex;
	
	//color
	this.vertices[this.idx++] = verts[off++];
};

