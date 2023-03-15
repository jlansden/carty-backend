'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Screen = require('./../../models/screen');

const get = function(req,done){
	let columnAndValue={}
	if(req.query.screen_id){
		columnAndValue.screen_id = req.query.screen_id
	}
    if(req.query.status){
        columnAndValue.status = req.query.status
    }
    if(req.query.type){
        columnAndValue.type = req.query.type
    }
	query.selectWithAndFilter(dbConstants.dbSchema.screens, columnAndValue, {
        _id: 0,
    }, {created_at:-1}, {}, (error, screens) => {
    	if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.screens);
            done(errors.internalServer(true), null);
            return;
        }
        done(null,screens)
    });
};

const create = function(requestParam,done){
	query.insertSingle(dbConstants.dbSchema.screens,requestParam,function (error, role) {
		if (error) {
			logger('Error: can not create role');
			done(error, null);
			return;
		}
		done(null, role);
	});
};

const update = function(requestParam,done){
	query.updateSingle(dbConstants.dbSchema.screens,requestParam, { 'screen_id':requestParam.screen_id},function (error, role) {
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
        query.removeMultiple(dbConstants.dbSchema.screens, {
            'screen_id': {
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
       query.updateMultiple(dbConstants.dbSchema.screens, columnsToUpdate, {
            'screen_id': {
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