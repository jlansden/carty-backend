// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var labelSchema = new Schema({
    label_id: String,
    screen_id: String,
    title: String,
    code: String,
    value: Object,
    type: {
        type: String,
        default: ''
    },
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
labelSchema.pre('save', function(callback) {
    idGenerator.generateId('language_labels', 'label_id', 'LBL', (err, ID) => {
        this.label_id = ID;
        callback();
    });
});

var Language_label = mongoose.model('Language_label', labelSchema);
module.exports = Language_label;