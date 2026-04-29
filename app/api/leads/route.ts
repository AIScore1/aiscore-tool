import { NextRequest, NextResponse } from 'next/server';
import {
  exportLeadsCSV,
  getLead,
  getLeads,
  markLeadRead,
  unreadHotLeads,
  updateLeadNotes,
  updateLeadStatus,
} from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get('format') === 'csv') {
    const csv = await exportLeadsCSV();
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="aiscore-leads-${new Date()
          .toISOString()
          .split('T')[0]}.csv"`,
      },
    });
  }
  const id = url.searchParams.get('id');
  if (id) {
    const lead = await getLead(id);
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ lead });
  }
  return NextResponse.json({
    leads: await getLeads(),
    unreadHot: await unreadHotLeads(),
  });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    id: string;
    status?: 'new' | 'contacted' | 'audit_sent' | 'proposal' | 'client' | 'lost';
    notes?: string;
    read?: boolean;
  };
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (body.status) await updateLeadStatus(body.id, body.status);
  if (typeof body.notes === 'string') await updateLeadNotes(body.id, body.notes);
  if (body.read) await markLeadRead(body.id);
  const lead = await getLead(body.id);
  return NextResponse.json({ lead });
}
