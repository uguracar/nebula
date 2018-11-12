'use strict';



module.exports = function(app) {
  var review = require('../controllers/reviewController');

  app.route('/api/reviews')
    .get(review.list_all_reviews)
    .post(review.create_a_review);
};