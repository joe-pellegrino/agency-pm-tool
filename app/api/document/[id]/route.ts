import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServerClient();

  const [docRes, collabRes, teamRes, clientsRes, versionsRes, commentsRes] = await Promise.all([
    db.from('documents').select('*').eq('id', id).is('archived_at', null).single(),
    db.from('document_collaborators').select('team_member_id').eq('document_id', id),
    db.from('team_members').select('*').is('archived_at', null),
    db.from('clients').select('id,name,color').is('archived_at', null),
    db.from('document_versions').select('*').eq('document_id', id).order('created_at', { ascending: false }).limit(50),
    db.from('comments').select('*').eq('document_id', id).is('archived_at', null).order('created_at', { ascending: true }),
  ]);

  if (!docRes.data || docRes.error) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  return NextResponse.json({
    document: docRes.data,
    collaborators: (collabRes.data || []).map((c: { team_member_id: string }) => c.team_member_id),
    teamMembers: teamRes.data || [],
    clients: clientsRes.data || [],
    versions: versionsRes.data || [],
    comments: commentsRes.data || [],
  });
}
