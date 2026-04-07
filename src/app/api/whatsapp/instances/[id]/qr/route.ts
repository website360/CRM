import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET - Get QR code for instance
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const instance = await prisma.whatsAppInstance.findUnique({
    where: { id: parseInt(id) },
    select: { qrCode: true, status: true, phone: true },
  });

  if (!instance) {
    return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    status: instance.status,
    qrCode: instance.qrCode,
    phone: instance.phone,
  });
}
