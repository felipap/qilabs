/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')

module.exports = React.createClass({
	getInitialState: function () {
		if (this.props.subject) {
			if (this.props.subject in pageMap) {
				return {
					disabled: false,
					placeholder: "Tags relacionadas a "+pageMap[this.props.subject].name,
				};
			} else {
				console.warn("Invalid subject "+this.props.subject);
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

	changeSubject: function (subject) {
		this.props.subject = subject;
		var selectize = this.refs.select.getDOMNode().selectize;
		selectize.clearOptions();
		var tags;
		if ((tags = this.getSubtags()) && tags.length) {
			for (var i=0; i<tags.length; ++i) {
				selectize.addOption(tags[i]);
			}
		}
		selectize.clear();
		selectize.refreshOptions(true);
		$(this.getDOMNode()).find('.selectize-input input').attr('placeholder',
			"Tags relacionadas a "+pageMap[subject].name );
	},

	getSubtags: function () {
		var subject = this.props.subject;
		if (subject && pageMap[subject]) {
			var tags = _.clone(pageMap[subject].children || {});
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
			render: function (item, escape) {
				return '<div>'+item.name+'</div>'
			}
		});
	},

	render: function () {
		var options = _.map(this.props.data, function (val, index) {
			return (
				<option value={val.id}>
					{val.name} { val.desc? ("> "+val.desc) : null }
				</option>
			);
		});

		return (
			<div className="tagSelectionBox">
				<i className="etiqueta icon-tags"></i>
				<select ref="select" disabled={this.state.disabled} name="state[]" multiple>
					<option ref="Placeholder" value="">{this.state.placeholder}</option>
					{options}
				</select>
			</div>
		);
	},
});
