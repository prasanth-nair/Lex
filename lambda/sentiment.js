'use strict';

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var comprehend = new AWS.Comprehend({ apiVersion: '2017-11-27' });

module.exports = function (msg) {
    var params = {
        LanguageCode: 'en', /* required */
        Text: msg, /* required */
    }
    debugger;
    comprehend.detectSentiment(params, function (err, data) {
        console.log('inside call')
        if (err) {
            console.log('ERROR : ', err, err.stack);
            return 'ERROR';
        }
        else {
            console.log(data);
            return data.Sentiment;
        }
    });
    return;
};

