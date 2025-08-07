import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return new Response(JSON.stringify({
    success: true,
    message: 'Simple API working'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const text = await request.text()
    let body
    try {
      body = JSON.parse(text)
    } catch {
      body = { rawText: text }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Simple POST working',
      received: body
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed',
      details: String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}