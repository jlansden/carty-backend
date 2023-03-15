const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL);
const dbConnection = mongoose.connection;
