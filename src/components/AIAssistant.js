import axios from "axios"
import { useState } from "react"
import "./AIAssistant.css"

export default function AIAssistant({ quill, isOpen, onClose }) {
    const [selectedText, setSelectedText] = useState("")
    const [action, setAction] = useState("grammar")
    const [result, setResult] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleGetSelectedText = () => {
        if (!quill) return

        const selection = quill.getSelection()
        if (selection && selection.length > 0) {
            const text = quill.getText(selection.index, selection.length)
            setSelectedText(text)
            setError("")
        } else {
            setError("Please select some text in the editor first")
        }
    }

    const handleProcess = async () => {
        if (!selectedText.trim()) {
            setError("Please select text first")
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
            console.error("Error processing AI request:", error)
            setError(error.response?.data?.message || "Failed to process AI request")
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = () => {
        if (!quill || !result) return

        const selection = quill.getSelection()
        if (selection && selection.length > 0) {
            quill.deleteText(selection.index, selection.length, 'user')
            quill.insertText(selection.index, result, 'user')
            quill.setSelection(selection.index + result.length)
        } else {
            // If no selection, insert at cursor position
            const cursorPosition = selection ? selection.index : quill.getLength()
            quill.insertText(cursorPosition, result, 'user')
            quill.setSelection(cursorPosition + result.length)
        }

        // Reset state
        setSelectedText("")
        setResult("")
        setError("")
    }

    const handleClear = () => {
        setSelectedText("")
        setResult("")
        setError("")
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
                        <label>Step 1: Select text from the editor</label>
                        <button onClick={handleGetSelectedText} className="btn-secondary">
                            Get Selected Text
                        </button>
                        {selectedText && (
                            <div className="text-preview">
                                <strong>Selected text:</strong>
                                <p>{selectedText}</p>
                            </div>
                        )}
                    </div>

                    <div className="section">
                        <label>Step 2: Choose an action</label>
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
