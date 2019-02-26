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
function generateQuote() {
    session.quoteGenerated = true;
    return {
        "reducedRate": 80,
        "standardRate": 100,
        "exceptionalRate": 160,
    };

}


function isValidDate(date) {
    return !(isNaN(Date.parse(date)));
}


function isValidFrequency(frequency) {
    const frequencyTypes = ['single', 'yearly'];
    return (frequencyTypes.indexOf(frequency.toLowerCase()) > -1);
}


function isValidRegion(region) {
    const regionTypes = ['europe', 'world'];
    return (regionTypes.indexOf(region.toLowerCase()) > -1);
}


function isValidInsuredCount(insuredCount) {
    return !(isNaN(insuredCount));
}

function isValidAge(age) {
    return !(isNaN(age));
}

function isValidCoverageType(coverageType) {
    const coverageTypes = ['reduced', 'standard', 'exceptional'];
    return (coverageTypes.indexOf(coverageType.toLowerCase()) > -1);
}

function isValidgroupType(groupType) {
    const groupTypes = ['couple', 'family'];
    return (groupTypes.indexOf(groupType.toLowerCase()) > -1);
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
    const groupType = slots.groupType;
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

    if (groupType) {
        if (!isValidgroupType(groupType)) {
            return buildValidationResult(false, 'groupType', 'I did not understand your discount selection.  Please suggest if you qualify for couple or family discount?');
        }
    }


    return { isValid: true };


}

// --------------- Process Intents -----------------------



/*****************************************************************************/
/*  This section handles the intent  - StartIntent                           */
/*****************************************************************************/
function processStartIntent(intentRequest, callback) {

    const sessionAttributes = intentRequest.sessionAttributes;

    sessionAttributes.currentQuote = session.init();
    sessionAttributes.previousQuote = session.init();
    session.retrieveSession('StartIntent', sessionAttributes);

    callback(elicitSlot(sessionAttributes,
        `GetQuoteDetails`,
        {
            "travelEndDate": null,
            "coverageType": null,
            "travelStartDate": null,
            "groupType": null,
            "region": null,
            "frequency": null,
            "insuredCount": null,
            "privateInsurance": null,
        },
        `frequency`,
        {
            contentType: 'PlainText', content: 'Welcome to the AIG Travel chat bot. In order to process your quote,' +
                ' please suggest if this request is for a single trip or an year round trip.'
        }
    ));
    return;

}

