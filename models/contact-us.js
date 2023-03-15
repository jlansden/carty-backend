// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var contactSchema = new Schema({
	contact_us_id: {
        type: String,
        default: ''
    },
    user_id: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: ''
    },
    message: {
        type: String,
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
});

// // Execute before each user.save() call
contactSchema.pre('save', function(callback) {
	idGenerator.generateId('contact_us', 'contact_us_id', 'CTU', (err, ID) => {
        this.contact_us_id = ID;
        callback();
    });
});

var Contact_us = mongoose.model('Contact_us', contactSchema);
module.exports = Contact_us;