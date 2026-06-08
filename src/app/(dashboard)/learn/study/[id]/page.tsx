export const metadata = { title: "Study Mode" };

export default function StudyModePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Study Mode</h1>
      <p className="text-muted-foreground">Question {params.id} — Coming in Phase 5.</p>
    </div>
  );
}
