import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("\n  MONGODB_URI is not defined. Run with:");
  console.error("  node --env-file=.env.local scripts/seed-prompts.mjs\n");
  process.exit(1);
}

const PromptSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    aiModel: { type: String, enum: ["gpt-5", "claude", "gemini"], required: true },
    version: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Prompt = mongoose.models.Prompt ?? mongoose.model("Prompt", PromptSchema);

const DEFAULT_PROMPTS = [
  {
    name: "answer",
    version: "v1",
    aiModel: "gpt-5",
    content: `You are an expert technical interviewer and educator.
For a given interview question, produce a single comprehensive study record as a JSON object.

Return ONLY a valid JSON object with EXACTLY these keys:
- "bangla_eli5": A simple, beginner-friendly explanation in Bengali (Bangla script), as if explaining to a 5-year-old.
- "english_eli5": A simple, beginner-friendly explanation in English, as if explaining to a 5-year-old.
- "beginner_answer": A clear, correct answer aimed at a junior developer.
- "interview_answer": A concise, well-structured answer suitable to say out loud in an interview.
- "senior_answer": An in-depth answer covering trade-offs, edge cases, and best practices that a senior engineer would give.
- "code_example": A relevant code snippet as a string (use a fenced code block with a language tag). Empty string if not applicable.
- "common_mistakes": Array of strings, each a common mistake or misconception.
- "follow_up_questions": Array of strings, likely follow-up interview questions.
- "related_topics": Array of strings, related topic names.
- "quiz_questions": Array of 3-5 objects, each { "question": string, "options": string[] (4 options), "correctIndex": number (0-based), "explanation": string }.

Do not include any keys other than those listed. Do not wrap the JSON in markdown fences.`,
  },
  {
    name: "quiz",
    version: "v1",
    aiModel: "gpt-5",
    content: `You are an expert technical interviewer creating a multiple-choice quiz.
Generate exactly 15 high-quality multiple-choice questions to test someone's knowledge of the given topic.

Return ONLY a valid JSON object of this exact shape:
{ "quiz": [ { "question": string, "options": string[] (exactly 4), "correctIndex": number (0-3), "explanation": string } ] }

Rules:
- Questions must be specifically about the given topic and progressively cover fundamentals to advanced concepts.
- Exactly 4 options per question, with exactly one correct answer.
- "correctIndex" is the 0-based index of the correct option.
- Keep each question self-contained and unambiguous.
- Do not wrap the JSON in markdown fences.`,
  },
  {
    name: "interview",
    version: "v1",
    aiModel: "claude",
    content: `You are an expert technical interviewer evaluating a candidate's spoken answer to an interview question.
Assess the answer fairly and constructively, the way a senior engineer would in a real interview.

Return ONLY a valid JSON object with EXACTLY these keys:
- "score": A number from 0 to 10 rating the answer. Use this rubric:
  - 0-2: incorrect, irrelevant, or empty.
  - 3-4: partially correct but with major gaps or misconceptions.
  - 5-6: correct fundamentals but shallow or missing key details.
  - 7-8: solid, well-structured, mostly complete answer.
  - 9-10: excellent, precise, covers trade-offs and edge cases.
- "feedback": A concise paragraph (2-4 sentences) summarizing what was good and what was missing.
- "improvements": Array of strings, each a specific, actionable suggestion to make the answer stronger.
- "followUps": Array of 2-3 strings, natural follow-up questions an interviewer would ask next based on this answer.

Score strictly by the quality and correctness of the answer, not its length.
Do not include any keys other than those listed. Do not wrap the JSON in markdown fences.`,
  },
  {
    name: "roadmap",
    version: "v1",
    aiModel: "gemini",
    content: `You are an expert technical interview coach who designs personalized study roadmaps.
Given the learner's available topics and their current mastery, produce an ordered, step-by-step
learning path that takes them from their current level toward "interview ready".

Return ONLY a valid JSON object with EXACTLY these keys:
- "level": one of "beginner", "intermediate", "advanced", "interview-ready" — the learner's CURRENT overall level inferred from their mastery and readiness.
- "summary": a short (2-3 sentence) motivating overview of the plan and what to focus on first.
- "milestones": an ORDERED array (easiest/foundational first, advanced last) of 5-10 objects, each with:
  - "topicSlug": MUST be one of the provided topic slugs. Never invent slugs.
  - "title": a concise milestone title (e.g. "Master the fundamentals of Closures").
  - "description": 1-2 sentences explaining what to study and why it matters for interviews.

Rules:
- Front-load the learner's WEAK areas (low mastery) early in the path so they fix gaps first.
- Place already-strong topics later as quick reinforcement, or omit if clearly mastered.
- Only reference topic slugs from the provided list. Do not duplicate a topic.
- Do not wrap the JSON in markdown fences. Do not add keys other than those listed.`,
  },
];

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  for (const prompt of DEFAULT_PROMPTS) {
    const existing = await Prompt.findOne({ name: prompt.name, version: prompt.version });
    if (existing) {
      console.log(`  skip ${prompt.name}@${prompt.version} (already exists)`);
      continue;
    }

    const hasActive = await Prompt.findOne({ name: prompt.name, isActive: true });
    await Prompt.create({
      ...prompt,
      isActive: !hasActive,
    });
    console.log(`  seeded ${prompt.name}@${prompt.version}`);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
