// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var modeSchema = new Schema({
    mode_id: {
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
modeSchema.pre('save', function(callback) {
    idGenerator.generateId('modes', 'mode_id', 'MOD', (err, ID) => {
        this.mode_id = ID;
        callback();
    });
});

var Mode = mongoose.model('Mode', modeSchema);
module.exports = Mode;