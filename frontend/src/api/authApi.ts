import api from './axiosInstance'

export const authApi = {
  signup: (countryCode: string, phoneNumber: string, displayName: string, email?: string) =>
    api.post('/auth/signup', { countryCode, phoneNumber, displayName, email }),

  login: (countryCode: string, phoneNumber: string) =>
    api.post('/auth/login', { countryCode, phoneNumber }),

  verifyOtp: (phone: string, otp: string, purpose: string) =>
    api.post('/auth/verify-otp', { phone, otp, purpose }),
}
