export function LoadingSpinner() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
            }}>
            <div className="elibrary-spinner" />
        </div>
    );
}
