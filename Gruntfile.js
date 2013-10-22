module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-concat-sourcemap');

    var root = 'src/pixi/',
        debug = 'bin/pixi.dev.js',
        srcFiles = [
            '<%= dirs.src %>/Intro.js',
            '<%= dirs.src %>/Pixi.js',
            '<%= dirs.src %>/core/Point.js',
            '<%= dirs.src %>/core/Rectangle.js',
            '<%= dirs.src %>/core/Polygon.js',
            '<%= dirs.src %>/core/Circle.js',
            '<%= dirs.src %>/core/Ellipse.js',
            '<%= dirs.src %>/core/Matrix.js',
            '<%= dirs.src %>/display/DisplayObject.js',
            '<%= dirs.src %>/display/DisplayObjectContainer.js',
            '<%= dirs.src %>/display/Sprite.js',
            '<%= dirs.src %>/display/MovieClip.js',
            '<%= dirs.src %>/filters/FilterBlock.js',
            '<%= dirs.src %>/text/Text.js',
            '<%= dirs.src %>/text/BitmapText.js',
            '<%= dirs.src %>/InteractionManager.js',
            '<%= dirs.src %>/display/Stage.js',
            '<%= dirs.src %>/utils/Utils.js',
            '<%= dirs.src %>/utils/EventTarget.js',
            '<%= dirs.src %>/utils/Detector.js',
            '<%= dirs.src %>/utils/Polyk.js',
            '<%= dirs.src %>/time/Time.js',
            '<%= dirs.src %>/renderers/webgl/WebGLShaders.js',
            '<%= dirs.src %>/renderers/webgl/WebGLGraphics.js',
            '<%= dirs.src %>/renderers/webgl/WebGLExtras.js',
            '<%= dirs.src %>/renderers/webgl/WebGLRenderer.js',
            '<%= dirs.src %>/renderers/webgl/WebGLBatch.js',
            '<%= dirs.src %>/renderers/webgl/utils/AbstractBatch.js',
            '<%= dirs.src %>/renderers/webgl/utils/WebGLSpriteBatch.js',
            '<%= dirs.src %>/renderers/webgl/utils/WebGLAdvancedBatch.js',
            '<%= dirs.src %>/renderers/webgl/WebGLRenderGroup.js',
            '<%= dirs.src %>/renderers/canvas/CanvasRenderer.js',
            '<%= dirs.src %>/renderers/canvas/CanvasGraphics.js',
            '<%= dirs.src %>/primitives/Graphics.js',
            '<%= dirs.src %>/extras/Strip.js',
            '<%= dirs.src %>/extras/Rope.js',
            '<%= dirs.src %>/extras/TilingSprite.js',
            '<%= dirs.src %>/extras/Spine.js',
            '<%= dirs.src %>/extras/CustomRenderable.js',
            '<%= dirs.src %>/textures/BaseTexture.js',
            '<%= dirs.src %>/textures/Texture.js',
            '<%= dirs.src %>/textures/RenderTexture.js',
            '<%= dirs.src %>/loaders/AssetLoader.js',
            '<%= dirs.src %>/loaders/JsonLoader.js',
            '<%= dirs.src %>/loaders/SpriteSheetLoader.js',
            '<%= dirs.src %>/loaders/ImageLoader.js',
            '<%= dirs.src %>/loaders/BitmapFontLoader.js',
            '<%= dirs.src %>/loaders/SpineLoader.js',
            '<%= dirs.src %>/Outro.js'
        ], banner = [
            '/**',
            ' * @license',
            ' * <%= pkg.name %> - v<%= pkg.version %>',
            ' * Copyright (c) 2012, Mat Groves',
            ' * <%= pkg.homepage %>',
            ' *',
            ' * Compiled: <%= grunt.template.today("yyyy-mm-dd") %>',
            ' *',
            ' * <%= pkg.name %> is licensed under the <%= pkg.license %> License.',
            ' * <%= pkg.licenseUrl %>',
            ' */',
            ''
        ].join('\n');


    var srcFilesAMD = srcFiles.concat();
    srcFilesAMD[ 0 ] = '<%= dirs.src %>/IntroAMD.js';
    srcFilesAMD[ srcFilesAMD.length - 1 ] = '<%= dirs.src %>/OutroAMD.js';


    grunt.initConfig({
        pkg : grunt.file.readJSON('package.json'),
        dirs: {
            build: 'bin',
            docs: 'docs',
            examples: 'examples',
            src: 'src/pixi',
            test: 'test'
        },
        files: {
            srcBlob: '<%= dirs.src %>/**/*.js',
            testBlob: '<%= dirs.test %>/unit/**/*.js',
            build: '<%= dirs.build %>/pixi.dev.js',
            buildMin: '<%= dirs.build %>/pixi.js',
            buildAMD: '<%= dirs.build %>/pixi.amd.dev.js',
            buildAMDMin: '<%= dirs.build %>/pixi.amd.js'
        },
        concat: {
            options: {
                banner: banner
            },
            dist: {
                src: srcFiles,
                dest: '<%= files.build %>'
            }
        },
        concat_sourcemap: {
            dev: {
                files: {
                    '<%= files.build %>': srcFiles
                }
            },
            devAMD: {
                src: srcFilesAMD,
                dest: '<%= files.buildAMD %>'  
            }
        },
        jshint: {
            beforeconcat: srcFiles,
            test: ['<%= files.testBlob %>'],
            options: {
                asi: true,
                smarttabs: true
            }
        },
        uglify: {
            options: {
                banner: banner
            },
            dist: {
                src: '<%= files.build %>',
                dest: '<%= files.buildMin %>'
            },
            distAMD: {
                src: '<%= files.buildAMD %>',
                dest: '<%= files.buildAMDMin %>'
            }
        },
        distribute: {
            examples: [
                'examples/example 1 - Basics',
                'examples/example 2 - SpriteSheet',
                'examples/example 3 - MovieClip',
                'examples/example 4 - Balls',
                'examples/example 5 - Morph',
                'examples/example 6 - Interactivity',
                'examples/example 7 - Transparent Background',
                'examples/example 8 - Dragging',
                'examples/example 9 - Tiling Texture',
                'examples/example 10 - Text',
                'examples/example 11 - RenderTexture',
                'examples/example 12 - Spine',
                'examples/example 13 - Graphics',
                'examples/example 14 - Masking'
            ]
        },
        connect: {
            qunit: {
                options: {
                    port: grunt.option('port-test') || 9002,
                    base: './'
                }
            },
            test: {
                options: {
                    port: grunt.option('port-test') || 9002,
                    base: './',
                    keepalive: true
                }
            }
        },
        qunit: {
            all: {
                options: {
                    urls: ['http://localhost:' + (grunt.option('port-test') || 9002) + '/test/index.html']
                }
            }
        },
        yuidoc: {
            compile: {
                name: '<%= pkg.name %>',
                description: '<%= pkg.description %>',
                version: '<%= pkg.version %>',
                url: '<%= pkg.homepage %>',
                logo: '<%= pkg.logo %>',
                options: {
                    paths: '<%= dirs.src %>',
                    outdir: '<%= dirs.docs %>'
                }
            }
        },
        watch: {
            dev: {
                files: ['src/**/*.js', 'examples/**/*.html'],
                tasks: ['build'],
                options: {
                    livereload: true
                }
            }
        }
     });
    grunt.registerTask('build-concat', ['concat_sourcemap']);
     
    grunt.registerTask('default', ['build-concat', 'uglify']);
    grunt.registerTask('build', ['build-concat', 'uglify']);
    grunt.registerTask('test', ['build', 'connect:qunit', 'qunit']);
    grunt.registerTask('docs', ['yuidoc']);

}