// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var accessibleSchema = new Schema({
    accessible_id: {
        type: String,
        default:''
    },
    title: {
        type: Object,
        default:{}
    },
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
accessibleSchema.pre('save', function(callback) {
    idGenerator.generateId('accessibles', 'accessible_id', 'ASB', (err, ID) => {
        this.accessible_id = ID;
        callback();
    });
});

var Accessible = mongoose.model('Accessible', accessibleSchema);
module.exports = Accessible;