// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var helpSchema = new Schema({
	help_id:String,
	help_category_id:String,
	question: Object,
	ans: Object,
	link: Object,
	status : {type: String, enum: ['active', 'inactive'], default:'active'},
	created_at:{type: Date, default: Date.now}
});

// // Execute before each user.save() call
helpSchema.pre('save', function(callback) {
	idGenerator.generateId('helps', 'help_id', 'HEL', (err, ID) => {
        this.help_id = ID;
        callback();
    });
});

var Help = mongoose.model('Help', helpSchema);
module.exports = Help;