import { getAIClient } from "@/lib/ai/client";

export async function callAIEvaluation(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const ai = getAIClient();
  if (!ai) {
    throw new Error(
      "No AI provider configured. Add GROQ_API_KEY (free at console.groq.com) to .env.local."
    );
  }

  const response = await ai.client.chat.completions.create({
    model: ai.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content ?? "{}";
}
