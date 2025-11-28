import axios from "axios"
import { createContext, useEffect, useState } from "react"

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
            const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/auth/me`)
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
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/auth/login`, {
                email,
                password,
            })
            const { token, ...userData } = response.data
            localStorage.setItem("token", token)
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
            setUser(userData)
            return { success: true }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Login failed",
            }
        }
    }

    const register = async (username, email, password) => {
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}/api/auth/register`,
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
            return { success: true }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Registration failed",
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
