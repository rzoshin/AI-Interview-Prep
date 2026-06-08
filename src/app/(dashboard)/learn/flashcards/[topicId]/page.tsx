export const metadata = { title: "Flashcards" };

export default function FlashcardsPage({ params }: { params: { topicId: string } }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Flashcards</h1>
      <p className="text-muted-foreground">Topic {params.topicId} — Coming in Phase 5.</p>
    </div>
  );
}
