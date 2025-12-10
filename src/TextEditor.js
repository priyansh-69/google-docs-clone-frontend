import axios from "axios"
import Quill from "quill"
import "quill/dist/quill.snow.css"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import {
  FiArrowLeft,
  FiCheckCircle,
  FiCloud,
  FiCloudOff,
  FiDownload,
  FiMoon,
  FiShare2,
  FiSun
} from "react-icons/fi"
import { useNavigate, useParams } from "react-router-dom"
import { io } from "socket.io-client"
import AIAssistant from "./components/AIAssistant"

const SAVE_INTERVAL_MS = 2000
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
]

export default function TextEditor() {
  const { id: documentId } = useParams()
  const navigate = useNavigate()

  // Extract share token from URL query params
  const urlParams = new URLSearchParams(window.location.search)
  const shareToken = urlParams.get('share')

  const [socket, setSocket] = useState()
  const [quill, setQuill] = useState()
  const [title, setTitle] = useState("Untitled Document")
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [activeUsers, setActiveUsers] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [saveStatus, setSaveStatus] = useState("Saved")
  const [darkMode, setDarkMode] = useState(false)
  const [hasOfflineChanges, setHasOfflineChanges] = useState(false)

  // Load theme from local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    }
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

  // Initialize socket connection with JWT authentication
  useEffect(() => {
    // Get JWT token from localStorage
    const token = localStorage.getItem("token")

    if (!token) {
      console.error("No authentication token found")
      toast.error("Authentication required")
      navigate("/login")
      return
    }

    // Connect with authentication
    const s = io(process.env.REACT_APP_API_BASE_URL, {
      auth: {
        token: token
      }
    })

    setSocket(s)

    s.on("connect", () => {
      setIsConnected(true)
      console.log("Connected to server")
    })

    s.on("disconnect", () => {
      setIsConnected(false)
      console.log("Disconnected from server")
    })

    s.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message)
      setIsConnected(false)
    })

    s.on("error", (error) => {
      console.error("Socket error:", error.message)
      toast.error(error.message || "An error occurred")
    })

    return () => {
      s.disconnect()
    }
  }, [navigate])

  // Warn user about unsaved changes before closing
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus !== "Saved") {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (socket && quill) {
          socket.emit("save-document", quill.getContents())
          setSaveStatus("Saving...")
          setTimeout(() => setSaveStatus("Saved"), 500)
          toast.success("Document saved!", { duration: 1500 })
        }
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [socket, quill])

  // Load document and join collaboration
  useEffect(() => {
    if (socket == null || quill == null) return

    const loadHandler = document => {
      quill.setContents(document)
      quill.enable()
      toast.success("Document loaded")
    }

    socket.once("load-document", loadHandler)
    socket.emit("get-document", { documentId, shareToken })  // Include share token

    // Handle reconnection
    const connectHandler = () => {
      console.log("Reconnected")
      toast("Reconnected", { icon: '🟢' })

      if (hasOfflineChanges) {
        console.log("Syncing offline changes...")
        socket.emit("save-document", quill.getContents())
        setHasOfflineChanges(false)
        toast.success("Offline changes synced!")
      } else {
        console.log("Fetching latest document...")
        socket.emit("get-document", { documentId, shareToken })
      }
    }

    const disconnectHandler = () => {
      console.log("Disconnected from server")
      // Note: Removed intrusive offline toast - user will see "Offline" status in header instead
    }

    socket.on("connect", connectHandler)
    socket.on("disconnect", disconnectHandler)

    return () => {
      socket.off("connect", connectHandler)
      socket.off("disconnect", disconnectHandler)
      socket.off("load-document", loadHandler)
    }
  }, [socket, quill, documentId, shareToken, hasOfflineChanges])

  // Handle user joined
  useEffect(() => {
    if (socket == null) return

    const handleUserJoined = ({ user: newUser, activeUsers: users }) => {
      console.log("User joined:", newUser.username)
      const uniqueUsers = Array.from(new Map(users.map(u => [u.userId, u])).values())
      setActiveUsers(uniqueUsers)
      toast(`${newUser.username} joined`, { icon: '👋', duration: 2000 })
    }

    socket.on("user-joined", handleUserJoined)

    return () => {
      socket.off("user-joined", handleUserJoined)
    }
  }, [socket])

  // Handle user left
  useEffect(() => {
    if (socket == null) return

    const handleUserLeft = ({ username, activeUsers: users }) => {
      console.log("User left:", username)
      const uniqueUsers = Array.from(new Map(users.map(u => [u.userId, u])).values())
      setActiveUsers(uniqueUsers)
    }

    socket.on("user-left", handleUserLeft)

    return () => {
      socket.off("user-left", handleUserLeft)
    }
  }, [socket])

  // Handle title updates from other users
  useEffect(() => {
    if (socket == null) return

    const handleTitleUpdate = (newTitle) => {
      setTitle(newTitle)
    }

    socket.on("title-update", handleTitleUpdate)

    return () => {
      socket.off("title-update", handleTitleUpdate)
    }
  }, [socket])

  // Handle cursor updates
  useEffect(() => {
    if (socket == null || quill == null) return

    const handleCursorUpdate = (cursorData) => {
      // You can implement cursor rendering here
      console.log("Cursor update:", cursorData)
    }

    socket.on("cursor-update", handleCursorUpdate)

    return () => {
      socket.off("cursor-update", handleCursorUpdate)
    }
  }, [socket, quill])

  // Send cursor position
  useEffect(() => {
    if (socket == null || quill == null) return

    const handleSelectionChange = (range) => {
      if (range) {
        socket.emit("cursor-move", {
          index: range.index,
          length: range.length
        })
      }
    }

    quill.on("selection-change", handleSelectionChange)

    return () => {
      quill.off("selection-change", handleSelectionChange)
    }
  }, [socket, quill])

  // Fetch document title
  useEffect(() => {
    const fetchDocumentTitle = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/documents/${documentId}`)
        setTitle(response.data.title || "Untitled Document")
      } catch (error) {
        console.error("Error fetching document title:", error)
      }
    }
    fetchDocumentTitle()
  }, [documentId])

  // Auto-save title
  useEffect(() => {
    if (!title || title === "Untitled Document") return
    if (socket == null) return

    const timeoutId = setTimeout(async () => {
      setIsSavingTitle(true)
      try {
        // Save to database first
        await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/documents/${documentId}/title`, { title })

        // Only broadcast if save succeeded
        socket.emit("title-change", title)

        setIsSavingTitle(false)
      } catch (error) {
        console.error("Error saving title:", error)
        setIsSavingTitle(false)
        toast.error("Failed to save title")
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [title, documentId, socket])

  // Auto-save document
  useEffect(() => {
    if (socket == null || quill == null) return

    const interval = setInterval(() => {
      setSaveStatus("Saving...")
      socket.emit("save-document", quill.getContents(), (response) => {
        if (response && response.status === 'ok') {
          setSaveStatus("Saved")
        } else {
          setSaveStatus("Error Saving")
          console.error("Save failed:", response?.error)
        }
      })
    }, SAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [socket, quill])

  // Receive changes from other users
  useEffect(() => {
    if (socket == null || quill == null) return

    const handler = delta => {
      quill.updateContents(delta)
    }
    socket.on("receive-changes", handler)

    return () => {
      socket.off("receive-changes", handler)
    }
  }, [socket, quill])

  // Send changes to other users
  useEffect(() => {
    if (socket == null || quill == null) return

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return

      if (socket && !socket.connected) {
        setHasOfflineChanges(true)
      }

      socket.emit("send-changes", delta)
    }
    quill.on("text-change", handler)

    return () => {
      quill.off("text-change", handler)
    }
  }, [socket, quill])

  const wrapperRef = useCallback(wrapper => {
    if (wrapper == null) return

    wrapper.innerHTML = ""
    const editor = document.createElement("div")
    wrapper.append(editor)
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    })
    q.disable()
    q.setText("Loading...")
    setQuill(q)
  }, [])

  const handleGenerateShareLink = async () => {
    const loadingToast = toast.loading("Generating link...")
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/documents/${documentId}/share`,
        { permission: 'viewer' }
      )
      setShareLink(response.data.shareUrl)
      setShowShareModal(true)
      toast.dismiss(loadingToast)
    } catch (error) {
      console.error("Error generating share link:", error)
      toast.dismiss(loadingToast)
      toast.error("Failed to generate share link")
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    toast.success("Link copied to clipboard!")
  }

  const handleExportPDF = () => {
    window.print()
  }

  return (
    <div className="editor-container">
      {/* Editor Header */}
      <header className="editor-header detail-glass" style={{
        height: 'var(--header-height)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--glass-border)',
        backdropFilter: 'blur(10px)'
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary"
          style={{ padding: '8px', display: 'flex', alignItems: 'center' }}
          title="Back to Dashboard"
        >
          <FiArrowLeft size={20} />
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '18px',
              fontWeight: '600',
              padding: '4px 8px',
              outline: 'none',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              width: '100%',
              transition: 'background 0.2s'
            }}
            onFocus={(e) => e.target.style.background = 'var(--input-bg)'}
            onBlur={(e) => e.target.style.background = 'transparent'}
            placeholder="Untitled Document"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingLeft: '8px', fontSize: '13px' }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              color: saveStatus === 'Error Saving' ? 'var(--danger-color)' : 'var(--text-secondary)'
            }}>
              {saveStatus === 'Saving...' ? <FiCloud /> :
                saveStatus === 'Saved' ? <FiCheckCircle style={{ color: 'var(--success-color)' }} /> :
                  <FiCloudOff />}
              {isSavingTitle ? "Saving..." : saveStatus}
            </span>

            <span style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              color: isConnected ? 'var(--success-color)' : 'var(--text-light)'
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: isConnected ? 'var(--success-color)' : 'var(--text-light)'
              }} />
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Active Users */}
        {activeUsers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px' }}>
            <div style={{ display: 'flex', marginLeft: '10px' }}>
              {activeUsers.slice(0, 3).map((u, i) => (
                <div
                  key={i}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: u.color, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', border: '2px solid white',
                    marginLeft: '-10px', fontSize: '12px'
                  }}
                  title={u.username}
                >
                  {u.username[0].toUpperCase()}
                </div>
              ))}
              {activeUsers.length > 3 && (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#e2e8f0', color: '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', border: '2px solid white',
                  marginLeft: '-10px', fontSize: '12px'
                }}>
                  +{activeUsers.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{ padding: '8px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', height: '40px' }}
            title="Toggle Dark Mode"
          >
            {darkMode ? <FiSun /> : <FiMoon />}
          </button>

          <button
            onClick={handleExportPDF}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Export to PDF"
          >
            <FiDownload /> <span className="btn-label">PDF</span>
          </button>

          <button
            onClick={handleGenerateShareLink}
            className="btn-primary"
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
          >
            <FiShare2 /> <span className="btn-label">Share</span>
          </button>

          <button
            onClick={() => setIsAIOpen(true)}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(102, 126, 234, 0.25)'
            }}
          >
            ✨ <span className="btn-label">AI</span>
          </button>
        </div>
      </header>

      <div className="container" ref={wrapperRef}></div>

      <AIAssistant quill={quill} isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />

      {/* Share Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowShareModal(false)}>
          <div className="glass-panel" style={{
            background: 'var(--card-bg)', padding: '30px', borderRadius: '16px',
            maxWidth: '500px', width: '90%', border: '1px solid var(--glass-border)'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Share Document</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Anyone with this link can view this document:</p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <input
                type="text"
                value={shareLink}
                readOnly
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--input-bg)', color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={copyShareLink}
                className="btn-primary"
                style={{ width: 'auto', whiteSpace: 'nowrap' }}
              >
                Copy Link
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="btn-secondary"
              style={{ marginTop: '20px', width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
