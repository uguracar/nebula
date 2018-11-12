var amqp = require('amqplib/callback_api');

const rabbitMQConnectionString = process.env.RABBITMQ_URL || 'amqp://rabbitmq:rabbitmq@mq:5672';
const consumerTaskQueue = 'review_task_queue';
const producerTaskQueue = 'db_task_queue';


amqp.connect(rabbitMQConnectionString, function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = consumerTaskQueue;

    ch.assertQueue(q, {durable: true});
    ch.prefetch(1);
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
    
    ch.consume(q, function(msg) {
      var secs = msg.content.toString().split('.').length - 1;

      console.log(" [x] Received review object: %s", msg.content);
      var reviewObj=JSON.parse(msg.content);
      var reviewText = reviewObj.review.toString();
      //var reviewMeta = reviewObj.meta.toString();
      console.log(" [x] Received review text: %s", reviewText);
      
      reviewProcessor(reviewText, result => decidePublishingOnDB(result, conn, ch, msg.content));

      setTimeout(function() {
        console.log(" [x] Done");
        ch.ack(msg);
      }, secs * 1000);
    }, {noAck: false});
  });
});

function reviewProcessor(reviewText, callback) {
  var properLanguage=true;
  if (reviewText.indexOf('bad') !== -1){
     properLanguage = false;
  }
  console.log(" [x] Reviewing inappropriate language in the text:" + reviewText);
  callback(properLanguage);
};

function decidePublishingOnDB(result, conn, ch, reviewMeta){
  if(result){
    console.log(" [x] Passed inappropriate language review, now will send review to db worker queue");
    sendToDbProcesser(conn, ch, reviewMeta);
  }
  else{
    console.log(" [x] Failed inappropriate language review, keep review in archive state");   
  } 
}

function sendToDbProcesser(conn, ch, reviewMeta){
  conn.createChannel(function(err, ch) {
    var q = producerTaskQueue;   
    ch.assertQueue(q, {durable: true});
    ch.sendToQueue(q, new Buffer(reviewMeta), {persistent: true});
    console.log(" [x] Sent review data to DB processor queue: '%s'", reviewMeta);
  });
  //setTimeout(function() { conn.close();}, 500);
};



process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});