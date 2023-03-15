// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var tempSchema = new Schema({
	verify_mobile_id:String,
	mobile_country_code:String,
	mobile:String,
	email:String,
	otp: Number,
});

tempSchema.pre('save', function(callback) {
    idGenerator.generateId('verify_mobiles', 'verify_mobile_id', 'VEM', (err, ID) => {
        this.verify_mobile_id = ID;
        callback();
    });
});

var Verify_mobile = mongoose.model('Verify_mobile', tempSchema);
module.exports = Verify_mobile;