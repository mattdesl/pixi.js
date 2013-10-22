/**
 * @author Mat Groves http://matgroves.com/ @Doormat23
 */

PIXI._defaultFrame = new PIXI.Rectangle(0,0,1,1);

// an instance of the gl context..
// only one at the moment :/
PIXI.gl;

/**
 * the WebGLRenderer is draws the stage and all its content onto a webGL enabled canvas. This renderer
 * should be used for browsers support webGL. This Render works by automatically managing webGLBatchs.
 * So no need for Sprite Batch's or Sprite Cloud's
 * Dont forget to add the view to your DOM or you will not see anything :)
 *
 * @class WebGLRenderer
 * @constructor
 * @param width=0 {Number} the width of the canvas view
 * @param height=0 {Number} the height of the canvas view
 * @param view {Canvas} the canvas to use as a view, optional
 * @param transparent=false {Boolean} the transparency of the render view, default false
 * @param antialias=false {Boolean} sets antialias (only applicable in chrome at the moment)
 *
 */
PIXI.WebGLRenderer = function(width, height, view, transparent, antialias)
{
	// do a catch.. only 1 webGL renderer..

	this.transparent = !!transparent;

	this.width = width || 800;
	this.height = height || 600;

	this.view = view || document.createElement( 'canvas' );
    this.view.width = this.width;
	this.view.height = this.height;

	// deal with losing context..
    var scope = this;
	this.view.addEventListener('webglcontextlost', function(event) { scope.handleContextLost(event); }, false)
	this.view.addEventListener('webglcontextrestored', function(event) { scope.handleContextRestored(event); }, false)

	this.contextOptions = {
		 alpha: this.transparent,
		 antialias: !!antialias, // SPEED UP??
		 premultipliedAlpha:false,
		 stencil:true
    };

	try
 	{
        PIXI.gl = this.gl = this.view.getContext("experimental-webgl",  this.contextOptions);
    }
    catch (e)
    {
    	throw new Error(" This browser does not support webGL. Try using the canvas renderer" + this);
    }

    PIXI.initPrimitiveShader();
    PIXI.initDefaultShader();
    PIXI.initDefaultStripShader();

    PIXI.activateDefaultShader();

    var gl = this.gl;


        

    PIXI.WebGLRenderer.gl = gl;

    this.initializeGL();

    PIXI.projection = new PIXI.Point(400, 300);

    this.resize(this.width, this.height);
    this.contextLost = false;

	this.extras = new PIXI.WebGLExtras(gl);

	if (PIXI.WebGLRenderer.batchMode == PIXI.WebGLRenderer.BATCH_GROUPS)
    	this.stageRenderGroup = new PIXI.WebGLRenderGroup(this.gl, this.extras);
    else {
    	if (PIXI.WebGLRenderer.batchMode == PIXI.WebGLRenderer.BATCH_MULTITEXTURE)
    		this.spriteBatch = new PIXI.WebGLAdvancedBatch(this.gl, PIXI.WebGLRenderer.batchSize);
    	else 
    		this.spriteBatch = new PIXI.WebGLSpriteBatch(this.gl, PIXI.WebGLRenderer.batchSize);
    }
 
    //can simulate context loss in Chrome like so:
    // this.view.onmousedown = function(ev) {
    	// console.dir(this.gl.getSupportedExtensions());
  //   	var ext = (
  //   		gl.getExtension("WEBGL_scompressed_texture_s3tc")
		//   // gl.getExtension("WEBGL_compressed_texture_s3tc") ||
		//   // gl.getExtension("MOZ_WEBGL_compressed_texture_s3tc") ||
		//   // gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc")
		// );
		// console.dir(ext);

    // 	var loseCtx = this.gl.getExtension("WEBGL_lose_context");
    // 	console.log("killing context");
    // 	loseCtx.loseContext();

    // 	setTimeout(function() {
    // 		console.log("restoring context...");
    // 		loseCtx.restoreContext();
    // 	}.bind(this), 1000);
    // }.bind(this);
}

// constructor
PIXI.WebGLRenderer.prototype.constructor = PIXI.WebGLRenderer;

/**
 * A constant defining the BATCH_SIMPLE mode, which simply
 * walks the scene graph and renders as much as we can in the same batch
 * until it's time to flush (state change, texture switch, blend mode, etc).
 * 
 * @attribute SINGLE_BUFFER
 * @readOnly
 * @static
 * @default  0
 * @type {Number}
 */
PIXI.WebGLRenderer.BATCH_SIMPLE = 0;

/**
 * A constant defining the BATCH_GROUPS mode, which tries
 * to merge sprites with similar states to reduce batch flushes
 * and improve performance. However, this doesn't work so well
 * if you have a complex scene with a lot of nested relations,
 * as it leads to many more batches being created.
 * 
 * @attribute BUFFER_GROUPS
 * @readOnly
 * @static
 * @default  1
 * @type {Number}
 */
