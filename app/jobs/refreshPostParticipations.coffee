
# Refreshes a post.participation object, responsible for keeping track of who
# has commenteded in post, and how many times.

mongoose = require 'mongoose'
async = require 'async'
TMERA = require 'app/lib/tmera'
lodash = require 'lodash'

CommentTree = mongoose.model 'CommentTree'

module.exports = (post, cb) ->
  if !post.comment_tree
    return cb()

  CommentTree.findOne { _id: post.comment_tree }, TMERA (tree) ->
    counts = {}
    users = {}

    tree.docs.forEach (comment, done) ->
      counts[comment.author.id] = counts[comment.author.id]+1 or 1
      users[comment.author.id] ?= comment.author

    participations = ({ user: users[id], count: counts[id]} for id of users)
    post.participations = lodash.sortBy(participations, 'count')
    post.save cb