
var React = require('react');
require('autosize');
require('pagedown-editor');
require('ace');
require('ace-md-mode');
require('ace-textmate-theme');
var Dialog = require('../lib/dialogs.jsx')

/**
 *
 * Required pagedown lib.
 */
var PagedownEditor = React.createClass({
  displayName: 'PagedownEditor',

  propTypes: {
    converter: React.PropTypes.func.isRequired,
    value: React.PropTypes.string,
  },

  componentDidMount: function () {
    this.editor = new Markdown.Editor(this.props.converter);
    this.editor.run();

    $(this.getDOMNode()).find('.wmd-help-button').click(() => {
      Dialog.PostEditHelp({})
    })

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
      <div className={(this.props.className||'')+" MarkdownEditor"}>
        <div className="pagedown-button-bar" id="wmd-button-bar"></div>
        <textarea ref="textarea" id="wmd-input"
          placeholder={this.props.placeholder}
          data-placeholder="Escreva o seu problema aqui."
          defaultValue={_.unescape(this.props.value)}></textarea>
      </div>
    );
  }
});

var AceEditor = React.createClass({
  displayName: 'AceEditor',

  propTypes: {
    converter: React.PropTypes.func.isRequired,
    value: React.PropTypes.string,
  },

  getInitialState: function () {
    return {
      tabIndex: 0,
    }
  },

  componentDidMount: function () {
    this._mountAce();
  },

  _mountAce: function () {
    ace.config.set("basePath", "/static/js");
    var editor = ace.edit('ace-editor');
    window.editor = this.editor = editor;

    editor.setTheme("ace/theme/textmate");
    editor.getSession().setMode("ace/mode/markdown");

    editor.renderer.setShowGutter(false)
    editor.setOption("wrap", "free")
    editor.setHighlightActiveLine(false)
    editor.renderer.setPadding(30)
    editor.renderer.setShowPrintMargin(false)

    editor.setAutoScrollEditorIntoView(true);
    editor.setOption("minLines", 5);
    editor.setOption("maxLines", 50);
  },

  componentDidUpdate: function () {
    window.Utils.refreshLatex();
  },

  getValue: function () {
    return this.editor.getValue();
  },

  render: function() {
    var genTabs = () => {

      var data = [
        ['Editar Markdown', 'src-button', 'icon-edit', 'Editar texto'],
        ['Visualizar', 'preview-button', 'icon-visibility', 'Visualizar markdown'],
      ];

      var items = _.map(data, (info, i) => {
        console.log(this.state.tabIndex, 'o', i)

        var isActive = this.state.tabIndex === i;

        var activate = () => { this.setState({ tabIndex: i }); }

        return (
          <div className={"tab "+(isActive?'active ':'')+info[1]} title={info[3]}
            onClick={activate}>
            <i className={info[2]}></i>
            <span className="tab-label">{info[0]}</span>
          </div>
        );
      })

      var pleaseHelp = () => {
        Dialog.PostEditHelp({})
      }

      return (
        <div className="tabs clearfix">
          {items}
          <div className="tab right" title="Ajuda"
            title="Como formatar usando markdown."
            onClick={pleaseHelp}>
            <i className="icon-help"></i>
          </div>
        </div>
      )
    };

    if (this.editor) {
      var html = Utils.renderMarkdown(this.editor.getValue())
    } else {
      var html = '';
    }

    return (
      <div className="MarkdownEditor AceEditor">
        {genTabs()}
        <div className="editor"
          style={this.state.tabIndex!==0?{display:"none"}:{}}>
          <div ref="textarea" id="ace-editor"
            dangerouslySetInnerHTML={{__html: _.unescape(this.props.value) }} />
        </div>
        <div className="preview"
          style={this.state.tabIndex!==1?{display:"none"}:{}}>
          <div className="" dangerouslySetInnerHTML={{__html: html }} />
        </div>
      </div>
    );
  }
});

module.exports = PagedownEditor;
module.exports = AceEditor;