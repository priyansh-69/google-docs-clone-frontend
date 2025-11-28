import axios from "axios"
import { createContext, useEffect, useState } from "react"

// Configure axios to send credentials with CORS requests
axios.defaults.withCredentials = true

// Debug: Log the API URL to verify it's set correctly
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
console.log('🔧 API Base URL:', API_BASE_URL)

if (!API_BASE_URL || API_BASE_URL === 'undefined') {
    console.error('❌ REACT_APP_API_BASE_URL is not set! Check Vercel environment variables.')
}

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem("token")
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
            fetchUser()
        } else {
            setLoading(false)
        }
    }, [])

    const fetchUser = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/auth/me`)
            setUser(response.data)
        } catch (error) {
            console.error("Error fetching user:", error)
            localStorage.removeItem("token")
            delete axios.defaults.headers.common["Authorization"]
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password) => {
        try {
            console.log('🔐 Attempting login to:', `${API_BASE_URL}/api/auth/login`)
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                email,
                password,
            })
            const { token, ...userData } = response.data
            localStorage.setItem("token", token)
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
            setUser(userData)
            console.log('✅ Login successful')
            return { success: true }
        } catch (error) {
            console.error('❌ Login error:', error)
            console.error('❌ Error response:', error.response?.data)
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Login failed",
            }
        }
    }

    const register = async (username, email, password) => {
        try {
            console.log('📝 Attempting registration to:', `${API_BASE_URL}/api/auth/register`)
            const response = await axios.post(
                `${API_BASE_URL}/api/auth/register`,
                {
                    username,
                    email,
                    password,
                }
            )
            const { token, ...userData } = response.data
            localStorage.setItem("token", token)
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
            setUser(userData)
            console.log('✅ Registration successful')
            return { success: true }
        } catch (error) {
            console.error('❌ Registration error:', error)
            console.error('❌ Error response:', error.response?.data)
            return {
                success: false,
                message: error.response?.data?.message || error.message || "Registration failed",
            }
        }
    }

    const logout = () => {
        localStorage.removeItem("token")
        delete axios.defaults.headers.common["Authorization"]
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext
