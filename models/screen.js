// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var screenSchema = new Schema({
    screen_id: String,
    title: String,
    type: String,
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
screenSchema.pre('save', function(callback) {
    idGenerator.generateId('screens', 'screen_id', 'SCR', (err, ID) => {
        this.screen_id = ID;
        callback();
    });
});

var Screen = mongoose.model('Screen', screenSchema);
module.exports = Screen;