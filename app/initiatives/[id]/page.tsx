import { notFound } from 'next/navigation';
import { getProjectDetail } from '@/lib/actions-projects';
import ProjectDetailClient from '@/components/projects/ProjectDetailClient';
import TopBar from '@/components/layout/TopBar';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getProjectDetail(id);

  if (!project) {
    notFound();
  }

  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar />
      <div className="px-4 py-4 sm:px-8 sm:py-6">
        <ProjectDetailClient project={project} />
      </div>
    </div>
  );
}
