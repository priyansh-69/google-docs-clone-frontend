import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)
        this.setState({
            error,
            errorInfo
        })
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
        window.location.href = '/dashboard'
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f5f5f5'
                }}>
                    <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>
                        Oops! Something went wrong
                    </h1>
                    <p style={{ marginBottom: '30px', color: '#666' }}>
                        We're sorry for the inconvenience. The application encountered an error.
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            maxWidth: '600px',
                            textAlign: 'left'
                        }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                                Error Details
                            </summary>
                            <pre style={{
                                fontSize: '12px',
                                overflow: 'auto',
                                color: '#d32f2f'
                            }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                    <button
                        onClick={this.handleReset}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Go to Dashboard
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
