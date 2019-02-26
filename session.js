'use strict';

var intentName;
var frequency;
var region;
var travelStartDate;
var travelEndDate;
var insuredCount;
var insuredAges;
var groupType;
var coverageType;
var quoteGenerated;
var quotePrice;
var privateInsurance;

// var slots4GetQuoteIntent =         {
//     "travelEndDate": this.travelEndDate,
//     "coverageType": this.coverageType,
//     "travelStartDate": this.travelStartDate,
//     "groupType": this.groupType,
//     "region": this.region,
//     "frequency": this.frequency,
//     "insuredCount": this.insuredCount,
//     "privateInsurance": this.privateInsurance
// },





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
        return this.sessionCache
    },
    //TODO rename set and get
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
    }
}




