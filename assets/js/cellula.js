(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Board, Bot, Circle, Drawable, FixedPole, Food, G, NeuralNet, Neuron, NeuronLayer, OneBody, Square, Triangle, Vec, acceleration, colorConfig, copy, dist, dist2, mm, mod, painter, _, _Bot,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

_ = require('lodash');

painter = {
  applyCanvasOptions: function(context, options) {
    if (options.fill === true) {
      return context.fillStyle = options.color || 'black';
    } else {
      context.strokeStyle = options.color || 'black';
      return context.lineWidth = options.width || 1;
    }
  },
  drawCircle: function(context, position, radius, options) {
    if (radius == null) {
      radius = 2;
    }
    if (options == null) {
      options = {};
    }
    this.applyCanvasOptions(context, options);
    context.beginPath();
    context.arc(position.x, position.y, radius, 0, 2 * Math.PI, true);
    if (options.fill) {
      return context.fill();
    } else {
      return context.stroke();
    }
  },
  drawLine: function(context, p1, p2, options) {
    if (options == null) {
      options = {};
    }
    this.applyCanvasOptions(context, options);
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    return context.stroke();
  },
  drawTriangle: function(context, p1, p2, p3, options) {
    if (options == null) {
      options = {};
    }
    this.applyCanvasOptions(context, options);
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.lineTo(p3.x, p3.y);
    context.closePath();
    return context.stroke();
  },
  clearRect: function(context, p1, p2) {
    return context.clearRect(p1.x, p1.y, p2.x, p2.y);
  },
  drawCenteredPolygon: function(context, center, points, angle, options) {
    var point, _i, _len, _ref;
    if (angle == null) {
      angle = 0;
    }
    if (options == null) {
      options = {};
    }
    this.applyCanvasOptions(context, options);
    context.save();
    context.translate(center.x, center.y);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    _ref = points.slice(1);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      point = _ref[_i];
      context.lineTo(point.x, point.y);
    }
    context.closePath();
    if (options.fill) {
      context.fill();
    } else {
      context.stroke();
    }
    return context.restore();
  },
  drawCrown: function(context, center, radius, angles, angle, options) {
    if (angles == null) {
      angles = [0, Math.PI * 2];
    }
    if (angle == null) {
      angle = 0;
    }
    if (options == null) {
      options = {};
    }
    this.applyCanvasOptions(context, options);
    context.save();
    context.translate(center.x, center.y);
    context.rotate(angle);
    context.beginPath();
    context.arc(0, 0, radius, angles[0], angles[1]);
    context.stroke();
    return context.restore();
  },
  drawPolygon: function(context, points, options) {
    var point, _i, _len, _ref;
    if (options == null) {
      options = {};
    }
    this.applyCanvasOptions(context, options);
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    _ref = points.slice(1);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      point = _ref[_i];
      context.lineTo(point.x, point.y);
    }
    context.lineTo(points[0].x, points[0].y);
    context.closePath();
    if (options.fill) {
      return context.fill();
    } else {
      return context.stroke;
    }
  },
  drawRectangle: function(context, p1, p2, angle, options) {
    if (angle == null) {
      angle = 0;
    }
    if (options == null) {
      options = {};
    }
    this.applyCanvasOptions(context, options);
    context.beginPath();
    if (angle !== 0) {
      context.save();
      context.translate((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      context.rotate(angle);
      context.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      context.restore();
    } else {
      context.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    }
    if (options.fill) {
      return context.fill();
    } else {
      return context.stroke();
    }
  },
  drawSizedRect: function(context, point, size, angle, options) {
    if (angle == null) {
      angle = 0;
    }
    if (options == null) {
      options = {};
    }
    this.applyCanvasOptions(context, options);
    context.beginPath();
    if (angle) {
      context.save();
      context.translate(point.x, point.y);
      context.rotate(angle);
      context.rect(-size.x / 2, -size.y / 2, size.x, size.y);
      context.restore();
    } else {
      context.rect(point.x - size.x / 2, point.y - size.y / 2, size.x, size.y);
    }
    if (options.fill) {
      return context.fill();
    } else {
      return context.stroke();
    }
  }
};

Vec = (function() {
  var constructor;

  function Vec() {}

  constructor = function(x, y) {
    this.x = x;
    this.y = y;
    return {
      isub: function(other) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
      },
      sub: function(other) {
        return new Vec(this.x - other.x, this.y - other.y);
      },
      iadd: function(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
      },
      add: function(other) {
        return new Vec(this.x + other.x, this.y + other.y);
      },
      imul: function(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
      },
      mul: function(scalar) {
        return new Vec(this.x * scalar, this.y * scalar);
      },
      idiv: function(scalar) {
        this.x /= scalar;
        this.y /= scalar;
        return this;
      },
      div: function(scalar) {
        return new Vec(this.x / scalar, this.y / scalar);
      },
      normalized: function() {
        var length;
        x = this.x;
        y = this.y;
        length = Math.sqrt(x * x + y * y);
        return new Vec(x / length, y / length);
      },
      normalize: function() {
        var length;
        x = this.x;
        y = this.y;
        length = Math.sqrt(x * x + y * y);
        this.x = x / length;
        this.y = y / length;
        return this;
      },
      length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
      },
      distance: function(other) {
        x = this.x - other.x;
        y = this.y - other.y;
        return Math.sqrt(x * x + y * y);
      },
      copy: function() {
        return new Vec(this.x, this.y);
      }
    };
  };

  return Vec;

})();

G = 1500.0;

acceleration = function(a, b) {
  var direction, length, normal;
  direction = a.sub(b);
  length = direction.length();
  normal = direction.normalized();
  return normal.mul(G / Math.pow(length, 2));
};

copy = function() {
  var name, result;
  result = {};
  for (name in this) {
    if (this[name].type === "Vector") {
      result[name] = this[name].copy();
    } else {
      result[name] = this[name];
    }
  }
  return result;
};

OneBody = function(name, obj) {
  var body, center, simulation;
  obj.body.copy = copy;
  body = obj.body.copy();
  center = new Vec(250, 100);
  simulation = new Simulation(name, {
    init: function(context) {
      body = obj.body.copy();
      context.dot(center, 5);
      context.dot(obj.body.position, 1);
    },
    step: function(context) {
      var previous;
      previous = body.copy();
      obj.step(center, body);
      context.line(previous.position, body.position);
    }
  });
};

mod = function(a, n) {
  return ((a % n) + n) % n;
};

dist2 = function(a, b) {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
};

dist = function(a, b) {
  return Math.sqrt(dist2(a, b));
};

mm = function(a, num, b) {
  if (b == null) {
    b = Infinity;
  }
  return Math.max(a, Math.min(num, b));
};

Drawable = (function() {
  Drawable.prototype.type = 'Drawable';

  Drawable.prototype.multipliers = {};

  Drawable.prototype.angle = 0;

  Drawable.prototype.position = {
    x: 0,
    y: 0
  };

  Drawable.prototype.angularSpeed = 0;

  function Drawable(position) {
    this.position = position != null ? position : {
      x: Math.floor(Math.random() * canvas.width),
      y: Math.floor(Math.random() * canvas.height)
    };
    this.vel = {
      x: 0,
      y: 0
    };
    this.acc = {
      x: 0,
      y: 0
    };
    this.angle = Math.random() * Math.PI * 2;
  }

  Drawable.prototype.render = function(context) {};

  Drawable.prototype.tic = function(step) {
    return this.angle += this.angularSpeed * step;
  };

  return Drawable;

})();

