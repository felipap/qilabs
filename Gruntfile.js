
module.exports = function(grunt) {
	'use strict';

	// 1. All configuration goes here 
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		version: grunt.file.readJSON('package.json').version,
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= version %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
			' Licensed <%= pkg.license %> */\n',
		
		less: {
			dist: {
				files: { // change to singular?
					'src/static/css/snpages.min.css':'src/static/less/views/snpages.less',
				},
				options: { cleancss: true },
			},
		},
		
		coffee: {
			options: {
				bare: true,
			},
			glob_to_multiple: {
				expand: true,
				src: ['src/**/*.coffee','tasks/**/*.coffee'],
				ext: '.js',
			}
		},

		watch: {
			options: {
				// livereload: true,
				// interrupt: true,
				atBegin: true,
			},
			// CoffeeScript
			coffee: {
				files: ['**/*.coffee'],
				tasks: ['coffee'],
				options: { spawn: true },
			},
			// React.js
			react: {
				files: ['src/static/js/**/*.jsx'],
				tasks: ['react'],
			},
			// Less
			css: {
				files: ['src/static/less/**/*.less'],
				tasks: ['less'],
				options: { spawn: true },
			},
		},

		browserify: {
			lib: {
				files: { "src/static/js/bundle.min.js":	"src/static/js/app/views/wall.js", },
				options: {
					preBundleCB: function (b) {
						b.plugin('minifyify', {map: 'bundle.min.map.json', output: "src/static/js/bundle.min.map.json"});
						return b;
					},
				},
			},
			options: {
				watch: true,
				keepAlive: true,
				// debug: true,
			}
		},

		nodemon: {
			dev: {
				script: 'src/server.js',
				options: {
					args: ['dev'],
					nodeArgs: ['--debug'],
					ignore: ['node_modules/**','src/static/**', '/src/static/js/app/components/'],
					// watch: ['src'],
					// ext: 'js',
					delayTime: 1,
					legacyWatch: true,
					cwd: __dirname,
				}
			},
		},

		react: {
			files: {
				expand: true,
				cwd: 'src/static/js/app',
				src: ['**/*.jsx'],
				dest: 'src/static/js/app',
				ext: '.js'
			}
		},

		concurrent: {
			dev: {
				tasks: ['nodemon', 'watch'], // +? 'node-inspector'
				options: {
					logConcurrentOutput: true
				}
			}
		},
	});

	// 3. Where we tell Grunt we plan to use this plug-in.
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-coffee');
	// grunt.loadNpmTasks('grunt-iced-coffee');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-react');

	// 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
	grunt.registerTask('serve', ['nodemon']);
};
