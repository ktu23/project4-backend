// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for posts
const Posts = require('../models/posts')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existent document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { post: { title: '', text: 'foo' } } -> { post: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /posts
router.get('/posts', (req, res, next) => {
  // Posts.find()
  Posts.find(
  //   {
  //   owner: req.user._id
  // }
  )
    .populate('owner')
    // respond with status 200 and JSON of the posts
    .then(posts => res.status(200).json({ posts: posts }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// INDEX
// GET /myposts
router.get('/myposts', requireToken, (req, res, next) => {
  // Posts.find()
  Posts.find(
    {
      owner: req.user._id
    }
  )
    .populate('owner')
    // respond with status 200 and JSON of the posts
    .then(posts => res.status(200).json({ posts: posts }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /posts/5a7db6c74d55bc51bdf39793
router.get('/posts/:id', (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Posts.findById(req.params.id)
    .then(handle404)
    // if `findById` is successful, respond with 200 and "post" JSON
    .then(post => res.status(200).json({ post: post }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /posts
router.post('/posts', requireToken, (req, res, next) => {
  // set owner of new post to be current user
  // req.body.post.owner = req.user.id
  // req.body.post.owner = 'potato'
  // console.log(req.body.post)
  console.log(req.body)
  req.body.post.owner = req.user.id

  // Posts.create(req.body.post)
  Posts.create(req.body.post)
    // respond to succesful `create` with status 201 and JSON of new "post"
    .then(post => {
      res.status(201).json({ post })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /posts/5a7db6c74d55bc51bdf39793
router.patch('/posts/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  console.log('posts body', req.body)
  delete req.body.post.owner

  Posts.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the post's owner (post.owner)
    .then(post => requireOwnership(req, post))
    // updating post object with postData
    .then(post => post.updateOne(req.body.post))
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /posts/5a7db6c74d55bc51bdf39793
router.delete('/posts/:id', requireToken, (req, res, next) => {
  console.log('test')
  Posts.findById(req.params.id)
    .then(handle404)
    // ensure the signed in user (req.user.id) is the same as the post's owner (post.owner)
    .then(post => requireOwnership(req, post))
    // delete post from mongodb
    .then(post => post.deleteOne())
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
