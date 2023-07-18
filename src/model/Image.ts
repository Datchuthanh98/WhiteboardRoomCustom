import mongoose from "mongoose";
import { Schema } from "mongoose";

export const ImgSchema = new Schema({
  url: { type: String, require: true },
  idField: { type: String, require: true },
  idRoom: { type: String, require: true },
});

const Img = mongoose.model("Img", ImgSchema);
export default Img;