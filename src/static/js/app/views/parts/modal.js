/** @jsx React.DOM */

var $ = require('jquery')
var _ = require('lodash')
window.React = require('react')
var Box = React.createClass({displayName: 'Box',
	close: function () {
		this.props.onClose();
	},
	render: function () {
		return (
			React.DOM.div(null, 
				React.DOM.div( {className:"box-blackout", onClick:this.close, 'data-action':"close-dialog"}),
				React.DOM.div( {className:"box"}, 
					React.DOM.i( {className:"close-btn", onClick:this.close, 'data-action':"close-dialog"}),
					this.props.children
				)
			)
		);
	}
});

var Modal = module.exports = function (component, className, onRender) {
	var $el = $('<div class="dialog">').appendTo("body");
	if (className) {
		$el.addClass(className);
	}
	function onClose () {
		$el.fadeOut();
		React.unmountComponentAtNode($el[0]);
	}
	var c = React.renderComponent(Box( {onClose:onClose}, component), $el[0],
		function () {
			// Defer execution, so variable c is set.
			setTimeout(function () {
				$el.fadeIn();
				onRender && onRender($el[0], c);
			}, 10);
		});
}

var Share = React.createClass({displayName: 'Share',
	onClickBlackout: function () {
		$(this).fadeOut();
	},
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
			React.DOM.div(null, 
				React.DOM.label(null, this.props.message),
				React.DOM.input( {type:"text", name:"url", readOnly:true, value:this.props.url} ),
				React.DOM.div( {className:"share-icons"}, 
					React.DOM.button( {className:"share-gp", onClick:genOnClick(urls.gplus),
						title:"Compartilhe essa questão no Google+"}, 
						React.DOM.i( {className:"icon-google-plus-square"}), " Google+"
					),
					React.DOM.button( {className:"share-fb", onClick:genOnClick(urls.facebook),
						title:"Compartilhe essa questão no Facebook"}, 
						React.DOM.i( {className:"icon-facebook-square"}), " Facebook"
					),
					React.DOM.button( {className:"share-tw", onClick:genOnClick(urls.twitter),
						title:"Compartilhe essa questão no Twitter"}, 
						React.DOM.i( {className:"icon-twitter-square"}), " Twitter"
					)
				)
			)
		);
	},
});

var Markdown = React.createClass({displayName: 'Markdown',
	onClickBlackout: function () {
		$(this).fadeOut();
	},
	render: function () {
		var urls = {
			facebook: 'http://www.facebook.com/sharer.php?u='+encodeURIComponent(this.props.url)+
				'&ref=fbshare&t='+encodeURIComponent(this.props.title),
			gplus: 'https://plus.google.com/share?url='+encodeURIComponent(this.props.url),
			twitter: 'http://twitter.com/share?url='+encodeURIComponent(this.props.url)+
				'&ref=twitbtn&text='+encodeURIComponent(this.props.title),
		}

		function genOnClick(url) {
			return function () {
				window.open(url,"mywindow","menubar=1,resizable=1,width=500,height=500");
			};
		}

		return (
			React.DOM.div(null, 
				React.DOM.label(null, "Como usar Markdown"),
				React.DOM.p(null, 
					"Markdown é um conjunto de códigos para formatar o seu código."
				),
				React.DOM.table( {className:"table table-bordered"}, 
					React.DOM.thead(null, 
						React.DOM.tr(null, 
							React.DOM.th(null, "Resultado"),
							React.DOM.th(null, "Markdown")
						)
					),
					React.DOM.tr(null, 
						React.DOM.td(null, React.DOM.strong(null, "negrito")),
						React.DOM.td(null, "**negrito**")
					),
					React.DOM.tr(null, 
						React.DOM.td(null, React.DOM.a( {href:"#"}, "link")),
						React.DOM.td(null, "[link](http://)")
					),
					React.DOM.tr(null, 
						React.DOM.td(null, React.DOM.del(null, "Riscado")),
						React.DOM.td(null, "~~Riscado~~")
					)
				)
			)
		);
	},
});

module.exports.ShareDialog = function (data, onRender) {
	Modal(
		Share(data),
		"share-dialog",
		function (elm, component) {
			$(component.getDOMNode()).find('input').focus();
			onRender && onRender.call(this, elm, component);
		}
	);
};

module.exports.MarkdownDialog = function (data, onRender) {
	Modal(
		Markdown(data),
		"markdown-dialog",
		function (elm, component) {
			onRender && onRender.call(this, elm, component);
		}
	);
};