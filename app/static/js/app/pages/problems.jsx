/** @jsx React.DOM */

var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')

var Header = React.createClass({

	getInitialState: function () {
		return {
			changed: false,
			tab: "posts",
		};
	},

	componentDidMount: function () {
		//
		var t = $(this.refs.topic.getDOMNode()).selectize({
			plugins: ['remove_button'],
			maxItems: 5,
			multiple: true,
			labelField: 'name',
			valueField: 'id',
			searchField: 'name',
			options: [
				{ name: 'Álgebra', id: 'algebra', },
				{ name: 'Combinatória', id: 'combinatorics', },
				{ name: 'Geometria', id: 'geometry', },
				{ name: 'Teoria dos Números', id: 'number-theory', }
			],
		});
		t[0].selectize.addItem('algebra')
		t[0].selectize.addItem('combinatorics')
		t[0].selectize.addItem('geometry')
		t[0].selectize.addItem('number-theory')
		t[0].selectize.on('change', this.onChangeSelect);
		//
		var l = $(this.refs.level.getDOMNode()).selectize({
				plugins: ['remove_button'],
				maxItems: 5,
				multiple: true,
				labelField: 'name',
				valueField: 'id',
				searchField: 'name',
				options: [
					{ name: 'Nível 1', id: 1, },
					{ name: 'Nível 2', id: 2, },
					{ name: 'Nível 3', id: 3, },
				],
		});
		l[0].selectize.addItem(1)
		l[0].selectize.addItem(2)
		l[0].selectize.addItem(3)
		l[0].selectize.on('change', this.onChangeSelect);
	},

	onChangeSelect: function () {
		this.setState({ changed: true });
	},

	query: function () {
		var topic = this.refs.topic.getDOMNode().selectize.getValue(),
				level = this.refs.level.getDOMNode().selectize.getValue();

		this.props.onQuery({ level: level, topic: topic },
			function () {
				this.setState({ changed: false })
			}.bind(this)
		)
	},

	render: function () {

		if (this.state.tab === 'posts') {

		} else if (this.state.tab === 'problems') {
			return (
				<div>
					<div className="label">
						Mostrando problemas
					</div>

					<select ref="topic" className="select-topic">
					</select>

					<select ref="level" className="select-level">
					</select>

					<button className="new-problem"
						data-trigger="component" data-component="createProblem">
						Novo Problema
					</button>

					{
						this.state.changed?
						<button className="query" onClick={this.query}>
							Procurar
						</button>
						:<button disabled className="query">
							Procurar
						</button>
					}
				</div>
			);
		} else {
			throw new Error("WTF state?", this.state.tab);
		}
	},
})


module.exports = function (app) {

	// function changeQuery (data, cb) {
	// 	console.log(arguments)
	// 	app.postList.once('reset', function () {
	// 		cb();
	// 	})
	// 	app.renderWall('/api/labs/all/problems',
	// 		{ level: data.level, topic: data.topic })
	// }


	// React.render(<Header onQuery={changeQuery} />,
	// 	document.getElementById('qi-header'));
};