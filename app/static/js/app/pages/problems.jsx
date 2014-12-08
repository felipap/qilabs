
var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')

var LabsList = React.createClass({
	getInitialState: function () {
		return {
			changesMade: false,
		}
	},

	saveSelection: function () {

		// change to Backbone model

		$.ajax({
			type: 'put',
			dataType: 'json',
			url: '/api/me/interests',
			data: { items: this.state.uinterests }
		}).done(function (response) {
			if (response.error) {
				app.flash.alert("<strong>Puts.</strong>");
			} else {
				this.setState({ changesMade: false });
				window.user.preferences.labs = response.data;
				this.setState({ interests: response.data });
				app.flash.info("Interesses Salvos");
				location.reload();
			}
		}.bind(this)).fail(function (xhr) {
			app.flash.warn(xhr.responseJSON && xhr.responseJSON.message || "Erro.");
		}.bind(this));

	},

	render: function () {

		if (!conf.userSubjectPreferences) {
			console.warn("User preferences NOT found!");
			var uinterests = [];
		} else {
			var uinterests = conf.userSubjectPreferences;
		}

		var selected = [];
		var unselected = [];
		_.forEach(pageMap, function (value, key) {
			if (!value.hasProblems)
				return;
			if (uinterests.indexOf(value.id) != -1)
				selected.push(value);
			else
				unselected.push(value);
		});

		function genSelectedItems () {
			return _.map(selected, function (i) {
				return (
					<li data-tag={i.id} className="tag-color selected">
						<i className="icon-radio-button-on"></i>
						<span className="name">{i.name}</span>
					</li>
				);
			});
		}

		function genUnselectedItems () {
			return _.map(unselected, function (i) {
				return (
					<li data-tag={i.id} className="tag-color unselected">
						<i className="icon-radio-button-off"></i>
						<span className="name">{i.name}</span>
					</li>
				);
			});
		}

		return (
			<div>
				<div className="list-header">
					<span className="">
						Seleção de Problemas
					</span>
					<button className="help" data-toggle="tooltip" title="Só aparecerão na sua tela os problemas das matérias selecionadas." data-placement="right" data-container="body">
						<i className="icon-help2"></i>
					</button>
				</div>
				<ul>
					{genSelectedItems()}
					{genUnselectedItems()}
				</ul>
				{
					this.state.changesMade?
					<button className="right-button">
						Salvar
					</button>
					:null
				}
				<a href="/ranking" className="button goto-ranking">
					<i className="icon-trophy2"></i> Veja o Ranking
				</a>
			</div>
		);
	},
});

var ProblemsHeader = React.createClass({

	getInitialState: function () {
		return {
			changed: false,
			sorting: this.props.startSorting,
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
		var topic = this.refs.topic.getDOMNode().selectize.getValue(),
				level = this.refs.level.getDOMNode().selectize.getValue();
		this.props.render(url, { level: level, topic: topic },
			function () {
				this.setState({ changed: false })
			}.bind(this)
		)
	},

	// Change sort

	sortHot: function () {
		this.setState({ sorting: 'hot' });
		this.props.sortWall('hot');
	},
	sortFollowing: function () {
		this.setState({ sorting: 'following' });
		this.props.sortWall('following');
	},
	sortGlobal: function () {
		this.setState({ sorting: 'global' });
		this.props.sortWall('global');
	},

	render: function () {

		// <select ref='topic' className='select-topic'>
		// </select>

		var SearchBox = (
			<div className='stream-search-box'>

				<select ref='level' className='select-level'>
				</select>

				<button className='new-problem'
					data-trigger='component' data-component='createProblem'>
					Novo Problema
				</button>

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
	function sortWall (sorting) {
		app.renderWall('/api/labs/all/problems')
	}

	React.render(<LabsList />,
		document.getElementById('qi-sidebar-interests'));

	React.render(<ProblemsHeader sortWall={sortWall} startSorting='global' />,
		document.getElementById('qi-header'))
};