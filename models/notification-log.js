// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var notificationLogSchema = new Schema({
    notification_log_id: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        default: ''
    },
    user_id: {
        type: String,
        default: ''
    },
    message: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
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
notificationLogSchema.pre('save', function(callback) {
    idGenerator.generateId('notification_logs', 'notification_log_id', 'NOT', (err, ID) => {
        this.notification_log_id = ID;
        callback();
    });
});

var Notification_log = mongoose.model('Notification_log', notificationLogSchema);
module.exports = Notification_log;