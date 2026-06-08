export const metadata = { title: "Admin Overview" };

export default function AdminPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
      <p className="text-muted-foreground mb-8">Manage your platform content and settings.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Questions", value: "—" },
          { label: "Published", value: "—" },
          { label: "Pending Review", value: "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
