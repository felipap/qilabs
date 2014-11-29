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
					],
			});
			l[0].selectize.addItem(1)
			l[0].selectize.addItem(2)
			l[0].selectize.addItem(3)
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

	render: function () {

		var makeSetter = function (ns) {
			var self = this;
			return function () {
				if (self.source !== ns) {
					var url = {
						'problems': '/api/labs/all/problems',
						'posts': '/api/labs/all',
					}[ns];
					if (!url)
						throw new Error("WTF");
					self.setState({ tab: ns });
					self.props.render(url,
						function () {
							// self.setState({ changed: false })
						}
					)
				}
			}
		}.bind(this)

					// <div className="label">
					// 	Mostrando posts
					// </div>
		if (this.state.tab === 'posts') {
			var SearchBox = (
				<div>
				</div>
			);
					// <div className="label">
					// 	Mostrando problemas
					// </div>
		} else if (this.state.tab === 'problems') {
			var SearchBox = (
				<div className="stream-search-box">

					<select ref="topic" className="select-topic">
					</select>

					<select ref="level" className="select-level">
					</select>

					<button className="new-problem"
						data-trigger="component" data-component="createProblem">
						Novo Problema
					</button>

					<button disabled={!this.state.changed} className="query" onClick={this.query}>
						Procurar
					</button>
				</div>
			);
		} else {
			throw new Error("WTF state?", this.state.tab);
		}

		return (
				<div>
					<nav className="header-nav">
						<ul className="tabs">
							<li>
								<button onClick={makeSetter('posts')}
								className={this.state.tab==='posts' && 'active'}>Publicações</button>
							</li>
							<li>
								<button onClick={makeSetter('problems')}
								className={this.state.tab==='problems' && 'active'}>Problemas</button>
							</li>
						</ul>
						<ul className="right">
							<li>
								<button className="ordering global"><i className="icon-publ"></i></button>
							</li>
							<li>
								<button className="ordering hot"><i className="icon-whatshot"></i></button>
							</li>
						</ul>
					</nav>
					{SearchBox}
				</div>
			);
	},
})

module.exports = function (app) {
	function renderWall () {
		app.renderWall.apply(app, arguments);
	}

	React.render(<Header render={renderWall} />,
		document.getElementById('qi-header'));
};