'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const config = require('./../../config');
const Contact_us = require('./../../models/contact-us');

const getContactUs = function(req,done){
	let columnAndValue={}
    let joinArr = [{
        $lookup: {
            from: 'customers',
            localField: 'user_id',
            foreignField: 'customer_id',
            as: 'cusDetails'
        }
    },  {
        $unwind: "$cusDetails"
    },  { 
        $match : columnAndValue
    }, { 
        $sort : {created_at:-1}
    }, {
        $project: {
            _id: 0,
            contact_us_id: "$contact_us_id",
            name: "$cusDetails.name",
            type: "$type",
            message: "$message",
        }
    }];
    query.joinWithAnd(dbConstants.dbSchema.contact_us, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        done(null, response)
    });
};

const actionContactUs  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.contact_us, {
            'contact_us_id': {
                $in: requestParam['ids']
            }
        }, function(error, data) {
            if (error) {
                logger('Error: can not delete ');
                done(error, null);
                return;
            }
            done(null, data);
        });        
    }
};

const getFeedback = function(req,done){
    let columnAndValue={}
    let joinArr = [{
        $lookup: {
            from: 'customers',
            localField: 'user_id',
            foreignField: 'customer_id',
            as: 'cusDetails'
        }
    },  {
        $unwind: "$cusDetails"
    },  { 
        $match : columnAndValue
    }, { 
        $sort : {created_at:-1}
    }, {
        $project: {
            _id: 0,
            feedback_id: "$feedback_id",
            name: "$cusDetails.name",
            type: "$type",
            message: "$message",
            rating: "$rating",
        }
    }];
    query.joinWithAnd(dbConstants.dbSchema.feedbacks, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        done(null, response)
    });
};

const actionFeedback  = (requestParam, done) => {
    if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.feedbacks, {
            'feedback_id': {
                $in: requestParam['ids']
            }
        }, function(error, data) {
            if (error) {
                logger('Error: can not delete ');
                done(error, null);
                return;
            }
            done(null, data);
        });        
    }
};

module.exports = {
	getContactUs,
	actionContactUs,
    getFeedback,
    actionFeedback
};