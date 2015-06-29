
/*
 * This may be the most gambiar-ish code ever created.
 * Viewer's discretion is advised.
 */

var $ = require('jquery');
var _ = require('lodash');
var React = require('react');
var selectize = require('selectize');

var TagSelector = React.createClass({
	getValue: function() {
		return this.refs.select.getDOMNode().selectize.getValue();
	},

	_mountSelectize: function() {
		var pool = window.pool = this.props.pool;

		// This is a gambiarra.
		// addItem(item, silence=true) is buggy. Not really silent.
		var silence = false;

		function getActiveLab() {
			return control.getValue()[0];
		}

		function getActiveTopics() {
			console.log('active', control.getValue())
			return control.getValue().slice(1);
		}

		function setOptions(options) {
			control.clearOptions();
			_.each(options, (i) => control.addOption(i));
			control.refreshOptions();
			// console.log('options', JSON.stringify(options));
		}

		function setItems(items) {
			control.clear(true);
			silence = true;
			control.setValue(items);
			silence = false;
			control.refreshItems();
			console.log('items', items)
		}

		function genLabOption(lab) {
			return {
				value: lab,
				name: pool[lab].name,
				description: pool[lab].description,
				isLab: true,
			}
		}

		function genTopicsOptions(pool, lab) {
			// We must concat with the lab's won option, otherwise the lab
			// item will disappear.
			return _.map(pool[lab].children, function(child, id) {
				return {
					value: id,
					name: child.name,
					description: child.description,
					parent: lab,
				}
			}).concat(genLabOption(lab));
		}

		function genLabsOptions(pool) {
			return _.map(pool, (a, key) => genLabOption(key))
		}

		// Lab is selected. → User will now select topics within that lab.
		var refreshSelectTopics = (newItem, $item) => {
			var lab = getActiveLab();
			if ($item) {
				var items = [lab].concat(getActiveTopics()).concat(newItem)
			} else {
				var items = [lab].concat(getActiveTopics())
			}
			setOptions(genTopicsOptions(pool, lab));
			setItems(items)
			control.refreshOptions()
		}

		// No tag is selected. → User will now select the lab.
		var setupSelectLab = () => {
			var options = genLabsOptions(pool);
			setOptions(options);
			setItems([]);
		}

		var loop = () => {
			if (silence) {
				return;
			}

			var lab = getActiveLab();
			if (lab) {
				if (!pool[lab]) {
					throw new Error('WTF?'+lab);
				}
				console.log('→ User will now select topics within that lab.')
				refreshSelectTopics.apply(this, arguments);
			} else {
				console.log('→ User will now select the lab.')
				setupSelectLab.apply(this, arguments);
			}

			return true
		}

		var options = this.props.lab ? genTopicsOptions(pool, this.props.lab) : [];
		var items = this.props.lab ? [this.props.lab].concat(this.props.tags || []) : [];

		$(this.refs.select.getDOMNode()).selectize({
			maxItems: 5,
			multiple: true,
			labelField: 'name',
			searchField: 'name',
			options: options,
			items: items,
			onItemAdd: loop,
			preload: "focus",
			onItemRemove: (value) => {
				// If user removed the lab tag, remove all other tags.
				// TODO:
				// A better option would be to prevent the user from removing the lab
				// item if there are topics items, ie preventing the caret from moving.
				if (value in pool) {
					setItems([]);
				}
				loop.apply(this, arguments);
			},
			render: {
				item: (data, escape) => {
					if (data.isLab) {
						return "<div data-value='"+escape(data.value)+"' data-tag='"+
							data.value+"' class='data tag-color tag-border'>#"+escape(data.name)+"</div>";
					} else {
						return "<div data-value='"+escape(data.value)+"' class='data tag'>#"+
							escape(data.name)+"</div>";
					}
				},
				option: function(data, escape) {
					if (data.description) {
						return '<div><div class="tag tag-border" data-sd="'+data.parent+'">#'+escape(data.name)+'</div><p>'+escape(data.description)+'</p></div>'
					}
					return '<div><strong>'+escape(data.name)+'</strong></div>';
				}
			},
		});
		var control = window.control = this.refs.select.getDOMNode().selectize;

		loop();
	},

	componentDidMount: function() {
		this._mountSelectize();
		setTimeout(() => {
			this.refs.select.getDOMNode().selectize.blur();
		}, 1)
	},

	render: function() {
		return (
			<div className='TagsSelector'>
				<select ref='select' name='state[]' multiple>
					<option ref='Placeholder' value=''>
						Escolha #tags para o seu texto.
					</option>
				</select>
			</div>
		);
	},
});

module.exports = TagSelector;