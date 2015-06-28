
var React = require('react');
var $ = require('jquery');
require('autosize');

/**
 * Textarea that autosizes. No newlines allowed.
 */
var LineInput = React.createClass({
  displayName: 'LineInput',

  propTypes: {
    defaultValue: React.PropTypes.string,
  },

  componentDidMount: function () {
    setTimeout(function () {
      $(this.refs.textarea.getDOMNode()).autosize();
    }.bind(this), 1);


    $(this.refs.textarea.getDOMNode()).on('input keyup keypress', (e) => {
      // Prevent newlines.
      if ((e.keyCode || e.charCode) === 13) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (this.props.onChange) {
        this.props.onChange(this.getValue());
      }
    });
  },

  componentWillUnmount: function () {
    $(this.refs.textarea.getDOMNode()).trigger('autosize.destroy');
  },

  getValue: function () {
    return this.refs.textarea.getDOMNode().value;
  },

  setValue: function (value) {
    this.refs.textarea.getDOMNode().value = value;
    setTimeout(() => {
      $(this.refs.textarea.getDOMNode()).trigger('autosize.resize')
    }, 10)
  },

  render: function() {
    return (
      <textarea ref="textarea"
        className={"lineInput "+(this.props.className||'')}
        placeholder={this.props.placeholder}
        data-placeholder={this.props.placeholder}
        defaultValue={ _.unescape(this.props.defaultValue)}>
      </textarea>
    );
  }
});

module.exports = LineInput;