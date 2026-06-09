import crypto from "node:crypto";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("\n  MONGODB_URI is not defined. Run with:");
  console.error("  node --env-file=.env.local scripts/seed.mjs\n");
  process.exit(1);
}

// Minimal schemas matching src/lib/db/models (only the fields seeding needs).
const TopicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    parentTopic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    order: { type: Number, default: 0 },
    icon: String,
    questionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const QuestionSchema = new mongoose.Schema(
  {
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
    question: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    source: String,
    isPublished: { type: Boolean, default: false },
    contentHash: { type: String, index: true },
  },
  { timestamps: true }
);

const Topic = mongoose.models.Topic ?? mongoose.model("Topic", TopicSchema);
const Question = mongoose.models.Question ?? mongoose.model("Question", QuestionSchema);

function hashQuestion(text) {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

// ---- Seed data --------------------------------------------------------------

const TOPICS = [
  { name: "JavaScript", slug: "javascript", description: "Core JavaScript language concepts", icon: "Code", order: 1, parentSlug: null },
  { name: "TypeScript", slug: "typescript", description: "Typed superset of JavaScript", icon: "FileCode", order: 2, parentSlug: "javascript" },
  { name: "React", slug: "react", description: "React library and ecosystem", icon: "Atom", order: 3, parentSlug: "typescript" },
  { name: "Node.js", slug: "node-js", description: "Server-side JavaScript runtime", icon: "Server", order: 4, parentSlug: "javascript" },
  { name: "Data Structures", slug: "data-structures", description: "Common data structures", icon: "Boxes", order: 5, parentSlug: null },
  { name: "System Design", slug: "system-design", description: "Designing scalable systems", icon: "Network", order: 6, parentSlug: null },
];

const QUESTIONS = [
  { topic: "javascript", difficulty: "easy", tags: ["closures", "scope"], question: "What is a closure in JavaScript and why is it useful?" },
  { topic: "javascript", difficulty: "medium", tags: ["event-loop", "async"], question: "Explain the JavaScript event loop and how the call stack, task queue, and microtask queue interact." },
  { topic: "javascript", difficulty: "easy", tags: ["equality"], question: "What is the difference between == and === in JavaScript?" },
  { topic: "javascript", difficulty: "hard", tags: ["prototype", "inheritance"], question: "How does prototypal inheritance work in JavaScript and how does it differ from classical inheritance?" },

  { topic: "typescript", difficulty: "easy", tags: ["types"], question: "What is the difference between an interface and a type alias in TypeScript?" },
  { topic: "typescript", difficulty: "medium", tags: ["generics"], question: "Explain generics in TypeScript with a practical example." },
  { topic: "typescript", difficulty: "medium", tags: ["utility-types"], question: "What are utility types like Partial, Pick, and Omit, and when would you use them?" },

  { topic: "react", difficulty: "easy", tags: ["hooks", "state"], question: "What is the difference between useState and useRef in React?" },
  { topic: "react", difficulty: "medium", tags: ["hooks", "effects"], question: "Explain how the useEffect dependency array works and common pitfalls with it." },
  { topic: "react", difficulty: "hard", tags: ["performance", "memo"], question: "How do React.memo, useMemo, and useCallback help with performance, and when can they hurt?" },

  { topic: "node-js", difficulty: "easy", tags: ["modules"], question: "What is the difference between CommonJS and ES modules in Node.js?" },
  { topic: "node-js", difficulty: "medium", tags: ["streams"], question: "What are streams in Node.js and what problem do they solve?" },

  { topic: "data-structures", difficulty: "easy", tags: ["arrays", "complexity"], question: "What is the time complexity of common array operations (access, search, insert, delete)?" },
  { topic: "data-structures", difficulty: "medium", tags: ["hashmap"], question: "How does a hash map achieve O(1) average lookup and what causes collisions?" },
  { topic: "data-structures", difficulty: "hard", tags: ["trees", "balancing"], question: "What is a self-balancing binary search tree and why is balancing important?" },

  { topic: "system-design", difficulty: "medium", tags: ["caching"], question: "What caching strategies would you use to scale a read-heavy API, and what are the trade-offs?" },
  { topic: "system-design", difficulty: "hard", tags: ["scaling", "databases"], question: "How would you design a URL shortener that handles millions of requests per day?" },
];

// ---- Run --------------------------------------------------------------------

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log(`Connected to database: "${mongoose.connection.name}"`);

  // Upsert topics by slug (two-pass: ids first, then parentTopic links)
  const slugToId = {};
  for (const { parentSlug: _parent, ...t } of TOPICS) {
    const doc = await Topic.findOneAndUpdate(
      { slug: t.slug },
      { $set: t },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    slugToId[t.slug] = doc._id;
  }

  for (const t of TOPICS) {
    const parentTopic = t.parentSlug ? slugToId[t.parentSlug] : null;
    await Topic.updateOne({ slug: t.slug }, { $set: { parentTopic } });
  }
  console.log(`Upserted ${TOPICS.length} topics with hierarchy links.`);

  // Insert questions (skip if contentHash already exists)
  let inserted = 0;
  let skipped = 0;
  const countsByTopic = {};

  for (const q of QUESTIONS) {
    const topicId = slugToId[q.topic];
    if (!topicId) {
      console.warn(`  Skipping question with unknown topic "${q.topic}"`);
      continue;
    }
    const contentHash = hashQuestion(q.question);
    const existing = await Question.findOne({ contentHash });
    if (existing) {
      skipped++;
      continue;
    }
    await Question.create({
      topic: topicId,
      question: q.question,
      difficulty: q.difficulty,
      tags: q.tags ?? [],
      source: "seed",
      isPublished: true,
      contentHash,
    });
    inserted++;
    countsByTopic[q.topic] = (countsByTopic[q.topic] ?? 0) + 1;
  }

  // Recompute questionCount per topic from the DB (accurate even on re-runs)
  for (const [slug, id] of Object.entries(slugToId)) {
    const count = await Question.countDocuments({ topic: id, isPublished: true });
    await Topic.updateOne({ _id: id }, { $set: { questionCount: count } });
  }

  console.log(`Inserted ${inserted} new questions, skipped ${skipped} existing.`);
  console.log("Seed complete.");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