Circle = (function(_super) {
  __extends(Circle, _super);

  function Circle() {
    return Circle.__super__.constructor.apply(this, arguments);
  }

  Circle.prototype.render = function(context, color) {
    return painter.drawCircle(context, this.position, this.size, {
      color: this.color,
      fill: true
    });
  };

  return Circle;

})(Drawable);

Square = (function(_super) {
  __extends(Square, _super);

  function Square() {
    this.render = __bind(this.render, this);
    return Square.__super__.constructor.apply(this, arguments);
  }

  Square.prototype.render = function(context) {
    return painter.drawSizedRect(context, this.position, {
      x: this.size,
      y: this.size
    }, this.angle, {
      color: this.color,
      fill: true
    });
  };

  return Square;

})(Drawable);

Triangle = (function(_super) {
  __extends(Triangle, _super);

  function Triangle() {
    return Triangle.__super__.constructor.apply(this, arguments);
  }

  Triangle.prototype.render = function(context) {
    this.p1 = {
      x: 0,
      y: -1.154700 * this.size
    };
    this.p2 = {
      x: -this.size,
      y: 0.5773 * this.size
    };
    this.p3 = {
      x: this.size,
      y: 0.5773 * this.size
    };
    return painter.drawCenteredPolygon(context, this.position, [this.p1, this.p2, this.p3], this.angle, {
      color: this.color,
      fill: true
    });
  };

  return Triangle;

})(Drawable);

FixedPole = (function(_super) {
  __extends(FixedPole, _super);

  function FixedPole() {
    return FixedPole.__super__.constructor.apply(this, arguments);
  }

  FixedPole.prototype.color = 'grey';

  FixedPole.prototype.size = 70;

  FixedPole.prototype.tic = function(step) {
    return FixedPole.__super__.tic.apply(this, arguments);
  };

  return FixedPole;

})(Circle);

Food = (function(_super) {
  __extends(Food, _super);

  Food.prototype.size = 10;

  Food.prototype.color = '#AAA';

  function Food() {
    Food.__super__.constructor.apply(this, arguments);
    this.angularSpeed = Math.random() * 4 - 2;
  }

  Food.prototype.eat = function(eater) {
    return this.position = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height
    };
  };

  return Food;

})(Circle);

colorConfig = {
  bot: '#F5A',
  eliteBot: '#088',
  bestBot: 'black',
  food: '#CCC',
  selectedFood: '#F22'
};

_Bot = (function(_super) {
  __extends(_Bot, _super);

  _Bot.prototype.color = colorConfig.bot;

  _Bot.prototype.size = 5;

  _Bot.prototype.closestFood = null;

  function _Bot(position) {
    this.position = position;
    _Bot.__super__.constructor.apply(this, arguments);
    window.lastAdded = this;
    this.lastOutput = [0, 0];
    this.position = {
      x: 400,
      y: 400
    };
    this.old = _.clone(this.position);
    this.acc = {
      x: 0,
      y: 0
    };
    this.thrust = [];
  }

  _Bot.prototype.tic = function(step, tic) {
    var move, newFoodObj;
    newFoodObj = (function(_this) {
      return function() {
        var p, possible, _i, _len, _ref;
        possible = [];
        _ref = game.board.food;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          if (p !== _this && (!_this.closestPop || p !== _this.closestPop)) {
            possible.push(p);
          }
        }
        if (possible.length) {
          _this.closestPop = possible[Math.floor(Math.random() * possible.length)];
        }
        return console.log(_this.closestPop, possible);
      };
    })(this);
    move = (function(_this) {
      return function(pos) {
        var idealAngle;
        idealAngle = Math.atan2(pos.y - _this.position.y, pos.x - _this.position.x);
        if (Math.abs(idealAngle - _this.angle) < 0.1) {
          if (_this.speed) {
            _this.speed += (_this.speed - 30) * .005;
          } else {
            _this.speed = 70;
          }
        } else {
          _this.speed = 0;
        }
        if (idealAngle < _this.angle) {
          _this.angle = Math.min(idealAngle, _this.angle - .2);
        } else {
          _this.angle = Math.max(idealAngle, _this.angle + .2);
        }
        _this.position.x = mm(0, _this.position.x + _this.speed * Math.cos(_this.angle) * step, window.canvas.width);
        return _this.position.y = mm(0, _this.position.y + _this.speed * Math.sin(_this.angle) * step, window.canvas.height);
      };
    })(this);
    switch (this.status) {
      case 'feeding':
        this.speed = 0;
        this.sttsCount -= 1;
        if (this.sttsCount <= 0) {
          newFoodObj();
          return this.status = 'moving';
        }
        break;
      case 'moving':
        if (dist2(this.closestPop.position, this.position) < Math.pow(this.closestPop.size + this.size, 2)) {
          this.status = 'feeding';
          this.sttsCount = 200;
          this.speed = 0;
        }
        return move(this.closestPop.position);
      default:
        newFoodObj();
        if (this.closestPop) {
          return this.status = 'moving';
        }
    }
  };

  _Bot.prototype.render = function(context) {
    var opacity, radius, width;
    radius = this.size + 2 * this.fitness;
    opacity = (this.lastOutput[0] - this.lastOutput[1]) * 2;
    painter.drawCircle(context, this.position, radius, {
      width: 1,
      color: 'grey'
    });
    if (this.closestPop) {
      painter.drawLine(context, this.position, this.closestPop.position, {
        width: 1,
        color: '#AAA'
      });
    }
    if (this.closestFood) {
      width = 100 / Math.sqrt(Math.pow(this.closestFood.position.x - this.position.x, 2) + Math.pow(this.closestFood.position.y - this.position.y, 2));
      painter.drawLine(context, this.position, this.closestFood.position, {
        width: mm(0, width, 1),
        color: 'grey'
      });
    }
    _Bot.__super__.render.apply(this, arguments);
    this.p1 = {
      x: this.size / 2,
      y: 0
    };
    this.p2 = {
      x: -this.size * 2 / 3,
      y: this.size / 3
    };
    this.p3 = {
      x: -this.size * 2 / 3,
      y: -this.size / 3
    };
    return painter.drawCenteredPolygon(context, this.position, [this.p1, this.p2, this.p3], this.angle, {
      color: 'white',
      fill: true
    });
  };

  _Bot.prototype.foundFood = function() {
    return false;
  };

  return _Bot;

})(Circle);

Neuron = (function() {
  var sigmoid;

  sigmoid = function(netinput, response) {
    return 1 / (1 + Math.exp(-netinput / response));
  };

  function Neuron(nInputs) {
    var i;
    this.nInputs = nInputs;
    this.weights = (function() {
      var _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.nInputs; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(0);
      }
      return _results;
    }).call(this);
  }

  Neuron.prototype.fire = function(input) {
    var i, out, value, _i, _len;
    out = 0;
    console.assert(this.weights.length === input.length + 1, this.weights.length);
    for (i = _i = 0, _len = input.length; _i < _len; i = ++_i) {
      value = input[i];
      out += value * this.weights[i];
    }
    out += -1 * this.weights[this.weights.length - 1];
    return sigmoid(out, game.board.params.activationResponse);
  };

  Neuron.prototype.getWeights = function() {
    return this.weights;
  };

  Neuron.prototype.putWeights = function(weights) {
    return this.weights = weights.splice(0, this.nInputs + 1);
  };

  return Neuron;

})();

