const mongoose = require("mongoose");

const actorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    bio :{
      type : String,
      required : true
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

const Actor = mongoose.model("Actor", actorSchema);

module.exports = Actor;
