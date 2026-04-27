import axios from 'axios'

const adminAxios = axios.create({ baseURL: '/api' })

adminAxios.interceptors.request.use(config => {
  const token = sessionStorage.getItem('lt_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default adminAxios
