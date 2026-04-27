import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setAuth } from '../store/authSlice'
import { authApi } from '../api/authApi'
import toast from 'react-hot-toast'

type Step = 'choose' | 'signup' | 'signup-otp' | 'login' | 'login-otp'

const COUNTRY_CODES = [
  { label: '🇺🇸 +1',   value: '+1'  },
  { label: '🇬🇧 +44',  value: '+44' },
  { label: '🇮🇳 +91',  value: '+91' },
  { label: '🇦🇺 +61',  value: '+61' },
  { label: '🇨🇦 +1',   value: '+1'  },
  { label: '🇩🇪 +49',  value: '+49' },
  { label: '🇫🇷 +33',  value: '+33' },
  { label: '🇸🇬 +65',  value: '+65' },
  { label: '🇦🇪 +971', value: '+971'},
  { label: '🇯🇵 +81',  value: '+81' },
]

function buildPhone(cc: string, num: string) {
  return cc + num.replace(/[^0-9]/g, '')
}

export default function AuthPage() {
  const dispatch = useDispatch()
  const [step, setStep] = useState<Step>('choose')

  // Signup fields
  const [signupCc, setSignupCc]   = useState('+1')
  const [signupNum, setSignupNum] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]         = useState('')

  // Login fields
  const [loginCc, setLoginCc]   = useState('+1')
  const [loginNum, setLoginNum] = useState('')

  const [otp, setOtp]         = useState('')
  const [loading, setLoading] = useState(false)

  const signupPhone = buildPhone(signupCc, signupNum)
  const loginPhone  = buildPhone(loginCc,  loginNum)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.signup(signupCc, signupNum, displayName, email || undefined)
      toast.success('OTP sent — check the backend terminal.')
      setStep('signup-otp')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Signup failed')
    } finally { setLoading(false) }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.login(loginCc, loginNum)
      toast.success('OTP sent — check the backend terminal.')
      setStep('login-otp')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  async function handleVerify(purpose: 'SIGNUP' | 'LOGIN') {
    setLoading(true)
    try {
      const phone = purpose === 'SIGNUP' ? signupPhone : loginPhone
      const res = await authApi.verifyOtp(phone, otp, purpose)
      const { accessToken, user } = res.data
      dispatch(setAuth({ token: accessToken, user }))
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  const inputCls = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
  const selectCls = "bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition flex-shrink-0"
  const btnPrimary = "w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
  const btnGhost   = "w-full border border-gray-200 hover:border-brand-400 hover:text-brand-600 text-gray-600 font-semibold py-3 rounded-xl transition-all text-sm"

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0f1923] flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#00B8D4 1px, transparent 1px), linear-gradient(90deg, #00B8D4 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10">
          <img src="/logo.png" alt="LockTrust" className="w-48 h-48 object-contain drop-shadow-2xl" />
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <img src="/logo.png" alt="LockTrust" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold text-gray-900">LockTrust</span>
          </div>

          {step === 'choose' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome</h2>
              <p className="text-gray-400 text-sm mb-8">Sign in or create an account to continue</p>
              <div className="space-y-3">
                <button onClick={() => setStep('login')} className={btnPrimary}>Sign in</button>
                <button onClick={() => setStep('signup')} className={btnGhost}>Create account</button>
              </div>
            </div>
          )}

          {step === 'signup' && (
            <form onSubmit={handleSignup}>
              <button type="button" onClick={() => setStep('choose')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <span>←</span> Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
              <p className="text-gray-400 text-sm mb-7">Join your team on LockTrust</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full name</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="Alice Smith" required className={inputCls} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone number</label>
                  <div className="flex gap-2">
                    <select value={signupCc} onChange={e => setSignupCc(e.target.value)} className={selectCls}>
                      {COUNTRY_CODES.map((c, i) => (
                        <option key={i} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <input type="tel" value={signupNum} onChange={e => setSignupNum(e.target.value)}
                      placeholder="555 123 4567" required className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Email <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="alice@example.com" className={inputCls} />
                </div>

                <button type="submit" disabled={loading} className={btnPrimary + " mt-2"}>
                  {loading ? 'Sending OTP…' : 'Continue →'}
                </button>
              </div>
            </form>
          )}

          {step === 'login' && (
            <form onSubmit={handleLogin}>
              <button type="button" onClick={() => setStep('choose')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <span>←</span> Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
              <p className="text-gray-400 text-sm mb-7">We'll send a one-time code to your phone</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone number</label>
                  <div className="flex gap-2">
                    <select value={loginCc} onChange={e => setLoginCc(e.target.value)} className={selectCls}>
                      {COUNTRY_CODES.map((c, i) => (
                        <option key={i} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <input type="tel" value={loginNum} onChange={e => setLoginNum(e.target.value)}
                      placeholder="555 123 4567" required className={inputCls} />
                  </div>
                </div>

                <button type="submit" disabled={loading} className={btnPrimary}>
                  {loading ? 'Sending OTP…' : 'Send OTP →'}
                </button>
              </div>
            </form>
          )}

          {(step === 'signup-otp' || step === 'login-otp') && (
            <OtpForm
              phone={step === 'signup-otp' ? signupPhone : loginPhone}
              loading={loading}
              otp={otp}
              setOtp={setOtp}
              onVerify={() => handleVerify(step === 'signup-otp' ? 'SIGNUP' : 'LOGIN')}
              onBack={() => setStep(step === 'signup-otp' ? 'signup' : 'login')}
              onResend={() => step === 'signup-otp'
                ? authApi.signup(signupCc, signupNum, displayName, email || undefined).then(() => toast.success('OTP resent!'))
                : authApi.login(loginCc, loginNum).then(() => toast.success('OTP resent!'))}
              btnPrimary={btnPrimary}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function OtpForm({ phone, loading, otp, setOtp, onVerify, onBack, onResend, btnPrimary }: {
  phone: string; loading: boolean; otp: string
  setOtp: (v: string) => void; onVerify: () => void
  onBack: () => void; onResend: () => void
  btnPrimary: string
}) {
  return (
    <div>
      <button type="button" onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <span>←</span> Back
      </button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Check your phone</h2>
      <p className="text-gray-400 text-sm mb-1">We sent a 6-digit code to</p>
      <p className="text-gray-900 font-semibold text-sm mb-7">{phone}</p>

      <div className="mb-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">One-time code</label>
        <input
          type="text"
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          autoFocus
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
        />
      </div>
      <p className="text-xs text-gray-400 mb-5 text-center">
        In dev mode, the code is printed in the backend terminal
      </p>

      <button onClick={onVerify} disabled={loading || otp.length !== 6} className={btnPrimary}>
        {loading ? 'Verifying…' : 'Verify & continue →'}
      </button>

      <button type="button" onClick={onResend}
        className="w-full text-sm text-brand-500 hover:text-brand-600 font-medium mt-4 transition-colors">
        Resend code
      </button>
    </div>
  )
}
