'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
let async = require('async');
let _ = require('underscore');

/*
    Name : Set default
    Purpose : Set default
    Original Author : Gaurav Patel
    Created At : 23th Sep 2020
*/
const setDefault = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1} );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }

            await query.updateSingle(dbConstants.dbSchema.customers, {default_card: requestParam.card_id}, { customer_id: requestParam.customer_id });

            resolve(list(requestParam));
            return;
        } catch (error) {
            console.log(error);
            reject(error)
            return
        }
    })
};


/*
	Name : List
	Purpose : List
	Original Author : Gaurav Patel
    Created At : 23th Sep 2020
*/
const list = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1, stripe_profile_id:1, default_card:1} );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, is_payment_live: 1} );
            let stripe = require("stripe")(settings.is_payment_live ? config.stripeInfo.live_key : config.stripeInfo.test_key);

            let cardsArr = [];
            if(response.stripe_profile_id){
                stripe.customers.listSources(response.stripe_profile_id, (error, innerCardsArr) => {
                    if (error) {
                        reject(errors.stripeError(true, error.message,requestParam.code));
                        return;
                    }
                    if(innerCardsArr){
                        _.each(innerCardsArr.data, (element, index, list) => {
                            cardsArr.push({
                                id: element.id,
                                brand: element.brand,
                                exp_month: element.exp_month,
                                exp_year: element.exp_year,
                                last4: element.last4,
                                name: element.name,
                                is_default: (element.id==response.default_card ? true : false)
                            })
                        })
                    }
                    resolve(cardsArr);
                    return;
                })
            } else {
                resolve(cardsArr);
                return;
            }
        } catch (error) {
            console.log(error);
            reject(error)
            return
        }
    })
};

/*
    Name : Add
    Purpose : Add
    Original Author : Gaurav Patel
    Created At : 23th Sep 2020
*/
const add = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1, name:1, stripe_profile_id:1, default_card:1, email:1, cards:1} );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, is_payment_live: 1} );
            let stripe = require("stripe")(settings.is_payment_live ? config.stripeInfo.live_key : config.stripeInfo.test_key);

            let stripe_profile_id = response.stripe_profile_id;
            if(!stripe_profile_id){
                let stripeProfile = await stripe.customers.create({ email: response.email, description: `${config.appName} - ${response.name} - ${response.email}` });
                stripe_profile_id = stripeProfile.id;
                await query.updateSingle(dbConstants.dbSchema.customers, { stripe_profile_id }, { customer_id: requestParam.customer_id });
            }

            stripe.tokens.create({ card: { "name": requestParam.card_name, "number": requestParam.card_number, "exp_month": requestParam.exp_month, "exp_year": requestParam.exp_year, "cvc": requestParam.cvc }}, (error, stripeToken) => {
                if (error) {
                    reject(errors.stripeError(true, error.message,requestParam.code));
                    return;
                }

                stripe.customers.createSource(stripe_profile_id, { source: stripeToken.id }, async (error, cardResponse) => {
                    if (error) {
                        reject(errors.stripeError(true, error.message,requestParam.code));
                        return;
                    }
                    let cards = response.cards;
                    let default_card = response.default_card;
                    if(cards.length==0){
                        default_card = cardResponse.id
                    }
                    cards.push({stripe_card_id:cardResponse.id})
                    await query.updateSingle(dbConstants.dbSchema.customers, { cards: cards, default_card:default_card}, { customer_id: requestParam.customer_id });
                    resolve(list(requestParam));
                    return;
                })
            })
        } catch (error) {
            //console.log(error);
            reject(error)
            return
        }
    })
};

/*
    Name : Remove
    Purpose : Remove
    Original Author : Gaurav Patel
    Created At : 23th Sep 2020
*/
const remove = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1, name:1, stripe_profile_id:1, default_card:1, email:1, cards:1} );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            if(response.default_card==requestParam.card_id){
                reject(errors.notRemoveDefaultCard(true, requestParam.code));
                return;
            }
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, is_payment_live: 1} );
            let stripe = require("stripe")(settings.is_payment_live ? config.stripeInfo.live_key : config.stripeInfo.test_key);
            
            stripe.customers.deleteSource(response.stripe_profile_id, requestParam.card_id, async(error, card) => {
                if (error) {
                    reject(errors.stripeError(true, error.message,requestParam.code));
                    return;
                }

                let cards = [];
                _.each(response.cards, (element) => {
                    if(element.stripe_card_id!=requestParam.card_id){
                        cards.push({stripe_card_id:element.stripe_card_id})
                    }
                })
                await query.updateSingle(dbConstants.dbSchema.customers, { cards: cards}, { customer_id: requestParam.customer_id });
                resolve(list(requestParam));
                return;
            })
        } catch (error) {
            console.log(error);
            reject(error)
            return
        }
    })
};

module.exports = {
    add,
    list,
    remove,
    setDefault
};