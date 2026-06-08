export const metadata = { title: "Question" };

export default function QuestionDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Question Detail</h1>
      <p className="text-muted-foreground">Question {params.id} — Coming in Phase 4.</p>
    </div>
  );
}
