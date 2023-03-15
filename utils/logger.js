'use strict';

const moment = require('moment');


module.exports = function() {
	let message = moment.utc().format() + ' :: ';
	for (let i=0; i < arguments.length; i++) {
		let argument = arguments[i];
		if (typeof argument === 'string' || argument instanceof String) {
			message += argument;
		} else {
			message += JSON.stringify(argument);
		}

		if (i !== arguments.length - 1) {
			message += ' ';
		}
	}
	console.log(message)
};
