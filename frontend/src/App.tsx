import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store'
import { setAuth } from './store/authSlice'
import { userApi } from './api/userApi'
import AuthPage from './pages/AuthPage'
import WorkspacePage from './pages/WorkspacePage'
import AdminPage from './pages/AdminPage'

function App() {
  const dispatch = useDispatch()
  const token = useSelector((s: RootState) => s.auth.token)
  const user = useSelector((s: RootState) => s.auth.user)
  const [booting, setBooting] = useState(!!token && !user)

  // On hard refresh: token in localStorage but user not in Redux — restore it once
  useEffect(() => {
    if (!token || user) { setBooting(false); return }
    userApi.getMe()
      .then(res => dispatch(setAuth({ token, user: res.data })))
      .catch(() => {/* axiosInstance 401 handler clears token */})
      .finally(() => setBooting(false))
  }, [])

  if (booting) return null

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route
          path="/auth"
          element={token ? <Navigate to="/workspace" replace /> : <AuthPage />}
        />
        <Route
          path="/workspace/*"
          element={token ? <WorkspacePage /> : <Navigate to="/auth" replace />}
        />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="*" element={<Navigate to={token ? '/workspace' : '/auth'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
