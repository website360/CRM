import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getOrgIdFromRequest } from '@/lib/auth';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

function corsResponse(body: unknown, init: ResponseInit = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...init.headers,
    },
  });
}

function isAuthorized(request: NextRequest): boolean {
  // Allow if logged in (has auth cookie)
  const authToken = request.cookies.get('auth_token')?.value;
  if (authToken) return true;

  // Allow if API key matches
  const apiKey = process.env.API_KEY;
  if (!apiKey) return true;

  const provided = request.headers.get('X-API-Key');
  const fromQuery = request.nextUrl.searchParams.get('key');
  return provided === apiKey || fromQuery === apiKey;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return corsResponse({ error: 'API key inválida' }, { status: 401 });
  }

  try {
    const { name, email, phone, source, notes, metadata, ...extraFields } = await request.json();

    if (!name || !email) {
      return corsResponse({ error: 'Nome e email são obrigatórios' }, { status: 400 });
    }

    // Merge extra fields into metadata
    const allMetadata = {
      ...(metadata || {}),
      ...(Object.keys(extraFields).length > 0 ? extraFields : {}),
    };

    // Get orgId from auth token if available
    let orgId: number | null = null;
    const authToken = request.cookies.get('auth_token')?.value;
    if (authToken) {
      const payload = verifyToken(authToken);
      if (payload?.orgId) orgId = payload.orgId;
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        source: source || 'wordpress',
        notes: notes || null,
        metadata: Object.keys(allMetadata).length > 0 ? allMetadata : undefined,
        orgId,
      },
    });

    // Trigger automations for new lead
    import('@/lib/automation-runner').then(({ runAutomations }) => {
      runAutomations('new_lead', { leadId: lead.id, contactName: lead.name, contactPhone: lead.phone || undefined, contactEmail: lead.email }).catch(console.error);
    });

    return corsResponse(lead, { status: 201 });
  } catch (error) {
    console.error(error);
    return corsResponse({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return corsResponse({ error: 'API key inválida' }, { status: 401 });
  }

  try {
    const orgId = getOrgIdFromRequest(request);
    const leads = await prisma.lead.findMany({ where: orgId ? { orgId } : undefined, orderBy: { createdAt: 'desc' } });
    return corsResponse(leads);
  } catch (error) {
    console.error(error);
    return corsResponse({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
