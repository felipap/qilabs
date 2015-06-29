
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

    editor.getSession().setMode("ace/mode/markdown");

    // as taken from Tumblr
    // thank you, Tumblr :)

    editor.setShowPrintMargin(false);
    editor.renderer.setShowGutter(false);
    editor.renderer.setPadding(30);
    editor.renderer.setScrollMargin(20, 20);
    editor.setHighlightActiveLine(false);
    editor.setHighlightSelectedWord(false);
    editor.setBehavioursEnabled(false);
    editor.commands.removeCommands([
      "showSettingsMenu", "goToNextError", "goToPreviousError", "centerselection", "gotoline", "fold", "unfold", "toggleFoldWidget", "toggleParentFoldWidget", "foldall", "foldOther", "unfoldall", "findnext", " findprevious", "selectOrFindNext", "selectOrFindPrevious", "find", "overwrite", "togglerecording", "replaymacro", "jumptomatching", "selecttomatching", "removeline", "duplicateSelection", "sortlines", "togglecomment", "toggleBlockComment", "modifyNumberUp", "modifyNumberDown", "replace", "copylinesup", "movelinesup", "copylinesdown", "movelinesdown", "cut_or_delete", "blockoutdent", "blockindent", "splitline", "transposeletters", "touppercase", "tolowercase", "expandtoline", "joinlines", "inverSelection"]);
    editor.commands.addCommand({
      name: "uncommand",
      bindKey: {
        win: "",
        mac: "Ctrl-A|Ctrl-B|Ctrl-D|Ctrl-E|Ctrl-F|Ctrl-H|Ctrl-K|Ctrl-N|Ctrl-P|Ctrl-V"
      },
      exec: function () { return true },
      readOnly: true
    });

    editor.setOption("wrap", "free")
    editor.setAutoScrollEditorIntoView(true);
    if (this.props.minLines) {
      console.log(this.props.minLines)
      editor.setOption("minLines", this.props.minLines);
    }
    // editor.setOption("maxLines", 100);
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