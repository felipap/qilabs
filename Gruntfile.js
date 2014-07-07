
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
				options: { spawn: false },
			},
			// // Require.js
			// buildRequirejs: {
			// 	files: ['src/static/js/app/**/*'],
			// 	tasks: ['requirejs'],
			// },
		},

		nodemon: {
			dev: {
				script: 'src/server.js',
				options: {
					args: ['dev'],
					nodeArgs: ['--debug'],
					// watch: ['src'],
					ignore: ['node_modules/**','src/static/**', '/src/static/js/app/components/'],
					// ext: 'js',
					delayTime: 1,

					legacyWatch: true,
					cwd: __dirname,
				}
			},
		},
		requirejs: {
			options: {
				logLevel: 0,
				generateSourceMaps: true,
				optimize: 'uglify2',
				preserveLicenseComments: false,
				mainConfigFile: 'src/static/js/config.js',
				baseUrl: 'src/static/js',
			},
			production: {
				options: {
					removeCombined: true,
					modules: [
						{name: 'views.common'},
						{name: 'views.wall'},
						{name: 'views.profile'},
						{name: 'views.front'},
					]
				}
			}
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
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-coffee');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-react');

	// grunt.registerTask('production', 'lint requirejs:production');
	// grunt.registerTask('development', 'lint requirejs:development');

	// 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
	grunt.registerTask('serve', ['nodemon']);
};
