// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var stateSchema = new Schema({
    state_id: {
        type: String,
        default:''
    },
    title: {
        type: String,
        default:''
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
stateSchema.pre('save', function(callback) {
    idGenerator.generateId('states', 'state_id', 'STA', (err, ID) => {
        this.state_id = ID;
        callback();
    });
});

var State = mongoose.model('State', stateSchema);
module.exports = State;