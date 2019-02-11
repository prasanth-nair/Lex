'use strict';

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

// Validation rules for GetQuoteDetails


function isValidCoverageType(coverageType) {
    const coverageTypes = ['reduced', 'standard', 'exceptional'];
    return (coverageTypes.indexOf(coverageType.toLowerCase()) > -1);
}

// Validation rules for GetCoverageDetails


function validateQuoteParams(slots) {
    const frequency = slots.frequency;
    const region = slots.region;
    const travelStartDate = slots.travelStartDate;
    const travelEndDate = slots.travelEndDate;
    const insuredCount = slots.insuredCount;
    const driverAge = slots.DriverAge;
    const discountType = slots.discountType;
    const coverageType = slots.coverageType;
    var suggestedRegion;


    const europeanCountries = ['russia', 'germany', 'u.k.', 'france', 'italy', 'spain', 'ukraine', 'poland',
        'romania', 'netherlands', 'belgium', 'greece', 'czech republic', 'portugal',
        'sweden', 'hungary', 'belarus', 'austria', 'serbia', 'switzerland', 'bulgaria',
        'denmark', 'finland', 'slovakia', 'norway', 'ireland', 'croatia', 'moldova',
        'bosnia & herzegovina', 'albania', 'lithuania', 'tfyr macedonia', 'slovenia',
        'latvia', 'estonia', 'montenegro', 'luxembourg', 'malta', 'iceland', 'andorra',
        'monaco', 'liechtenstein', 'san marino', 'holy see'];


    //  select the region based on the country listed
    if (region) {
        if (region.toLowerCase != 'europe' || region.toLowerCase != 'world') {
            if (europeanCountries.indexOf(region.toLowerCase()) > -1) {
                suggestedRegion = 'europe'
            } else {
                suggestedRegion = 'world'
            }
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

    return { isValid: true };


}

// --------------- Process Intents -----------------------


/*****************************************************************************/
/*  This section handles the intent  - GetQuoteDetails                       */
/*****************************************************************************/


function processGetQuoteDetails(intentRequest, callback) {


    const slots = intentRequest.currentIntent.slots;
    const frequency = intentRequest.currentIntent.slots.frequency;
    const region = intentRequest.currentIntent.slots.region;
    const travelStartDate = intentRequest.currentIntent.slots.travelStartDate;
    const travelEndDate = intentRequest.currentIntent.slots.travelEndDate;
    const insuredCount = intentRequest.currentIntent.slots.insuredCount;
    const discountType = intentRequest.currentIntent.slots.discountType;
    const coverageType = intentRequest.currentIntent.slots.coverageType;

    const sessionAttributes = intentRequest.sessionAttributes;


    // Load confirmation history and track the current reservation.
    const quote = String(JSON.stringify({
        ReservationType: 'GetQuoteDetails',
        frequency: frequency,
        region: region,
        travelStartDate: travelStartDate,
        travelEndDate: travelEndDate,
        insuredCount: insuredCount,
        discountType: discountType,
        coverageType: coverageType
    }));
    sessionAttributes.currentQuote = quote;


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
        sessionAttributes.currentQuote = quote;
        callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
        return;
    }


    // If the Code Hook is fullfilment flow, calculate the quote based on params
    //coverage type is an optional slot. If that is not provided, ask for it, along with rates

    var rates = generateQuote(frequency, region, travelStartDate, travelEndDate, insuredCount, discountType);
    var ratesNotification = 'You have 3 options to choose from. The rates for Reduced coverage is $' + rates.reducedRate +
        '. Our most poular Standard coverage is $' + rates.standardRate + ' and our Exception coverage is available for $' + rates.exceptionalRate


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
    sessionAttributes.lastConfirmedReservation = quote;


    callback(close(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: 'Thanks, I have placed your reservation.   Please let me know if you would like to book a car rental, or another hotel.' }));


}



/*****************************************************************************/
/*  This section handles the intent  - GetCoverageDetails                    */
/*****************************************************************************/
function processGetCoverageDetails(intentRequest, callback) {


    const frequency = intentRequest.currentIntent.slots.frequency;
    const region = intentRequest.currentIntent.slots.region;
    const travelStartDate = intentRequest.currentIntent.slots.travelStartDate;
    const travelEndDate = intentRequest.currentIntent.slots.travelEndDate;
    const insuredCount = intentRequest.currentIntent.slots.insuredCount;
    const discountType = intentRequest.currentIntent.slots.discountType;
    const coverageType = intentRequest.currentIntent.slots.coverageType;

    const sessionAttributes = intentRequest.sessionAttributes;

    // let Plans = ""

    // Load confirmation history and track the current reservation.
    const quote = String(JSON.stringify({
        ReservationType: 'GetQuoteDetails',
        frequency: frequency,
        region: region,
        travelStartDate: travelStartDate,
        travelEndDate: travelEndDate,
        insuredCount: insuredCount,
        discountType: discountType,
        coverageType: coverageType
    }));
    sessionAttributes.currentQuote = quote;

    var Plans;

    switch (coverageType.toLowerCase()) {
        case 'reduced':
            Plans = 'The Travel Guard Silver plan is our basic and budget-friendly travel insurance plan, is perfect for business travel and general travel with basic coverage amounts'
            break;
        case 'standard':
            Plans = 'Travel easy with comprehensive travel insurance provided from the Travel Guard Gold Plan.'
            break;
        case 'exceptional':
            Plans = 'The Travel Guard Platinum plan is our best travel insurance plan with global travel assistance and access to 24/7 travel assistance services.'
            break;
        default:
            Plans = 'We currently do not offer this type of coverage. Please call help desk for more details'
    }



    sessionAttributes.lastConfirmedReservation = quote;


    //coverage type is an optional slot. If that is not provided, as for it, along with rates
    if (!coverageType) {
        callback(elicitSlot(sessionAttributes,
            `GetQuoteDetails`,
            slots,
            `coverageType`,
            { contentType: 'PlainText', content: Plans }
        ));

    } else {
        callback(close(sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: `${Plans}` }));

    }




}



// --------------- Dispatch to Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    console.log(' session : ' + JSON.stringify(sessionAttributes))

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'GetCoverageDetails') {
        return processGetCoverageDetails(intentRequest, callback);
    } else if (intentName === 'GetQuoteDetails') {
        return processGetQuoteDetails(intentRequest, callback);
    }
    throw new Error(`Intent with name ${intentName} not supported`);
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
