import DashboardLayout from "./(dashboard)/layout";
import DashboardHome from "./(dashboard)/page";

export default function RootPage() {
  return (
    <DashboardLayout>
      <DashboardHome />
    </DashboardLayout>
  );
}
