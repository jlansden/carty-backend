// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var yearSchema = new Schema({
    year_id: String,
    title: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default:'active'
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
yearSchema.pre('save', function(callback) {
    idGenerator.generateId('years', 'year_id', 'YER', (err, ID) => {
        this.year_id = ID;
        callback();
    });
});

var Year = mongoose.model('Year', yearSchema);
module.exports = Year;