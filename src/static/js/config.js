
requirejs.config({
	dir: 	'../buildjs',
	baseUrl:'/static/js', // Override this inside grunt. Must be '.' for r.js.

	paths: {
		'common':			'app/common',
		'plugins':			'app/plugins',
		// App
		'views.common':		'app/views/common',
		'views.wall':		'app/views/wall',
		'views.tag':		'app/views/tag',
		'views.profile':	'app/views/profile',
		'views.config':		'app/views/config',
		'views.front':		'app/views/front',
		// In-app pages
		'pages.notifications': 	'app/pages/notifications',
		'pages.follows': 		'app/pages/follows',
		'pages.postView': 		'app/pages/postView',
		// Components
		'components.postForm': 	'app/components/postForm',
		'components.postViews':	'app/components/postViews',
		'components.stream':	'app/components/stream',
		'components.bell':		'app/components/bell',
		'components.flash':		'app/components/flash',
		'components.cards':		'app/components/wall',
		'components.postModels':'app/components/postModels',
		// Third-party
		'jquery':				'vendor/jquery-2.0.3.min',
		'bootstrap':			'vendor/bootstrap-3.0.0.min',
		'underscore':			'vendor/underscore-1.5.1.min',
		'modernizr':			'vendor/modernizr-2.6.2.min',
		'bloodhound': 			'vendor/bloodhound.min',
		'typeahead-bundle': 	'vendor/typeahead.bundle.min',
		'typeahead': 			'vendor/typeahead.jquery.min',
		'backbone':				'vendor/backbone-1.1.2.min',
		'react':				'vendor/react-addons-0.10.0',
		'react-addons':			'vendor/react-addons-0.10.0',
		'medium-editor': 		'vendor/medium-editor',
		'bootstrap.tooltip':	'vendor/bootstrap/tooltip',
		'bootstrap.dropdown':	'vendor/bootstrap/dropdown',
		'bootstrap.popover':	'vendor/bootstrap/popover',

	},
	shim: {
		'bootstrap.tooltip': { deps: ['jquery'] },
		'bootstrap.dropdown': { deps: ['jquery'] },
		'bootstrap.popover': { deps: ['jquery', 'bootstrap.tooltip'] },
		'typeahead': { deps: ['jquery'] },
		'medium-editor': { deps: ['vendor/addons/medium-editor-insert-images-modified'] },
		'vendor/addons/medium-editor-insert-plugin.min': { deps: ['jquery', 'vendor/addons/medium-editor.min'] },
		'vendor/addons/medium-editor-insert-images-modified': { deps: ['vendor/addons/medium-editor-insert-plugin.min'] },
		'vendor/addons/medium-editor.min': { deps: ['jquery'] },
		'typeahead-bundle': { deps: ['jquery'] },
		'underscore': { exports: '_' },
		'bootstrap' : { deps: ['jquery'] },
		'backbone'	: { exports: 'Backbone', deps: ['underscore', 'jquery']},
	}
});
