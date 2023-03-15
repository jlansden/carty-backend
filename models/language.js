// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var languageSchema = new Schema({
    language_id: String,
    title: String,
    code: String,
    status: {
        type: String,
        enum: ['active', 'inactive']
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// // Execute before each user.save() call
languageSchema.pre('save', function(callback) {
    idGenerator.generateId('languages', 'language_id', 'LAN', (err, ID) => {
        this.language_id = ID;
        callback();
    });
});

var Language = mongoose.model('Language', languageSchema);
module.exports = Language;