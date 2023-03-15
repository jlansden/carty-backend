'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');

const get = function(req,done){
	let columnAndValue={}
	if(req.query.state_id){
		columnAndValue.state_id = req.query.state_id
	}
    if(req.query.status){
        columnAndValue.status = req.query.status
    }
	query.selectWithAndFilter(dbConstants.dbSchema.states, columnAndValue, {
        _id: 0,
    }, {created_at:-1}, {}, (error, states) => {
    	if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.states);
            done(errors.internalServer(true), null);
            return;
        }
        done(null,states)
    });
};

const create = function(requestParam,done){
	query.insertSingle(dbConstants.dbSchema.states,requestParam,function (error, role) {
		if (error) {
			logger('Error: can not create role');
			done(error, null);
			return;
		}
		done(null, role);
	});
};

const update = function(requestParam,done){
	query.updateSingle(dbConstants.dbSchema.states,requestParam, { 'state_id':requestParam.state_id},function (error, role) {
		if (error) {
			logger('Error: can not update role');
			done(error, null);
			return;
		}
		done(null, role);
	});
};

const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.states, {
            'state_id': {
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
       query.updateMultiple(dbConstants.dbSchema.states, columnsToUpdate, {
            'state_id': {
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
	update,
};