import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, password, name } = body

    // Validate required fields
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    if (email) {
      const existingEmailUser = await db.user.findUnique({
        where: { email }
      })
      if (existingEmailUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        )
      }
    }

    if (phone) {
      const existingPhoneUser = await db.user.findUnique({
        where: { phone }
      })
      if (existingPhoneUser) {
        return NextResponse.json(
          { error: 'Phone number already registered' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        email: email || null,
        phone: phone || null,
        name: name || email?.split('@')[0] || phone || 'Player',
        password: hashedPassword,
        avatar: '🎮',
        isVerified: false,
        verificationToken: generateToken(),
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        isVerified: true,
        createdAt: true
      }
    })

    // In production, send verification email/SMS here
    console.log('Verification token:', user.id) // For demo purposes

    return NextResponse.json({
      message: 'Registration successful',
      user,
      requiresVerification: true
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
