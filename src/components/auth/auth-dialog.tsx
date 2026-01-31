'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Mail, Phone, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoginSuccess: (user: any) => void
  defaultTab?: 'login' | 'signup'
}

export function AuthDialog({ open, onOpenChange, onLoginSuccess, defaultTab = 'login' }: AuthDialogProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password'>(defaultTab)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resetToken, setResetToken] = useState('')

  // Form states
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' })
  const [signupForm, setSignupForm] = useState({ email: '', phone: '', password: '', name: '' })
  const [forgotForm, setForgotForm] = useState({ identifier: '' })
  const [resetForm, setResetForm] = useState({ token: '', newPassword: '', confirmPassword: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Save to localStorage
      localStorage.setItem('snake-game-user', JSON.stringify(data.user))
      onLoginSuccess(data.user)
      onOpenChange(false)
      setLoginForm({ identifier: '', password: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (signupForm.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setMessage('Registration successful! Please login with your credentials.')
      setTimeout(() => {
        setAuthMode('login')
        setLoginForm({ identifier: signupForm.email || signupForm.phone, password: '' })
        setMessage('')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotForm)
      })

      const data = await res.json()

      setMessage(data.message)
      if (data.resetToken) {
        setResetToken(data.resetToken)
        setResetForm(prev => ({ ...prev, token: data.resetToken }))
        setTimeout(() => setAuthMode('reset-password'), 1500)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (resetForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetForm.token, newPassword: resetForm.newPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed')
      }

      setMessage('Password reset successful! Please login with your new password.')
      setTimeout(() => {
        setAuthMode('login')
        setResetForm({ token: '', newPassword: '', confirmPassword: '' })
        setMessage('')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const backToLogin = () => {
    setAuthMode('login')
    setError('')
    setMessage('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 backdrop-blur-xl border-slate-700/50 text-white max-w-md">
        <DialogHeader>
          {authMode === 'login' && (
            <>
              <DialogTitle>Welcome Back!</DialogTitle>
              <DialogDescription className="text-slate-400">
                Login to play and track your progress
              </DialogDescription>
            </>
          )}
          {authMode === 'signup' && (
            <>
              <DialogTitle>Create Account</DialogTitle>
              <DialogDescription className="text-slate-400">
                Sign up with email or phone number
              </DialogDescription>
            </>
          )}
          {authMode === 'forgot-password' && (
            <>
              <DialogTitle>Forgot Password?</DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter your email or phone to reset your password
              </DialogDescription>
            </>
          )}
          {authMode === 'reset-password' && (
            <>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter your new password
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* Login Form */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email or Phone</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Enter email or phone"
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="button"
              variant="link"
              className="text-purple-400 hover:text-purple-300 p-0 h-auto text-sm"
              onClick={() => { setAuthMode('forgot-password'); setError(''); setMessage(''); }}
            >
              Forgot password?
            </Button>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <div className="text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <Button
                type="button"
                variant="link"
                className="text-purple-400 hover:text-purple-300 p-0 h-auto"
                onClick={() => { setAuthMode('signup'); setError(''); setMessage(''); }}
              >
                Sign up
              </Button>
            </div>
          </form>
        )}

        {/* Signup Form */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name (optional)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 pl-10"
                />
              </div>
            </div>

            <div className="text-center text-sm text-slate-400">- OR -</div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password (min 6 characters)"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>

            <div className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Button
                type="button"
                variant="link"
                className="text-purple-400 hover:text-purple-300 p-0 h-auto"
                onClick={() => { setAuthMode('login'); setError(''); setMessage(''); }}
              >
                Login
              </Button>
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {authMode === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email or Phone</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Enter email or phone"
                  value={forgotForm.identifier}
                  onChange={(e) => setForgotForm({ ...forgotForm, identifier: e.target.value })}
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={backToLogin}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </form>
        )}

        {/* Reset Password Form */}
        {authMode === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reset Token</label>
              <Input
                type="text"
                placeholder="Enter reset token"
                value={resetForm.token}
                onChange={(e) => setResetForm({ ...resetForm, token: e.target.value })}
                className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
                required
              />
              <p className="text-xs text-slate-500">Check the console/terminal for the reset token</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min 6 characters)"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={backToLogin}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