PIXI.WebGLRenderer.BATCH_GROUPS = 1;

/**
 * A constant defining the BATCH_MULTITEXTURE mode, which 
 * tries to batch up to 4 textures in the same render call using the
 * following technique:
 *
 * http://webglsamples.googlecode.com/hg/sprites/readme.html
 * 
 * @attribute BUFFER_GROUPS
 * @readOnly
 * @static
 * @default  2
 * @type {Number}
 */
PIXI.WebGLRenderer.BATCH_MULTITEXTURE = 2;


/**
 * Sets the batch mode that will be used the next time we initialize a WebGLRenderer,
 * either PIXI.WebGLRenderer.BATCH_SIMPLE, PIXI.WebGLRenderer.BATCH_GROUPS,
 * or PIXI.WebGLRenderer.BATCH_MULTITEXTURE.
 *
 * @attribute batchMode
 * @static 
 * @default PIXI.WebGLRenderer.BATCH_GROUPS 
 * @type {Number}
 */
PIXI.WebGLRenderer.batchMode = PIXI.WebGLRenderer.BATCH_GROUPS;
PIXI.WebGLRenderer.batchSize = 500;
PIXI.WebGLRenderer.throttleTextureUploads = false;

PIXI.WebGLRenderer.prototype._renderStage = function(stage, projection) 
{
	if (PIXI.WebGLRenderer.batchMode == PIXI.WebGLRenderer.BATCH_GROUPS) {
		this.stageRenderGroup.render(this, PIXI.projection);
	} else {
		this.spriteBatch.begin(projection);
		stage._glDraw(this, projection);
		this.spriteBatch.end();
	}
};



/**
 * Gets a new WebGLBatch from the pool (assumes batchMode is groups)
 *
 * @static
 * @method getBatch
 * @return {WebGLBatch}
 * @private
 */
PIXI.WebGLRenderer.getBatch = function()
{
	if(PIXI._batchs.length == 0)
	{
		return new PIXI.WebGLBatch(PIXI.WebGLRenderer.gl);
	}
	else
	{
		return PIXI._batchs.pop();
	}
}

/**
 * Puts a batch back into the pool
 *
 * @static
 * @method returnBatch
 * @param batch {WebGLBatch} The batch to return
 * @private
 */
PIXI.WebGLRenderer.returnBatch = function(batch)
{
	batch.clean();
	PIXI._batchs.push(batch);
}

/**
 * Renders the stage to its webGL view
 *
 * @method render
 * @param stage {Stage} the Stage element to be rendered
 */
PIXI.WebGLRenderer.prototype.render = function(stage)
{
	if(this.contextLost)
		return;


	// if rendering a new stage clear the batchs..
	if(this.__stage !== stage)
	{
		// TODO make this work
		// dont think this is needed any more?
		this.__stage = stage;

		if (PIXI.WebGLRenderer.batchMode == PIXI.WebGLRenderer.BATCH_GROUPS)
			this.stageRenderGroup.setRenderable(stage);
	}

	// TODO not needed now...
	// update children if need be
	// best to remove first!
	/*for (var i=0; i < stage.__childrenRemoved.length; i++)
	{
		var group = stage.__childrenRemoved[i].__renderGroup
		if(group)group.removeDisplayObject(stage.__childrenRemoved[i]);
	}*/

	// update any textures
	PIXI.WebGLRenderer.updateTextures();

	// update the scene graph
	PIXI.visibleCount++;
	stage.updateTransform();

	var gl = this.gl;

	// -- Does this need to be set every frame? -- //
 	gl.colorMask(true, true, true, this.transparent);
	gl.viewport(0, 0, this.width, this.height);

  	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	gl.clearColor(stage.backgroundColorSplit[0],stage.backgroundColorSplit[1],stage.backgroundColorSplit[2], !this.transparent);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// HACK TO TEST
	//PIXI.projectionMatrix = this.projectionMatrix;
		
	//renders batches with correct mode
	this._renderStage(stage, PIXI.projection);
	
	// interaction
	// run interaction!
	if(stage.interactive)
	{
		//need to add some events!
		if(!stage._interactiveEventsAdded)
		{
			stage._interactiveEventsAdded = true;
			stage.interactionManager.setTarget(this);
		}
	}

	// after rendering lets confirm all frames that have been uodated..
	if(PIXI.Texture.frameUpdates.length > 0)
	{
		for (var i=0; i < PIXI.Texture.frameUpdates.length; i++)
		{
		  	PIXI.Texture.frameUpdates[i].updateFrame = false;
		};

		PIXI.Texture.frameUpdates = [];
	}
}

/**
 * Updates the textures loaded into this webgl renderer
 *
 * @static
 * @method updateTextures
 * @private
 */
