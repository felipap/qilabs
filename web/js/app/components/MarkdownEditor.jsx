
var React = require('react');
require('autosize');
require('pagedown-editor');
require('ace');
require('ace-md-mode');
var Dialog = require('../lib/dialogs.jsx')


var S3Upload = (function() {

  S3Upload.prototype.s3_object_name = 'default_name';
  S3Upload.prototype.s3_sign_put_url = '/signS3put';
  S3Upload.prototype.file_dom_selector = 'file_upload';

  S3Upload.prototype.onFinishS3Put = function(public_url) {
    return console.log('base.onFinishS3Put()', public_url);
  };

  S3Upload.prototype.onProgress = function(percent, status) {
    return console.log('base.onProgress()', percent, status);
  };

  S3Upload.prototype.onError = function(status) {
    return console.log('base.onError()', status);
  };

  function S3Upload(files, options) {
    if (options === null) options = {};
    for (option in options) {
      this[option] = options[option];
    }
    // this.handleFileSelect(document.getElementById(this.file_dom_selector));
    this.handleFileSelect(files);
  }

  S3Upload.prototype.handleFileSelect = function(files) {
    var f, files, output, _i, _len, _results;
    this.onProgress(0, 'Upload started.');
    // files = file_element.files;
    output = [];
    _results = [];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      f = files[_i];
      _results.push(this.uploadFile(f));
    }
    return _results;
  };

  S3Upload.prototype.createCORSRequest = function(method, url) {
    var xhr;
    xhr = new XMLHttpRequest();
    if (xhr.withCredentials != null) {
      xhr.open(method, url, true);
    } else if (typeof XDomainRequest !== "undefined") {
      xhr = new XDomainRequest();
      xhr.open(method, url);
    } else {
      xhr = null;
    }
    return xhr;
  };

  S3Upload.prototype.executeOnSignedUrl = function(file, callback) {
    var this_s3upload, xhr;
    this_s3upload = this;
    xhr = new XMLHttpRequest();
    xhr.open('GET', this.s3_sign_put_url + '?s3_object_type=' + file.type + '&s3_object_name=' + this.s3_object_name, true);
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.onreadystatechange = function(e) {
      var result;
      if (this.readyState === 4 && this.status === 200) {
        try {
          result = JSON.parse(this.responseText);
        } catch (error) {
          this_s3upload.onError('Signing server returned some ugly/empty JSON: "' + this.responseText + '"');
          return false;
        }
        return callback(decodeURIComponent(result.signed_request), result.url);
      } else if (this.readyState === 4 && this.status !== 200) {
        return this_s3upload.onError('Could not contact request signing server. Status = ' + this.status);
      }
    };
    return xhr.send();
  };

  S3Upload.prototype.uploadToS3 = function(file, url, public_url) {
    var this_s3upload, xhr;
    this_s3upload = this;
    console.log('you say', arguments)
    xhr = this.createCORSRequest('PUT', url);
    if (!xhr) {
      this.onError('CORS not supported');
    } else {
      xhr.onload = function() {
        if (xhr.status === 200) {
          this_s3upload.onProgress(100, 'Arquivo enviado.');
          return this_s3upload.onFinishS3Put(public_url);
        } else {
          return this_s3upload.onError('Upload error: ' + xhr.status);
        }
      };
      xhr.onerror = function() {
        return this_s3upload.onError('XHR error.');
      };
      xhr.upload.onprogress = function(e) {
        var percentLoaded;
        if (e.lengthComputable) {
          percentLoaded = Math.round((e.loaded / e.total) * 100);
          return this_s3upload.onProgress(percentLoaded, percentLoaded === 100 ? 'Finalizing.' : 'Uploading.');
        }
      };
    }
    xhr.setRequestHeader('Content-Type', file.type || "image/jpeg");
    xhr.setRequestHeader('x-amz-acl', 'public-read');
    return xhr.send(file);
  };

  S3Upload.prototype.uploadFile = function(file) {
    var this_s3upload;
    this_s3upload = this;
    return this.executeOnSignedUrl(file, function(signedURL, publicURL) {
      return this_s3upload.uploadToS3(file, signedURL, publicURL);
    });
  };

  return S3Upload;
})();


