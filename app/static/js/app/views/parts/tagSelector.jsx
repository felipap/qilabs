/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
var React = require('react')
var selectize = require('selectize')

module.exports = React.createClass({
	getInitialState: function () {
		if (this.props.lab) {
			if (this.props.lab in this.props.pool) {
				return {
					disabled: false,
					placeholder: 'Tags relacionadas a '+this.props.pool[this.props.lab].name,
				};
			} else {
				console.warn('Invalid lab '+this.props.lab);
			}
		}
		return {
			disabled: true,
			placeholder: 'Selecione primeiro uma página para postar.',
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
		$(this.getDOMNode()).find('.selectize-input input').attr('placeholder',
			'Tags relacionadas a '+this.props.pool[lab].name );
	},

	getSubtags: function () {
		/* Return subtags of selected lab. */
		var lab = this.props.lab;
		if (lab && this.props.pool[lab]) {
			var tags = _.clone(this.props.pool[lab].children || {});
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
				item: function (data, escape) {
					return "<div data-value='"+escape(data.value)+"' data-tag='"+this.props.lab+"' class='data tag-bg'>"+escape(data.name)+"</div>";
				}.bind(this),
				option: function (data, escape) {
					if (data.description)
						return '<div><strong>'+escape(data.name)+'</strong><p>'+escape(data.description)+'</p></div>'
					return '<div><strong>'+escape(data.name)+'</strong></div>';
				}
			}
		});
	},

	render: function () {
		return (
			<div className='tag-box'>
				<i className='etiqueta icon-tag3'></i>
				<select ref='select' disabled={this.state.disabled} name='state[]' multiple>
					<option ref='Placeholder' value=''>{this.state.placeholder}</option>
				</select>
			</div>
		);
	},
});
