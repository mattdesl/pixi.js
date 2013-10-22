## CHANGES

This fork introduces some major changes to PIXI's WebGL backend.

- TilingSprite includes a "flipX" and "flipY" feature to flip horizontally/vertically. This is added to all backends/batch modes.
- Context loss fixes. See [here](https://github.com/GoodBoyDigital/pixi.js/pull/357).
- Uses concat_sourcemap for better debugging. All examples reference the same build to improve build time and unify the distribution of PIXI.
- Instead of uploading all textures at once (which can cause drastic drops in FPS), now they can be throttled one per frame. This is disabled by default; use `PIXI.WebGLRenderer.throttleTextureUploads = true`
- Custom sprite batcher:
    - A sprite and its children will be culled if `visible` is false or if the sprite is not within the stage (optional). This greatly improves performance.
    - Previously TilingSprite was only resizable in the canvas backend. The custom sprite batcher now supports resizing TilingSprite on the fly.
    - The custom sprite batcher no longer needs a separate shader/batch to render a tiling sprite. They are all rendered in the same batch as the rest of your Sprites. This should reduce state switches and improve performance. 

Example:
```javascript
this.stage = new PIXI.Stage( ... );

//enable single buffer batching
PIXI.WebGLRenderer.batchMode = PIXI.WebGLRenderer.BATCH_SIMPLE;

//max # of sprites in batch.. default is 500.. play around with this
PIXI.WebGLRenderer.batchSize = 400; 

//Optionally "throttle" texture uploads. By default, this is disabled
//Since texture uploads can stall GL rendering we don't want to do too many per frame
PIXI.WebGLRenderer.throttleTextureUploads = true; 

//renderer...
this.renderer = new PIXI.autoDetectRenderer( sceneWidth, sceneHeight, ... );

//Optionally we can add in culling for more optimizations.
//This will not render a sprite to GPU if it's outside of the given bounds, even if "sprite.visible = true"
//If we leave cullingRect as undefined then culling will be disabled
this.stage.cullingRect = new PIXI.Rectangle(0, 0, sceneWidth, sceneHeight);
```

I also wrote another batcher that is slightly different from the first. Instead of flushing the batch for every texture switch, it tries to render up to 4 textures in the same batch. In a typical scene in our game this has reduced render calls per frame from ~40 to ~5. The technique is described here:
http://webglsamples.googlecode.com/hg/sprites/readme.html

Instead of setting mode to `BATCH_SIMPLE`, we can set it to `BATCH_MULTITEXTURE` to try out the new rendering technique.

You can debug the render calls per frame with `PIXI.AbstractBatch.totalRenderCalls`:
```javascript

PIXI.AbstractBatch.totalRenderCalls = 0; //reset to zero

renderer.render(stage);

console.log( "Render Calls:", PIXI.AbstractBatch.totalRenderCalls ); //display render calls for this frame
```

Pixi Renderer
=============

![pixi.js logo](http://www.goodboydigital.com/pixijs/logo_small.png)

#### JavaScript 2D Renderer ####

The aim of this project is to provide a fast lightweight 2D library that works
across all devices. The Pixi renderer allows everyone to enjoy the power of
hardware acceleration without prior knowledge of webGL. Also its fast.

If you’re interested in pixi.js then feel free to follow me on twitter
([@doormat23](https://twitter.com/doormat23)) and I will keep you posted!  And
of course check back on [our site](<http://www.goodboydigital.com/blog/>) as
any breakthroughs will be posted up there too!

### Demos ###

- [Run pixi run](<http://www.goodboydigital.com/runpixierun/>)

- [Fight for Everyone](<http://www.theleisuresociety.co.uk/fightforeveryone>)

- [Flash vs HTML](<http://flashvhtml.com>)

- [Bunny Demo](<http://www.goodboydigital.com/pixijs/bunnymark>)

- [Render Texture Demo](<http://www.goodboydigital.com/pixijs/examples/11/>)

- [Primitives Demo](<http://www.goodboydigital.com/pixijs/examples/13/>)

- [Masking Demo](<http://www.goodboydigital.com/pixijs/examples/14/>)

- [Interaction Demo](<http://www.goodboydigital.com/pixijs/examples/6/>)

- [photonstorm Balls Demo](<http://gametest.mobi/pixi/balls/>)

- [photonstorm Morph Demo](<http://gametest.mobi/pixi/morph/>)

Thanks to [@photonstorm](https://twitter.com/photonstorm) for providing those
last 2 examples and allowing us to share the source code :)

### Docs ###

[Documentation can be found here](<http://www.goodboydigital.com/pixijs/docs/>)

### Resources ###

[Tutorials and other helpful bits](<https://github.com/GoodBoyDigital/pixi.js/wiki/Resources>)

[Pixi.js forum](<http://www.html5gamedevs.com/forum/15-pixijs/>)


### Road Map ###

* Create a Typescript definition file for Pixi.js
* Implement Filters (currently being worked on by @GoodBoyDigital)
* Implement Flash animation to pixi
* Update Loader so that it support XHR2 if it is available
* Improve the Documentation of the Project
* Create an Asset Loader Tutorial
* Create a MovieClip Tutorial
* Create a small game Tutorial

### Contribute ###

Want to be part of the pixi.js project? Great! All are welcome! We will get there quicker together :)
Whether you find a bug, have a great feature request or you fancy owning a task from the road map above feel free to get in touch.

### How to build ###

PixiJS is build with Grunt. If you don't already have this, go install Node and NPM then install the Grunt Command Line.

```
$> npm install -g grunt-cli
```

Then, in the folder where you have downloaded the source, install the build dependencies using npm:

```
$> npm install
```

Then build:

```
$> grunt
```

This will create a minified version at bin/pixi.js and a non-minified version at bin/pixi.dev.js.

It also copies the non-minified version to the examples.

### Current features ###

- WebGL renderer (with automatic smart batching allowing for REALLY fast performance)
- Canvas renderer (Fastest in town!)
- Full scene graph
- Super easy to use API (similar to the flash display list API)
- Support for texture atlases
- Asset loader / sprite sheet loader
- Auto-detect which renderer should be used
- Full Mouse and Multi-touch Interaction
- Text
- BitmapFont text
- Multiline Text
- Render Texture
- Spine support
- Primitive Drawing
- Masking

### Coming soon ###

- Filters ( wip : [storm brewing](<http://www.goodboydigital.com/pixijs/storm/>) )


### Coming later ###

- Awesome Post processing effects

### Usage ###

```javascript

	// You can use either PIXI.WebGLRenderer or PIXI.CanvasRenderer
	var renderer = new PIXI.WebGLRenderer(800, 600);

	document.body.appendChild(renderer.view);

	var stage = new PIXI.Stage;

	var bunnyTexture = PIXI.Texture.fromImage("bunny.png");
	var bunny = new PIXI.Sprite(bunnyTexture);

	bunny.position.x = 400;
	bunny.position.y = 300;

	bunny.scale.x = 2;
	bunny.scale.y = 2;

	stage.addChild(bunny);

	requestAnimationFrame(animate);

	function animate() {
		bunny.rotation += 0.01;

		renderer.render(stage);

		requestAnimationFrame(animate);
	}
```

This content is released under the (http://opensource.org/licenses/MIT) MIT License.
