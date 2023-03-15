// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
const emailTemplateCategorySchema = new Schema({
    emailtemplate_id: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    code: {
        type: String,
        default: ''
    },
    from_name: {
        type: String,
        default: ''
    },
    from_email: {
        type: String,
        default: ''
    },
    email_subject: {
        type: Object,
        default: {},
    },
    description: {
        type: Object,
        default: {}
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
emailTemplateCategorySchema.pre('save', function(callback) {
	idGenerator.generateId('email_templates', 'emailtemplate_id', 'EMT', (err, ID) => {
        this.emailtemplate_id = ID;
        callback();
    });
});

var Email_template = mongoose.model('Email_template', emailTemplateCategorySchema);
module.exports = Email_template;