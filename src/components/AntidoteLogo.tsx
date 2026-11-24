interface AntidoteLogoProps {
  size?: "sm" | "lg";
  className?: string;
}

export function AntidoteLogo({ size = "sm", className = "" }: AntidoteLogoProps) {
  return (
    <svg
      viewBox="0 0 120 132"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${
        size === "lg" ? "drop-shadow-[0_0_26px_rgba(16,185,129,0.45)]" : ""
      } ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="shieldStroke"
          x1="60"
          y1="6"
          x2="60"
          y2="124"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="48%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>
        <linearGradient
          id="shieldFill"
          x1="60"
          y1="10"
          x2="60"
          y2="122"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0B241E" />
          <stop offset="100%" stopColor="#071311" />
        </linearGradient>
        <linearGradient
          id="snakeBody"
          x1="30"
          y1="24"
          x2="90"
          y2="112"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <path
        d="M60 8L14 23V61C14 91.5 33.8 115.8 60 125C86.2 115.8 106 91.5 106 61V23L60 8Z"
        fill="url(#shieldFill)"
        stroke="url(#shieldStroke)"
        strokeWidth="6.5"
        strokeLinejoin="round"
      />
      <path
        d="M60 15.5L21 28.5V60.5C21 86.8 37.8 107.8 60 116.2C82.2 107.8 99 86.8 99 60.5V28.5L60 15.5Z"
        stroke="#34D399"
        strokeOpacity="0.22"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M60 44C42 44 33 52 33 61C33 70 43 75 60 76C77 77 85 83 85 91C85 99 74 106 58 106C46 106 39 101 37 95"
        stroke="url(#snakeBody)"
        strokeWidth="10.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M60 44C78 44 87 52 87 61C87 68.5 79 73 66 75"
        stroke="url(#snakeBody)"
        strokeWidth="9.5"
        strokeLinecap="round"
      />
      <path
        d="M42 61C42 66.5 49 69.5 60 70.5C74 71.8 82 76.5 85 83"
        stroke="#042F25"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M60 25C50.5 25 44 30.5 44 37.5C44 43 49 48 54 50.5L60 53L66 50.5C71 48 76 43 76 37.5C76 30.5 69.5 25 60 25Z"
        fill="#34D399"
        stroke="#064E3B"
        strokeWidth="1.5"
      />
      <path d="M48.5 34.5L55 37.5L50 38.5Z" fill="#052E24" />
      <path d="M71.5 34.5L65 37.5L70 38.5Z" fill="#052E24" />
      <circle cx="57" cy="41.5" r="1.1" fill="#052E24" />
      <circle cx="63" cy="41.5" r="1.1" fill="#052E24" />
      <path d="M54.2 48.5L55.8 57.5L57.6 49.5Z" fill="#ECFDF5" />
      <path d="M65.8 48.5L64.2 57.5L62.4 49.5Z" fill="#ECFDF5" />
      <path
        d="M60 51.5V60.5M60 60.5L57 64.5M60 60.5L63 64.5"
        stroke="#A7F3D0"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
