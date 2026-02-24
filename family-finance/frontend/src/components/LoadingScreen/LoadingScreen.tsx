export default function TelaDeCarga() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: '#ffffff', gap: 20,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        border: '3px solid #EFF6FF',
        borderTop: '3px solid #3B82F6',
        animation: 'spin .8s linear infinite',
      }} />
      <div style={{ fontSize: 15, color: '#9CA3AF', fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
        Carregando...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
