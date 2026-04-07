import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  const apiKey = process.env.API_KEY;
  if (!apiKey) return true; // no key configured = open (dev mode)

  const provided = request.headers.get('X-API-Key');
  return provided === apiKey;
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
    const { name, email, phone, source, notes } = await request.json();

    if (!name || !email) {
      return corsResponse({ error: 'Nome e email são obrigatórios' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        source: source || 'wordpress',
        notes: notes || null,
      },
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
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
    return corsResponse(leads);
  } catch (error) {
    console.error(error);
    return corsResponse({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
