
# src/models/answer

mongoose = require 'mongoose'
Resource = mongoose.model 'Resource'
AnswerSchema = new Resource.Schema {}
module.exports = Answer = Resource.discriminator('Answer', AnswerSchema)