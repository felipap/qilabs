
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

module.exports = React.createClass({
	getInitialState: function () {
		return {
			EOF: false,
		};
	},
	//
	alertEOF: function () {
		this.setState({ EOF: true });
	},
	boundForceUpdate: function (e) {
		this.forceUpdate();
	},
	//
	componentWillMount: function() {
		if (this.props.collection) {
			this.bindNewCollection(this.props.collection);
		}
		$(document).scroll(_.throttle(function() {
			// Detect scroll up? http://stackoverflow.com/questions/9957860
			if ($(document).height() -
				($(window).scrollTop() + $(window).height()) < 50) {
				this.props.collection.tryFetchMore();
			}
		}.bind(this), 2000));
	},
	setTemplate: function (r) {
		this.props.template = r;
	},
	bindNewCollection: function (col) {
		col.on('add', this.boundForceUpdate, this);
		col.on('remove', this.boundForceUpdate, this);
		col.on('reset', this.boundForceUpdate, this);
		col.on('eof', this.alertEOF, this);
	},
	changeCollection: function (c) {
		// Unbind events from old.
		if (this.props.collection) {
			this.props.collection.off('add', this.boundForceUpdate, this);
			this.props.collection.off('remove', this.boundForceUpdate, this);
			this.props.collection.off('reset', this.boundForceUpdate, this);
			this.props.collection.off('eof', this.alertEOF, this);
		}
		// Bind from new!
		this.bindNewCollection(c);
		this.props.collection = c;
		if (this.props.collection.length) {
			this.forceUpdate();
		}
	},
	render: function () {
		if (!this.props.collection) {
			return (
				<div ref="stream" className="stream">123123</div>
			);
		}

		var template = this.props.template;
		var items = this.props.collection.map(function (doc) {
			return template({ model: doc, key: doc.id });
		});

		if (this.props.collection.length) {
			return (
				<div ref="stream" className="stream">
					{items}
					{
						this.state.EOF?
						<div className="stream-msg eof">
							<span data-toggle="tooltip" title="Fim. :)" data-placement="right">
								EOF.
							</span>
						</div>
						:<div className="stream-msg">
							<span style={{float:'right'}} id="stream-load-indicator" className="loader"><span className="loader-inner"></span></span>
						</div>
					}
				</div>
			);
		} else {
			return (
				<div ref="stream" className="stream">
					{
						(this.props.collection.eof && this.props.collection.isEmpty())?
						<div className="stream-msg">
							Nada por aqui. <i className="icon-sad"></i>
						</div>
						:<div className="stream-msg">
							<span style={{float:'right'}} id="stream-load-indicator" className="loader"><span className="loader-inner"></span></span>
						</div>
					}
				</div>
			);
		}
	},
});