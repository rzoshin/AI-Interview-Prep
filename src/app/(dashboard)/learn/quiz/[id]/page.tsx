import { QuizRunner } from "@/features/learning-modes/quiz/components/QuizRunner";

export const metadata = { title: "Quiz Mode" };

// The dynamic segment carries a topic id (quizzes are topic-wise).
export default async function QuizModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuizRunner topicId={id} />;
}
