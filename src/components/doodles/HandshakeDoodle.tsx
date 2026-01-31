const HandshakeDoodle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 120 80"
    className={`doodle ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Left hand */}
    <path
      d="M10 45 L25 40 Q30 38 35 42 L55 55"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
    />
    {/* Right hand */}
    <path
      d="M110 45 L95 40 Q90 38 85 42 L65 55"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
    />
    {/* Handshake connection */}
    <path
      d="M55 55 Q60 58 65 55"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
    />
    {/* Left arm */}
    <path
      d="M5 50 L10 45 L5 40"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    {/* Right arm */}
    <path
      d="M115 50 L110 45 L115 40"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    {/* Sparkles */}
    <path d="M50 30 L52 25 L54 30 L59 32 L54 34 L52 39 L50 34 L45 32 Z" fill="currentColor" />
    <circle cx="70" cy="25" r="2" fill="currentColor" />
    <circle cx="40" cy="35" r="1.5" fill="currentColor" />
  </svg>
);

export default HandshakeDoodle;
