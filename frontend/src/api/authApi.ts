import api from './axiosInstance'

export const authApi = {
  signup: (email: string, displayName: string) =>
    api.post('/auth/signup', { email, displayName }),

  login: (email: string) =>
    api.post('/auth/login', { email }),

  verifyOtp: (email: string, otp: string, purpose: string) =>
    api.post('/auth/verify-otp', { email, otp, purpose }),
}
