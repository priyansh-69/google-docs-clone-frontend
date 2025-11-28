import { useContext } from "react"
import {
  Redirect,
  Route,
  BrowserRouter as Router,
  Switch,
} from "react-router-dom"
import TextEditor from "./TextEditor"
import AuthContext, { AuthProvider } from "./context/AuthContext"
import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import Register from "./pages/Register"

// Protected Route Component
function ProtectedRoute({ children, ...rest }) {
  const { user, loading } = useContext(AuthContext)

  return (
    <Route
      {...rest}
      render={({ location }) =>
        loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '1.5rem'
          }}>
            Loading...
          </div>
        ) : user ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location }
            }}
          />
        )
      }
    />
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Switch>
          <Route path="/login" exact>
            <Login />
          </Route>
          <Route path="/register" exact>
            <Register />
          </Route>
          <ProtectedRoute path="/dashboard" exact>
            <Dashboard />
          </ProtectedRoute>
          <ProtectedRoute path="/documents/:id">
            <TextEditor />
          </ProtectedRoute>
          <Route path="/" exact>
            <Redirect to="/dashboard" />
          </Route>
        </Switch>
      </AuthProvider>
    </Router>
  )
}

export default App