PIXI.WebGLRenderer.updateTextures = function()
{
	//TODO break this out into a texture manager...
	
	//throttle texture uploads
	if (PIXI.WebGLRenderer.throttleTextureUploads) {
		if (PIXI.texturesToUpdate.length) {
			var tex = PIXI.texturesToUpdate.shift();
			PIXI.WebGLRenderer.updateTexture(tex);
		}
	} else {
		for (var i=0; i < PIXI.texturesToUpdate.length; i++) {
			PIXI.WebGLRenderer.updateTexture(PIXI.texturesToUpdate[i]);
		}
		PIXI.texturesToUpdate = [];
	}
	
	//texture deletes will be fast, so do em all in one.
	for (var i=0; i < PIXI.texturesToDestroy.length; i++) PIXI.WebGLRenderer.destroyTexture(PIXI.texturesToDestroy[i]);
	PIXI.texturesToDestroy = [];
};

/**
 * Updates a loaded webgl texture
 *
 * @static
 * @method updateTexture
 * @param texture {Texture} The texture to update
 * @private
 */
PIXI.WebGLRenderer.updateTexture = function(texture)
{
	//TODO break this out into a texture manager...
	var gl = PIXI.gl;

	if(!texture._glTexture)
	{
		texture._glTexture = gl.createTexture();
	}

	if(texture.hasLoaded)
	{ 
		gl.bindTexture(gl.TEXTURE_2D, texture._glTexture);
	 	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	 	
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.source);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		// reguler...

		if(!texture._powerOf2)
		{
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		}
		else
		{
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		}

		gl.bindTexture(gl.TEXTURE_2D, null);
	}
}

/**
 * Destroys a loaded webgl texture
 *
 * @method destroyTexture
 * @param texture {Texture} The texture to update
 * @private
 */
PIXI.WebGLRenderer.destroyTexture = function(texture)
{
	//TODO break this out into a texture manager...
	var gl = PIXI.gl;

	if(texture._glTexture)
	{
		gl.deleteTexture(gl.TEXTURE_2D, texture._glTexture);
		texture._glTexture = null;
	}
}

/**
 * resizes the webGL view to the specified width and height
 *
 * @method resize
 * @param width {Number} the new width of the webGL view
 * @param height {Number} the new height of the webGL view
 */
PIXI.WebGLRenderer.prototype.resize = function(width, height)
{
	this.width = width;
	this.height = height;

	this.view.width = width;
	this.view.height = height;

	this.gl.viewport(0, 0, this.width, this.height);

	//var projectionMatrix = this.projectionMatrix;

	PIXI.projection.x =  this.width/2;
	PIXI.projection.y =  this.height/2;

//	projectionMatrix[0] = 2/this.width;
//	projectionMatrix[5] = -2/this.height;
//	projectionMatrix[12] = -1;
//	projectionMatrix[13] = 1;
}

/**
 * Init the default GL states.
 */
PIXI.WebGLRenderer.prototype.initializeGL = function()
{
	var gl = this.gl;
   	gl.disable(gl.DEPTH_TEST);
   	gl.disable(gl.CULL_FACE);

    gl.enable(gl.BLEND);

    //TODO: investigate -- why wouldn't we write to alpha channel?
    gl.colorMask(true, true, true, this.transparent);
	gl.viewport(0, 0, this.width, this.height);
}


/**
 * Handles a lost webgl context
 *
 * @method handleContextLost
 * @param event {Event}
 * @private
 */
PIXI.WebGLRenderer.prototype.handleContextLost = function(event)
{
	event.preventDefault();
	this.contextLost = true;

}

/**
 * Handles a restored webgl context
 *
 * @method handleContextRestored
 * @param event {Event}
 * @private
*/
PIXI.WebGLRenderer.prototype.handleContextRestored = function(event)
{
	this.gl = this.view.getContext("experimental-webgl", this.contextOptions);
    


    //static is ugly.. will need to refactor to get rid of this kind of stuff
    PIXI.gl = this.gl;

    //if anything is going to get updated next frame, clear its GL texture
    for (var i=0; i<PIXI.texturesToUpdate.length; i++) {
    	PIXI.texturesToUpdate[i].baseTexture._glTexture = null;
	}
    PIXI.texturesToUpdate = [];	
    PIXI.texturesToDestroy = []; //will already be deleted due to context loss

    //This will probably change when TextureCache gets cleaned up to use multiple 
    //contexts/canvases
	for(var key in PIXI.TextureCache)
	{
    	var texture = PIXI.TextureCache[key].baseTexture;
    	texture._glTexture = null;
    	PIXI.WebGLRenderer.updateTexture(texture);
	}


    PIXI.initPrimitiveShader();
    PIXI.initDefaultShader();
    PIXI.initDefaultStripShader();

    this.initializeGL();

	if (this.stageRenderGroup) {
		this.stageRenderGroup.handleContextRestored(this.gl);
	}

	PIXI._restoreBatchs(this.gl);

	this.contextLost = false;
}
