'use strict';
const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://postgres@db:5432/adventureworks';


exports.saveReview = function(reviewObj, callback) {        
    var id=null;
    var reviewText = reviewObj.review;
    var reviewMeta = reviewObj.meta;
    
    console.log(" [x] Received review meta: %s", reviewMeta);
    console.log(" [x] Received review text: %s", reviewText);

    pg.connect(connectionString, (err, client, done) => {
        if(err) {
            done();
            console.log(' [x] Error:'+err);
            callback(id);
        }
        var reviewMetaObj=JSON.parse(reviewMeta);
        const query = client.query('INSERT INTO production.productreview(productid, reviewername, emailaddress, comments, rating, status) values($1, $2, $3, $4, $5, $6) RETURNING productreviewid', 
        [parseInt(reviewMetaObj.productid), reviewMetaObj.name.toString(), reviewMetaObj.email.toString(), reviewText, parseInt(reviewMetaObj.rating), false]);
        
        query.on('row', (row) => {
            id = row.productreviewid;
            console.log(" [x] Successfully saved review to db with archive state with id:'%s'", id);
        });

        query.on('end', () => {
            done(); 
            callback(id);
        });
    });    
};

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
});

function generateJSONData(productReview)
{
    var jsonData = {};
    var columnMetaData = "meta";
    var columnProductReview="review";
    jsonData[columnMetaData] = productReview[0];
    jsonData[columnProductReview] = productReview[1];
    return jsonData;
}