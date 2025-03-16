const mongoose = require("mongoose");

const producerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    DOB: {
      type: Date,
      required: true,
    },
    image : {
      type : String,
    }
  },
  { timestamps: true }
);

const Producer = mongoose.model("Producer", producerSchema);

module.exports = Producer;
