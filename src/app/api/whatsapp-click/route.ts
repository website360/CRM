import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

function corsResponse(body: unknown, init: ResponseInit = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...CORS_HEADERS, ...init.headers },
  });
}

function isAuthorized(request: NextRequest): boolean {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return true;
  // Accept API key from header or query param (sendBeacon can't send headers)
  const fromHeader = request.headers.get('X-API-Key');
  const fromQuery = request.nextUrl.searchParams.get('key');
  return fromHeader === apiKey || fromQuery === apiKey;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return corsResponse({ error: 'API key inválida' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      page,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      whatsapp_number,
    } = body;

    const metadata: Record<string, string> = {
      tipo: 'clique-whatsapp',
      ...(page && { pagina: page }),
      ...(referrer && { referrer }),
      ...(utm_source && { utm_source }),
      ...(utm_medium && { utm_medium }),
      ...(utm_campaign && { utm_campaign }),
      ...(whatsapp_number && { whatsapp_number }),
    };

    // Generate a unique placeholder email for anonymous clicks
    const clickId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const email = `whatsapp-${clickId}@click.track`;

    const lead = await prisma.lead.create({
      data: {
        name: 'Clique WhatsApp',
        email,
        source: body.source || 'whatsapp-click',
        status: 'whatsapp',
        metadata,
      },
    });

    return corsResponse({ ok: true, id: lead.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return corsResponse({ error: 'Erro interno' }, { status: 500 });
  }
}