/*****************************************************************************/
/*  This section handles the intent  - GetQuoteDetails                       */
/*****************************************************************************/
function processGetQuoteDetails(intentRequest, callback) {

    const slots = intentRequest.currentIntent.slots;
    const sessionAttributes = intentRequest.sessionAttributes;
    var confirmationStatus = intentRequest.currentIntent.confirmationStatus;

    session.retrieveSession('GetQuoteDetails', sessionAttributes);  //move previous cache values to session 

    //update session variables with recent slot values
    session.frequency = intentRequest.currentIntent.slots.frequency;
    session.region = intentRequest.currentIntent.slots.region;
    session.travelStartDate = intentRequest.currentIntent.slots.travelStartDate;
    session.travelEndDate = intentRequest.currentIntent.slots.travelEndDate;
    session.insuredCount = intentRequest.currentIntent.slots.insuredCount;
    session.groupType = intentRequest.currentIntent.slots.groupType;
    session.coverageType = intentRequest.currentIntent.slots.coverageType;

    //move current cache to previous cache; update current cache with recent slot values
    sessionAttributes.previousQuote = sessionAttributes.currentQuote;
    sessionAttributes.currentQuote = session.setCache();

    const europeanCountries = ['russia', 'germany', 'u.k.', 'france', 'italy', 'spain', 'ukraine', 'poland',
        'romania', 'netherlands', 'belgium', 'greece', 'czech republic', 'portugal',
        'sweden', 'hungary', 'belarus', 'austria', 'serbia', 'switzerland', 'bulgaria',
        'denmark', 'finland', 'slovakia', 'norway', 'ireland', 'croatia', 'moldova',
        'bosnia & herzegovina', 'albania', 'lithuania', 'tfyr macedonia', 'slovenia',
        'latvia', 'estonia', 'montenegro', 'luxembourg', 'malta', 'iceland', 'andorra',
        'monaco', 'liechtenstein', 'san marino', 'holy see'];

    if (session.region &&
        session.region.toLowerCase() != 'europe' &&
        session.region.toLowerCase() != 'world' &&
        (europeanCountries.indexOf(session.region.toLowerCase()) > -1)) {
        session.region = 'Europe';
        slots.region = 'Europe';
    }



    /****** DialogCodeHook --> This flow is executed for all required slots   ******/

    // If the Code Hook is dialog flow, validate the slots. If there are any wrong slot values, re-elicitate the slot


    //Validate if the slots provided by use is valid
    const validationResult = validateQuoteParams(slots);
    if (!validationResult.isValid) {
        // const slots = intentRequest.currentIntent.slots;
        slots[`${validationResult.violatedSlot}`] = null;
        callback(elicitSlot(sessionAttributes,
            intentRequest.currentIntent.name,
            slots,
            validationResult.violatedSlot,
            validationResult.message
        ));
        return;
    }

    console.log('no errors');
    // if the client selects a sigle trip, elicit the start and end dates

    if (session.frequency != null &&
        session.frequency.toLowerCase() == 'single' &&
        session.travelStartDate == null) {
        callback(elicitSlot(sessionAttributes,
            `GetQuoteDetails`,
            slots,
            `travelStartDate`,
            { contentType: 'PlainText', content: `Please select the start date for your travel` }
        ));
        return;
    }

    console.log('single or multi trip')

    if (session.frequency != null &&
        session.frequency.toLowerCase() == 'single' &&
        session.travelStartDate && session.travelEndDate == null) {
        callback(elicitSlot(sessionAttributes,
            `GetQuoteDetails`,
            slots,
            `travelEndDate`,
            { contentType: 'PlainText', content: `Please select the return date for your travel` }
        ));
        return;
    }

    console.log('single or multi trip 2')


    // Switch intent to collect the age of first traveller
    while (session.insuredCount > session.insuredAges.length) {
        callback(elicitSlot(sessionAttributes,
            `GetMemberDetails`,
            { "age": null },
            `age`,
            {
                contentType: 'PlainText',
                content: 'Please enter the age of the first passenger'
            }
        ));
        return;
    }





    // Delegate to Lex to select the next course of action. i.e. elicit next required slot by Lex

    if (intentRequest.invocationSource === 'DialogCodeHook') {
        callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
        return;
    }  //end of if DialogCodeHook


    // TODO --> ELICIT GROUP TYPE HERE

    // if all the slots needed for coverage calculation is provided, 
    // then only calculate the rate and ask for coverage type

    if (session.frequency && session.region && session.insuredCount) {
        session.quotePrice = generateQuote();
        var ratesNotification = 'You have 3 options to choose from. The rates for Reduced coverage is $' + session.quotePrice.reducedRate +
            '. Our most poular Standard coverage is $' + session.quotePrice.standardRate + ' and our Exception coverage is available for $' + session.quotePrice.exceptionalRate +
            ' Please select the coverage you wish to take.';
        var rateToShow;


        if (!session.coverageType) {
            callback(elicitSlot(sessionAttributes,
                intentRequest.currentIntent.name,
                slots,
                `coverageType`,
                { contentType: 'PlainText', content: ratesNotification }
                // JSON.stringify(ratesNotification)
            ));
            return;

        }
    }

    console.log('not here')
    if (intentRequest.invocationSource === 'FulfillmentCodeHook' & session.quoteGenerated) {

        switch (confirmationStatus) {
            case 'None':
                console.log('None');
                console.log(JSON.stringify(session));
                switch (session.coverageType.toLowerCase()) {
                    case 'reduced':
                        rateToShow = session.quotePrice.reducedRate;
                        break;
                    case 'standard':
                        rateToShow = session.quotePrice.standardRate;
                        break;
                    case 'exceptional':
                        rateToShow = session.quotePrice.exceptionalRate;
                        break;
                }
                callback(confirmIntent(sessionAttributes,
                    intentRequest.currentIntent.name,
                    slots,
                    {
                        contentType: 'PlainText',
                        content: `You have selected ${session.coverageType} coverage for a total premium of €${rateToShow}. Please confirm `
                    }));
                break;
            case 'Confirmed':
                callback(close(sessionAttributes, 'Fulfilled',
                    {
                        contentType: 'PlainText',
                        content: 'Thank you. We have issued a new policy. The details will be sent to you by email.'
                    }));
                break;
            case 'Denied':
                callback(close(sessionAttributes, 'Fulfilled',
                    {
                        contentType: 'PlainText',
                        content: 'Thank you for choosing AIG. Have a nice day!'
                    })); break;
            default:
                break;
        }

    }

    console.log('again')
    return;

}

