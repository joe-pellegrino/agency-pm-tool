import { notFound } from 'next/navigation';
import { getProjectDetail } from '@/lib/actions-projects';
import ProjectDetailClient from '@/components/projects/ProjectDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getProjectDetail(id);

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} />;
}
