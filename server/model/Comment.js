// server/models/Comment.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  user: { type: String, required: true }, // you can later change to userId for real accounts
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Comment", commentSchema);
