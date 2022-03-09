const mongoose = require('mongoose')
const commentSchema = require('./comments')

// post schema
const postsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comments: [commentSchema]
}, {
  timestamps: true
})

module.exports = mongoose.model('Posts', postsSchema)
