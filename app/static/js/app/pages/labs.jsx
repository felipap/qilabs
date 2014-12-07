
var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')


var LabsList = React.createClass({
	getInitialState: function () {
		return {
			changesMade: false,
			uinterests: conf.userInterests || [],
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
				window.user.preferences.interests = response.data;
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
		console.log(this.state.uinterests)

		var selected = [];
		var unselected = [];
		_.forEach(pageMap, function (value, key) {
			if (this.state.uinterests.indexOf(value.id) != -1)
				selected.push(value);
			else
				unselected.push(value);
		}.bind(this));

		function genSelectedItems () {
			return _.map(selected, function (value, key) {
				function onClick () {
					var index = self.state.uinterests.indexOf(value.id);
					if (index > -1) {
						var ninterests = self.state.uinterests.slice();
						ninterests.splice(index,1);
						self.setState({
							changesMade: true,
							uinterests: ninterests,
						});
					}
				}
				return (
					<li data-tag={value.id} onClick={onClick} className="tag-color selected">
						<i className="icon-radio-button-on"></i>
						<span className="name">{value.name}</span>
					</li>
				);
			});
		}

		function genUnselectedItems () {
			return _.map(unselected, function (value, key) {
				function onClick () {
					if (self.state.uinterests.indexOf(value.id) == -1) {
						var ninterests = self.state.uinterests.slice();
						ninterests.push(value.id);
						self.setState({
							changesMade: true,
							uinterests: ninterests,
						});
					}
				}
				return (
					<li data-tag={value.id} onClick={onClick} className="tag-color unselected">
						<i className="icon-radio-button-off"></i>
						<span className="name">{value.name}</span>
					</li>
				);
			});
		}

		return (
			<div>
				<div className="list-header">
					<span className="">
						Seleção de Textos
					</span>
					<button className="help" data-toggle="tooltip" title="Só aparecerão no seu feed <strong>global</strong> os itens dos laboratórios selecionados." data-html="true" data-placement="right" data-container="body">
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
			</div>
		);
	},
});

var Header = React.createClass({

	getInitialState: function () {
		return {
			changed: false,
			sorting: this.props.startSorting,
		};
	},

	componentDidMount: function () {
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
		return (
				<div>
					<nav className='header-nav'>
						<ul className='right'>
							<li>
								<button onClick={this.sortGlobal}
								className={'ordering global '+(this.state.sorting === 'global' && 'active')}>
									Global <i className='icon-publ'></i>
								</button>
							</li>
							<li>
								<button onClick={this.sortFollowing}
								className={'ordering following '+(this.state.sorting === 'following' && 'active')}>
									Seguindo <i className='icon-users'></i>
								</button>
							</li>
							<li>
								<button onClick={this.sortHot}
								className={'ordering hot '+(this.state.sorting === 'hot' && 'active')}>
									Populares <i className='icon-whatshot'></i>
								</button>
							</li>
						</ul>
					</nav>
				</div>
			);
	},
})

module.exports = function (app) {
	function sortWall (sorting) {
		if (sorting === 'global')
			app.renderWall('/api/labs/all')
		else if (sorting === 'following')
			app.renderWall('/api/labs/inbox')
		else if (sorting === 'hot')
			app.renderWall('/api/labs/hot')
		else
			throw new Error("dumbass developer")
	}

	React.render(<LabsList />,
		document.getElementById('qi-sidebar-interests'));

	React.render(<Header sortWall={sortWall} startSorting='global' />,
		document.getElementById('qi-header'))
};