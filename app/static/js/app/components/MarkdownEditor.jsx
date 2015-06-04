
var React = require('react');
require('autosize');

/**
 *
 * Required pagedown lib.
 */
var MarkdownEditor = React.createClass({
  displayName: 'MarkdownEditor',

  propTypes: {
    converter: React.PropTypes.func.isRequired,
    value: React.PropTypes.string,
  },

  componentDidMount: function () {
    this.editor = new Markdown.Editor(this.props.converter);
    this.editor.run();

    setTimeout(function () {
      // if (this.refs.textarea) {
        $(this.refs.textarea.getDOMNode()).autosize();
      // }
    }.bind(this), 1);
  },

  getValue: function () {
    return this.refs.textarea.getDOMNode().value;
  },

  render: function() {
    return (
      <div>
        <div className="pagedown-button-bar" id="wmd-button-bar"></div>
        <textarea ref="textarea" id="wmd-input"
          placeholder={this.props.placeholder}
          data-placeholder="Escreva o seu problema aqui."
          defaultValue={_.unescape(this.props.value)}></textarea>
      </div>
    );
  }

});

module.exports = MarkdownEditor;