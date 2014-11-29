
module.exports = function (grunt) {
	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		version: grunt.file.readJSON('package.json').version,
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= version %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
			' Licensed <%= pkg.license %> */\n',

		less: {
			dist: {
				files: { 'assets/css/bundle.css': 'src/static/less/app/snpages.less' },
				options: { cleancss: true },
			},
		},
		watch: {
			options: {
				// livereload: true,
				// interrupt: true,
				atBegin: true,
			},
			less: {
				files: ['src/static/less/**/*.less'],
				tasks: ['less'],
				options: { spawn: true },
			},
			// livereload: {
			// 	files: ['*.html', '*.php', 'js/**/*.{js,json}', 'css/*.css','img/**/*.{png,jpg,jpeg,gif,webp,svg}'],
			// 	options: {
			// 		livereload: true
			// 	}
			// }
		},
		browserify: {
			prod: {
				files: {
					"assets/js/bundle.js": "src/static/js/app/app.js",
				},
				options: {
					preBundleCB: function (b) {
						// console.log(arguments)
						b.plugin('minifyify', {
							compressPath: function (p) {
								return require('path').relative(__dirname, p);
							},
							map: '/static/js/bundle.map?',
							output: "assets/js/bundle.map"
						});
						return b;
					},
				},
			},
			dev: {
				files: {
					"assets/js/devbundle.js": "src/static/js/app/app.js",
				},
			},
			options: {
				transform: [ require('grunt-react').browserify ],
				watch: true,
				keepAlive: true,
				debug: true,
			}
		},
		nodemon: {
			server: {
				script: 'master.js',
				options: {
					args: ['dev'],
					nodeArgs: ['--debug'],
					ignore: ['node_modules/**','src/static/', 'assets/**'],
					// watch: ['src'],
					ext: 'js,coffee',
					delay: 0,
					legacyWatch: true,
					cwd: __dirname,
				}
			},
			consumer: {
				script: 'src/consumer.js',
				options: {
					args: ['dev'],
					nodeArgs: ['--debug'],
					ignore: ['node_modules/**','src/static/**', 'src/static/js/app/components/', 'assets/**'],
					// watch: ['src'],
					// ext: 'js',
					delay: 1,
					legacyWatch: true,
					cwd: __dirname,
				}
			},
		},
		concurrent: {
			server: {
				tasks: ['nodemon:server', 'nodemon:consumer']
			},
			watch: {
				tasks: ['browserify:dev', 'watch'],
				options: {
					logConcurrentOutput: true
				}
			}
		},
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-nodemon');

	grunt.registerTask('serve', ['nodemon:server']);
	grunt.registerTask('watchy', ['concurrent:watch']);
};
