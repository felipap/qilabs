
var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')
var Dialog = require('../components/dialog.jsx')

var LabsList = React.createClass({
	getInitialState: function () {

		var selected = [],
				unselected = [];
		_.forEach(pageMap, function (value, key) {
			if (!window.user || conf.userInterests.indexOf(value.id) != -1)
				selected.push(value.id);
			else
				unselected.push(value.id);
		}.bind(this));

		return {
			changesMade: false,
			uinterests: conf.userInterests || [],
			orderedLabIds: selected.concat(unselected),
		}
	},

	saveSelection: function () {
		// change to Backbone model
		$.ajax({
			type: 'put',
			dataType: 'json',
			url: '/api/me/interests/labs',
			data: { items: this.state.uinterests }
		}).done(function (response) {
			if (response.error) {
				Utils.flash.alert("<strong>Puts.</strong>");
			} else {
				this.setState({ changesMade: false });
				window.user.preferences.labs = response.data;
				// // damn
				// var selected = [],
				// 		unselected = [];
				// _.forEach(pageMap, function (value, key) {
				// 	if (response.data.indexOf(value.id) != -1)
				// 		selected.push(value.id);
				// 	else
				// 		unselected.push(value.id);
				// }.bind(this));
				// selected.concat(unselected);
				// this.setState({ interests: response.data });

				Utils.flash.info("Interesses Salvos");
				location.reload();
			}
		}.bind(this)).fail(function (xhr) {
			Utils.flash.warn(xhr.responseJSON && xhr.responseJSON.message || "Erro.");
		}.bind(this));

	},

	render: function () {
		var self = this;

		function genItems() {
			return _.map(self.state.orderedLabIds, function (labId) {

				var item = pageMap[labId];
				var selected = !window.user || self.state.uinterests.indexOf(labId) != -1;

				function toggle (e) {
					e.stopPropagation();
					e.preventDefault();

					if (!window.user) {
						window.Utils.pleaseLoginTo('selecionar os seus interesses');
						return;
					}

					if (selected) {
						var index = self.state.uinterests.indexOf(labId);
						if (index > -1) {
							var ninterests = self.state.uinterests.slice();
							ninterests.splice(index,1);
							self.setState({
								changesMade: true,
								uinterests: ninterests,
							});
						}
					} else {
						if (self.state.uinterests.indexOf(labId) === -1) {
							var ninterests = self.state.uinterests.slice();
							ninterests.push(labId);
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
					app.navigate('/labs/'+item.slug, { trigger: true });
				}

				return (
					<li data-tag={item.id} key={labId} onClick={toggle} className={"tag-color "+(selected?"selected":"unselected")}>
						<i className={"icon-radio_button_"+(selected?'checked':'unchecked')}></i>
						<span className="name">{item.name}</span>
						<i onClick={gotoLab} className="icon-exit_to_app"
							title={"Ir para "+item.name}></i>
					</li>
				);
			}.bind(this));
		}

		return (
			<div>
					<div className="list-header">
						<span className="">
							Seleção de Textos
						</span>
						<button className="help" data-toggle="tooltip" title="Só aparecerão no seu feed <strong>global</strong> os itens dos laboratórios selecionados." data-html="true" data-placement="right" data-container="body">
							<i className="icon-info"></i>
						</button>
					</div>
					<ul>
						{genItems()}
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
	Arender: function () {
		var self = this;

		var selected = [];
		var unselected = [];
		_.forEach(pageMap, function (value, key) {
			if (!window.user || this.state.uinterests.indexOf(value.id) != -1)
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

					if (!window.user) {
						window.Utils.pleaseLoginTo('selecionar os seus interesses');
						return;
					}

					if (type === 'selected') {
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
						if (self.state.uinterests.indexOf(value.id) === -1) {
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
					app.navigate('/labs/'+value.slug, { trigger: true });
				}
				return (
					<li data-tag={value.id} key={key} onClick={toggle} className={"tag-color "+type}>
						<i className={"icon-radio-button-"+(type=='selected'?'on':'off')}></i>
						<span className="name">{value.name}</span>
						<i onClick={gotoLab} className="icon-exit_to_app"
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

	onChangeSelect: function () {
		this.setState({ changed: true });
	},

	// Change sort

	sortHot: function () {
		this.setState({ sorting: 'hot' });
		this.props.sortWall('hot');
	},
	sortFollowing: function () {
		if (window.user) {
			this.setState({ sorting: 'following' });
			this.props.sortWall('following');
		} else {
			window.Utils.pleaseLoginTo('seguir pessoas');
		}
	},
	sortGlobal: function () {
		this.setState({ sorting: 'global' });
		this.props.sortWall('global');
	},

	newPost: function (argument) {
		if (window.user)
			app.trigger('createPost');
		else {
			window.Utils.pleaseLoginTo('criar uma publicação');
		}
	},

	render: function () {
		return (
				<div>
					<nav className='header-nav'>
						<ul>
							<li>
								<button onClick={this.newPost} className='new-post'>
									<strong><i className="icon-edit"></i> Enviar Texto</strong>
								</button>
							</li>
						</ul>
						<ul className='right'>
							<li>
								<button onClick={this.sortGlobal}
								className={'ordering global '+(this.state.sorting === 'global' && 'active')}>
									<i className='icon-public'></i> Global
								</button>
								<button onClick={this.sortFollowing}
								className={'ordering following '+(this.state.sorting === 'following' && 'active')}>
									<i className='icon-group'></i> Seguindo
								</button>
								<button onClick={this.sortHot}
								className={'ordering hot '+(this.state.sorting === 'hot' && 'active')}>
									<i className='icon-whatshot'></i> Populares
								</button>
							</li>
						</ul>
					</nav>
				</div>
			);
	},
})


var OneLabHeader = React.createClass({

	getInitialState: function () {
		return {
		};
	},

	leaveLab: function () {
		app.navigate('/', { trigger: true })
	},

	render: function () {
		return (
				<div>
					<div className="onelab-strip">
						Mostrando publicações de
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

module.exports = function (app) {
	function sortWall (sorting) {
		if (sorting === 'global')
			app.FeedWall.renderPath('/api/labs/all')
		else if (sorting === 'following')
			app.FeedWall.renderPath('/api/labs/inbox')
		else if (sorting === 'hot')
			app.FeedWall.renderPath('/api/labs/hot')
		else
			throw new Error("dumbass developer")
	}

	React.render(<LabsList />,
		document.getElementById('qi-sidebar-interests'));

	React.render(<Header sortWall={sortWall} startSorting='global' />,
		document.getElementById('qi-stream-header'))
};

module.exports.oneLab = function (app, lab) {

	React.render(<LabsList />,
		document.getElementById('qi-sidebar-interests'));

	React.render(<OneLabHeader lab={lab} />,
		document.getElementById('qi-stream-header'))
}