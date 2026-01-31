import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Generate random token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Generate verification token (6 digits)
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
