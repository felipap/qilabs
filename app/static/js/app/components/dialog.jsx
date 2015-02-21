/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
window.React = require('react')

var Box = React.createClass({
	close: function () {
		this.props.close();
	},
	componentDidMount: function () {
		var self = this;
		$('body').on('keypress', function(e){
			if (e.which === 27){
				self.close();
			}
		});
	},
	render: function () {
		return (
			<div>
				<div className="dialog-blackout" onClick={this.close} data-action="close-dialog"></div>
				<div className="dialog-box">
					<i className='close-btn' onClick={this.close} data-action='close-dialog'></i>
					{this.props.children}
				</div>
			</div>
		);
	}
});

var Dialog = module.exports = function (component, className, onRender, onClose) {
	var $el = $('<div class="dialog">').appendTo("body");
	if (className) {
		$el.addClass(className);
	}
	function close () {
		$el.fadeOut();
		React.unmountComponentAtNode($el[0]);
		onClose && onClose($el[0], c);
	}
	component.props.close = close;
	var c = React.render(<Box close={close}>{component}</Box>, $el[0],
		function () {
			// Defer execution, so variable c is set.
			setTimeout(function () {
				$el.fadeIn();
				onRender && onRender($el[0], c);
				$('body').focus();
			}, 10);
		});
}

//

var Share = React.createClass({
	render: function () {
		var urls = {
			facebook: 'http://www.facebook.com/sharer.php?u='+encodeURIComponent(this.props.url)+
				'&ref=fbshare&t='+encodeURIComponent(this.props.title),
			gplus: 'https://plus.google.com/share?url='+encodeURIComponent(this.props.url),
			twitter: 'http://twitter.com/share?url='+encodeURIComponent(this.props.url)+
				'&ref=twitbtn&via=qilabsorg&text='+encodeURIComponent(this.props.title),
		}

		function genOnClick(url) {
			return function () {
				window.open(url,"mywindow","menubar=1,resizable=1,width=500,height=500");
			};
		}

		return (
			<div>
				<label>{this.props.message}</label>
				<input type="text" name="url" readOnly value={this.props.url} />
				<div className="share-icons">
					<button className="share-gp" onClick={genOnClick(urls.gplus)}
						title="Compartilhe essa questão no Google+">
						<i className="icon-google-plus-square"></i> Google+
					</button>
					<button className="share-fb" onClick={genOnClick(urls.facebook)}
						title="Compartilhe essa questão no Facebook">
						<i className="icon-facebook-square"></i> Facebook
					</button>
					<button className="share-tw" onClick={genOnClick(urls.twitter)}
						title="Compartilhe essa questão no Twitter">
						<i className="icon-twitter-square"></i> Twitter
					</button>
				</div>
			</div>
		);
	},
});

