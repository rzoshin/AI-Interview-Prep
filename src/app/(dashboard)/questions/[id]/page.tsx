import { QuestionDetailView } from "@/features/ai-answer/components/QuestionDetailView";

export const metadata = { title: "Question" };

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuestionDetailView id={id} />;
}
