const LoadingScreen = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        top: '10%', left: '15%',
        animation: 'float1 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
        bottom: '15%', right: '10%',
        animation: 'float2 8s ease-in-out infinite',
      }} />

      {/* Card */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: '48px 56px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
      }}>
        {/* Logo / Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
          boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          📚
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0, fontSize: 24, fontWeight: 700,
            background: 'linear-gradient(135deg, #e0e7ff, #c4b5fd)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}>
            Prakash Library
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            Loading your workspace...
          </p>
        </div>

        {/* Spinner bar */}
        <div style={{
          width: 220, height: 4, borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #6366f1)',
            backgroundSize: '200% 100%',
            borderRadius: 8,
            animation: 'slide 1.6s linear infinite',
          }} />
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.4; }
          40%            { transform: translateY(-10px); opacity: 1;   }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 8px 32px rgba(99,102,241,0.4); }
          50%       { transform: scale(1.08); box-shadow: 0 12px 40px rgba(168,85,247,0.6); }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(30px, -20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(-20px, 25px); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
