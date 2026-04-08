import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, setSetting, clearCache } from '@/lib/settings';

export async function GET() {
  const settings = await getAllSettings();
  // Mask sensitive values for display
  const masked: Record<string, string> = {};
  for (const [key, val] of Object.entries(settings)) {
    if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
      masked[key] = val ? `${val.slice(0, 8)}...${val.slice(-4)}` : '';
    } else {
      masked[key] = val;
    }
  }
  return NextResponse.json({ settings, masked });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string' && value.trim()) {
      await setSetting(key, value.trim());
    }
  }

  clearCache();
  return NextResponse.json({ ok: true });
}
