
var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')

var LabsList = React.createClass({
	getInitialState: function () {
		return {
			changesMade: false,
			uinterests: conf.userSubjectInterests || [],
		}
	},

	saveSelection: function () {

		// change to Backbone model

		$.ajax({
			type: 'put',
			dataType: 'json',
			url: '/api/me/interests/subjects',
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

		var self = this;

		var selected = [];
		var unselected = [];
		_.forEach(pageMap, function (value, key) {
			if (!value.hasProblems)
				return;
			if (this.state.uinterests.indexOf(value.id) != -1)
				selected.push(value);
			else
				unselected.push(value);
		}.bind(this));

		function genItems(type) {
			var source = type === 'selected' ? selected : unselected;
			return _.map(source, function (value, key) {
				function toggle (e) {
					e.stopPropagation();
					e.preventDefault();
					if (type === 'selected') {
						console.log('unselect')
						var index = self.state.uinterests.indexOf(value.id);
						if (index > -1) {
							var ninterests = self.state.uinterests.slice();
							ninterests.splice(index,1);
							self.setState({
								changesMade: true,
								uinterests: ninterests,
							});
						}
					} else {
						console.log('select')
						if (self.state.uinterests.indexOf(value.id) == -1) {
							var ninterests = self.state.uinterests.slice();
							ninterests.push(value.id);
							self.setState({
								changesMade: true,
								uinterests: ninterests,
							});
						}
					}
				}
				function gotoLab (e) {
					e.stopPropagation();
					e.preventDefault();
					app.navigate('/problemas/'+value.slug, { trigger: true });
				}
				return (
					<li data-tag={value.id} onClick={toggle} className={"tag-color "+type}>
						<i className={"icon-radio-button-"+(type=='selected'?'on':'off')}></i>
						<span className="name">{value.name}</span>
						<i onClick={gotoLab} className="icon-exit-to-app"
							title={"Ir para "+value.name}></i>
					</li>
				);
			});

		}

		function genSelectedItems () {
			return genItems("selected");
		}

		function genUnselectedItems () {
			return genItems("unselected");
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
					<button className="save-button" onClick={this.saveSelection}>
						Salvar Interesses
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

				<select ref='level' className='select-level'>
				</select>

				<button className='new-problem'
					data-trigger='component' data-component='createProblem'>
					<strong>Criar Problema</strong>
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
	function changeLevel (level) {
		app.postList.reset();
		app.postList.setQuery({ level: level });
		app.postList.fetch({ data: { level: level } });
	}

	React.render(<LabsList />,
		document.getElementById('qi-sidebar-interests'));

	React.render(<ProblemsHeader changeLevel={changeLevel} startSorting='global' />,
		document.getElementById('qi-header'))
};

var OneLabHeader = React.createClass({

	getInitialState: function () {
		return {
		};
	},

	leaveLab: function () {
		app.navigate('/labs', { trigger: true })
	},

	render: function () {
		return (
				<div>
					<div className="onelab-strip">
						Mostrando problemas de
						<div className="tag tag-bg" data-tag={this.props.lab.id}>
							{this.props.lab.name}
						</div>
						<button onClick={this.leaveLab} className="cancel">
							Voltar
						</button>
					</div>
				</div>
			);
	},
})

module.exports.oneLab = function (app, lab) {

	React.render(<LabsList />,
		document.getElementById('qi-sidebar-interests'));

	React.render(<OneLabHeader lab={lab} />,
		document.getElementById('qi-header'))
}