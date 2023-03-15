// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var feedbackSchema = new Schema({
	feedback_id: {
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
    rating: {
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
feedbackSchema.pre('save', function(callback) {
	idGenerator.generateId('feedbacks', 'feedback_id', 'FED', (err, ID) => {
        this.feedback_id = ID;
        callback();
    });
});

var Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;