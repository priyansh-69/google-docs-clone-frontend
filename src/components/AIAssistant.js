import axios from "axios"
import { useEffect, useState } from "react"
import "./AIAssistant.css"

export default function AIAssistant({ quill, isOpen, onClose }) {
    const [selectedText, setSelectedText] = useState("")
    const [action, setAction] = useState("grammar")
    const [result, setResult] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [savedSelection, setSavedSelection] = useState(null) // Store original selection

    useEffect(() => {
        if (isOpen && quill) {
            // Try to get selection immediately
            let selection = quill.getSelection()

            // If no selection, wait a tiny bit and try again (selection might be delayed)
            if (!selection || selection.length === 0) {
                setTimeout(() => {
                    selection = quill.getSelection()
                    if (selection && selection.length > 0) {
                        const text = quill.getText(selection.index, selection.length)
                        setSelectedText(text.trim())
                        setSavedSelection(selection)
                        setError("")
                    } else {
                        setSelectedText("")
                        setSavedSelection(null)
                        setError("⚠️ No text selected. Please:\n1. Select text in the editor first\n2. Then click the AI button")
                    }
                }, 10)
            } else {
                const text = quill.getText(selection.index, selection.length)
                setSelectedText(text.trim())
                setSavedSelection(selection)
                setError("")
            }
        } else if (!isOpen) {
            // When closing, clear all state
            setSelectedText("")
            setResult("")
            setError("")
            setSavedSelection(null)
        }
    }, [isOpen, quill])

    const handleProcess = async () => {
        if (!selectedText.trim()) {
            setError("⚠️ Please select some text first")
            return
        }

        setLoading(true)
        setError("")
        setResult("")

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/ai/process`, {
                text: selectedText,
                action
            })

            setResult(response.data.result)
        } catch (error) {
            console.error("AI processing error:", error)

            // Check for specific error types
            if (error.response?.status === 429) {
                setError("❌ AI Quota Exceeded\n\nThe Google Gemini API free tier limit has been reached. Please:\n• Wait a few hours for quota reset\n• Or contact the administrator to upgrade the API plan")
            } else if (error.response?.data?.message) {
                setError(`❌ Error: ${error.response.data.message}`)
            } else if (error.message === "Network Error") {
                setError("❌ Network Error\n\nCannot connect to the AI server. Please check your connection.")
            } else {
                setError("❌ Failed to process text\n\nPlease try again or contact support.")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = () => {
        if (!quill || !result || !savedSelection) return

        // Use the saved selection instead of getting current selection
        quill.deleteText(savedSelection.index, savedSelection.length, 'user')
        quill.insertText(savedSelection.index, result, 'user')
        quill.setSelection(savedSelection.index + result.length, 0, 'user')

        // Reset state
        setSelectedText("")
        setResult("")
        setError("")
        setSavedSelection(null)
    }

    const handleClear = () => {
        setSelectedText("")
        setResult("")
        setError("")
        setSavedSelection(null)
    }

    if (!isOpen) return null

    return (
        <div className="ai-assistant-overlay">
            <div className="ai-assistant-panel">
                <div className="ai-assistant-header">
                    <h2>🤖 AI Writing Assistant</h2>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                <div className="ai-assistant-body">
                    <div className="section">
                        <label>Selected text:</label>
                        <div className="text-preview">
                            {selectedText ? (
                                <p>{selectedText}</p>
                            ) : (
                                <p className="hint" style={{ margin: 0 }}>
                                    No text selected. Please select text in the editor first.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="section">
                        <label>Step 1: Choose an action</label>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="action-select"
                        >
                            <option value="grammar">Fix Grammar</option>
                            <option value="summarize">Summarize</option>
                            <option value="enhance">Enhance Writing</option>
                            <option value="expand">Expand Text</option>
                            <option value="simplify">Simplify</option>
                        </select>
                    </div>

                    <div className="section">
                        <button
                            onClick={handleProcess}
                            disabled={!selectedText || loading}
                            className="btn-primary"
                        >
                            {loading ? "Processing..." : "Process with AI"}
                        </button>
                    </div>

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {result && (
                        <div className="section result-section">
                            <label>AI Result:</label>
                            <div className="result-box">
                                <p>{result}</p>
                            </div>
                            <div className="result-actions">
                                <button onClick={handleAccept} className="btn-primary">
                                    ✓ Accept & Replace
                                </button>
                                <button onClick={handleClear} className="btn-secondary">
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