NeuronLayer = (function() {
  function NeuronLayer(nNeurons, nInputs) {
    var i;
    this.neurons = (function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= nNeurons ? _i < nNeurons : _i > nNeurons; i = 0 <= nNeurons ? ++_i : --_i) {
        _results.push(new Neuron(nInputs));
      }
      return _results;
    })();
  }

  NeuronLayer.prototype.calculate = function(input) {
    var neuron, output, _i, _len, _ref;
    output = [];
    _ref = this.neurons;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      neuron = _ref[_i];
      output.push(neuron.fire(input));
    }
    return output;
  };

  NeuronLayer.prototype.getWeights = function() {
    var neuron;
    return _.flatten((function() {
      var _i, _len, _ref, _results;
      _ref = this.neurons;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        neuron = _ref[_i];
        _results.push(neuron.getWeights());
      }
      return _results;
    }).call(this));
  };

  NeuronLayer.prototype.putWeights = function(weights) {
    var neuron, _i, _len, _ref, _results;
    _ref = this.neurons;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      neuron = _ref[_i];
      _results.push(neuron.putWeights(weights));
    }
    return _results;
  };

  return NeuronLayer;

})();

NeuralNet = (function() {
  function NeuralNet(layersConf, nInputs) {
    var e, i, _i, _len;
    this.layers = [];
    for (i = _i = 0, _len = layersConf.length; _i < _len; i = ++_i) {
      e = layersConf[i];
      this.layers.push(new NeuronLayer(e, i > 0 ? layersConf[i - 1] : nInputs));
    }
  }

  NeuralNet.prototype.getWeights = function() {
    var layer;
    return _.flatten((function() {
      var _i, _len, _ref, _results;
      _ref = this.layers;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        layer = _ref[_i];
        _results.push(layer.getWeights());
      }
      return _results;
    }).call(this));
  };

  NeuralNet.prototype.putWeights = function(weights) {
    var layer, _i, _len, _ref, _results, _weights;
    _weights = weights.slice(0);
    _ref = this.layers;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      layer = _ref[_i];
      _results.push(layer.putWeights(_weights));
    }
    return _results;
  };

  NeuralNet.prototype.fire = function(inputNeurons) {
    var layer, outputs, _i, _len, _ref;
    outputs = inputNeurons;
    _ref = this.layers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      layer = _ref[_i];
      outputs = layer.calculate(outputs);
    }
    return outputs;
  };

  return NeuralNet;

})();

Bot = (function(_super) {
  __extends(Bot, _super);

  function Bot(weights, params, color) {
    this.weights = weights;
    this.color = color != null ? color : this.color;
    Bot.__super__.constructor.call(this);
    this.speed = params.speed;
    this.fitness = 0;
    this.inEvidence = false;
    $(this).bind('toggleEvidence', (function(_this) {
      return function() {
        _this.inEvidence = !_this.inEvidence;
        return console.log('evidence?', _this.inEvidence);
      };
    })(this));
    this.nn = new NeuralNet(params.layersConf, params.nInputs);
    this.nn.putWeights(this.weights);
  }

  Bot.prototype.reset = function(params) {
    this.isElite = true;
    this.fitness = 0;
    this.speed = params.speed;
    return this.closestFood = null;
  };

  Bot.prototype.render = function(context) {
    var color;
    color = this.color;
    return Bot.__super__.render.call(this, context, color);
  };

  return Bot;

})(_Bot);

