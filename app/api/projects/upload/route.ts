import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { logProjectActivity } from '@/lib/actions-projects';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;

    if (!file || !projectId) {
      return NextResponse.json({ error: 'Missing file or projectId' }, { status: 400 });
    }

    const db = createServerClient();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const storagePath = `projects/${projectId}/${Date.now()}-${file.name}`;

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await db.storage
      .from('assets')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      // If storage bucket doesn't exist or fails, just create DB record without file
      console.error('Storage upload error:', storageError);
    }

    const storageUrl = storageData
      ? db.storage.from('assets').getPublicUrl(storagePath).data.publicUrl
      : null;

    // Create asset record in DB
    const { data: asset, error: dbError } = await db
      .from('assets')
      .insert({
        id: `asset-${Date.now()}`,
        client_id: null,
        filename: file.name,
        file_type: file.type || 'application/octet-stream',
        size: file.size,
        uploaded_by: 'Joe',
        storage_path: storagePath,
        storage_url: storageUrl,
        project_id: projectId,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Log activity
    await logProjectActivity(projectId, {
      actionType: 'file_uploaded',
      entityType: 'file',
      entityId: asset.id,
      description: `Joe uploaded "${file.name}"`,
    });

    return NextResponse.json({ success: true, asset });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
