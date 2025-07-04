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
      <h1 style={{ fontSize: '32px', marginBottom: '16px', color: '#111' }}>
        Brain Health Admin Console
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        시니어 인지 및 운동 훈련 프로그램 관리 시스템
      </p>
      <p style={{ fontSize: '16px', color: '#888', marginBottom: '30px' }}>
        애플리케이션이 정상적으로 실행되고 있습니다.
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
        로그인 페이지로 이동
      </a>
    </div>
  )
}
