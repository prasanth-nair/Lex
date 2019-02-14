'use strict';
const session = require('./session');

/**
 *  Ths is a bot for collecting the user information for providing an insurance
 *  quote. Once the quote is selected, user will be prompted to purchase the quote
 *  by providing credit card info. 
 */

// --------------- Helpers that build all of the responses -----------------------


function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

function confirmIntent(sessionAttributes, intentName, slots, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ConfirmIntent',
            intentName,
            slots,
            message,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

// ---------------- Helper Functions --------------------------------------------------




// Calculation for quote value based on params
function generateQuote(frequency, region, travelStartDate, travelEndDate, insuredCount, discountType) {

    return {
        "reducedRate": 80,
        "standardRate": 100,
        "exceptionalRate": 160,
    }

}



function isValidDate(date) {
    return !(isNaN(Date.parse(date)));
}


function isValidFrequency(frequency) {
    const frequencyTypes = ['once', 'all year'];
    return (frequencyTypes.indexOf(frequency.toLowerCase()) > -1);
}


function isValidRegion(region) {
    const regionTypes = ['europe', 'world'];
    const europeanCountries = ['russia', 'germany', 'u.k.', 'france', 'italy', 'spain', 'ukraine', 'poland',
        'romania', 'netherlands', 'belgium', 'greece', 'czech republic', 'portugal',
        'sweden', 'hungary', 'belarus', 'austria', 'serbia', 'switzerland', 'bulgaria',
        'denmark', 'finland', 'slovakia', 'norway', 'ireland', 'croatia', 'moldova',
        'bosnia & herzegovina', 'albania', 'lithuania', 'tfyr macedonia', 'slovenia',
        'latvia', 'estonia', 'montenegro', 'luxembourg', 'malta', 'iceland', 'andorra',
        'monaco', 'liechtenstein', 'san marino', 'holy see'];
    return (regionTypes.indexOf(region.toLowerCase()) > -1);
}


function isValidInsuredCount(insuredCount) {
    return !(isNaN(insuredCount));
}


function isValidCoverageType(coverageType) {
    const coverageTypes = ['reduced', 'standard', 'exceptional'];
    return (coverageTypes.indexOf(coverageType.toLowerCase()) > -1);
}

function isValidDiscountType(discountType) {
    const discountTypes = ['couple', 'family'];
    return (discountTypes.indexOf(discountType.toLowerCase()) > -1);
}


function getDayDifference(earlierDate, laterDate) {
    const laterDateInDaysSinceEpoch = new Date(laterDate).getTime() / 86400000;
    const earlierDateInDaysSinceEpoch = new Date(earlierDate).getTime() / 86400000;
    return Number(laterDateInDaysSinceEpoch - earlierDateInDaysSinceEpoch).toFixed(0);
}

function addDays(date, numberOfDays) {
    const newDate = new Date(date);
    newDate.setTime(newDate.getTime() + (86400000 * numberOfDays));
    return `${newDate.getFullYear()}-${newDate.getMonth() + 1}-${newDate.getDate()}`;
}

function buildValidationResult(isValid, violatedSlot, messageContent) {
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

//***************** validation for Dialog Flow for intents ***********************************/

// Validation rules for GetCoverageDetails


function validateQuoteParams(slots) {
    const frequency = slots.frequency;
    const region = slots.region;
    const travelStartDate = slots.travelStartDate;
    const travelEndDate = slots.travelEndDate;
    const insuredCount = slots.insuredCount;
    const discountType = slots.discountType;
    const coverageType = slots.coverageType;

    if (frequency) {
        if (!isValidFrequency(frequency)) {
            return buildValidationResult(false, 'frequency', 'I did not understand how frequently you travel.  Please suggest if you like coverage for single trip or full year trip?');
        }
    }

    if (region) {
        if (!isValidRegion(region)) {
            return buildValidationResult(false, 'region', 'I did not understand your travel destination.  Please suggest if you are travelling within Europe or or world wide?');
        }
    }

    if (travelStartDate) {
        if (!isValidDate(travelStartDate)) {
            return buildValidationResult(false, 'travelStartDate', 'I did not understand your departure date.  When are you planning to travel?');
        }
        if (new Date(travelStartDate) < new Date()) {
            return buildValidationResult(false, 'travelStartDate', 'Your travel date is in the past!  Can you try a different date?');
        }
    }

    if (travelEndDate) {
        if (!isValidDate(travelEndDate)) {
            return buildValidationResult(false, 'travelEndDate', 'I did not understand your return date.  When are you planning to return?');
        }
    }


    if (travelStartDate && travelEndDate) {
        if (new Date(travelStartDate) >= new Date(travelEndDate)) {
            return buildValidationResult(false, 'travelEndDate', 'Your return date must be after your travel date.  Can you try a different return date?');
        }
        // if (getDayDifference(travelStartDate, travelEndDate) > 30) {
        //     return buildValidationResult(false, 'travelEndDate', 'You cannot travel for more than 30 days.  Can you try a different return date?');
        // }
    }


    if (insuredCount) {
        if (!isValidInsuredCount(insuredCount)) {
            return buildValidationResult(false, 'insuredCount', 'I did not understand how many members are in your party.  Please provide the number of members in your travel group?');
        }
    }


    if (coverageType) {
        if (!isValidCoverageType(coverageType)) {
            return buildValidationResult(false, 'coverageType', 'I did not understand your coverage choice.  Please select if you would like Reduced, Standard or Exceptional?');
        }
    }

    if (discountType) {
        if (!isValidDiscountType(discountType)) {
            return buildValidationResult(false, 'discountType', 'I did not understand your discount selection.  Please suggest if you qualify for couple or family discount?');
        }
    }


    return { isValid: true };


}

// --------------- Process Intents -----------------------



/*****************************************************************************/
/*  This section handles the intent  - StartIntent                           */
/*****************************************************************************/
function processStartIntent(intentRequest, callback) {

    const slots = intentRequest.currentIntent.slots;
    const sessionAttributes = intentRequest.sessionAttributes;

    sessionAttributes.currentQuote = session.init();
    sessionAttributes.previousQuote = session.init();


    callback(elicitSlot(sessionAttributes,
        `GetQuoteDetails`,

        {
            "travelEndDate": null,
            "coverageType": null,
            "travelStartDate": null,
            "discountType": null,
            "region": null,
            "frequency": null,
            "insuredCount": null
        },
        `frequency`,
        {
            contentType: 'PlainText', content: 'Welcome to the AIG Travel chat bot. In order to process your quote,' +
                ' please suggest if this request is for a single trip or an year round trip.'
        }
    ));

}



/*****************************************************************************/
/*  This section handles the intent  - GetQuoteDetails                       */
/*****************************************************************************/
function processGetQuoteDetails(intentRequest, callback) {


    const slots = intentRequest.currentIntent.slots;
    const sessionAttributes = intentRequest.sessionAttributes;

    const frequency = intentRequest.currentIntent.slots.frequency;
    const region = intentRequest.currentIntent.slots.region;
    const travelStartDate = intentRequest.currentIntent.slots.travelStartDate;
    const travelEndDate = intentRequest.currentIntent.slots.travelEndDate;
    const insuredCount = intentRequest.currentIntent.slots.insuredCount;
    const insuredAges = intentRequest.currentIntent.slots.insuredAges;
    const discountType = intentRequest.currentIntent.slots.discountType;
    const coverageType = intentRequest.currentIntent.slots.coverageType;


    sessionAttributes.previousQuote = sessionAttributes.currentQuote;

    sessionAttributes.currentQuote = session.setCache('GetQuoteDetails',
        frequency,
        region,
        travelStartDate,
        travelEndDate,
        insuredCount,
        insuredAges,
        discountType,
        coverageType,
        '');


    // If the Code Hook is dialog flow, validate the slots. If there are any wrong slot values, re-elicitate the slot

    if (intentRequest.invocationSource === 'DialogCodeHook') {
        const validationResult = validateQuoteParams(intentRequest.currentIntent.slots);
        if (!validationResult.isValid) {
            const slots = intentRequest.currentIntent.slots;
            slots[`${validationResult.violatedSlot}`] = null;
            callback(elicitSlot(sessionAttributes,
                intentRequest.currentIntent.name,
                slots,
                validationResult.violatedSlot,
                validationResult.message
            ));
            return;
        }
        callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
        return;
    }


    // If the Code Hook is fullfilment flow, calculate the quote based on params
    //coverage type is an optional slot. If that is not provided, ask for it, along with rates

    var rates = generateQuote(frequency, region, travelStartDate, travelEndDate, insuredCount, discountType);
    var ratesNotification = 'You have 3 options to choose from. The rates for Reduced coverage is $' + rates.reducedRate +
        '. Our most poular Standard coverage is $' + rates.standardRate + ' and our Exception coverage is available for $' + rates.exceptionalRate +
        'Please select the coverage you wish to take.'

    console.log('coverage type -> ' + coverageType)

    if (!coverageType) {
        callback(elicitSlot(sessionAttributes,
            intentRequest.currentIntent.name,
            slots,
            `coverageType`,
            { contentType: 'PlainText', content: ratesNotification }
            // JSON.stringify(ratesNotification)
        ));

    }


    // delete sessionAttributes.currentReservationPrice;
    // delete sessionAttributes.currentReservation;


    callback(close(sessionAttributes, 'Fulfilled',
        {
            contentType: 'PlainText', content: 'Thank you. We have issued a new policy. The details will be sent to you by email.'
            // + 'Is there anything else we can do for you.'
        }));


}

/*****************************************************************************/
/*  This section handles the intent  - GetMemberDetails                      */
/*****************************************************************************/
function processGetMemberDetails(intentRequest, callback) {

    console.log('first')
    // setSessionCache(intentRequest.currentIntent.slots, 'GetCoverageDetails')
    const slots = intentRequest.currentIntent.slots;
    const age = intentRequest.currentIntent.slots.age;
    console.log('second')

    var ages = [];
    // ages = intentRequest.sessionAttributes.ages;

    // ages.push(age);
    console.log('third')

    const sessionAttributes = intentRequest.sessionAttributes;
    sessionAttributes.ages = ages;

    console.log('fourth')


    // Load confirmation history and track the current reservation.

    if (sessionAttributes.insuredMembers > ages.length) {
        callback(elicitSlot(sessionAttributes,
            `GetMemberDetails`,
            slots,
            `age`,
            { contentType: 'PlainText', content: `Please enter the age of the next member in your group` }
        ));
    } else {
        callback(close(sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: 'Got the ages of all team members' }));

    }

}




/*****************************************************************************/
/*  This section handles the intent  - GetCoverageDetails                    */
/*****************************************************************************/
function processGetCoverageDetails(intentRequest, callback) {

    const sessionAttributes = intentRequest.sessionAttributes;

    const coverageType = intentRequest.currentIntent.slots.coverageType;


    sessionAttributes.previousQuote = sessionAttributes.currentQuote;

    var currentCache = JSON.parse(sessionAttributes.currentQuote)

    sessionAttributes.currentQuote = session.setCache('GetCoverageDetails',
        currentCache.frequency,
        currentCache.region,
        currentCache.travelStartDate,
        currentCache.travelEndDate,
        currentCache.insuredCount,
        currentCache.insuredAges,
        currentCache.discountType,
        currentCache.coverageType,
        '');



    var Plans;

    switch (coverageType.toLowerCase()) {
        case 'reduced':
            Plans = 'The Travel Guard Reduced plan is our basic and budget-friendly travel insurance plan, is perfect for business travel and general travel with basic coverage amounts'
            break;
        case 'standard':
            Plans = 'The Travel Guard Standard plan is our most common plan that covers most of your needs on a friendly budget.'
            break;
        case 'exceptional':
            Plans = 'The Travel Guard Exceptional plan is our best travel insurance plan with global travel assistance and access to 24/7 travel assistance services.'
            break;
        default:
            Plans = 'We currently do not offer this type of coverage. Please call help desk for more details'
    }

    Plans = Plans + ' Please select the coverage you wish to take.'

    callback(elicitSlot(sessionAttributes,
        `GetQuoteDetails`,
        {
            "travelEndDate": currentCache.travelEndDate,
            "coverageType": currentCache.coverageType,
            "travelStartDate": currentCache.travelStartDate,
            "discountType": currentCache.discountType,
            "region": currentCache.region,
            "frequency": currentCache.frequency,
            "insuredCount": currentCache.insuredCount
        },
        `coverageType`,
        { contentType: 'PlainText', content: Plans }
    ));
}



// --------------- Dispatch to Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, 
                 intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers

    switch (intentName) {
        case 'StartIntent':
            return processStartIntent(intentRequest, callback);
        case 'GetCoverageDetails':
            return processGetCoverageDetails(intentRequest, callback);
        case 'GetQuoteDetails':
            return processGetQuoteDetails(intentRequest, callback);
        case 'GetMemberDetails':
            return processGetMemberDetails(intentRequest, callback);
        default:
            throw new Error(`Intent with name ${intentName} not supported`);
    }
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.bot.name=${event.bot.name}`);
        console.log(`event details = ${JSON.stringify(event)}`);

        /**
         * Uncomment this if statement and populate with your Lex bot name, alias and / or version as
         * a sanity check to prevent invoking this Lambda function from an undesired source.
         */
        /*
        if (event.bot.name != 'BookTrip') {
             callback('Invalid Bot Name');
        }
        */
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};
