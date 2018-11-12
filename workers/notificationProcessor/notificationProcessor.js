var amqp = require('amqplib/callback_api');

const rabbitMQConnectionString = process.env.RABBITMQ_URL || 'amqp://rabbitmq:rabbitmq@mq:5672';
const consumerTaskQueue = 'notification_task_queue';


amqp.connect(rabbitMQConnectionString, function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = consumerTaskQueue;

    ch.assertQueue(q, {durable: true});
    ch.prefetch(1);
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
    
    ch.consume(q, function(msg) {
      var secs = msg.content.toString().split('.').length - 1;
      console.log(" [x] Received %s", msg.content.toString());

      emailProcessor(msg.content, success => {
        if(success){
          console.log(" [x] Sent successfully");
        }
        else{
          console.log(" [x] Error on sending the email");  
        }
      });

      setTimeout(function() {
        console.log(" [x] Done");
        ch.ack(msg);
      }, secs * 1000);
    }, {noAck: false});
  });
});

function emailProcessor(reviewMeta, callback) {
  var success=true;
  var reviewObj=JSON.parse(reviewMeta);
  var reviewerName= reviewObj.name;
  var reviewerEmail = reviewObj.email;
  
  console.log(" [x] Sending email confirmation to reviewer %s <%s>", reviewerName, reviewerEmail);
  callback(success);
};

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});