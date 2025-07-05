export default function Home() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <img 
          src="https://github.com/showboyz/showboyz.github.io/blob/main/BHP_eng@3x.png?raw=true" 
          alt="Brain Health Playground" 
          style={{ height: '60px', width: 'auto', marginBottom: '20px' }}
        />
      </div>
      <h1 style={{ fontSize: '28px', marginBottom: '16px', color: '#111827', fontWeight: '600' }}>
        Brain Health Admin Console
      </h1>
      <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '30px' }}>
        Senior cognitive and physical training program management system
      </p>
      <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '30px' }}>
        Application is running successfully and ready for use.
      </p>
      <a 
        href="/login" 
        style={{ 
          display: 'inline-block',
          backgroundColor: '#111', 
          color: 'white', 
          padding: '12px 24px', 
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        Go to Login Page
      </a>
    </div>
  )
}
