import axios from "axios"
import { useContext, useEffect, useState } from "react"
import { useHistory } from "react-router-dom"
import { v4 as uuidV4 } from "uuid"
import AuthContext from "../context/AuthContext"

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext)
    const history = useHistory()
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        fetchDocuments()
    }, [])

    const fetchDocuments = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/documents`)
            setDocuments(response.data)
        } catch (error) {
            console.error("Error fetching documents:", error)
            setError("Failed to load documents")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateDocument = async () => {
        const documentId = uuidV4()
        try {
            await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/documents`, {
                documentId,
                title: "Untitled Document"
            })
            history.push(`/documents/${documentId}`)
        } catch (error) {
            console.error("Error creating document:", error)
            setError("Failed to create document")
        }
    }

    const handleDocumentClick = (documentId) => {
        history.push(`/documents/${documentId}`)
    }

    const handleDeleteDocument = async (e, documentId) => {
        e.stopPropagation()
        if (window.confirm("Are you sure you want to delete this document?")) {
            try {
                const token = localStorage.getItem('token')
                await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/documents/${documentId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                setDocuments(documents.filter(doc => doc._id !== documentId))
            } catch (error) {
                console.error("Error deleting document:", error)
                // Show specific error message from backend (e.g. "Only owner can delete")
                if (error.response && error.response.data && error.response.data.message) {
                    alert(error.response.data.message)
                } else {
                    setError("Failed to delete document")
                }
            }
        }
    }

    const handleLogout = () => {
        logout()
        history.push("/login")
    }

    const formatDate = (id) => {
        // Extract timestamp from MongoDB ObjectId or UUID
        try {
            const timestamp = parseInt(id.substring(0, 8), 16) * 1000
            return new Date(timestamp).toLocaleDateString()
        } catch {
            return "Recently"
        }
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Google Docs Clone</h1>
                <div className="user-info">
                    <span>Welcome, {user?.username}!</span>
                    <button onClick={handleLogout} className="btn-secondary">
                        Logout
                    </button>
                </div>
            </header>
            <main className="dashboard-main">
                <div className="dashboard-content">
                    <h2>Your Documents</h2>
                    <button onClick={handleCreateDocument} className="btn-primary">
                        + Create New Document
                    </button>
                    {error && <div className="error-message">{error}</div>}
                    <div className="documents-list">
                        {loading ? (
                            <p className="empty-state">Loading documents...</p>
                        ) : documents.length === 0 ? (
                            <p className="empty-state">
                                No documents yet. Create your first document to get started!
                            </p>
                        ) : (
                            documents.map(doc => (
                                <div
                                    key={doc._id}
                                    className="document-card"
                                    onClick={() => handleDocumentClick(doc._id)}
                                >
                                    <h3>{doc.title || "Untitled Document"}</h3>
                                    <p>Created {formatDate(doc._id)}</p>
                                    <button
                                        onClick={(e) => handleDeleteDocument(e, doc._id)}
                                        className="btn-secondary"
                                        style={{ marginTop: '10px', width: '100%' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
