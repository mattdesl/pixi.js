
/**
 * An abstract batcher composed of quads (two tris, indexed).
 * 
 * @param {[type]} gl   [description]
 * @param {[type]} size [description]
 */
PIXI.AbstractBatch = function(gl, size)
{
	this.initialize(gl);
	this.size = size || 500;
	
	// 65535 is max index, so 65535 / 6 = 10922.
	if (this.size > 10922)  //(you'd have to be insane to try and batch this much with WebGL)
		throw "Can't have more than 10922 sprites per batch: " + this.size;
	
	//the total number of floats in our batch
	var numVerts = this.size * 4 * this.getVertexSize();
	//the total number of indices in our batch
	var numIndices = this.size * 6;

	//TODO: use properties here
	//current blend mode.. changing it flushes the batch
	this.blendMode = PIXI.blendModes.NORMAL;

	//vertex data
	this.vertices = new Float32Array(numVerts);
	//index data
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

	this.idx = 0;
	this.drawing = false;
};



PIXI.AbstractBatch.totalRenderCalls = 0;


// constructor
PIXI.AbstractBatch.constructor = PIXI.AbstractBatch;




// for subclasses to implement (i.e. extra attribs)
PIXI.AbstractBatch.prototype.getVertexSize = function()
{
	return PIXI.Sprite.VERTEX_SIZE;
};

/** 
 * Begins the sprite batch. Subclasses should then bind shaders,
 * upload projection matrix, and bind textures.
 */
PIXI.AbstractBatch.prototype.begin = function(projection) 
{
	if (this.drawing) 
		throw "batch.end() must be called before begin";
	this.drawing = true;

	var gl = this.gl; 
	projection = projection || PIXI.projection; //TODO: get rid of these statics!

	//disable depth mask
	gl.depthMask(false);

	//premultiplied alpha
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); 

	//bind the element buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
};

PIXI.AbstractBatch.prototype.end = function() 
{
	if (!this.drawing)
		throw "batch.begin() must be called before end";
	if (this.idx > 0)
		this.flush();
	this.drawing = false;

	this.gl.depthMask(true); //reset to default WebGL state
};

/** 
 * Called before rendering to bind new textures and setup
 * vertex attribute pointers. This method does nothing by default.
 */
PIXI.AbstractBatch.prototype._bind = function() 
{
};

PIXI.AbstractBatch.prototype.flush = function() 
{
	if (this.idx===0)
		return;

    var gl = this.gl;
    
    PIXI.AbstractBatch.totalRenderCalls++;

	//bind our vertex buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

	//upload the new data.. we are not changing the size as that may allocate new memory
	gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

	//setup our vertex attributes & binds textures
	//TODO: move this to begin to remove redundant GL calls?
	this._bind();

	//number of sprites in batch
	var numComponents = this.getVertexSize();
	var spriteCount = (this.idx / (numComponents * 4));
 	
 	//draw the sprites
    gl.drawElements(gl.TRIANGLES, spriteCount * 6, gl.UNSIGNED_SHORT, 0);
    
    this.idx = 0;
};

/**
 * Renders a sprite.
 */
PIXI.AbstractBatch.prototype.drawSprite = function(sprite) 
{

};

/**
 * Adds a single set of vertices to this sprite batch (20 floats).
 */
PIXI.AbstractBatch.prototype.drawVertices = function(texture, verts, off) 
{

};

/**
 * Initializes the buffers, replacing the old ones, i.e. on context restoration.
 * Does not delete old buffers -- use destroy() for that.
 * 
 * @method initialize
 */
PIXI.AbstractBatch.prototype.initialize = function(gl)
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
PIXI.AbstractBatch.prototype.destroy = function()
{
	this.vertices = [];
	this.indices = [];
	this.size = this.maxVertices = 0;
	if (this.vertexBuffer !== null)
		this.gl.deleteBuffer(this.vertexBuffer);
	if (this.indexBuffer !== null)
		this.gl.deleteBuffer(this.indexBuffer);
};
