const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/govdata", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = mongoose;