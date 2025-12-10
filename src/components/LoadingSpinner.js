
export default function LoadingSpinner({ fullScreen = false }) {
    if (fullScreen) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100vw',
                position: 'fixed',
                top: 0,
                left: 0,
                backgroundColor: 'var(--bg-color)',
                zIndex: 9999
            }}>
                <div className="loading-spinner"></div>
            </div>
        )
    }

    return (
        <div className="loading-spinner"></div>
    )
}
