import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier } = body

    if (!identifier) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      )
    }

    // Find user by email or phone
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    })

    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email/phone, a reset code will be sent.'
      })
    }

    // Generate reset token
    const resetToken = generateToken()
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Update user with reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // In production, send email/SMS with reset link here
    // For demo, log the token
    console.log('Password reset token for user', user.email || user.phone, ':', resetToken)
    console.log('Reset code:', resetToken.substring(0, 6).toUpperCase())

    return NextResponse.json({
      message: 'If an account exists with this email/phone, a reset code will be sent.',
      // Only return this in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
