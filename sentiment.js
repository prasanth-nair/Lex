'use strict';

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var comprehend = new AWS.Comprehend({ apiVersion: '2017-11-27' });

module.exports = function (msg) {
    return new Promise(
        function (resolve, reject) {

            var params = {
                LanguageCode: 'en', /* required */
                Text: msg, /* required */
            }
            comprehend.detectSentiment(params, function (err, data) {
                if (err) {
                    return reject(err);
                }
                else {
                    return resolve(data);
                }
            });
        }
    );
};

