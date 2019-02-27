'use strict';

var intentName = null;
var frequency = null;
var region = null;
var travelStartDate = null;
var travelEndDate = null;
var insuredCount = null;
var insuredAges = null;
var groupType = null;
var coverageType = null;
var quoteGenerated = null;
var quotePrice = null;
var privateInsurance = null;


var GetQuoteDetailsSlot = {
    "travelEndDate": null,
    "coverageType": null,
    "travelStartDate": null,
    "groupType": null,
    "region": null,
    "frequency": null,
    "insuredCount": null,
    "privateInsurance": null
};


// module.exports =  class SessionAttr {
module.exports = {

    intentName,
    frequency,
    region,
    travelStartDate,
    travelEndDate,
    insuredCount,
    insuredAges,
    groupType,
    coverageType,
    quoteGenerated,
    quotePrice,
    privateInsurance,
    GetQuoteDetailsSlot,

    printLogs(msg) {
        console.log(msg, ' -> ',
            this.intentName,
            this.frequency,
            this.region,
            this.travelStartDate,
            this.travelEndDate,
            this.insuredCount,
            this.insuredAges,
            this.groupType,
            this.coverageType,
            this.quoteGenerated,
            this.quotePrice,
            this.privateInsurance,
            this.GetQuoteDetailsSlot
        )
    },

    init() {
        this.sessionCache = String(JSON.stringify({
            intentName: null,
            frequency: null,
            region: this.region,
            travelStartDate: null,
            travelEndDate: null,
            insuredCount: null,
            insuredAges: [],
            groupType: null,
            coverageType: null,
            quoteGenerated: false,
            quotePrice: {},
            privateInsurance: null,
        }))
        return this.sessionCache
    },

    setCache() {

        // set the values for the current session variables
        this.sessionCache = String(JSON.stringify({
            intentName: this.intentName,
            frequency: this.frequency,
            region: this.region,
            travelStartDate: this.travelStartDate,
            travelEndDate: this.travelEndDate,
            insuredCount: this.insuredCount,
            insuredAges: this.insuredAges,
            groupType: this.groupType,
            coverageType: this.coverageType,
            quoteGenerated: this.quoteGenerated,
            quotePrice: this.quotePrice,
            privateInsurance: this.privateInsurance,
        }));
        // set the slot values for calling elicit slot intents
        this.GetQuoteDetailsSlot = {
            "travelEndDate": this.travelEndDate,
            "coverageType": this.coverageType,
            "travelStartDate": this.travelStartDate,
            "groupType": this.groupType,
            "region": this.region,
            "frequency": this.frequency,
            "insuredCount": this.insuredCount,
            "privateInsurance": this.privateInsurance
        };
        // this.printLogs('setCache')

        return this.sessionCache
    },
    // Retrive the session values from Lex to local variables
    retrieveSession(intentName, sessionAttributes) {
        var currentCache = JSON.parse(sessionAttributes.currentQuote);
        this.intentName = intentName,
            this.frequency = currentCache.frequency,
            this.region = currentCache.region,
            this.travelStartDate = currentCache.travelStartDate,
            this.travelEndDate = currentCache.travelEndDate,
            this.insuredCount = currentCache.insuredCount,
            this.insuredAges = currentCache.insuredAges,
            this.groupType = currentCache.groupType,
            this.coverageType = currentCache.coverageType,
            this.quoteGenerated = currentCache.quoteGenerated,
            this.quotePrice = currentCache.quotePrice,
            this.privateInsurance = currentCache.privateInsurance
        // this.printLogs('retrieveSession')

    }
}




