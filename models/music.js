// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var musicSchema = new Schema({
    music_id: {
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
musicSchema.pre('save', function(callback) {
    idGenerator.generateId('musics', 'music_id', 'MUS', (err, ID) => {
        this.music_id = ID;
        callback();
    });
});

var Music = mongoose.model('Music', musicSchema);
module.exports = Music;