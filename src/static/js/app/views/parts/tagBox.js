/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')

module.exports = React.createClass({displayName: 'exports',
	getInitialState: function () {
		if (this.props.lab) {
			if (this.props.lab in pageMap) {
				return {
					disabled: false,
					placeholder: "Tags relacionadas a "+pageMap[this.props.lab].name,
				};
			} else {
				console.warn("Invalid lab "+this.props.lab);
			}
		}
		return {
			disabled: true,
			placeholder: "Selecione primeiro uma página para postar.",
		};
	},

	getValue: function () {
		return this.refs.select.getDOMNode().selectize.getValue();
	},

	changeLab: function (lab) {
		this.props.lab = lab;
		var selectize = this.refs.select.getDOMNode().selectize;
		selectize.clearOptions();
		var tags;
		if ((tags = this.getSubtags()) && tags.length) {
			for (var i=0; i<tags.length; ++i) {
				selectize.addOption(tags[i]);
			}
		}
		selectize.clear();
		selectize.refreshOptions(false);
		console.log(pageMap, lab)
		$(this.getDOMNode()).find('.selectize-input input').attr('placeholder',
			"Tags relacionadas a "+pageMap[lab].name );
	},

	getSubtags: function () {
		var lab = this.props.lab;
		if (lab && pageMap[lab]) {
			var tags = _.clone(pageMap[lab].children || {});
			for (var child in tags)
			if (tags.hasOwnProperty(child)) {
				tags[child].value = child;
			}
			return _.toArray(tags);
		}
		return null;
	},

	componentDidMount: function () {
		var options = this.getSubtags();

		if (options === null) {
			this.setState({ disabled: true });
			options = [];
		}

		$(this.refs.select.getDOMNode()).selectize({
			maxItems: 5,
			multiple: true,
			labelField: 'name',
			searchField: 'name',
			options: options,
			items: this.props.children || [],
			render: {
				option: function (item, escape) {
					return '<div>'+item.name+(item.description?' : '+item.description:'')+'</div>'
				}
			}
		});

		this.changeLab(this.props.lab);
	},

	render: function () {
		return (
			React.DOM.div( {className:"tagSelectionBox"}, 
				React.DOM.i( {className:"etiqueta icon-tag3"}),
				React.DOM.select( {ref:"select", disabled:this.state.disabled, name:"state[]", multiple:true}, 
					React.DOM.option( {ref:"Placeholder", value:""}, this.state.placeholder)
				)
			)
		);
	},
});
