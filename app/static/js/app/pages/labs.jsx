/** @jsx React.DOM */

var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')

var tabUrls = {
	'problems': '/api/labs/all/problems',
	'posts': '/api/labs/',
};

var Header = React.createClass({

	getInitialState: function () {
		return {
			changed: false,
			tab: this.props.startTab,
			sorting: this.props.startSorting,
		};
	},

	componentDidMount: function () {
	},

	componentDidUpdate: function () {
		//
		if (!this.intializedProblems && this.state.tab === 'problems') {
			this.intializedProblems = true;
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
		}
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

	// Change tab

	getProblems: function () {
		this.setState({ tab: 'problems' });
		this.props.renderTab('problems', this.state.sorting);
	},

	getPosts: function () {
		this.setState({ tab: 'posts' });
		this.props.renderTab('posts', this.state.sorting);
	},

	// Change sort

	sortHot: function () {
		this.setState({ sorting: 'hot' });
		this.props.renderTab(this.state.tab, 'hot');
	},
	sortFollowing: function () {
		this.setState({ sorting: 'following' });
		this.props.renderTab(this.state.tab, 'following');
	},
	sortGlobal: function () {
		this.setState({ sorting: 'global' });
		this.props.renderTab(this.state.tab, 'global');
	},

	render: function () {

					// <div className='label'>
					// 	Mostrando posts
					// </div>
		if (this.state.tab === 'posts') {
			var SearchBox = (
				<div>
				</div>
			);
					// <div className='label'>
					// 	Mostrando problemas
					// </div>
		} else if (this.state.tab === 'problems') {
			var SearchBox = (
				<div className='stream-search-box'>

					<select ref='topic' className='select-topic'>
					</select>

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
		} else {
			throw new Error('WTF state?', this.state.tab);
		}

		return (
				<div>
					<nav className='header-nav'>
						<ul className='tabs'>
							<li>
								<button onClick={this.getPosts}
								className={this.state.tab==='posts' && 'active'}>Publicações</button>
							</li>
							<li>
								<button onClick={this.getProblems}
								className={this.state.tab==='problems' && 'active'}>Problemas</button>
							</li>
						</ul>
						<ul className='right'>
							<li>
								<button onClick={this.sortGlobal}
								className={'ordering global '+(this.state.sorting === 'global' && 'active')}>
									<i className='icon-publ'></i>
								</button>
							</li>
							<li>
								<button onClick={this.sortFollowing}
								className={'ordering following '+(this.state.sorting === 'following' && 'active')}>
									<i className='icon-users'></i>
								</button>
							</li>
							<li>
								<button onClick={this.sortHot}
								className={'ordering hot '+(this.state.sorting === 'hot' && 'active')}>
									<i className='icon-whatshot'></i>
								</button>
							</li>
						</ul>
					</nav>
					{SearchBox}
				</div>
			);
	},
})

module.exports = function (app, startTab) {
	var startTab = startTab || 'posts'

	function renderTab (tab, sorting) {
		if (tab === 'problems') {
			app.renderWall('/api/labs/all/problems');
		} else if (tab === 'posts') {
			if (sorting === 'global')
				app.renderWall('/api/labs/all')
			else if (sorting === 'following')
				app.renderWall('/api/labs/inbox')
			else if (sorting === 'hot')
				app.renderWall('/api/labs/hot')
			else
				throw new Error("dumbass developer")

		} else {
			throw new Error("dumbass developer");
		}
	}

	React.render(<Header renderTab={renderTab} startSorting='global' startTab={startTab} />,
		document.getElementById('qi-header'));
};