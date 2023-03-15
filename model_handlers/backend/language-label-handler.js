'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Language_label = require('./../../models/language-label');
const csv = require('csvtojson');

const get = function(req,done){
	let columnAndValue={}
	if(req.query.label_id){
		columnAndValue.label_id = req.query.label_id
	}
	query.selectWithAndFilter(dbConstants.dbSchema.language_labels, columnAndValue, {
        _id: 0,
    }, {created_at:-1}, {}, (error, labels) => {
    	if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.language_labels);
            done(errors.internalServer(true), null);
            return;
        }
        if(req.query.label_id){
            labels = labels[0]
            labels = JSON.parse(JSON.stringify(labels));
            query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'}, {}, function(error, languages) {
                _.each(languages, (element, index, list) => {
                    labels[element.code] = labels.value[element.code];
                });
                done(null,labels)
            });
        }
        else{
            done(null,labels)
        }
    });
};


const create = function(requestParam,done){
	let value = new Object();
	query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function (error, languages) {
		_.each(languages, (element, index, list) => {
            value[element.code] = requestParam[element.code];
        });
        requestParam.value = value;
		query.insertSingle(dbConstants.dbSchema.language_labels,requestParam,function (error, label) {
			if (error) {
				logger('Error: can not create label');
				done(error, null);
				return;
			}
			done(null, label);
		});
	});
};


const update = function(requestParam,done){
	let value = new Object();
	query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function (error, languages) {
		_.each(languages, (element, index, list) => {
            value[element.code] = requestParam[element.code];
        });
        requestParam.value = value;
		query.updateSingle(dbConstants.dbSchema.language_labels,requestParam, { 'label_id':requestParam.label_id},function (error, label) {
			if (error) {
				logger('Error: can not update label');
				done(error, null);
				return;
			}
			done(null, label);
		});
	});
};

const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.language_labels, {
            'label_id': {
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
        query.updateMultiple(dbConstants.dbSchema.language_labels, columnsToUpdate, {
            'label_id': {
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

const importLbl = async (req, done) => {
    let cnt = 1;
    const jsonArray = await csv().fromFile(req.files.file.path);
    //query.removeMultiple(dbConstants.dbSchema.language_labels, {},async function (error, city) {
        async.forEachSeries(jsonArray, async function(singleRec, callbackSingleRec) {
            if(singleRec.Title!='' && singleRec.Code!=''){
                let obj = {
                    //screen_id:singleRec.ScreenId,
                    title:singleRec.Title,
                    code:singleRec.Code,
                    value:{
                        "EN": singleRec.Value
                    },
                    type:singleRec.Type,
                    //status:'active'
                }
                console.log(cnt)
                console.log(singleRec.ID)
                query.updateSingle(dbConstants.dbSchema.language_labels,obj, { 'label_id':singleRec.ID},function (error, label) {
                    console.log(label)
                    console.log(error)
                    cnt++;
                    callbackSingleRec();
                });
            }
            else{
                callbackSingleRec();
            }
        }, function(){
            done(null, 'Imported successfully.')
        });
    //});
};

module.exports = {
	get,
	create,
	action,
	update,
    importLbl
};