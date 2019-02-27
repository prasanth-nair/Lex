'use strict';
const compri = require('./sentiment');


var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var comprehend = new AWS.Comprehend({ apiVersion: '2017-11-27' });

function functionA() {
    var abc = compri('I AM really upset about you')
        .then((res) => {
            console.log('promise resolved', res)
        })
        .catch((err) => {
            console.log('error : ', err)
        }

        );

};

functionA();