Board = (function() {
  var calcNumWeights, getChromoRoulette;

  Board.prototype.totalFitness = 0;

  Board.prototype.bestFitness = 0;

  Board.prototype.avgFitness = 0;

  Board.prototype.worstFitness = 0;

  Board.prototype.bestGenoma = null;

  calcNumWeights = function(matrix, nInputs) {
    var e, i, lastNum, numWeights, _i, _len;
    lastNum = nInputs;
    numWeights = 0;
    for (i = _i = 0, _len = matrix.length; _i < _len; i = ++_i) {
      e = matrix[i];
      numWeights += (lastNum + 1) * e;
      lastNum = e;
    }
    return numWeights;
  };

  Board.prototype.params = {
    activationResponse: 1,
    ticsPerGen: 2000,
    mutationRate: 0.1,
    foodDensity: 0.2,
    popSize: 1,
    crossoverRate: 0.7,
    maxMutationFactor: 0.3,
    nInputs: 1,
    speed: 20,
    layersConf: [5, 2],
    numWeights: null
  };

  Board.prototype.stats = {
    foodEaten: 0,
    genCount: 0
  };

  Board.prototype.leaveEvidence = function() {
    if (this.inEvidence) {
      this.inEvidence.inEvidence = false;
    }
    return game.panel.hide();
  };

  Board.prototype.showSpecs = function(pos) {
    var bot, stop, _i, _len, _ref, _ref1, _ref2;
    if (this.inEvidence) {
      if ((_ref = $(this.inEvidence)) != null) {
        _ref.trigger('toggleEvidence');
      }
    }
    this.inEvidence = null;
    stop = false;
    _ref1 = this.pop;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      bot = _ref1[_i];
      if (Math.pow(bot.size, 2) > dist2(pos, bot.position)) {
        stop = true;
        this.inEvidence = bot;
        if ((_ref2 = $(this.inEvidence)) != null) {
          _ref2.trigger('toggleEvidence');
        }
        game.panel.show();
      }
    }
    return window.canvasStop = stop;
  };

  Board.prototype.genRandBot = function() {
    var i2;
    return new Bot((function() {
      var _i, _ref, _results;
      _results = [];
      for (i2 = _i = 0, _ref = this.params.numWeights; 0 <= _ref ? _i < _ref : _i > _ref; i2 = 0 <= _ref ? ++_i : --_i) {
        _results.push(Math.random() - Math.random());
      }
      return _results;
    }).call(this), this.params);
  };

  Board.prototype.crossover = function(mum, dad) {
    var baby1, baby2, cp, i, _i, _j, _ref;
    if (mum === dad || this.params.crossoverRate < Math.random()) {
      return [mum.slice(0), dad.slice(0)];
    }
    baby1 = [];
    baby2 = [];
    cp = Math.floor(Math.random() * mum.length);
    for (i = _i = 0; 0 <= cp ? _i < cp : _i > cp; i = 0 <= cp ? ++_i : --_i) {
      baby1.push(mum[i]);
      baby2.push(dad[i]);
    }
    for (i = _j = cp, _ref = mum.length; cp <= _ref ? _j < _ref : _j > _ref; i = cp <= _ref ? ++_j : --_j) {
      baby1.push(dad[i]);
      baby2.push(mum[i]);
    }
    return [baby1, baby2];
  };

  Board.prototype.mutate = function(crom) {
    var e, i, mutated, _i, _len;
    mutated = false;
    for (i = _i = 0, _len = crom.length; _i < _len; i = ++_i) {
      e = crom[i];
      if (Math.random() < this.params.mutationRate) {
        crom[i] = mm(-this.params.maxMutationFactor, Math.random() - Math.random(), this.params.maxMutationFactor);
        mutated = true;
      }
    }
    if (mutated) {
      ++this.stats.mutated;
    }
    return crom;
  };

  getChromoRoulette = function(population) {
    var fitnessCount, g, slice, _i;
    slice = Math.random() * _.reduce(_.pluck(population, 'fitness'), (function(a, b) {
      return a + b;
    }));
    fitnessCount = 0;
    for (_i = population.length - 1; _i >= 0; _i += -1) {
      g = population[_i];
      fitnessCount += g.fitness;
      if (fitnessCount >= slice) {
        console.log('selected for roulette:', g.fitness);
        return g;
      }
    }
  };

  Board.prototype.makeNew = function(popSize, numWeights) {
    var i, _i;
    this.pop = [];
    for (i = _i = 0; 0 <= popSize ? _i < popSize : _i > popSize; i = 0 <= popSize ? ++_i : --_i) {
      this.pop.push(this.genRandBot());
    }
    return this.pop;
  };

  Board.prototype.epoch = function(oldpop) {
    var baby1, baby2, father, g, mother, newpop, sorted, _i, _len, _ref, _ref1;
    sorted = _.sortBy(oldpop, function(a) {
      return a.fitness;
    }).reverse();
    newpop = [];
    console.log('sorted: (%s)', sorted.length, _.map(sorted, (function(_this) {
      return function(e) {
        return (e.fitness / _this.params.foodDensity / e.speed / _this.params.ticsPerGen * _this.params.popSize * 10000).toFixed(1);
      };
    })(this)));
    _ref = sorted.slice(0, 6);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      g = _ref[_i];
      g.reset(this.params);
      newpop.push(g);
    }
    newpop.push(new Bot(this.mutate(sorted[0].weights.slice(0)), this.params, 'green'));
    newpop.push(new Bot(this.mutate(sorted[1].weights.slice(0)), this.params, 'green'));
    newpop.push(new Bot(this.mutate(sorted[2].weights.slice(0)), this.params, 'green'));
    newpop.push(new Bot(this.crossover(sorted[0].weights.slice(0), sorted[1].weights.slice(0))[0], this.params, 'yellow'));
    newpop.push(new Bot(this.crossover(sorted[0].weights.slice(0), sorted[2].weights.slice(0))[1], this.params, 'yellow'));
    this.stats.mutated = 0;
    while (newpop.length < this.params.popSize) {
      mother = getChromoRoulette(oldpop);
      father = getChromoRoulette(oldpop);
      if (mother.fitness === 0 || father.fitness === 0) {
        console.log('fitness 0. making random');
        mother = this.genRandBot();
      }
      _ref1 = this.crossover(mother.weights, father.weights), baby1 = _ref1[0], baby2 = _ref1[1];
      this.mutate(baby1);
      this.mutate(baby2);
      newpop.push(new Bot(baby1, this.params));
      newpop.push(new Bot(baby2, this.params));
    }
    console.log("mutated: " + this.stats.mutated + "/" + this.params.popSize);
    return newpop;
  };

  function Board() {
    var foodCount, i;
    this.params.numWeights = calcNumWeights(this.params.layersConf, this.params.nInputs);
    this.tics = this.stats.genCount = 0;
    this.makeNew(this.params.popSize, this.params.numWeights);
    foodCount = Math.round(this.params.foodDensity * canvas.height * canvas.width / 10000);
    console.log("Making " + foodCount + " of food for generation " + this.stats.genCount + ".");
    this.food = (function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= foodCount ? _i <= foodCount : _i >= foodCount; i = 0 <= foodCount ? ++_i : --_i) {
        _results.push(new Food());
      }
      return _results;
    })();
  }

  Board.prototype.tic = function(step) {
    var bestBot, bot, item, _i, _j, _len, _len1, _ref, _ref1, _results;
    bestBot = this.stats.topBot || this.pop[0];
    ++this.tics;
    _ref = this.pop;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      bot = _ref[_i];
      bot.tic(step, this.tics);
      if (bot.fitness > bestBot.fitness) {
        bestBot = bot;
      }
      if (bot.foundFood()) {
        ++bot.fitness;
        ++this.stats.foodEaten;
      }
    }
    this.stats.topBot = bestBot;
    _ref1 = this.food;
    _results = [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      item = _ref1[_j];
      _results.push(item.tic(step));
    }
    return _results;
  };

  Board.prototype.render = function(context) {
    var item, _i, _j, _len, _len1, _ref, _ref1, _results;
    painter.clearRect(context, {
      x: 0,
      y: 0
    }, {
      x: canvas.width,
      y: canvas.height
    });
    _ref = this.food;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      item = _ref[_i];
      item.render(context);
    }
    _ref1 = this.pop;
    _results = [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      item = _ref1[_j];
      _results.push(item.render(context));
    }
    return _results;
  };

  Board.prototype.reset = function() {
    var foodCount, i;
    ++this.stats.genCount;
    console.log("Ending generation " + this.stats.genCount + ". " + ((this.stats.foodEaten / this.params.popSize).toFixed(2)));
    $("#flags #lastEat").html((this.stats.foodEaten / this.params.popSize).toFixed(2));
    $("#flags #generation").html(this.stats.genCount);
    foodCount = Math.round(this.params.foodDensity * canvas.height * canvas.width / 10000);
    console.log("Making " + foodCount + " of food for generation " + this.stats.genCount + ".");
    this.food = (function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= foodCount ? _i <= foodCount : _i >= foodCount; i = 0 <= foodCount ? ++_i : --_i) {
        _results.push(new Food());
      }
      return _results;
    })();
    this.tics = this.stats.foodEaten = 0;
    return this.pop = this.epoch(this.pop);
  };

  return Board;

})();

