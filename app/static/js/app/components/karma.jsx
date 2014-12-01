/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var Backbone = require('backbone')
var Favico = require('favico')
var PopoverList = require('./parts/popover_list.jsx')

Backbone.$ = $

var Points = {
	'PostUpvote': 10,
};

var Handlers = {
	PostUpvote: function (item) {
		var obj = {};
		if (item.instances.length === 0) {
			return null;
		} else if (item.instances.length === 1) {
			var name = item.instances[0].name.split(' ')[0];
			// return name+" votou na sua publicação '"+item.name+"'"
			obj.html = '<i class="icon-favorite"></i> '+name+" votou"
		} else {
			var names = _.map(item.instances.slice(0, item.instances.length-1),
				function (i) {
					return i.name.split(' ')[0];
				}).join(', ')
			names += " e "+(item.instances[item.instances.length-1].name.split(' '))[0]+" ";
			obj.html = '<i class="icon-favorite"></i> '+names+" votaram";
		}
		obj.path = item.path;
		return obj;
	}
}

/**
 * React component the PopoverList items.
 */

var KarmaItem = React.createClass({
	componentWillMount: function () {
 		this.kdata = Handlers[this.props.model.get('type')](this.props.model.attributes);
	},
	handleClick: function () {
		if (this.kdata.path) {
			window.location.href = this.kdata.path;
		}
	},
	render: function () {
		if (!this.kdata) {
			return null;
		}

		var ptype = this.props.model.get('object').postType;

		var date = window.calcTimeFrom(this.props.model.get('updated_at'));
		var delta = Points[this.props.model.get('type')]*this.props.model.get('multiplier');
		// <time>{date}</time>
		return (
			<li onClick={this.handleClick} className="hasThumb">
				<div className="left">
					<div className="delta">
						+{delta}
					</div>
				</div>
				<div className="right body">
					<span className="name">{this.props.model.get('object').name}</span>
					<span className="read"
						dangerouslySetInnerHTML={{__html: this.kdata.html}}/>
				</div>
			</li>
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
}));

var KarmaHeader = React.createClass({
	render: function () {
		return (
			<div className="popover-header">
				PONTOS
			</div>
		)
	},
})


/**
 * Export and also serve as jquery plugin.
 */

module.exports = $.fn.ikarma = function (opts) {
	if (this.data('ikarma'))
		return;
	this.data('ikarma', true);

	// Do it.
	var all_seen = false
	var pl = PopoverList(this[0], kl, KarmaItem, KarmaHeader, {
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
	};

	kl.fetch({
		success: function (collection, response, options) {
			updateKarma(collection.jarma)
		}.bind(this),
		error: function (collection, response, options) {
			app.flash.alert("Falha ao obter notificações.")
		}.bind(this),
	})
}