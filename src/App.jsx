import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

// Page Components
import Dashboard from './pages/Dashboard'
import VolunteerDashboard from './pages/VolunteerDashboard'
import Volunteers from './pages/Volunteers'
import Tasks from './pages/Tasks'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import PublicPortal from './pages/PublicPortal'
import Login from './pages/Login'
// ✅ FIXED: Added the new Registration component
import RegisterVolunteer from './components/RegisterVolunteer' 

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        
        {/* Unprotected Routes */}
        <Route path="/public" element={<PublicPortal />} />
        <Route path="/login" element={<Login />} />
        {/* ✅ FIXED: Added the join route so volunteers can apply */}
        <Route path="/join" element={<RegisterVolunteer />} />

        {/* Redirect root domain */}
        <Route path="/" element={<Navigate to="/public" replace />} />

        {/* Protected Volunteer Route */}
        <Route path="/volunteer" element={
          <ProtectedRoute user={user}>
            <VolunteerDashboard />
          </ProtectedRoute>
        } />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute user={user}>
            <MainLayoutWrapper />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="volunteers" element={<Volunteers />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback routes */}
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/tasks" element={<Navigate to="/admin/tasks" replace />} />
        <Route path="/volunteers" element={<Navigate to="/admin/volunteers" replace />} />
        <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
        <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

function MainLayoutWrapper() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}

export default App