export const metadata = { title: "Topic" };

export default function TopicPage({ params }: { params: { slug: string } }) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 capitalize">{params.slug.replace(/-/g, " ")}</h1>
      <p className="text-muted-foreground">Topic questions — Coming in Phase 3.</p>
    </div>
  );
}
