
# Refresh nested author objects related to a certain user, used in
# - Comments (info inside CommentTree.docs.author)
# - Posts (info inside Post.author and Post.participations.user)
# - Problem (info inside Problem.author) # TODO
# - Problem Sets # TODO

async = require 'async'
mongoose = require 'mongoose'
_ = require 'lodash'
TMERA = require 'app/lib/tmera'

CommentTree = mongoose.model 'CommentTree'
User = mongoose.model 'User'
Post = mongoose.model 'Post'

module.exports = (user, cb) ->

  updatePosts = (done) ->
    console.log "Refreshing authorship for #{user.id} aka #{user.username}"
    Post.update {'author.id':''+user.id},
      {$set: {author: User.toAuthorObject(user)}},
      {multi:true},
      (err, num) ->
        if err
          console.error(err)
        # console.log "Saving posts:", err, num
        done(err)

  updateParticipations = (done) ->

    getParticipations = (cb) ->
      Post.find {'participations.user.id':user.id}, (err, posts) ->
        if err
          throw err
        parts = _.map(posts, (post) ->
          userPart = _.find(post.participations, (p) -> p.user.id is user.id)
          if not userPart
            throw new Error("User part in post.participations no longer here.")
          [post._id, userPart._id] # part format
        )
        cb(parts)

    updateParticipation = (part, cb) ->
      Post.update {
        '_id': ''+part[0]
        'participations._id': ''+part[1]
      }, {
        'participations.$.user': User.toAuthorObject(user)
      }, (err, doc) ->
        # console.log('args',arguments)
        cb(err, doc)

    getParticipations (docs) ->
      async.map docs, ((doc, done) ->
        updateParticipation doc, (err, saved) ->
          if err
            throw err
          if not saved
            throw new Error("WTF")
          done()
      ), (err, results) ->
        done()

  # Update notification trees (too expensive?)
  updateNT = (done) ->

  # Update comment trees
  updateComments = (done) ->
    # console.log("Updating commenttree?")

    getCommentIds = (cb) ->
      CommentTree.find { # CommentTrees that user is in
        'docs.author.id': ''+user.ide
      }, (err, cts) ->
        if err
          throw err
        allcomments = _.flatten(_.pluck(cts, 'docs'))
        cb(_.filter(allcomments, (i) -> i.author.id is user.id))

    updateComment = (id, done) ->
      # README: this is just too fucking expensive
      CommentTree.update {
        'docs._id': ''+id
      }, {
        'docs.$.author': User.toAuthorObject(user)
      }, done

    getCommentIds (docs) ->
      # console.log(docs)
      async.map docs, ((doc, done) ->
        updateComment doc._id, (err, saved) ->
          if err
            throw err
          if not saved
            throw new Error("WTF")
          # console.log("Updated id:", doc._id)
          done()
      ), (err, results) ->
        done()

  updateCache = (done) ->
    user.updateCachedProfile(done)

  console.log "Updating user", user.name, "@"+user.username, user.id
  async.series [
    updatePosts,
    updateComments,
    updateParticipations
  ], (err, results) ->
    cb()
