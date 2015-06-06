
var React = require('react');
require('autosize');

/**
 * Textarea that autosizes. No newlines allowed.
 */
var LineInput = React.createClass({
  displayName: 'LineInput',

  propTypes: {
    value: React.PropTypes.string,
  },

  componentDidMount: function () {
    setTimeout(function () {
      $(this.refs.textarea.getDOMNode()).autosize();
    }.bind(this), 1);


    $(this.refs.textarea.getDOMNode()).on('input keyup keypress', function (e) {
      // Prevent newlines.
      if ((e.keyCode || e.charCode) === 13) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }.bind(this));
  },

  componentWillUnmount: function () {
    $(this.refs.textarea.getDOMNode()).trigger('autosize.destroy');
  },

  getValue: function () {
    return this.refs.textarea.getDOMNode().value;
  },

  render: function() {
    return (
      <textarea ref="textarea"
        className={this.props.className}
        placeholder={this.props.placeholder}
        data-placeholder={this.props.placeholder}
        defaultValue={ _.unescape(this.props.value)}>
      </textarea>
    );
  }
});

module.exports = LineInput;