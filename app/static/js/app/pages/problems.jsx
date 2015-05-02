
var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')

var ProblemsHeader = React.createClass({

	getInitialState: function () {
		return {
			changed: false,
		};
	},

	componentDidMount: function () {
		// var t = $(this.refs.topic.getDOMNode()).selectize({
		// 	plugins: ['remove_button'],
		// 	maxItems: 5,
		// 	multiple: true,
		// 	labelField: 'name',
		// 	valueField: 'id',
		// 	searchField: 'name',
		// 	options: [
		// 		{ name: 'Álgebra', id: 'algebra', },
		// 		{ name: 'Combinatória', id: 'combinatorics', },
		// 		{ name: 'Geometria', id: 'geometry', },
		// 		{ name: 'Teoria dos Números', id: 'number-theory', }
		// 	],
		// });
		// t[0].selectize.addItem('algebra')
		// t[0].selectize.addItem('combinatorics')
		// t[0].selectize.addItem('geometry')
		// t[0].selectize.addItem('number-theory')
		// t[0].selectize.on('change', this.onChangeSelect);
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
					{ name: 'Nível 4', id: 4, },
					{ name: 'Nível 5', id: 5, },
				],
		});
		l[0].selectize.addItem(1)
		l[0].selectize.addItem(2)
		l[0].selectize.addItem(3)
		l[0].selectize.addItem(4)
		l[0].selectize.addItem(5)
		l[0].selectize.on('change', this.onChangeSelect);
	},

	onChangeSelect: function () {
		this.setState({ changed: true });
	},

	query: function () {
		// var topic = this.refs.topic.getDOMNode().selectize.getValue();
		var level = this.refs.level.getDOMNode().selectize.getValue();
		this.props.changeLevel(level,
		// this.props.render(url, { level: level },
			function () {
				this.setState({ changed: false })
			}.bind(this)
		)
	},

	// Change sort

	render: function () {

		// <select ref='topic' className='select-topic'>
		// </select>


		var SearchBox = (
			<div className='stream-search-box'>
			{
				(window.user.flags && window.user.flags.editor)?
				<button className='new-problem'
					data-trigger='component' data-component='createProblem'>
					<strong>Criar Problema</strong>
				</button>
				:null
			}

				<select ref='level' className='select-level'>
				</select>

				<button disabled={!this.state.changed} className='query' onClick={this.query}>
					Procurar
				</button>
			</div>
		);

		return (
				<div>
					<nav className='header-nav'>
					</nav>
					{SearchBox}
				</div>
			);
	},
})

module.exports = function (app) {
	function changeLevel (level) {
		app.streamItems.reset();
		app.streamItems.setQuery({ level: level });
		app.streamItems.fetch({ data: { level: level } });
	}

	// React.render(<ProblemsHeader changeLevel={changeLevel} startSorting='global' />,
	// 	document.getElementById('qi-header'))
};