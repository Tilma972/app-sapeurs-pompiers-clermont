import { NextResponse } from 'next/server'
import { runAllPotDepensesTests } from '@/lib/supabase/__tests__/pot-depenses.test'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Sécurité minimale : uniquement en développement
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Route de test désactivée en production' }, { status: 403 })
  }

  const logs: string[] = []
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  // Capturer les logs
  console.log = (...args: unknown[]) => {
    const line = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
    logs.push(line)
    originalLog(...args)
  }
  console.error = (...args: unknown[]) => {
    const line = '❌ ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
    logs.push(line)
    originalError(...args)
  }
  console.warn = (...args: unknown[]) => {
    const line = '⚠️  ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
    logs.push(line)
    originalWarn(...args)
  }

  try {
    await runAllPotDepensesTests()
  } finally {
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn
  }

  const hasFailures = logs.some(l => l.includes('❌'))

  return NextResponse.json(
    {
      status: hasFailures ? 'FAILED' : 'PASSED',
      logs,
    },
    { status: hasFailures ? 500 : 200 }
  )
}
