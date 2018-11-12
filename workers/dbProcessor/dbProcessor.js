var amqp = require('amqplib/callback_api');

const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres@db:5432/adventureworks';
const rabbitMQConnectionString = process.env.RABBITMQ_URL || 'amqp://rabbitmq:rabbitmq@mq:5672';
const consumerTaskQueue = 'db_task_queue';
const producerTaskQueue = 'notification_task_queue';


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
      var reviewMeta = reviewObj.meta;
         
      console.log(" [x] Received object meta data:"+reviewObj.meta); 
      
      publishReviewDB(reviewObj, result => decideToSendNotification(result, conn, ch, reviewMeta));

      setTimeout(function() {
        console.log(" [x] Sent the review meta data to notification queue");
        ch.ack(msg);
      }, secs * 1000);
    }, {noAck: false});
  });
});

function publishReviewDB(reviewObj, callback) {
  var success=true;
  let id = 0;
  
  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(' [x] Error:'+err);
      return;
    }
      
    const query = prepareUpdateQuery(client, reviewObj);
    query.on('row', (row) => {
      id = JSON.stringify(row);
    });

    query.on('end', () => {
      done();
      console.log(" [x] Published review successfully with id:'%s'", id);
      return;
    });
  });    
  
  callback(success);
};

function decideToSendNotification(result, conn, ch, reviewMeta){
  if(result){
    console.log(" [x] Stored to db with published state successfully");
    sendToNotificationProcesser(conn, ch, reviewMeta);
  }
  else{
    console.log(" [x] Error storing review to db, will try again");
    //send bad response   
  } 
}

function sendToNotificationProcesser(conn, ch, reviewMeta){
  conn.createChannel(function(err, ch) {
    var q = producerTaskQueue;   
    ch.assertQueue(q, {durable: true});
    ch.sendToQueue(q, new Buffer(reviewMeta), {persistent: true});
    console.log(" [x] Sent review meta data to notification queue: '%s'", reviewMeta);
  });
  //setTimeout(function() { conn.close();}, 500);
};

function prepareUpdateQuery (client, reviewObj){
  //var reviewText = reviewObj.review;
  //var reviewMeta = reviewObj.meta;
  var reviewID = reviewObj.reviewID;

  //console.log(' [x] reviewID:%s', reviewID);

  //var reviewMetaObj=JSON.parse(reviewMeta);
  //const query = client.query('INSERT INTO production.productreview(productid, reviewername, emailaddress, comments, rating) values($1, $2, $3, $4, $5) RETURNING productreviewid', 
  //[parseInt(reviewMetaObj.productid), reviewMetaObj.name.toString(), reviewMetaObj.email.toString(), reviewText, parseInt(reviewMetaObj.rating)]);

  const query = client.query('UPDATE production.productreview SET status=($1) WHERE productreviewid=($2) RETURNING productreviewid', 
  [true, parseInt(reviewID)]);
  
  return query;
}


process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});