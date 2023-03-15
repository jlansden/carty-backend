// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var helpCategorySchema = new Schema({
	help_category_id: {
        type: String,
        default: ''
    },
    title: {
        type: Object,
        default: ''
    },
    type: {
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
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
});

// // Execute before each user.save() call
helpCategorySchema.pre('save', function(callback) {
	idGenerator.generateId('help_categories', 'help_category_id', 'HLC', (err, ID) => {
        this.help_category_id = ID;
        callback();
    });
});

var Help_Category = mongoose.model('Help_Category', helpCategorySchema);
module.exports = Help_Category;