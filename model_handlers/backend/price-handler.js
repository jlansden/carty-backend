'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const price = require('./../../models/price');

const get = function(req,done){
	let columnAndValue={}
	if(req.query.price_id){
		columnAndValue.price_id = req.query.price_id
    	query.selectWithAndFilter(dbConstants.dbSchema.prices, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, prices) => {
        	if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.prices);
                done(errors.internalServer(true), null);
                return;
            }
            done(null,prices[0])
        });
	}
    else{
        let joinArr = [{
            $lookup: {
                from: 'vehicles',
                localField: 'vehicle_id',
                foreignField: 'vehicle_id',
                as: 'vehDetails'
            }
        },  {
            $unwind: "$vehDetails"
        },  { 
            $match : columnAndValue
        }, { 
            $sort : {created_at:-1}
        }, {
            $project: {
                _id: 0,
                price_id: "$price_id",
                vehicle_name: "$vehDetails.title.EN",
                base_fare: "$base_fare",
                per_mile_fare: "$per_mile_fare",
                per_min_fare: "$per_min_fare",
                max_fare: "$max_fare",
                booking_fare: "$booking_fare",
                min_fare: "$min_fare",
                status: "$status",
            }
        }];
        query.joinWithAnd(dbConstants.dbSchema.prices, joinArr, (error, response) => {
            if (error) {
                logger('Error: can not get record.');
                done(errors.internalServer(true), null);
                return;
            }
            done(null, response)
        });
    }
};

const create = function(requestParam,done){
    query.selectWithAndOne(dbConstants.dbSchema.prices, {vehicle_id: requestParam.vehicle_id}, {
        price_id: 1
    }, async(error, exists) => {
        if(exists){
            query.updateSingle(dbConstants.dbSchema.prices,requestParam, { 'price_id':exists.price_id},function (error, response) {
                if (error) {
                    logger('Error: can not update price');
                    done(error, null);
                    return;
                }
                done(null, response);
            });
        }
        else{
        	query.insertSingle(dbConstants.dbSchema.prices,requestParam,function (error, response) {
        		if (error) {
        			logger('Error: can not create price');
        			done(error, null);
        			return;
        		}
        		done(null, response);
        	});
        }
    });
};


const update = function(requestParam,done){
	query.updateSingle(dbConstants.dbSchema.prices,requestParam, { 'price_id':requestParam.price_id},function (error, response) {
		if (error) {
			logger('Error: can not update price');
			done(error, null);
			return;
		}
		done(null, response);
	});
};

const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.prices, {
            'price_id': {
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
    else
    {
        let columnsToUpdate = {
            status: requestParam['type']
        };
       query.updateMultiple(dbConstants.dbSchema.prices, columnsToUpdate, {
            'price_id': {
                $in: requestParam['ids']
            }
        }, function(error, data) {
            if (error) {
                logger('Error: can not update ');
                done(error, null);
                return;
            }
            done(null, data);
        });  
    }
};


module.exports = {
	get,
	create,
	action,
	update
};