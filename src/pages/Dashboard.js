import axios from "axios"
import { useContext, useEffect, useState } from "react"
import toast from "react-hot-toast"
import {
    FiFileText,
    FiGrid, FiList,
    FiLogOut,
    FiMoon,
    FiPlus,
    FiSearch,
    FiSun,
    FiTrash2
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { v4 as uuidV4 } from "uuid"
import AuthContext from "../context/AuthContext"

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext)
    const navigate = useNavigate()
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState("grid") // 'grid' | 'list'
    const [darkMode, setDarkMode] = useState(false)

    // Load theme from local storage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'dark') {
            setDarkMode(true)
            document.documentElement.setAttribute('data-theme', 'dark')
        }
    }, [])

    useEffect(() => {
        fetchDocuments()
    }, [])

    const toggleTheme = () => {
        const newMode = !darkMode
        setDarkMode(newMode)
        if (newMode) {
            document.documentElement.setAttribute('data-theme', 'dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.removeAttribute('data-theme')
            localStorage.setItem('theme', 'light')
        }
    }

    const fetchDocuments = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/documents`)
            setDocuments(response.data)
        } catch (error) {
            console.error("Error fetching documents:", error)
            toast.error("Failed to load documents")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateDocument = async () => {
        const documentId = uuidV4()
        const loadingToast = toast.loading("Creating document...")
        try {
            await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/documents`, {
                documentId,
                title: "Untitled Document"
            })
            toast.dismiss(loadingToast)
            navigate(`/documents/${documentId}`)
        } catch (error) {
            console.error("Error creating document:", error)
            toast.dismiss(loadingToast)
            toast.error("Failed to create document")
        }
    }

    const handleDocumentClick = (documentId) => {
        navigate(`/documents/${documentId}`)
    }

    const handleDeleteDocument = async (e, documentId) => {
        e.stopPropagation()

        // Find document to show its title in confirmation
        const doc = documents.find(d => d._id === documentId)
        const docTitle = doc?.title || "Untitled Document"

        if (window.confirm(`Delete "${docTitle}"?\n\nThis action cannot be undone.`)) {
            const loadingToast = toast.loading("Deleting...")
            try {
                const token = localStorage.getItem('token')
                await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/documents/${documentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                setDocuments(documents.filter(doc => doc._id !== documentId))
                toast.dismiss(loadingToast)
                toast.success(`"${docTitle}" deleted`)
            } catch (error) {
                console.error("Error deleting document:", error)
                toast.dismiss(loadingToast)

                if (error.response?.data?.message) {
                    toast.error(error.response.data.message)
                } else {
                    toast.error("Failed to delete document")
                }
            }
        }
    }

    const handleLogout = () => {
        logout()
        toast.success("Logged out successfully")
        navigate("/login")
    }

    const formatDate = (dateString, id) => {
        if (dateString) {
            return new Date(dateString).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        }

        // Fallback for old documents using ID timestamp
        try {
            const timestamp = parseInt(id.substring(0, 8), 16) * 1000
            return new Date(timestamp).toLocaleDateString()
        } catch {
            return "Unknown date"
        }
    }

    const filteredDocuments = documents.filter(doc =>
        (doc.title || "Untitled Document").toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="dashboard-container">
            <header className="dashboard-header glass">
                <div className="brand-logo">FlowDocs</div>

                <div className="document-search">
                    <FiSearch style={{ position: 'absolute', left: '12px', top: '14px', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={toggleTheme}
                        className="btn-secondary"
                        style={{ padding: '8px', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}
                        title="Toggle Dark Mode"
                    >
                        {darkMode ? <FiSun /> : <FiMoon />}
                    </button>

                    <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'var(--primary-gradient)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold'
                        }}>
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user?.username}</span>
                        <button
                            onClick={handleLogout}
                            className="btn-secondary"
                            style={{ padding: '8px', marginLeft: '10px' }}
                            title="Logout"
                        >
                            <FiLogOut />
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-controls">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Recent Documents</h2>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ display: 'flex', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    padding: '8px 12px',
                                    border: 'none',
                                    background: viewMode === 'grid' ? 'rgba(0,0,0,0.05)' : 'transparent',
                                    color: viewMode === 'grid' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                <FiGrid />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    padding: '8px 12px',
                                    border: 'none',
                                    background: viewMode === 'list' ? 'rgba(0,0,0,0.05)' : 'transparent',
                                    color: viewMode === 'list' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                <FiList />
                            </button>
                        </div>

                        <button onClick={handleCreateDocument} className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiPlus /> New Document
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                        <div className="loading-spinner"></div>
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="empty-state glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '12px' }}>
                        <FiFileText style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '20px' }} />
                        <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>No documents found</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Create a new document to get started</p>
                        <button onClick={handleCreateDocument} className="btn-primary" style={{ width: 'auto' }}>
                            Create Document
                        </button>
                    </div>
                ) : (
                    <div className={viewMode === 'list' ? 'documents-list' : 'documents-grid'}>
                        {filteredDocuments.map(doc => (
                            <div
                                key={doc._id}
                                className="document-card"
                                onClick={() => handleDocumentClick(doc._id)}
                                style={viewMode === 'list' ? { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } : {}}
                            >
                                <div style={viewMode === 'list' ? { display: 'flex', alignItems: 'center', gap: '20px', flex: 1 } : {}}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '8px',
                                        background: 'rgba(78, 205, 196, 0.15)', color: 'var(--accent-color)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: viewMode === 'grid' ? '15px' : '0',
                                        fontSize: '1.2rem'
                                    }}>
                                        <FiFileText />
                                    </div>
                                    <div>
                                        <h3>{doc.title || "Untitled Document"}</h3>
                                        <p>Edited {formatDate(doc.updatedAt || doc.createdAt, doc._id)}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => handleDeleteDocument(e, doc._id)}
                                    className="btn-secondary"
                                    style={{
                                        marginTop: viewMode === 'grid' ? '15px' : '0',
                                        width: viewMode === 'grid' ? '100%' : 'auto',
                                        color: 'var(--danger-color)',
                                        borderColor: 'rgba(255, 107, 107, 0.2)'
                                    }}
                                    title="Delete"
                                >
                                    <FiTrash2 /> {viewMode === 'grid' ? 'Delete' : ''}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