var ImagesDisplay = React.createClass({
  render: function () {
    var images = _.map(this.props.children, (url) => {
      var removeImage = () => {
        if (confirm('Deseja remover essa imagem da publicação?')) {
          var all = this.props.children.slice();
          all.splice(all.indexOf(url),1);
          this.props.update(all);
        }
      }

      var openImage = function (e) {
        if (e.target.localName !== 'i') {
          console.log(arguments)
          window.open(url);
        }
      }

      return (
        <li key={url} onClick={openImage}>
          <div className="background" style={{backgroundImage: 'url('+url+')'}}>
          </div>
          <div className="backdrop"></div>
          <i className="close-btn icon-clear" onClick={removeImage}></i>
        </li>
      );
    });

    return (
      <div className="images-display">
        {images}
      </div>
    );
  }
});


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

    setTimeout(() => {
      $(this.refs.textarea.getDOMNode()).autosize();
    }, 1);
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
      uploaded: this.props.images || [],
    }
  },

  componentDidMount: function () {
    this._setupAce();
    this._setupDragNDrop();
  },

  writeAtCursor: function (text) {
    this.editor.insert("\n"+text+"\n")
  },

  _setupDragNDrop: function () {
    var me = this.getDOMNode()
    function undrag () {
      // $(this.getDOMNode()).removeClass('dragging');
    }

    function dragnothing (e) {
      // $(this.getDOMNode()).addClass('dragging');
      e.stopPropagation();
      e.preventDefault();
    }

    var self = this;

    function drop(e) {
      e.stopPropagation();
      e.preventDefault();

      if (self.state.uploaded.length >= 3)
        return;

      var dt = e.dataTransfer;
      var files = dt.files;
      console.log('files', files)
      var s3upload = new S3Upload(files, {
        file_dom_selector: 'files',
        s3_sign_put_url: '/api/posts/sign_img_s3',
        onProgress: function(percent, message) {
          Utils.flash.info('Upload progress: ' + percent + '% ' + message);
        },
        onFinishS3Put: function(public_url) {
          Utils.flash.info('Arquivo enviado.');
          // url_elem.value = public_url;
          // preview_elem.innerHTML = '<img src="'+public_url+'" style="width:300px;" />';
          // self.setState({ uploaded: self.state.uploaded.concat(public_url) })
          self.writeAtCursor("![]("+public_url+")\n");
        },
        onError: function(status) {
          Utils.flash.info('Upload error: ' + status);
        }
      });
    }

    me.addEventListener("dragenter", dragnothing.bind(this), false);
    me.addEventListener("dragover", dragnothing.bind(this), false);
    me.addEventListener("dragleave", undrag.bind(this), false);
    me.addEventListener("drop", drop.bind(this), false);
  },

  _setupAce: function () {
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
    // editor.setAutoScrollEditorIntoView(true);
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

    var markdown = _.unescape(this.props.value || this.props.placeholder);

    return (
      <div className="MarkdownEditor AceEditor">
        {genTabs()}
        <div className="editor"
          style={this.state.tabIndex!==0?{display:"none"}:{}}>
          <div ref="textarea" id="ace-editor"
            dangerouslySetInnerHTML={{__html: markdown }} />
        </div>
        <div className="preview"
          style={this.state.tabIndex!==1?{display:"none"}:{}}>
          <div className="" dangerouslySetInnerHTML={{__html: html }} />
        </div>

        <ImagesDisplay ref="images" maxSize={1} update={this.updateUploaded}>
          {this.state.uploaded}
        </ImagesDisplay>
      </div>
    );
  }
});

module.exports = PagedownEditor;
module.exports = AceEditor;