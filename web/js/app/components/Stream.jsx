
var $ = require('jquery')
var _ = require('lodash')
var React = require('react')

var Stream = React.createClass({

	getInitialState: function() {
		return {
			EOF: false,
		};
	},

	componentWillMount: function() {
		if (this.props.collection) {
			this._bindNewCollection(this.props.collection);
		}
		$(document).scroll(_.throttle(() => {
			// Detect scroll up? http://stackoverflow.com/questions/9957860
			if ($(document).height() -
				($(window).scrollTop() + $(window).height()) < 50) {
				this.props.collection.tryFetchMore();
			}
		}, 2000));
	},

	_bindNewCollection: function(collection) {
		collection.on('add remove reset', this._forceUpdate);
		collection.on('eof', this._alertEOF);
	},

	_forceUpdate: function() {
		this.forceUpdate();
	},

	_alertEOF: function() {
		this.setState({ EOF: true });
	},

	//

	setTemplate: function(r) {
		this.props.template = r;
	},

	setCollection: function(c) {
		if (this.props.collection) {
			// Unbind events from old.
			this.props.collection.off('add remove reset', this._forceUpdate);
			this.props.collection.off('eof', this._alertEOF);
		}
		// Bind from new!
		this._bindNewCollection(c);
		this.props.collection = c;
		if (this.props.collection.length) {
			this.forceUpdate();
		}
	},

	render: function() {
		if (!this.props.collection) {
			return (
				<div ref="stream" className="stream"></div>
			);
		}

		if (this.props.collection.length === 0) {
			if (this.props.collection.EOF && this.props.collection.isEmpty()) {
				return (
					<div ref="stream" className="stream">
						<div className="stream-msg">
							Nada por aqui. <i className="icon-sad"></i>
						</div>
					</div>
				);
			} else {
				return (
					<div ref="stream" className="stream">
						<div className="stream-msg" style={{textAlign: 'center'}}>
							<div className="circleLoader"><div /><div /></div>
						</div>
					</div>
				);
			}
		}

		var items = this.props.collection.map((doc) => {
			return this.props.template({ model: doc, key: doc.id });
		});

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
					:<div className="stream-msg" style={{textAlign: 'center'}}>
						<div className="circleLoader"><div /><div /></div>
					</div>
				}
			</div>
		);
	},
});

module.exports = Stream;