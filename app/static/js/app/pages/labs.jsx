
var $ = require('jquery')
var React = require('react')
var selectize = require('selectize')
var Dialog = require('../components/dialog.jsx')

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
			url: '/api/me/interests/labs',
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
						Dialog.PleaseLoginDialog("selecionar os seus interesses")
						return;
					}

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
					app.navigate('/labs/'+value.slug, { trigger: true });
				}
				return (
					<li data-tag={value.id} key={key} onClick={toggle} className={"tag-color "+type}>
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
			app.utils.pleaseLogin("seguir pessoas");
		}
	},
	sortGlobal: function () {
		this.setState({ sorting: 'global' });
		this.props.sortWall('global');
	},

	newPost: function (argument) {
		if (window.user)
			app.triggerComponent(app.components.createPost);
		else {
			app.utils.pleaseLogin("criar uma publicação")
		}
	},

	render: function () {
		return (
				<div>
					<nav className='header-nav'>
						<ul>
							<li>
							{
								window.conf.user?
								<button onClick={this.newPost} className='new-post'>
									<strong>Criar Aqui</strong>
								</button>
								:<button onClick={this.newPost} className='new-post'>
									<strong>Criar Aqui</strong>
								</button>
							}
							</li>
						</ul>
						<ul className='right'>
							<li>
								<button onClick={this.sortGlobal}
								className={'ordering global '+(this.state.sorting === 'global' && 'active')}>
									<i className='icon-publ'></i> Global
								</button>
							</li>
							<li>
								<button onClick={this.sortFollowing}
								className={'ordering following '+(this.state.sorting === 'following' && 'active')}>
									<i className='icon-users'></i> Seguindo
								</button>
							</li>
							<li>
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
		app.navigate('/labs', { trigger: true })
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

module.exports.oneLab = function (app, lab) {

	React.render(<LabsList />,
		document.getElementById('qi-sidebar-interests'));

	React.render(<OneLabHeader lab={lab} />,
		document.getElementById('qi-header'))
}