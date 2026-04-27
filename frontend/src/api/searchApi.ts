import api from './axiosInstance'

export const searchApi = {
  search: (q: string) => api.get('/search', { params: { q } }),
}
