import { StudyView } from "@/features/learning-modes/study/components/StudyView";

export const metadata = { title: "Study Mode" };

export default async function StudyModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudyView id={id} />;
}
