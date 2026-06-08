export const metadata = { title: "Quiz Mode" };

export default function QuizModePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quiz Mode</h1>
      <p className="text-muted-foreground">Quiz for {params.id} — Coming in Phase 5.</p>
    </div>
  );
}
