import { FlashcardDeck } from "@/features/learning-modes/flashcard/components/FlashcardDeck";

export const metadata = { title: "Flashcards" };

export default async function FlashcardsPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  return <FlashcardDeck topicId={topicId} />;
}
