import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret";
const DB_NAME = "redeem_codes_db";
let db;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  // Indexes (optional, for performance)
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("redeem_codes").createIndex({ user_id: 1 });
  await db
    .collection("copies")
    .createIndex({ user_id: 1, redeem_code_id: 1 }, { unique: true });
  await db.collection("user_suspensions").createIndex({ user_id: 1 });
  await db.collection("misuse_logs").createIndex({ user_id: 1 });
}
connectDB()
  .then(() => console.log("MongoDB connected."))
  .catch(console.error);

// --- Helper functions ---
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

async function checkSuspension(user_id) {
  const susp = await db.collection("user_suspensions").findOne({
    user_id: new ObjectId(user_id),
    is_active: true,
    suspended_until: { $gt: new Date() },
  });
  return susp;
}

// --- Auth ---
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await db.collection("users").findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    const result = await db
      .collection("users")
      .insertOne({ name, email, password: hashed, created_at: new Date() });
    const user = { id: result.insertedId, name, email };
    const token = jwt.sign({ id: user.id, name, email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ user, token });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.collection("users").findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Invalid email or password" });
  if (!(await bcrypt.compare(password, user.password)))
    return res.status(400).json({ message: "Invalid email or password" });
  const susp = await checkSuspension(user._id);
  if (susp)
    return res.status(403).json({
      message: `Suspended until ${susp.suspended_until}`,
      reason: susp.reason,
    });
  const token = jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({
    user: { id: user._id, name: user.name, email: user.email },
    token,
  });
});

// --- Redeem Codes ---
app.get("/api/redeem-codes", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const pipeline = [
    { $match: { created_at: { $gte: sevenDaysAgo } } },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user_info",
      },
    },
    {
      $lookup: {
        from: "copies",
        localField: "_id",
        foreignField: "redeem_code_id",
        as: "copies",
      },
    },
    {
      $addFields: {
        total_copies: { $size: "$copies" },
        user_copied: { $in: [new ObjectId(userId), "$copies.user_id"] },
      },
    },
    { $match: { total_copies: { $lt: 5 } } },
    { $sort: { total_copies: 1, created_at: -1 } },
  ];
  const codes = await db
    .collection("redeem_codes")
    .aggregate(pipeline)
    .toArray();
  res.json(
    codes.map((code) => ({
      id: code._id,
      title: code.title,
      code: code.code,
      created_at: code.created_at,
      user_name: code.user_info[0]?.name || "Unknown",
      total_copies: code.total_copies,
      user_copied: code.user_copied,
    }))
  );
});

app.post("/api/redeem-codes", authMiddleware, async (req, res) => {
  const { title, code } = req.body;
  const userId = req.user.id;
  await db.collection("redeem_codes").insertOne({
    title,
    code,
    user_id: new ObjectId(userId),
    created_at: new Date(),
  });
  res.json({ success: true });
});

// --- Copy Code ---
app.post("/api/copy-code", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { redeem_code_id } = req.body;
  // Check suspension
  const susp = await checkSuspension(userId);
  if (susp)
    return res.status(403).json({ message: "Suspended", reason: susp.reason });
  // Rapid copying check (last 5 in 2 min, 3 in 60s)
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
  const recent = await db
    .collection("copies")
    .find({
      user_id: new ObjectId(userId),
      copied_at: { $gte: twoMinAgo },
    })
    .sort({ copied_at: -1 })
    .limit(5)
    .toArray();
  if (recent.length >= 3) {
    let rapid = false;
    for (let i = 0; i < recent.length - 2; i++) {
      const t1 = recent[i].copied_at,
        t2 = recent[i + 1].copied_at,
        t3 = recent[i + 2].copied_at;
      if (
        (t1 - t3) / 1000 <= 60 &&
        ((t1 - t2) / 1000 <= 20 || (t2 - t3) / 1000 <= 20)
      )
        rapid = true;
    }
    if (rapid) {
      // Suspend user
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      await db
        .collection("user_suspensions")
        .updateMany(
          { user_id: new ObjectId(userId), is_active: true },
          { $set: { is_active: false } }
        );
      await db.collection("user_suspensions").insertOne({
        user_id: new ObjectId(userId),
        reason: "Rapid copying detected - potential misuse of platform",
        suspended_at: new Date(),
        suspended_until: endOfDay,
        is_active: true,
      });
      await db.collection("misuse_logs").insertOne({
        user_id: new ObjectId(userId),
        action_type: "RAPID_COPYING_DETECTED",
        details: `Attempted to copy code ${redeem_code_id} with rapid pattern`,
        created_at: new Date(),
      });
      return res
        .status(403)
        .json({ message: "Suspended for rapid copying", suspended: true });
    }
  }
  // Check copy limit
  const copyCount = await db
    .collection("copies")
    .countDocuments({ redeem_code_id: new ObjectId(redeem_code_id) });
  if (copyCount >= 5)
    return res.status(400).json({ message: "Copy limit reached" });
  try {
    await db.collection("copies").insertOne({
      user_id: new ObjectId(userId),
      redeem_code_id: new ObjectId(redeem_code_id),
      copied_at: new Date(),
    });
    await db.collection("misuse_logs").insertOne({
      user_id: new ObjectId(userId),
      action_type: "CODE_COPIED",
      details: `Successfully copied code ${redeem_code_id}`,
      created_at: new Date(),
    });
    res.json({ success: true });
  } catch (e) {
    if (e.code === 11000)
      return res.status(400).json({ message: "Already copied" });
    res.status(500).json({ message: "Copy failed" });
  }
});

// --- Archive ---
app.get("/api/archive", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  // Expired
  const expired = await db
    .collection("redeem_codes")
    .aggregate([
      { $match: { created_at: { $lt: sevenDaysAgo } } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user_info",
        },
      },
      {
        $lookup: {
          from: "copies",
          localField: "_id",
          foreignField: "redeem_code_id",
          as: "copies",
        },
      },
      {
        $addFields: {
          total_copies: { $size: "$copies" },
          user_copied: { $in: [new ObjectId(userId), "$copies.user_id"] },
          status: "Expired",
        },
      },
    ])
    .toArray();
  // Exhausted
  const exhausted = await db
    .collection("redeem_codes")
    .aggregate([
      {
        $lookup: {
          from: "copies",
          localField: "_id",
          foreignField: "redeem_code_id",
          as: "copies",
        },
      },
      { $addFields: { total_copies: { $size: "$copies" } } },
      { $match: { total_copies: { $gte: 5 } } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user_info",
        },
      },
      {
        $addFields: {
          user_copied: { $in: [new ObjectId(userId), "$copies.user_id"] },
          status: "Exhausted",
        },
      },
    ])
    .toArray();
  const all = [...expired, ...exhausted].map((code) => ({
    id: code._id,
    title: code.title,
    code: code.code,
    created_at: code.created_at,
    user_name: code.user_info[0]?.name || "Unknown",
    total_copies: code.total_copies,
    user_copied: code.user_copied,
    status: code.status,
  }));
  all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(all);
});

// --- Dashboard ---
app.get("/api/dashboard", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const totalCopies = await db
    .collection("copies")
    .countDocuments({ user_id: new ObjectId(userId) });
  const addedCodes = await db
    .collection("redeem_codes")
    .countDocuments({ user_id: new ObjectId(userId) });
  res.json({ totalCopies, addedCodes });
});

// --- Account info ---
app.get("/api/account", authMiddleware, async (req, res) => {
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(req.user.id) });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ id: user._id, name: user.name, email: user.email });
});

app.listen(process.env.PORT || 5001, () => {
  console.log("API server running on port", process.env.PORT || 5001);
});
