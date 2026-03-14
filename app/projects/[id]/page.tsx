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
      <TopBar title={project.name} subtitle="Project details and tracking" />
      <div style={{ padding: '24px 32px' }}>
        <ProjectDetailClient project={project} />
      </div>
    </div>
  );
}
