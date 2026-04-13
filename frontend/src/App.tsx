import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import AuthPage from './pages/AuthPage'
import WorkspacePage from './pages/WorkspacePage'

function App() {
  const token = useSelector((s: RootState) => s.auth.token)

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
        <Route path="*" element={<Navigate to={token ? '/workspace' : '/auth'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
