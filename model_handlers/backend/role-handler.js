'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Role = require('./../../models/role');

const get = function(req,done){
	let columnAndValue={}
	if(req.query.role_id){
		columnAndValue.role_id = req.query.role_id
	}
    if(req.query.status){
        columnAndValue.status = req.query.status
    }
	query.selectWithAndFilter(dbConstants.dbSchema.roles, columnAndValue, {
        _id: 0,
    }, {created_at:-1}, {}, (error, roles) => {
    	if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.roles);
            done(errors.internalServer(true), null);
            return;
        }
        done(null,roles)
    });
};

const create = function(requestParam,done){
	query.insertSingle(dbConstants.dbSchema.roles,requestParam,function (error, role) {
		if (error) {
			logger('Error: can not create role');
			done(error, null);
			return;
		}
		done(null, role);
	});
};

const update = function(requestParam,done){
	query.updateSingle(dbConstants.dbSchema.roles,requestParam, { 'role_id':requestParam.role_id},function (error, role) {
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
        query.removeMultiple(dbConstants.dbSchema.roles, {
            'role_id': {
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
       query.updateMultiple(dbConstants.dbSchema.roles, columnsToUpdate, {
            'role_id': {
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