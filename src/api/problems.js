var Post, Problem, Resource, User, checks, defaultSanitizerOptions, dry, htmlEntities, mongoose, required, sanitizeBody, trim, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

required = require('src/lib/required.js');

Resource = mongoose.model('Resource');

_ = require('underscore');

User = Resource.model('User');

Post = Resource.model('Post');

Problem = Resource.model('Problem');

defaultSanitizerOptions = {
  allowedTags: ['h1', 'h2', 'b', 'em', 'strong', 'a', 'img', 'u', 'ul', 'li', 'blockquote', 'p', 'br', 'i'],
  allowedAttributes: {
    'a': ['href'],
    'img': ['src']
  },
  selfClosing: ['img', 'br'],
  transformTags: {
    'b': 'strong',
    'i': 'em'
  },
  exclusiveFilter: function(frame) {
    var _ref;
    return ((_ref = frame.tag) === 'a' || _ref === 'span') && !frame.text.trim();
  }
};

sanitizeBody = function(body, type) {
  var getSanitizerOptions, sanitizer, str;
  sanitizer = require('sanitize-html');
  getSanitizerOptions = function(type) {
    switch (type) {
      case Post.Types.Question:
        return _.extend({}, defaultSanitizerOptions, {
          allowedTags: ['b', 'em', 'strong', 'a', 'u', 'ul', 'blockquote', 'p', 'img', 'br', 'i', 'li']
        });
      case Post.Types.Answer:
        return _.extend({}, defaultSanitizerOptions, {
          allowedTags: ['b', 'em', 'strong', 'a', 'u', 'ul', 'blockquote', 'p', 'img', 'br', 'i', 'li']
        });
      default:
        return defaultSanitizerOptions;
    }
    return defaultSanitizerOptions;
  };
  str = sanitizer(body, getSanitizerOptions(type));
  str = str.replace(new RegExp("(<br \/>){2,}", "gi"), "<br />").replace(/<p>(<br \/>)?<\/p>/gi, '').replace(/<br \/><\/p>/gi, '</p>');
  console.log(body, str);
  return str;
};

htmlEntities = function(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

trim = function(str) {
  return str.replace(/(^\s+)|(\s+$)/gi, '');
};

dry = function(str) {
  return str.replace(/(\s{1})[\s]*/gi, '$1');
};

checks = {
  contentExists: function(content, res) {
    if (!content) {
      res.status(500).endJson({
        error: true,
        message: 'Ops.'
      });
      return null;
    }
    return content;
  },
  tags: function(_tags, res) {
    var tag, tags;
    if (!_tags || !_tags instanceof Array) {
      res.status(400).endJson({
        error: true,
        message: 'Selecione pelo menos um assunto relacionado a esse post.'
      });
      return null;
    }
    tags = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = _tags.length; _i < _len; _i++) {
        tag = _tags[_i];
        if (__indexOf.call(_.keys(res.app.locals.tagMap), tag) >= 0) {
          _results.push(tag);
        }
      }
      return _results;
    })();
    if (tags.length === 0) {
      res.status(400).endJson({
        error: true,
        message: 'Selecione pelo menos um assunto relacionado a esse post.'
      });
      return null;
    }
    return tags;
  },
  source: function(source, res) {
    console.log("Checking source", source);
    return source;
  },
  answers: function(answers, res) {
    console.log("Checking answers", answers);
    return answers;
  },
  title: function(title, res) {
    if (!title || !title.length) {
      res.status(400).endJson({
        error: true,
        message: 'Dê um título para a sua publicação.'
      });
      return null;
    }
    if (title.length < 10) {
      res.status(400).endJson({
        error: true,
        message: 'Hm... Esse título é muito pequeno. Escreva um com no mínimo 10 caracteres, ok?'
      });
      return null;
    }
    if (title.length > 100) {
      res.status(400).endJson({
        error: true,
        message: 'Hmm... esse título é muito grande. Escreva um de até 100 caracteres.'
      });
      return null;
    }
    title = title.replace('\n', '');
    return title;
  },
  body: function(body, res, max_length, min_length) {
    var plainText;
    if (max_length == null) {
      max_length = 20 * 1000;
    }
    if (min_length == null) {
      min_length = 20;
    }
    if (!body) {
      res.status(400).endJson({
        error: true,
        message: 'Escreva um corpo para a sua publicação.'
      });
      return null;
    }
    if (body.length > max_length) {
      res.status(400).endJson({
        error: true,
        message: 'Ops. Texto muito grande.'
      });
      return null;
    }
    plainText = body.replace(/(<([^>]+)>)/ig, "");
    if (plainText.length < min_length) {
      res.status(400).endJson({
        error: true,
        message: 'Ops. Texto muito pequeno.'
      });
      return null;
    }
    return body;
  },
  type: function(type, res) {
    var _ref;
    if (typeof type !== 'string' || (_ref = !type.toLowerCase(), __indexOf.call(_.keys(res.app.locals.postTypes), _ref) >= 0)) {
      return res.status(400).endJson({
        error: true,
        message: 'Tipo de publicação inválido.'
      });
    }
    return type[0].toUpperCase() + type.slice(1).toLowerCase();
  }
};

module.exports = {
  permissions: [required.login],
  '/:id': {
    get: function(req, res) {
      var id;
      if (!(id = req.paramToObjectId('id'))) {
        return;
      }
      console.log('oi');
      return Problem.findOne({
        _id: id
      }, req.handleErrResult(function(doc) {
        return res.endJson({
          data: doc
        });
      }));
    }
  }
};
