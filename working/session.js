'use strict';

// module.exports =  class SessionAttr {
module.exports = {

    init() {
        this.sessionCache = String(JSON.stringify({
            intentName: null,
            frequency: null,
            region: null,
            travelStartDate: null,
            travelEndDate: null,
            insuredCount: null,
            insuredAges: [],
            groupType: null,
            coverageType: null,
            suggestedRegion: null
        }))
        return this.sessionCache
    },

    setCache(intentName, frequency, region, travelStartDate, travelEndDate, insuredCount, insuredAges, groupType, coverageType, suggestedRegion) {
        this.sessionCache = String(JSON.stringify({
            intentName: intentName,
            frequency: frequency,
            region: region,
            travelStartDate: travelStartDate,
            travelEndDate: travelEndDate,
            insuredCount: insuredCount,
            insuredAges: insuredAges,
            groupType: groupType,
            coverageType: coverageType,
            suggestedRegion: suggestedRegion
        }));
        return this.sessionCache

    }

}

// module.exports = session;