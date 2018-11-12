'use strict';

exports.collectRequestData = function(request, callback) {
    //const FORM_URLENCODED = 'application/x-www-form-urlencoded';
    const FORM_URLENCODED = 'application/json';
    if(request.headers['content-type'] === FORM_URLENCODED) {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            var s = body.split('&');
            var jsonData = generateJSONData(s);
            callback(jsonData);
        });
    }
    else {
        callback(null);
    }
};

exports.prepareJSONResponse = function(uniqueid){
    var jsonData = {};
    var columnSuccess = "success";
    var columnReviewId="reviewID";
    jsonData[columnSuccess] = true;
    jsonData[columnReviewId] = uniqueid;
    return jsonData;
}

function generateJSONData(productReview)
{
    var jsonData = {};
    var columnMetaData = "meta";
    var columnProductReview="review";
    jsonData[columnMetaData] = productReview[0];
    jsonData[columnProductReview] = productReview[1];
    return jsonData;
}



