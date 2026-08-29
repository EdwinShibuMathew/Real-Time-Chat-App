import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { emitNewMessage } from "../lib/socket.js";
import { serializeContact } from "../lib/serializers.js";
import { messageSchema, parseBody, validateImageDataUri } from "../lib/validation.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("_id fullName profilePic")
      .sort({ fullName: 1 });
    return res.status(200).json(users.map(serializeContact));
  } catch (error) {
    return next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const userToChatId = req.params.id;
    if (!mongoose.isValidObjectId(userToChatId) || String(req.user._id) === userToChatId) {
      return res.status(400).json({ message: "Invalid receiver" });
    }
    if (!(await User.exists({ _id: userToChatId }))) {
      return res.status(404).json({ message: "User not found" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: req.user._id },
      ],
    }).sort({ createdAt: 1, _id: 1 });
    return res.status(200).json(messages);
  } catch (error) {
    return next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const receiverId = req.params.id;
    if (!mongoose.isValidObjectId(receiverId) || String(req.user._id) === receiverId) {
      return res.status(400).json({ message: "Invalid receiver" });
    }
    if (!(await User.exists({ _id: receiverId }))) {
      return res.status(404).json({ message: "User not found" });
    }

    const parsed = parseBody(messageSchema, req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    let imageUrl;
    if (parsed.data.image) {
      const imageValidation = validateImageDataUri(parsed.data.image);
      if (!imageValidation.valid) {
        return res.status(415).json({ message: imageValidation.message });
      }
      const upload = await cloudinary.uploader.upload(parsed.data.image, {
        resource_type: "image",
        folder: "chat-app/messages",
      });
      imageUrl = upload.secure_url;
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      text: parsed.data.text,
      image: imageUrl,
    });
    emitNewMessage(message);
    return res.status(201).json(message);
  } catch (error) {
    return next(error);
  }
};
