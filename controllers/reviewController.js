'use strict';
var amqp = require('amqplib/callback_api');
var db = require('../db/dbOperations');
var parser = require('../utilities/parser');

const rabbitMQConnectionString = process.env.RABBITMQ_URL || 'amqp://rabbitmq:rabbitmq@mq:5672';


exports.create_a_review = function(req, res) {

  parser.collectRequestData(req, result => {
    let reviewID = 0;
        
    //save review to db with archive state by default
    db.saveReview(result, id => {
      if(id!= null){
        reviewID = id;
        var responseJSON = parser.prepareJSONResponse(id);
        responseJSON = JSON.stringify(responseJSON);
        console.log(" [x] Sent response to client:%s",responseJSON);
        res.end(responseJSON);

        //start review process
        result["reviewID"] = reviewID;
        var msg = JSON.stringify(result);
        sendReviewToQueue(msg);
      }
      else {
        console.log(" [x] Error occurred while saving review data to db");
        res.end("Error occurred during saving review to db");
      }
    });
  });    
};


exports.list_all_reviews = function(req, res) {
  console.log("List all reviews");
  res.send("Nebula list all reviews");
};

function sendReviewToQueue(msg)
{
    amqp.connect(rabbitMQConnectionString, function(err, conn){
      conn.createChannel(function(err, ch) {
            var q = 'review_task_queue';   
            ch.assertQueue(q, {durable: true});
            ch.sendToQueue(q, new Buffer(msg), {persistent: true});
            console.log(" [x] Sent '%s'", msg);
          });
        setTimeout(function() { conn.close(); }, 500);
    });
}










