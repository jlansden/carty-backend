'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
const queryApi = require('./../../utils/query-creator-api');
let async = require('async');
let _ = require('underscore');
const make = require('./../../models/make');
const csv = require('csvtojson');

const get = function(req,done){
	let columnAndValue={}
	if(req.query.make_id){
		columnAndValue.make_id = req.query.make_id
	}
    if(req.query.status){
        columnAndValue.status = req.query.status
    }
    query.selectWithAndFilter(dbConstants.dbSchema.makes, columnAndValue, {
        _id: 0,
    }, {created_at:-1}, {}, (error, response) => {
        if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.makes);
            done(errors.internalServer(true), null);
            return;
        }
        if(req.query.make_id){
            response = response[0]
            response = JSON.parse(JSON.stringify(response));
            query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'}, {}, function(error, languages) {
                _.each(languages, (element, index, list) => {
                    response[element.code] = response.title[element.code];
                });
                done(null,response)
            });
        }
        else{
            _.each(response, (elem) => {
                elem.title = elem.title ? (elem.title.EN ? elem.title.EN : '') : ''
            })
            done(null, response)
        }
    });
};

const create = function(requestParam,done){
    let title = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function (error, languages) {
        _.each(languages, (element, index, list) => {
            title[element.code] = requestParam[element.code];
        });
        requestParam.title = title;
    	query.insertSingle(dbConstants.dbSchema.makes,requestParam,function (error, response) {
    		if (error) {
    			logger('Error: can not create music');
    			done(error, null);
    			return;
    		}
    		done(null, response);
    	});
    });
};


const update = function(requestParam,done){
    let title = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function (error, languages) {
        _.each(languages, (element, index, list) => {
            title[element.code] = requestParam[element.code];
        });
        requestParam.title = title;
    	query.updateSingle(dbConstants.dbSchema.makes,requestParam, { 'make_id':requestParam.make_id},function (error, response) {
    		if (error) {
    			logger('Error: can not update music');
    			done(error, null);
    			return;
    		}
    		done(null, response);
    	});
    });
};

const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.makes, {
            'make_id': {
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
       query.updateMultiple(dbConstants.dbSchema.makes, columnsToUpdate, {
            'make_id': {
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

const importFile = async (req, done) => {
    let cnt = 1;
    const jsonArray = await csv().fromFile(req.files.csv_file.path);
    async.forEachSeries(jsonArray, async function(singleRec, callbackSingleRec) {
        console.log(singleRec)
        let make = await queryApi.selectWithAndOne(dbConstants.dbSchema.makes, { 'title.EN': singleRec.Make }, { _id: 0, make_id: 1, title:1}, { created_at: 1 });
        if(!make){
            make = await queryApi.insertSingle(dbConstants.dbSchema.makes, {title:{EN: singleRec.Make}});
        }
        let model = await queryApi.selectWithAndOne(dbConstants.dbSchema.models, { 'title.EN': singleRec.Model, make_id: make.make_id }, { _id: 0, model_id: 1, title:1}, { created_at: 1 });
        if(!model){
            model = await queryApi.insertSingle(dbConstants.dbSchema.models, {title:{EN: singleRec.Model}, make_id:make.make_id});
        }
        if(singleRec.Year){
            let year = await queryApi.selectWithAndOne(dbConstants.dbSchema.years, { 'title': singleRec.Year}, { _id: 0, year_id: 1, title:1}, { created_at: 1 });
            if(!year){
                year = await queryApi.insertSingle(dbConstants.dbSchema.years, {title:singleRec.Year});
            }
        }
        callbackSingleRec()
    }, function(){
        done(null, 'Imported successfully.')
    });
};

const exportFile = async(req, done) => {
    let joinArr = [{
        $lookup: {
            from: 'models',
            localField: 'make_id',
            foreignField: 'make_id',
            as: 'modelDetails'
        }
    },  { 
        $match : {}
    }, { 
        $sort : {created_at:-1}
    }, {
        $project: {
            _id: 0,
            make_id: "$make_id",
            title: "$title.EN",
            model: "$modelDetails",
        }
    }];
    query.joinWithAnd(dbConstants.dbSchema.makes, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        let csvData =[
            ['Make', 'Model']
        ];
        _.each(response, (make) => {
            _.each(make.model, (model) => {
                csvData.push([
                    make.title,
                    model.title.EN
                ])
            });
        });
        done(null, csvData)
    });
};


module.exports = {
	get,
	create,
	action,
	update,
    importFile,
    exportFile
};