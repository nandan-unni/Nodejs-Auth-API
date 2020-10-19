const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, max: 30 },
  email: { type: String, required: true },
  phno: { type: Number, required: true },
  isActive: { type: Boolean },
  signUpOTP: { type: Number },
  passwordResetOTP: { type: Number },
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("user", UserSchema);
