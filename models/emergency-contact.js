// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var emergencySchema = new Schema({
    contact_id: {
        type: String,
        default:''
    },
    customer_id: {
        type: String,
        default:''
    },
    name: {
        type: String,
        default:''
    },
    profile_picture: {
        type: String,
        default:''
    },
    mobile_country_code: {
        type: String,
        default: ''
    },
    mobile: {
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
    }
});


// // Execute before each user.save() call
emergencySchema.pre('save', function(callback) {
    idGenerator.generateId('emergency_contacts', 'contact_id', 'CTC', (err, ID) => {
        this.contact_id = ID;
        callback();
    });
});

var Emergency_contact = mongoose.model('Emergency_contact', emergencySchema);
module.exports = Emergency_contact;