/*****************************************************************************/
/*  This section handles the intent  - GetMemberDetails                      */
/*****************************************************************************/
function processGetMemberDetails(intentRequest, callback) {


    const sessionAttributes = intentRequest.sessionAttributes;

    session.retrieveSession('GetMemberDetails', sessionAttributes);  //move previous cache values to session 

    //update session variables with recent slot values
    session.insuredAges.push(intentRequest.currentIntent.slots.age);


    //move current cache to previous cache; update current cache with recent slot values
    sessionAttributes.previousQuote = sessionAttributes.currentQuote;
    sessionAttributes.currentQuote = session.setCache();


    while (session.insuredCount > session.insuredAges.length) {
        callback(elicitSlot(sessionAttributes,
            `GetMemberDetails`,
            { "age": null },
            `age`,
            {
                contentType: 'PlainText',
                content: 'Please enter the age of the next passenger'
            }
        ));
        return;
    }

    //Once we collect age of all passengers, return control to GetQuoteDetails
    callback(elicitSlot(sessionAttributes,
        `GetQuoteDetails`,
        {
            "travelEndDate": session.travelEndDate,
            "coverageType": session.coverageType,
            "travelStartDate": session.travelStartDate,
            "groupType": session.groupType,
            "region": session.region,
            "frequency": session.frequency,
            "insuredCount": session.insuredCount,
            "privateInsurance": session.privateInsurance
        },
        `privateInsurance`,
        { contentType: 'PlainText', content: 'Do you have private insurance?' }
    ));

    return;



}




/*****************************************************************************/
/*  This section handles the intent  - GetCoverageDetails                    */
/*****************************************************************************/
function processGetCoverageDetails(intentRequest, callback) {


    // const slots = intentRequest.currentIntent.slots;
    const sessionAttributes = intentRequest.sessionAttributes;

    session.retrieveSession('GetCoverageDetails', sessionAttributes);  //move previous cache values to session 

    //move current cache to previous cache; update current cache with recent slot values
    sessionAttributes.previousQuote = sessionAttributes.currentQuote;
    sessionAttributes.currentQuote = session.setCache();

    const coverageToExplain = intentRequest.currentIntent.slots.coverageType;

    var Plans;

    switch (coverageToExplain.toLowerCase()) {
        case 'reduced':
            Plans = 'The Travel Guard Reduced plan is our basic and budget-friendly travel insurance plan, is perfect for business travel and general travel with basic coverage amounts';
            break;
        case 'standard':
            Plans = 'The Travel Guard Standard plan is our most common plan that covers most of your needs on a friendly budget.';
            break;
        case 'exceptional':
            Plans = 'The Travel Guard Exceptional plan is our best travel insurance plan with global travel assistance and access to 24/7 travel assistance services.';
            break;
        default:
            Plans = 'We currently do not offer this type of coverage.';
    }

    Plans = Plans + ' Please select the coverage you wish to take.';

    callback(elicitSlot(sessionAttributes,
        `GetQuoteDetails`,
        {
            "travelEndDate": session.travelEndDate,
            "coverageType": session.coverageType,
            "travelStartDate": session.travelStartDate,
            "groupType": session.groupType,
            "region": session.region,
            "frequency": session.frequency,
            "insuredCount": session.insuredCount,
            "privateInsurance": session.privateInsurance
        },
        `coverageType`,
        { contentType: 'PlainText', content: Plans }
    ));
    return;
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
            console.log('before dispatch');

            return processGetQuoteDetails(intentRequest, callback);
            console.log('after dispatch');
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

const input = require('./GetCoverageDetails').data;
this.handler(input, {}, outputFn);

function outputFn(err, res) {
    if (err) {
        console.log('Error occured', JSON.stringify(err));
        return;
    }
    console.log('Returning value from Lambda', JSON.stringify(res));
}