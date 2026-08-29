import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "../lib/db.js";
import User from "../models/user.model.js";

config();

const applyChanges = process.argv.includes("--apply");

async function repairPasswords() {
  if (process.env.NODE_ENV === "production" && !applyChanges) {
    console.log("Production repair is in dry-run mode. Pass --apply after reviewing the count.");
  }

  await connectDB();
  const users = await User.find({ password: { $not: /^\$2[aby]\$/ } }).select("_id email password");
  console.log(`${users.length} legacy plaintext password value(s) found.`);

  if (applyChanges) {
    for (const user of users) {
      user.password = await bcrypt.hash(user.password, 12);
      await user.save();
    }
    console.log(`${users.length} password value(s) repaired.`);
  } else {
    console.log("Dry run only. Re-run with --apply to persist changes.");
  }
}

repairPasswords()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
