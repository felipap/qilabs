

var nconf = require('nconf')

nconf.argv().env()

if (nconf.get('NODE_ENV') !== 'production') {
	nconf.file({file: 'app/config/env.json'})
	nconf.set('env', 'development')
} else {
	nconf.set('env', 'production')
}

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
			production: {
				files: { 'assets/css/bundle.css': 'app/static/less/app/snpages.less' },
				options: { compress: true },
				plugins: [
					new (require('less-plugin-autoprefix'))({browsers: ["last 2 versions"]}),
					new (require('less-plugin-clean-css'))({})
				],
			},
		},
		watch: {
			options: {
				atBegin: true,
			},
			less: {
				files: ['app/static/less/**/*.less'],
				tasks: ['less'],
				options: { spawn: true },
			},
		},
		browserify: {
			prod: {
				files: {
					"assets/js/prod.js": "app/static/js/app/app.js",
				},
				options: {
					preBundleCB: function (b) {
						// console.log(arguments)
						b.plugin('minifyify', {
							compressPath: function (p) {
								return require('path').relative(__dirname, p);
							},
							map: '/static/js/prod.map?',
							output: "assets/js/prod.map"
						});
						return b;
					},
				},
			},
			dev: {
				files: {
					"assets/js/dev.js": "app/static/js/app/app.js",
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
					ignore: ['node_modules/**','app/static/', 'assets/**'],
					// watch: ['src'],
					ext: 'js,coffee',
					delay: 0,
					legacyWatch: true,
					cwd: __dirname,
				}
			},
			consumer: {
				script: 'app/consumer.js',
				options: {
					args: ['dev'],
					nodeArgs: ['--debug'],
					ignore: ['node_modules/**','app/static/**', 'app/static/js/app/components/', 'assets/**'],
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
		s3: {
			options: {
				key: nconf.get('AWS_ACCESS_KEY_ID'),
				secret: nconf.get('AWS_SECRET_ACCESS_KEY'),
				bucket: nconf.get('S3_BUCKET'),
				access: 'public-read',
				headers: {
					// Two Year cache policy (1000 * 60 * 60 * 24 * 730)
					"Cache-Control": "max-age=630720000, public",
					"Expires": new Date(Date.now() + 63072000000).toUTCString()
				},
			},
			deploy: {
				options: {
					encodePaths: false,
					maxOperations: 20,
				},
				upload: [
					{
						src: 'assets/css/bundle.css',
						dest: 'static/css/bundle.css',
					},
					{
						src: 'assets/js/prod.js',
						dest: 'static/js/prod.js',
					},
				]
			},
			deployVendor: {
				options: {
					encodePaths: false,
					maxOperations: 20,
				},
				upload: [
					{
						src: 'assets/js/vendor/*',
						dest: 'static/js/vendor/',
					},
				]
			},
			deployFonts: {
				options: {
					encodePaths: false,
					maxOperations: 20,
				},
				upload: [
					{
						src: 'assets/css/fonts.css',
						dest: 'static/css/fonts.css',
					},
				]
			},
			deployIcons: {
				options: {
					encodePaths: false,
					maxOperations: 20,
				},
				upload: [
					{
						src: 'assets/fonts/',
						dest: 'static/fonts/*',
					},
				]
			},
		}
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-s3');

	grunt.registerTask('serve', ['nodemon:server']);
	grunt.registerTask('watchy', ['concurrent:watch']);
};
