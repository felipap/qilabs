/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var Backbone = require('backbone')
var Favico = require('favico')
var PopoverList = require('./parts/popover_list.js')

Backbone.$ = $

var Points = {
	'PostUpvote': 10
};

var Handlers = {
	PostUpvote: function (item) {
		var obj = {};
		if (item.instances.length === 1) {
			var name = item.instances[0].name.split(' ')[0];
			// return name+" votou na sua publicação '"+item.name+"'"
			obj.html = name+" votou"
		} else {
			var names = _.map(item.instances.slice(0, item.instances.length-1),
				function (i) {
					return i.name.split(' ')[0];
				}).join(', ')
			names += " e "+(item.instances[item.instances.length-1].name.split(' '))[0]+" ";
			obj.html = names+" votaram";
		}
		return obj;
	}
}

/**
 * React component the PopoverList items.
 */

var KarmaItem = React.createClass({displayName: 'KarmaItem',
	componentWillMount: function () {
 		this.kdata = Handlers[this.props.model.get('type')](this.props.model.attributes);
	},
	handleClick: function () {
		if (this.kdata.path) {
			window.location.href = this.kdata.path;
		}
	},
	render: function () {
		var ptype = this.props.model.get('object').postType;
		if (ptype) {
			var icon = (
				React.DOM.i( {className:ptype=='Note'?"icon-file-text":"icon-chat3"})
			);
		}

		var date = window.calcTimeFrom(this.props.model.get('updated_at'));
		var delta = Points[this.props.model.get('type')]*this.props.model.get('multiplier');
		// <time>{date}</time>
		return (
			React.DOM.li( {onClick:this.handleClick}, 
				React.DOM.div( {className:"left"}, 
					React.DOM.div( {className:"delta"}, 
						"+",delta
					)
				),
				React.DOM.div( {className:"right body"}, 
					React.DOM.span( {className:"name"}, icon, " ", this.props.model.get('object').name),
					React.DOM.span( {className:"read",
						dangerouslySetInnerHTML:{__html: this.kdata.html}})
				)
			)
		);
	},
});

/**
 * Backbone collection for karma items.
 * Overrides default parse method to calculate seen attribute for each item.
 */

var kl = new (Backbone.Collection.extend({
	url: '/api/me/karma',
	parse: function (response, options) {
		this.last_seen = new Date(window.user.meta.last_seen_notification || 0);
		this.karma = response.karma;
		var all = Backbone.Collection.prototype.parse.call(this, response.items, options);
		return _.map(response.items, function (i) {
			i.seen = i.updated_at < this.last_seen;
			return i;
		}.bind(this));
	},
}))

/**
 * Export and also serve as jquery plugin.
 */

module.exports = $.fn.ikarma = function (opts) {
	if (this.data('ikarma'))
		return;
	this.data('ikarma', true);

	// Do it.
	var all_seen = false
	var pl = PopoverList(this[0], kl, KarmaItem, {
		onClick: function () {
			// // Check cookies for last fetch
			// if (!all_seen) {
			// 	all_seen = true
			// 	$.post('/api/me/karma/see');
			// }
		},
		className: 'karma-list',
	})

	var updateKarma = function (num) {
		$('[data-info=user-karma]').html(num)
		// $('[data-info=unseen-notifs]').addClass(num?'nonzero':'zero')
		// if (num) {
		// 	this.addClass('active');
		// } else {
		// 	this.removeClass('active');
		// }
	}.bind(this);

	kl.fetch({
		success: function (collection, response, options) {
			updateKarma(collection.jarma)
		}.bind(this),
		error: function (collection, response, options) {
			app.flash.alert("Falha ao obter notificações.")
		}.bind(this),
	})
}