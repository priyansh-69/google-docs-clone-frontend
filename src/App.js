import { useContext } from "react"
import { Toaster } from "react-hot-toast"
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom"
import TextEditor from "./TextEditor"
import ErrorBoundary from "./components/ErrorBoundary"
import AuthContext, { AuthProvider } from "./context/AuthContext"
import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import Register from "./pages/Register"

import LoadingSpinner from "./components/LoadingSpinner"

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/documents/:id"
              element={
                <ProtectedRoute>
                  <TextEditor />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster
            toastOptions={{
              style: {
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(10px)',
                boxShadow: 'var(--shadow-lg)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--success-color)',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--danger-color)',
                  secondary: 'white',
                },
              },
            }}
          />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