module.exports = Board;



},{"lodash":3}],2:[function(require,module,exports){
var Board, Game;

Board = require('./board.coffee');

Game = (function() {
  var context, fps, fpsFilter, lastRender, lastTic, tps;

  fps = 0;

  tps = 0;

  lastTic = (new Date) * 1 - 1;

  lastRender = (new Date) * 1 - 1;

  fpsFilter = 50;

  context = null;

  Game.prototype._getMousePos = function(event) {
    var rect;
    rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  function Game() {
    var $parent;
    this.canvas = document.querySelector("canvas#cellular");
    window.canvas = this.canvas;
    $parent = $(this.canvas.parentElement);
    $parent.height($(document).height() - 5);
    this.canvas.width = $parent.width();
    this.canvas.height = $parent.height();
    context = this.canvas.getContext("2d");
    window.context = context;
    this.panel = $("#panel");
    this.board = new Board();
    $(this.canvas).bind('click', (function(_this) {
      return function(event) {
        return _this.board.showSpecs(_this._getMousePos(event));
      };
    })(this));
    window.canvasStop = false;
    $(document).keydown((function(_this) {
      return function(event) {
        if (event.keyCode === 32) {
          console.log('spacebar hit');
          window.canvasStop = !window.canvasStop;
          if (window.canvasStop) {
            return _this.panel.fadeIn();
          } else {
            return _this.panel.fadeOut();
          }
        }
      };
    })(this));
  }

  Game.prototype.loopTic = function() {
    var now;
    now = new Date();
    if (!window.canvasStop) {
      this.board.tic(1 / 50);
    }
    return window.setTimeout(((function(_this) {
      return function() {
        return _this.loopTic();
      };
    })(this)), 10);
  };

  Game.prototype.loopRender = function() {
    this.board.render(context);
    return window.AnimateOnFrameRate((function(_this) {
      return function() {
        return _this.loopRender();
      };
    })(this));
  };

  Game.prototype.start = function() {
    console.log("Start looping board", this.board, "with painter", this);
    this.loopTic();
    return this.loopRender();
  };

  return Game;

})();

window.AnimateOnFrameRate = (function() {
  return function(callback) {
    return window.setTimeout(callback, 1000 / 60);
  };
})();

window.onload = function() {
  window.game = new Game;
  window.game.start();
};

$("body").keydown(function(e) {
  switch (e.keyCode || e.keyCode) {
    case 37:
      return window.leftPressed = true;
    case 38:
      return window.upPressed = true;
    case 39:
      return window.rightPressed = true;
    case 40:
      return window.downPressed = true;
  }
});

$("body").keyup(function(e) {
  switch (e.keyCode || e.keyCode) {
    case 37:
      return window.leftPressed = false;
    case 38:
      return window.upPressed = false;
    case 39:
      return window.rightPressed = false;
    case 40:
      return window.downPressed = false;
  }
});



},{"./board.coffee":1}],3:[function(require,module,exports){
(function (global){
/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) lodash.com/license | Underscore.js 1.5.2 underscorejs.org/LICENSE
 * Build: `lodash underscore exports="amd,commonjs,global,node" -o ./dist/lodash.underscore.js`
 */
;(function(){function n(n,r,t){t=(t||0)-1;for(var e=n?n.length:0;++t<e;)if(n[t]===r)return t;return-1}function r(n,r){for(var t=n.m,e=r.m,u=-1,o=t.length;++u<o;){var i=t[u],f=e[u];if(i!==f){if(i>f||typeof i=="undefined")return 1;if(i<f||typeof f=="undefined")return-1}}return n.n-r.n}function t(n){return"\\"+yr[n]}function e(n,r,t){r||(r=0),typeof t=="undefined"&&(t=n?n.length:0);var e=-1;t=t-r||0;for(var u=Array(0>t?0:t);++e<t;)u[e]=n[r+e];return u}function u(n){return n instanceof u?n:new o(n)}function o(n,r){this.__chain__=!!r,this.__wrapped__=n
}function i(n){function r(){if(u){var n=e(u);Rr.apply(n,arguments)}if(this instanceof r){var i=f(t.prototype),n=t.apply(i,n||arguments);return O(n)?n:i}return t.apply(o,n||arguments)}var t=n[0],u=n[2],o=n[4];return r}function f(n){return O(n)?Br(n):{}}function a(n,r,t){if(typeof n!="function")return Y;if(typeof r=="undefined"||!("prototype"in n))return n;switch(t){case 1:return function(t){return n.call(r,t)};case 2:return function(t,e){return n.call(r,t,e)};case 3:return function(t,e,u){return n.call(r,t,e,u)
};case 4:return function(t,e,u,o){return n.call(r,t,e,u,o)}}return L(n,r)}function l(n){function r(){var n=p?a:this;if(o){var y=e(o);Rr.apply(y,arguments)}return(i||g)&&(y||(y=e(arguments)),i&&Rr.apply(y,i),g&&y.length<c)?(u|=16,l([t,h?u:-4&u,y,null,a,c])):(y||(y=arguments),s&&(t=n[v]),this instanceof r?(n=f(t.prototype),y=t.apply(n,y),O(y)?y:n):t.apply(n,y))}var t=n[0],u=n[1],o=n[2],i=n[3],a=n[4],c=n[5],p=1&u,s=2&u,g=4&u,h=8&u,v=t;return r}function c(n,r){for(var t=-1,e=m(),u=n?n.length:0,o=[];++t<u;){var i=n[t];
0>e(r,i)&&o.push(i)}return o}function p(n,r,t,e){e=(e||0)-1;for(var u=n?n.length:0,o=[];++e<u;){var i=n[e];if(i&&typeof i=="object"&&typeof i.length=="number"&&(Cr(i)||b(i))){r||(i=p(i,r,t));var f=-1,a=i.length,l=o.length;for(o.length+=a;++f<a;)o[l++]=i[f]}else t||o.push(i)}return o}function s(n,r,t,e){if(n===r)return 0!==n||1/n==1/r;if(n===n&&!(n&&vr[typeof n]||r&&vr[typeof r]))return false;if(null==n||null==r)return n===r;var o=Er.call(n),i=Er.call(r);if(o!=i)return false;switch(o){case lr:case cr:return+n==+r;
case pr:return n!=+n?r!=+r:0==n?1/n==1/r:n==+r;case gr:case hr:return n==r+""}if(i=o==ar,!i){var f=n instanceof u,a=r instanceof u;if(f||a)return s(f?n.__wrapped__:n,a?r.__wrapped__:r,t,e);if(o!=sr)return false;if(o=n.constructor,f=r.constructor,o!=f&&!(A(o)&&o instanceof o&&A(f)&&f instanceof f)&&"constructor"in n&&"constructor"in r)return false}for(t||(t=[]),e||(e=[]),o=t.length;o--;)if(t[o]==n)return e[o]==r;var l=true,c=0;if(t.push(n),e.push(r),i){if(c=r.length,l=c==n.length)for(;c--&&(l=s(n[c],r[c],t,e)););}else Kr(r,function(r,u,o){return Nr.call(o,u)?(c++,!(l=Nr.call(n,u)&&s(n[u],r,t,e))&&er):void 0
}),l&&Kr(n,function(n,r,t){return Nr.call(t,r)?!(l=-1<--c)&&er:void 0});return t.pop(),e.pop(),l}function g(n,r,t){for(var e=-1,u=m(),o=n?n.length:0,i=[],f=t?[]:i;++e<o;){var a=n[e],l=t?t(a,e,n):a;(r?!e||f[f.length-1]!==l:0>u(f,l))&&(t&&f.push(l),i.push(a))}return i}function h(n){return function(r,t,e){var u={};t=X(t,e,3),e=-1;var o=r?r.length:0;if(typeof o=="number")for(;++e<o;){var i=r[e];n(u,i,t(i,e,r),r)}else Lr(r,function(r,e,o){n(u,r,t(r,e,o),o)});return u}}function v(n,r,t,e,u,o){var f=16&r,a=32&r;
if(!(2&r||A(n)))throw new TypeError;return f&&!t.length&&(r&=-17,t=false),a&&!e.length&&(r&=-33,e=false),(1==r||17===r?i:l)([n,r,t,e,u,o])}function y(n){return Vr[n]}function m(){var r=(r=u.indexOf)===G?n:r;return r}function _(n){return typeof n=="function"&&Ar.test(n)}function d(n){return Gr[n]}function b(n){return n&&typeof n=="object"&&typeof n.length=="number"&&Er.call(n)==fr||false}function w(n){if(!n)return n;for(var r=1,t=arguments.length;r<t;r++){var e=arguments[r];if(e)for(var u in e)n[u]=e[u]}return n
}function j(n){if(!n)return n;for(var r=1,t=arguments.length;r<t;r++){var e=arguments[r];if(e)for(var u in e)"undefined"==typeof n[u]&&(n[u]=e[u])}return n}function x(n){var r=[];return Kr(n,function(n,t){A(n)&&r.push(t)}),r.sort()}function T(n){for(var r=-1,t=Ur(n),e=t.length,u={};++r<e;){var o=t[r];u[n[o]]=o}return u}function E(n){if(!n)return true;if(Cr(n)||N(n))return!n.length;for(var r in n)if(Nr.call(n,r))return false;return true}function A(n){return typeof n=="function"}function O(n){return!(!n||!vr[typeof n])
}function S(n){return typeof n=="number"||n&&typeof n=="object"&&Er.call(n)==pr||false}function N(n){return typeof n=="string"||n&&typeof n=="object"&&Er.call(n)==hr||false}function R(n){for(var r=-1,t=Ur(n),e=t.length,u=Array(e);++r<e;)u[r]=n[t[r]];return u}function k(n,r){var t=m(),e=n?n.length:0,u=false;return e&&typeof e=="number"?u=-1<t(n,r):Lr(n,function(n){return(u=n===r)&&er}),u}function B(n,r,t){var e=true;r=X(r,t,3),t=-1;var u=n?n.length:0;if(typeof u=="number")for(;++t<u&&(e=!!r(n[t],t,n)););else Lr(n,function(n,t,u){return!(e=!!r(n,t,u))&&er
});return e}function F(n,r,t){var e=[];r=X(r,t,3),t=-1;var u=n?n.length:0;if(typeof u=="number")for(;++t<u;){var o=n[t];r(o,t,n)&&e.push(o)}else Lr(n,function(n,t,u){r(n,t,u)&&e.push(n)});return e}function q(n,r,t){r=X(r,t,3),t=-1;var e=n?n.length:0;if(typeof e!="number"){var u;return Lr(n,function(n,t,e){return r(n,t,e)?(u=n,er):void 0}),u}for(;++t<e;){var o=n[t];if(r(o,t,n))return o}}function D(n,r,t){var e=-1,u=n?n.length:0;if(r=r&&typeof t=="undefined"?r:a(r,t,3),typeof u=="number")for(;++e<u&&r(n[e],e,n)!==er;);else Lr(n,r)
}function I(n,r){var t=n?n.length:0;if(typeof t=="number")for(;t--&&false!==r(n[t],t,n););else{var e=Ur(n),t=e.length;Lr(n,function(n,u,o){return u=e?e[--t]:--t,false===r(o[u],u,o)&&er})}}function M(n,r,t){var e=-1,u=n?n.length:0;if(r=X(r,t,3),typeof u=="number")for(var o=Array(u);++e<u;)o[e]=r(n[e],e,n);else o=[],Lr(n,function(n,t,u){o[++e]=r(n,t,u)});return o}function $(n,r,t){var e=-1/0,u=e;typeof r!="function"&&t&&t[r]===n&&(r=null);var o=-1,i=n?n.length:0;if(null==r&&typeof i=="number")for(;++o<i;)t=n[o],t>u&&(u=t);
else r=X(r,t,3),D(n,function(n,t,o){t=r(n,t,o),t>e&&(e=t,u=n)});return u}function W(n,r,t,e){if(!n)return t;var u=3>arguments.length;r=X(r,e,4);var o=-1,i=n.length;if(typeof i=="number")for(u&&(t=n[++o]);++o<i;)t=r(t,n[o],o,n);else Lr(n,function(n,e,o){t=u?(u=false,n):r(t,n,e,o)});return t}function z(n,r,t,e){var u=3>arguments.length;return r=X(r,e,4),I(n,function(n,e,o){t=u?(u=false,n):r(t,n,e,o)}),t}function C(n){var r=-1,t=n?n.length:0,e=Array(typeof t=="number"?t:0);return D(n,function(n){var t;t=++r,t=0+Sr(Wr()*(t-0+1)),e[r]=e[t],e[t]=n
}),e}function P(n,r,t){var e;r=X(r,t,3),t=-1;var u=n?n.length:0;if(typeof u=="number")for(;++t<u&&!(e=r(n[t],t,n)););else Lr(n,function(n,t,u){return(e=r(n,t,u))&&er});return!!e}function U(n,r,t){return t&&E(r)?rr:(t?q:F)(n,r)}function V(n,r,t){var u=0,o=n?n.length:0;if(typeof r!="number"&&null!=r){var i=-1;for(r=X(r,t,3);++i<o&&r(n[i],i,n);)u++}else if(u=r,null==u||t)return n?n[0]:rr;return e(n,0,$r(Mr(0,u),o))}function G(r,t,e){if(typeof e=="number"){var u=r?r.length:0;e=0>e?Mr(0,u+e):e||0}else if(e)return e=J(r,t),r[e]===t?e:-1;
return n(r,t,e)}function H(n,r,t){if(typeof r!="number"&&null!=r){var u=0,o=-1,i=n?n.length:0;for(r=X(r,t,3);++o<i&&r(n[o],o,n);)u++}else u=null==r||t?1:Mr(0,r);return e(n,u)}function J(n,r,t,e){var u=0,o=n?n.length:u;for(t=t?X(t,e,1):Y,r=t(r);u<o;)e=u+o>>>1,t(n[e])<r?u=e+1:o=e;return u}function K(n,r,t,e){return typeof r!="boolean"&&null!=r&&(e=t,t=typeof r!="function"&&e&&e[r]===n?null:r,r=false),null!=t&&(t=X(t,e,3)),g(n,r,t)}function L(n,r){return 2<arguments.length?v(n,17,e(arguments,2),null,r):v(n,1,null,null,r)
}function Q(n,r,t){var e,u,o,i,f,a,l,c=0,p=false,s=true;if(!A(n))throw new TypeError;if(r=Mr(0,r)||0,true===t)var g=true,s=false;else O(t)&&(g=t.leading,p="maxWait"in t&&(Mr(r,t.maxWait)||0),s="trailing"in t?t.trailing:s);var h=function(){var t=r-(nt()-i);0<t?a=setTimeout(h,t):(u&&clearTimeout(u),t=l,u=a=l=rr,t&&(c=nt(),o=n.apply(f,e),a||u||(e=f=null)))},v=function(){a&&clearTimeout(a),u=a=l=rr,(s||p!==r)&&(c=nt(),o=n.apply(f,e),a||u||(e=f=null))};return function(){if(e=arguments,i=nt(),f=this,l=s&&(a||!g),false===p)var t=g&&!a;
else{u||g||(c=i);var y=p-(i-c),m=0>=y;m?(u&&(u=clearTimeout(u)),c=i,o=n.apply(f,e)):u||(u=setTimeout(v,y))}return m&&a?a=clearTimeout(a):a||r===p||(a=setTimeout(h,r)),t&&(m=true,o=n.apply(f,e)),!m||a||u||(e=f=null),o}}function X(n,r,t){var e=typeof n;if(null==n||"function"==e)return a(n,r,t);if("object"!=e)return nr(n);var u=Ur(n);return function(r){for(var t=u.length,e=false;t--&&(e=r[u[t]]===n[u[t]]););return e}}function Y(n){return n}function Z(n){D(x(n),function(r){var t=u[r]=n[r];u.prototype[r]=function(){var n=[this.__wrapped__];
return Rr.apply(n,arguments),n=t.apply(u,n),this.__chain__?new o(n,true):n}})}function nr(n){return function(r){return r[n]}}var rr,tr=0,er={},ur=+new Date+"",or=/($^)/,ir=/['\n\r\t\u2028\u2029\\]/g,fr="[object Arguments]",ar="[object Array]",lr="[object Boolean]",cr="[object Date]",pr="[object Number]",sr="[object Object]",gr="[object RegExp]",hr="[object String]",vr={"boolean":false,"function":true,object:true,number:false,string:false,undefined:false},yr={"\\":"\\","'":"'","\n":"n","\r":"r","\t":"t","\u2028":"u2028","\u2029":"u2029"},mr=vr[typeof window]&&window||this,_r=vr[typeof exports]&&exports&&!exports.nodeType&&exports,dr=vr[typeof module]&&module&&!module.nodeType&&module,br=dr&&dr.exports===_r&&_r,wr=vr[typeof global]&&global;
!wr||wr.global!==wr&&wr.window!==wr||(mr=wr);var jr=[],xr=Object.prototype,Tr=mr._,Er=xr.toString,Ar=RegExp("^"+(Er+"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$"),Or=Math.ceil,Sr=Math.floor,Nr=xr.hasOwnProperty,Rr=jr.push,kr=xr.propertyIsEnumerable,Br=_(Br=Object.create)&&Br,Fr=_(Fr=Array.isArray)&&Fr,qr=mr.isFinite,Dr=mr.isNaN,Ir=_(Ir=Object.keys)&&Ir,Mr=Math.max,$r=Math.min,Wr=Math.random;o.prototype=u.prototype;var zr={};!function(){var n={0:1,length:1};zr.spliceObjects=(jr.splice.call(n,0,1),!n[0])
}(1),u.templateSettings={escape:/<%-([\s\S]+?)%>/g,evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,variable:""},Br||(f=function(){function n(){}return function(r){if(O(r)){n.prototype=r;var t=new n;n.prototype=null}return t||mr.Object()}}()),b(arguments)||(b=function(n){return n&&typeof n=="object"&&typeof n.length=="number"&&Nr.call(n,"callee")&&!kr.call(n,"callee")||false});var Cr=Fr||function(n){return n&&typeof n=="object"&&typeof n.length=="number"&&Er.call(n)==ar||false},Pr=function(n){var r,t=[];
if(!n||!vr[typeof n])return t;for(r in n)Nr.call(n,r)&&t.push(r);return t},Ur=Ir?function(n){return O(n)?Ir(n):[]}:Pr,Vr={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;"},Gr=T(Vr),Hr=RegExp("("+Ur(Gr).join("|")+")","g"),Jr=RegExp("["+Ur(Vr).join("")+"]","g"),Kr=function(n,r){var t;if(!n||!vr[typeof n])return n;for(t in n)if(r(n[t],t,n)===er)break;return n},Lr=function(n,r){var t;if(!n||!vr[typeof n])return n;for(t in n)if(Nr.call(n,t)&&r(n[t],t,n)===er)break;return n};A(/x/)&&(A=function(n){return typeof n=="function"&&"[object Function]"==Er.call(n)
});var Qr=h(function(n,r,t){Nr.call(n,t)?n[t]++:n[t]=1}),Xr=h(function(n,r,t){(Nr.call(n,t)?n[t]:n[t]=[]).push(r)}),Yr=h(function(n,r,t){n[t]=r}),Zr=M,nt=_(nt=Date.now)&&nt||function(){return(new Date).getTime()};u.after=function(n,r){if(!A(r))throw new TypeError;return function(){return 1>--n?r.apply(this,arguments):void 0}},u.bind=L,u.bindAll=function(n){for(var r=1<arguments.length?p(arguments,true,false,1):x(n),t=-1,e=r.length;++t<e;){var u=r[t];n[u]=v(n[u],1,null,null,n)}return n},u.chain=function(n){return n=new o(n),n.__chain__=true,n
},u.compact=function(n){for(var r=-1,t=n?n.length:0,e=[];++r<t;){var u=n[r];u&&e.push(u)}return e},u.compose=function(){for(var n=arguments,r=n.length;r--;)if(!A(n[r]))throw new TypeError;return function(){for(var r=arguments,t=n.length;t--;)r=[n[t].apply(this,r)];return r[0]}},u.countBy=Qr,u.debounce=Q,u.defaults=j,u.defer=function(n){if(!A(n))throw new TypeError;var r=e(arguments,1);return setTimeout(function(){n.apply(rr,r)},1)},u.delay=function(n,r){if(!A(n))throw new TypeError;var t=e(arguments,2);
return setTimeout(function(){n.apply(rr,t)},r)},u.difference=function(n){return c(n,p(arguments,true,true,1))},u.filter=F,u.flatten=function(n,r){return p(n,r)},u.forEach=D,u.functions=x,u.groupBy=Xr,u.indexBy=Yr,u.initial=function(n,r,t){var u=0,o=n?n.length:0;if(typeof r!="number"&&null!=r){var i=o;for(r=X(r,t,3);i--&&r(n[i],i,n);)u++}else u=null==r||t?1:r||u;return e(n,0,$r(Mr(0,o-u),o))},u.intersection=function(){for(var n=[],r=-1,t=arguments.length;++r<t;){var e=arguments[r];(Cr(e)||b(e))&&n.push(e)
}var u=n[0],o=-1,i=m(),f=u?u.length:0,a=[];n:for(;++o<f;)if(e=u[o],0>i(a,e)){for(r=t;--r;)if(0>i(n[r],e))continue n;a.push(e)}return a},u.invert=T,u.invoke=function(n,r){var t=e(arguments,2),u=-1,o=typeof r=="function",i=n?n.length:0,f=Array(typeof i=="number"?i:0);return D(n,function(n){f[++u]=(o?r:n[r]).apply(n,t)}),f},u.keys=Ur,u.map=M,u.max=$,u.memoize=function(n,r){var t={};return function(){var e=r?r.apply(this,arguments):ur+arguments[0];return Nr.call(t,e)?t[e]:t[e]=n.apply(this,arguments)
}},u.min=function(n,r,t){var e=1/0,u=e;typeof r!="function"&&t&&t[r]===n&&(r=null);var o=-1,i=n?n.length:0;if(null==r&&typeof i=="number")for(;++o<i;)t=n[o],t<u&&(u=t);else r=X(r,t,3),D(n,function(n,t,o){t=r(n,t,o),t<e&&(e=t,u=n)});return u},u.omit=function(n){var r=[];Kr(n,function(n,t){r.push(t)});for(var r=c(r,p(arguments,true,false,1)),t=-1,e=r.length,u={};++t<e;){var o=r[t];u[o]=n[o]}return u},u.once=function(n){var r,t;if(!A(n))throw new TypeError;return function(){return r?t:(r=true,t=n.apply(this,arguments),n=null,t)
}},u.pairs=function(n){for(var r=-1,t=Ur(n),e=t.length,u=Array(e);++r<e;){var o=t[r];u[r]=[o,n[o]]}return u},u.partial=function(n){return v(n,16,e(arguments,1))},u.pick=function(n){for(var r=-1,t=p(arguments,true,false,1),e=t.length,u={};++r<e;){var o=t[r];o in n&&(u[o]=n[o])}return u},u.pluck=Zr,u.range=function(n,r,t){n=+n||0,t=+t||1,null==r&&(r=n,n=0);var e=-1;r=Mr(0,Or((r-n)/t));for(var u=Array(r);++e<r;)u[e]=n,n+=t;return u},u.reject=function(n,r,t){return r=X(r,t,3),F(n,function(n,t,e){return!r(n,t,e)
})},u.rest=H,u.shuffle=C,u.sortBy=function(n,t,e){var u=-1,o=n?n.length:0,i=Array(typeof o=="number"?o:0);for(t=X(t,e,3),D(n,function(n,r,e){i[++u]={m:[t(n,r,e)],n:u,o:n}}),o=i.length,i.sort(r);o--;)i[o]=i[o].o;return i},u.tap=function(n,r){return r(n),n},u.throttle=function(n,r,t){var e=true,u=true;if(!A(n))throw new TypeError;return false===t?e=false:O(t)&&(e="leading"in t?t.leading:e,u="trailing"in t?t.trailing:u),t={},t.leading=e,t.maxWait=r,t.trailing=u,Q(n,r,t)},u.times=function(n,r,t){n=-1<(n=+n)?n:0;
var e=-1,u=Array(n);for(r=a(r,t,1);++e<n;)u[e]=r(e);return u},u.toArray=function(n){return Cr(n)?e(n):n&&typeof n.length=="number"?M(n):R(n)},u.union=function(){return g(p(arguments,true,true))},u.uniq=K,u.values=R,u.where=U,u.without=function(n){return c(n,e(arguments,1))},u.wrap=function(n,r){return v(r,16,[n])},u.zip=function(){for(var n=-1,r=$(Zr(arguments,"length")),t=Array(0>r?0:r);++n<r;)t[n]=Zr(arguments,n);return t},u.collect=M,u.drop=H,u.each=D,u.extend=w,u.methods=x,u.object=function(n,r){var t=-1,e=n?n.length:0,u={};
for(r||!e||Cr(n[0])||(r=[]);++t<e;){var o=n[t];r?u[o]=r[t]:o&&(u[o[0]]=o[1])}return u},u.select=F,u.tail=H,u.unique=K,u.clone=function(n){return O(n)?Cr(n)?e(n):w({},n):n},u.contains=k,u.escape=function(n){return null==n?"":(n+"").replace(Jr,y)},u.every=B,u.find=q,u.has=function(n,r){return n?Nr.call(n,r):false},u.identity=Y,u.indexOf=G,u.isArguments=b,u.isArray=Cr,u.isBoolean=function(n){return true===n||false===n||n&&typeof n=="object"&&Er.call(n)==lr||false},u.isDate=function(n){return n&&typeof n=="object"&&Er.call(n)==cr||false
},u.isElement=function(n){return n&&1===n.nodeType||false},u.isEmpty=E,u.isEqual=function(n,r){return s(n,r)},u.isFinite=function(n){return qr(n)&&!Dr(parseFloat(n))},u.isFunction=A,u.isNaN=function(n){return S(n)&&n!=+n},u.isNull=function(n){return null===n},u.isNumber=S,u.isObject=O,u.isRegExp=function(n){return n&&vr[typeof n]&&Er.call(n)==gr||false},u.isString=N,u.isUndefined=function(n){return typeof n=="undefined"},u.lastIndexOf=function(n,r,t){var e=n?n.length:0;for(typeof t=="number"&&(e=(0>t?Mr(0,e+t):$r(t,e-1))+1);e--;)if(n[e]===r)return e;
return-1},u.mixin=Z,u.noConflict=function(){return mr._=Tr,this},u.random=function(n,r){return null==n&&null==r&&(r=1),n=+n||0,null==r?(r=n,n=0):r=+r||0,n+Sr(Wr()*(r-n+1))},u.reduce=W,u.reduceRight=z,u.result=function(n,r){if(n){var t=n[r];return A(t)?n[r]():t}},u.size=function(n){var r=n?n.length:0;return typeof r=="number"?r:Ur(n).length},u.some=P,u.sortedIndex=J,u.template=function(n,r,e){var o=u,i=o.templateSettings;n=(n||"")+"",e=j({},e,i);var f=0,a="__p+='",i=e.variable;n.replace(RegExp((e.escape||or).source+"|"+(e.interpolate||or).source+"|"+(e.evaluate||or).source+"|$","g"),function(r,e,u,o,i){return a+=n.slice(f,i).replace(ir,t),e&&(a+="'+_.escape("+e+")+'"),o&&(a+="';"+o+";\n__p+='"),u&&(a+="'+((__t=("+u+"))==null?'':__t)+'"),f=i+r.length,r
}),a+="';",i||(i="obj",a="with("+i+"||{}){"+a+"}"),a="function("+i+"){var __t,__p='',__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}"+a+"return __p}";try{var l=Function("_","return "+a)(o)}catch(c){throw c.source=a,c}return r?l(r):(l.source=a,l)},u.unescape=function(n){return null==n?"":(n+"").replace(Hr,d)},u.uniqueId=function(n){var r=++tr+"";return n?n+r:r},u.all=B,u.any=P,u.detect=q,u.findWhere=function(n,r){return U(n,r,true)},u.foldl=W,u.foldr=z,u.include=k,u.inject=W,u.first=V,u.last=function(n,r,t){var u=0,o=n?n.length:0;
if(typeof r!="number"&&null!=r){var i=o;for(r=X(r,t,3);i--&&r(n[i],i,n);)u++}else if(u=r,null==u||t)return n?n[o-1]:rr;return e(n,Mr(0,o-u))},u.sample=function(n,r,t){return n&&typeof n.length!="number"&&(n=R(n)),null==r||t?n?n[0+Sr(Wr()*(n.length-1-0+1))]:rr:(n=C(n),n.length=$r(Mr(0,r),n.length),n)},u.take=V,u.head=V,Z(u),u.VERSION="2.4.1",u.prototype.chain=function(){return this.__chain__=true,this},u.prototype.value=function(){return this.__wrapped__},D("pop push reverse shift sort splice unshift".split(" "),function(n){var r=jr[n];
u.prototype[n]=function(){var n=this.__wrapped__;return r.apply(n,arguments),zr.spliceObjects||0!==n.length||delete n[0],this}}),D(["concat","join","slice"],function(n){var r=jr[n];u.prototype[n]=function(){var n=r.apply(this.__wrapped__,arguments);return this.__chain__&&(n=new o(n),n.__chain__=true),n}}),typeof define=="function"&&typeof define.amd=="object"&&define.amd?(mr._=u, define(function(){return u})):_r&&dr?br?(dr.exports=u)._=u:_r._=u:mr._=u}).call(this);
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[2]);