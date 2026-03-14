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
      <div style={{ padding: '24px 32px' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{project.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Project details and tracking</p>
        </div>
        <ProjectDetailClient project={project} />
      </div>
    </div>
  );
}
