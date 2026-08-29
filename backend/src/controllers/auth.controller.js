import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { generateToken, getClearCookieOptions } from "../lib/utils.js";
import { serializeUser } from "../lib/serializers.js";
import {
  loginSchema,
  parseBody,
  profileSchema,
  signupSchema,
  validateImageDataUri,
} from "../lib/validation.js";
import User from "../models/user.model.js";

export const signup = async (req, res, next) => {
  try {
    const parsed = parseBody(signupSchema, req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const { fullName, email, password } = parsed.data;
    if (await User.exists({ email })) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = await User.create({
      fullName,
      email,
      password: await bcrypt.hash(password, 12),
    });
    generateToken(user._id, res);
    return res.status(201).json(serializeUser(user));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const parsed = parseBody(loginSchema, req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const user = await User.findOne({ email: parsed.data.email });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);
    return res.status(200).json(serializeUser(user));
  } catch (error) {
    return next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie("jwt", getClearCookieOptions());
  return res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res, next) => {
  try {
    const parsed = parseBody(profileSchema, req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const imageValidation = validateImageDataUri(parsed.data.profilePic);
    if (!imageValidation.valid) {
      return res.status(415).json({ message: imageValidation.message });
    }

    const user = await User.findById(req.user._id).select("+profilePicPublicId");
    const upload = await cloudinary.uploader.upload(parsed.data.profilePic, {
      resource_type: "image",
      folder: "chat-app/avatars",
    });
    const previousPublicId = user.profilePicPublicId;
    user.profilePic = upload.secure_url;
    user.profilePicPublicId = upload.public_id;
    await user.save();

    if (previousPublicId) {
      cloudinary.uploader.destroy(previousPublicId, { resource_type: "image" }).catch((error) => {
        req.log?.warn({ err: error }, "Could not remove previous avatar");
      });
    }

    return res.status(200).json(serializeUser(user));
  } catch (error) {
    return next(error);
  }
};

export const checkAuth = (req, res) => res.status(200).json(serializeUser(req.user));
