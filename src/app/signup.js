var bunyan, mongoose, required, winston, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

_ = require('underscore');

winston = require('winston');

bunyan = require('bunyan');

required = require('src/lib/required');

module.exports = function(app) {
  var router;
  router = require('express').Router();
  router.use(required.login);
  router.use(function(req, res, next) {
    return next();
  });
  router.get('/finish', function(req, res) {
    return res.redirect('/signup/finish/1');
  });
  router.route('/finish/1').get(function(req, res) {
    return res.render('app/signup_1');
  }).put(function(req, res) {
    var birthDay, birthMonth, birthYear, birthday, email, field, fields, nome, serie, sobrenome, validator, _i, _len, _ref;
    validator = require('validator');
    fields = 'nome sobrenome email school-year b-day b-month b-year'.split(' ');
    for (_i = 0, _len = fields.length; _i < _len; _i++) {
      field = fields[_i];
      if (typeof req.body[field] !== 'string') {
        return res.endJSON({
          error: true,
          message: "Formulário incompleto."
        });
      }
    }
    nome = validator.trim(req.body.nome).split(' ')[0];
    sobrenome = validator.trim(req.body.sobrenome).split(' ')[0];
    email = validator.trim(req.body.email);
    serie = validator.trim(req.body['school-year']);
    birthDay = parseInt(req.body['b-day']);
    birthMonth = req.body['b-month'];
    birthYear = Math.max(Math.min(2005, parseInt(req.body['b-year'])), 1950);
    if (__indexOf.call('january february march april may june july august september october november december'.split(' '), birthMonth) < 0) {
      return res.endJSON({
        error: true,
        message: "Mês de nascimento inválido."
      });
    }
    birthday = new Date(birthDay + ' ' + birthMonth + ' ' + birthYear);
    req.user.profile.birthday = birthday;
    console.log(birthday);
    req.user.name = nome + ' ' + sobrenome;
    if (validator.isEmail(email)) {
      req.user.email = email;
    }
    if ((_ref = !serie) === '6-ef' || _ref === '7-ef' || _ref === '8-ef' || _ref === '9-ef' || _ref === '1-em' || _ref === '2-em' || _ref === '3-em' || _ref === 'faculdade') {
      return res.endJSON({
        error: true,
        message: 'Ano inválido.'
      });
    } else {
      req.user.profile.serie = serie;
    }
    return req.user.save(function(err) {
      if (err) {
        console.log(err);
        return res.endJSON({
          error: true
        });
      }
      return res.endJSON({
        error: false
      });
    });
  });
  router.route('/finish/2').get(function(req, res) {
    return res.render('app/signup_2');
  }).put(function(req, res) {
    var bio, home, location, trim;
    trim = function(str) {
      return str.replace(/(^\s+)|(\s+$)/gi, '');
    };
    if (req.body.bio) {
      bio = trim(req.body.bio.replace(/^\s+|\s+$/g, '').slice(0, 300));
      req.user.profile.bio = bio;
    } else {
      return res.endJSON({
        error: true,
        message: 'Escreva uma bio.'
      });
    }
    if (req.body.home) {
      home = trim(req.body.home.replace(/^\s+|\s+$/g, '').slice(0, 35));
      req.user.profile.home = home;
    } else {
      return res.endJSON({
        error: true,
        message: 'De onde você é?'
      });
    }
    if (req.body.location) {
      location = trim(req.body.location.replace(/^\s+|\s+$/g, '').slice(0, 35));
      req.user.profile.location = location;
    } else {
      return res.endJSON({
        error: true,
        message: 'O que você faz da vida?'
      });
    }
    return req.user.save(function(err) {
      if (err) {
        console.log(err);
        return res.endJSON({
          error: true
        });
      }
      req.session.signinUp = false;
      return res.endJSON({
        error: false
      });
    });
  });
  return router;
};
