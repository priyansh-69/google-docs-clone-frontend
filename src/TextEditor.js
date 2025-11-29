import axios from "axios"
import Quill from "quill"
import "quill/dist/quill.snow.css"
import { useCallback, useContext, useEffect, useState } from "react"
import { useHistory, useParams } from "react-router-dom"
import { io } from "socket.io-client"
import AIAssistant from "./components/AIAssistant"
import AuthContext from "./context/AuthContext"

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
  const history = useHistory()
  const { user } = useContext(AuthContext)
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

  // Initialize socket connection
  useEffect(() => {
    const s = io(process.env.REACT_APP_API_BASE_URL)
    setSocket(s)

    s.on("connect", () => {
      setIsConnected(true)
      console.log("Connected to server")
    })

    s.on("disconnect", () => {
      setIsConnected(false)
      console.log("Disconnected from server")
    })

    return () => {
      s.disconnect()
    }
  }, [])

  // Load document and join collaboration
  // Load document and join collaboration
  useEffect(() => {
    if (socket == null || quill == null) return

    const loadHandler = document => {
      quill.setContents(document)
      quill.enable()
    }

    socket.once("load-document", loadHandler)
    socket.emit("get-document", { documentId, user })

    // Handle reconnection
    const connectHandler = () => {
      console.log("Reconnected, fetching latest document...")
      socket.emit("get-document", { documentId, user })
    }

    const disconnectHandler = () => {
      console.log("Disconnected, disabling editor...")
      quill.disable()
      quill.setText("Disconnected from server... Trying to reconnect...")
    }

    socket.on("connect", connectHandler)
    socket.on("disconnect", disconnectHandler)

    return () => {
      socket.off("connect", connectHandler)
      socket.off("disconnect", disconnectHandler)
      socket.off("load-document", loadHandler)
    }
  }, [socket, quill, documentId, user])

  // Handle user joined
  useEffect(() => {
    if (socket == null) return

    const handleUserJoined = ({ user: newUser, activeUsers: users }) => {
      console.log("User joined:", newUser.username)
      setActiveUsers(users)
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
      setActiveUsers(users)
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
      console.log("Title updated by another user:", newTitle)
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
        await axios.patch(`${process.env.REACT_APP_API_BASE_URL}/api/documents/${documentId}/title`, { title })
        // Broadcast title change to other users
        socket.emit("title-change", title)
      } catch (error) {
        console.error("Error saving title:", error)
      } finally {
        setIsSavingTitle(false)
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
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/documents/${documentId}/share`,
        { permission: 'viewer' }
      )
      setShareLink(response.data.shareUrl)
      setShowShareModal(true)
    } catch (error) {
      console.error("Error generating share link:", error)
      alert("Failed to generate share link")
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    alert("Share link copied to clipboard!")
  }

  return (
    <div>
      <div style={{
        background: 'white',
        padding: '15px 30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button
          onClick={() => history.push('/dashboard')}
          style={{
            padding: '8px 16px',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to Dashboard
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            fontSize: '18px',
            fontWeight: '500',
            padding: '8px',
            outline: 'none'
          }}
          placeholder="Untitled Document"
        />
        {isSavingTitle && (
          <span style={{ fontSize: '14px', color: '#999' }}>Saving Title...</span>
        )}
        <span style={{
          fontSize: '14px',
          color: saveStatus === 'Error Saving' ? '#ff6b6b' : '#999',
          fontWeight: saveStatus === 'Error Saving' ? 'bold' : 'normal'
        }}>
          {saveStatus}
        </span>

        {/* Connection status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: isConnected ? '#52B788' : '#999'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#52B788' : '#999'
          }} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>

        {/* Active users */}
        {activeUsers.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}>
            <span>👥 {activeUsers.length}</span>
            <div style={{
              display: 'flex',
              gap: '4px'
            }}>
              {activeUsers.slice(0, 3).map((u, i) => (
                <div
                  key={i}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: u.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  title={u.username}
                >
                  {u.username[0].toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleGenerateShareLink}
          style={{
            padding: '8px 16px',
            background: '#4ECDC4',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          🔗 Share
        </button>

        <button
          onClick={() => setIsAIOpen(true)}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          🤖 AI Assistant
        </button>
      </div>

      <div className="container" ref={wrapperRef}></div>

      <AIAssistant quill={quill} isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />

      {/* Share Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ marginTop: 0 }}>Share Document</h2>
            <p>Anyone with this link can view this document:</p>
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px'
            }}>
              <input
                type="text"
                value={shareLink}
                readOnly
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={copyShareLink}
                style={{
                  padding: '10px 20px',
                  background: '#4ECDC4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
