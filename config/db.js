const mongoose = require('mongoose');

const db = process.env.DATABASE;

const IntegrateDB = async () => {
  try {
    await mongoose.connect(db);
    console.log('🍏 Database integration successful');
  } catch (err) {
    console.log(`🔴 Database integration failed: (${err})`);
  }
};

module.exports = IntegrateDB;