var Markdown = React.createClass({
	render: function () {
		return (
			<div>
				<label>Como usar Markdown</label>
				<p>
					Markdown é um conjunto de códigos para formatar o seu código.
				</p>
				<table className="table table-bordered">
					<thead>
						<tr>
							<th>Resultado</th>
							<th>Markdown</th>
						</tr>
					</thead>
					<tr>
						<td><strong>negrito</strong></td>
						<td>**negrito**</td>
					</tr>
					<tr>
						<td><a href="#">link</a></td>
						<td>[link](http://)</td>
					</tr>
					<tr>
						<td><del>Riscado</del></td>
						<td>~~Riscado~~</td>
					</tr>
				</table>
			</div>
		);
	},
});

var PostEditHelp = React.createClass({
	render: function () {
		return (
			<div>
				Para formatar o seu post, selecione a parte que você deseja formatar e seja feliz.
			</div>
		);
	},
});

// var PleaseLogin = React.createClass({
// 	login: function () {
// 		location.href  = "/entrar";
// 	},
// 	render: function () {
// 		return (
// 			<div>
// 				<i className='icon-lightbulb'></i>
// 				<p>
// 					Entre para {this.props.actionMessage || "realizar essa ação"}.
// 				</p>
// 				<button onClick={this.login} className="login-fb">
// 					Entrar com o Facebook
// 				</button>
// 			</div>
// 		);
// 	},
// });

var FFF = React.createClass({
	getInitialState: function() {
		return {
			friends: [],
		};
	},
	componentWillMount: function() {
		$.ajax({
			type: 'get',
			dataType: 'json',
			timeout: 4000,
			url: '/api/me/fff',
		})
		.done(function (response) {
			if (response.error) {
				app.flash.alert(response.message || "Erro!")
			} else {
				this.setState({
					friends: response.data
				});
			}
		}.bind(this))
		.fail(function (xhr) {
			if (xhr.responseJSON && xhr.responseJSON.limitError) {
				app.flash.alert("Espere um pouco para realizar essa ação.");
			}
		}.bind(this));
	},
	render: function () {
		var Friends = _.map(this.state.friends, function (f) {
			return (
				<li>
					<div className="user-avatar">
						<div className="avatar" style={{background: 'url('+f.picture+')'}}>
						</div>
					</div>
					<div className="name">
						{f.name}
					</div>
					<div className="right">
					</div>
				</li>
			);
		});
		return (
			<div>
				<h1>Seus amigos usando o QI Labs</h1>
				<ul>
					{Friends}
				</ul>
			</div>
		);
	},
});

var Intro = React.createClass({
	render: function () {
		function login () {
			window.open("/entrar");
		}
		var close = function () {
			console.log('close', this.props.close)
			this.props.close();
		}.bind(this)
		return (
			<div>
				<i className='icon-lightbulb'></i>
				<h1>
					Bem-vindo ao <strong>QI Labs</strong>!
				</h1>
				<h3>
					Uma plataforma para extra-curriculares.
				</h3>

				<p>
					Aqui você pode ler textos sobre <a href="/labs/matematica" target="__blank" className="tag tag-color" data-tag="mathematics">Olimpíadas de Matemática</a>, compartilhar experiências sobre <a href="/labs/empreendedorismo" target="__blank" className="tag tag-color" data-tag="entrepreneurship">empreendedorismo</a>, ou fazer perguntas sobre <a href="/labs/fisica" target="__blank" className="tag tag-color" data-tag="physics">Fìsica Moderna</a>.
				</p>

				<button className="login-fb" onClick={login}>Entrar com o Facebook</button>
				<p>
					<button className="continue" onClick={close}>continuar explorando o site</button>
				</p>
			</div>
		);
	},
});

var Tour = React.createClass({
	render: function () {
		return (
			<div className=''>
				<div className='header'>
					<i className='icon-lightbulb'></i>
					<h1>Bem-vindo ao <strong>QI Labs</strong>!</h1>
				</div>
				<p>
					Aqui você pode ler textos sobre <a href="/labs/matematica" target="__blank" className="tag tag-color" data-tag="mathematics">Olimpíadas de Matemática</a>, compartilhar experiências sobre <a href="/labs/empreendedorismo" target="__blank" className="tag tag-color" data-tag="entrepreneurship">empreendedorismo</a>, ou fazer perguntas sobre <a href="/labs/fisica" target="__blank" className="tag tag-color" data-tag="physics">Fìsica Moderna</a>.
				</p>
				<p>
					Agora que você tem uma conta você pode:
					<ul>
						<li><strong>participar de discussões</strong> e <strong>receber notificações</strong></li>
						<li><strong>seguir pessoas</strong> que te interessarem (intelectualmente, claro)</li>
						<li><strong>resolver problemas</strong> e ganhar pontos</li>
					</ul>
				</p>
				<p>
					<strong>Clique nas bolinhas azuis para aprender a usar melhor o site.</strong>
				</p>
				<button className="go" onClick={this.props.close}>
					Go!
				</button>
			</div>
		);
	},
});

//

module.exports.PostEditHelpDialog = function (data, onRender) {
	Dialog(
		PostEditHelp(data),
		"postedithelp-dialog",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
			app.pages.chop();
		},
		function (elm, component) {
			app.pages.unchop();
		}
	);
};

module.exports.ShareDialog = function (data, onRender) {
	Dialog(
		Share(data),
		"share-dialog",
		function (elm, component) {
			$(component.getDOMNode()).find('input').focus();
			onRender && onRender.call(this, elm, component);
			app.pages.chop();
		},
		function (elm, component) {
			app.pages.unchop();
		}
	);
};

module.exports.IntroDialog = function (data, onRender) {
	Dialog(
		Intro(data),
		"intro-dialog",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
			app.pages.chop();
		},
		function (elm, component) {
			app.pages.unchop();
		}
	);
};

module.exports.MarkdownDialog = function (data, onRender) {
	Dialog(
		Markdown(data),
		"markdown-dialog",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
		},
		function (elm, component) {
		}
	);
};

module.exports.TourDialog = function (data, onRender, onClose) {
	Dialog(
		Tour(data),
		"tour-dialog",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
			app.pages.chop();
		},
		function (elm, component) {
			onClose && onClose.call(this, elm, component);
			app.pages.unchop();
		}
	);
};

// module.exports.PleaseLoginDialog = function (data, onRender) {
// 	Dialog(
// 		PleaseLogin(data),
// 		"pleaselogin-dialog",
// 		function (elm, component) {
// 			onRender && onRender.call(this, elm, component);
// 			app.pages.chop();
// 		},
// 		function (elm, component) {
// 			app.pages.unchop();
// 		}
// 	);
// };

module.exports.FFFDialog = function (data, onRender) {
	Dialog(
		FFF(data),
		"fff-dialog",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
			app.pages.chop();
		},
		function (elm, component) {
			app.pages.unchop();
		}
	);
};