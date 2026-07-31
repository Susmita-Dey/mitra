import type { RendererProps } from "./types";
import "./MockRenderer.css";

/**
 * MockRenderer — Super cute SVG based visual representation of a Red Panda.
 * Now with dynamic postures (sit, sleep on back, stretch) and props (laptop, mug).
 */
export function MockRenderer({ character }: RendererProps) {
  const isSleeping = character.animation === "sleep";
  const isHappy = character.emotion === "happy";
  const isSad = character.emotion === "sad";
  
  // Parse reminders
  const isReminder = character.interaction?.startsWith("reminder:");
  const reminderType = isReminder ? character.interaction.split(":")[1] : null;

  const handleReminderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reminderType) {
      window.dispatchEvent(
        new CustomEvent("companion:reminder:ack", { detail: { id: reminderType } })
      );
    }
  };

  return (
    <div
      className="mock-renderer"
      data-animation={character.animation}
      data-emotion={character.emotion}
      data-interaction={character.interaction}
      role="img"
      aria-label={`Mitra - ${character.animation}`}
      onPointerDown={(e) => {
        if (e.button === 0) {
          window.dispatchEvent(new CustomEvent("companion:drag:start"));
        }
      }}
    >
      <svg
        className="panda-svg"
        viewBox="0 -20 200 260"
        xmlns="http://www.w3.org/2000/svg"
        data-tauri-drag-region
      >
        <defs>
          <radialGradient id="blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff7b7b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff7b7b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Shadow underneath */}
        <ellipse className="panda-shadow" cx="100" cy="225" rx="60" ry="10" fill="rgba(0,0,0,0.15)" />

        {/* Main Panda Group */}
        <g className="panda-group" data-tauri-drag-region>
          
          {/* Tail */}
          <path className="panda-tail" d="M 140,180 C 190,200 210,130 180,100 C 160,80 140,110 150,130" fill="none" stroke="#C24F1E" strokeWidth="28" strokeLinecap="round" data-tauri-drag-region />

          {/* Legs */}
          <g className="panda-legs">
            <ellipse cx="65" cy="215" rx="18" ry="14" fill="#4F3527" className="panda-leg left" data-tauri-drag-region />
            <ellipse cx="135" cy="215" rx="18" ry="14" fill="#4F3527" className="panda-leg right" data-tauri-drag-region />
          </g>

          {/* Torso */}
          <ellipse className="panda-torso" cx="100" cy="160" rx="55" ry="60" fill="#E86A33" data-tauri-drag-region />
          
          {/* Tummy Fluff */}
          <ellipse className="panda-tummy" cx="100" cy="170" rx="35" ry="40" fill="#FFF9ED" data-tauri-drag-region />

          {/* Props Layer (Behind Arms) */}
          <g className="panda-props" data-tauri-drag-region>
            {/* Laptop Prop */}
            <g className="prop-laptop">
              <rect x="50" y="150" width="100" height="60" rx="4" fill="#E2E8F0" />
              <rect x="55" y="155" width="90" height="40" rx="2" fill="#1E293B" />
              <rect x="45" y="210" width="110" height="5" rx="2" fill="#CBD5E1" />
              {/* Apple logo or glowing light */}
              <circle cx="100" cy="175" r="5" fill="#38BDF8" opacity="0.8" />
            </g>

            {/* Mug Prop */}
            <g className="prop-mug">
              <rect x="130" y="140" width="30" height="35" rx="3" fill="#60A5FA" />
              <path d="M 160,150 Q 175,150 170,165 Q 165,170 160,170" fill="none" stroke="#60A5FA" strokeWidth="5" strokeLinecap="round" />
              {/* Coffee/Tea surface inside */}
              <ellipse cx="145" cy="140" rx="15" ry="5" fill="#93C5FD" />
              {/* Steam */}
              <path className="steam" d="M 140,135 Q 135,120 145,115" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Toy / Gamepad Prop */}
            <g className="prop-toy">
              <rect x="70" y="160" width="60" height="30" rx="15" fill="#EF4444" />
              <circle cx="85" cy="175" r="8" fill="#333" />
              <circle cx="115" cy="175" r="4" fill="#FDE047" />
              <circle cx="105" cy="175" r="4" fill="#60A5FA" />
            </g>
          </g>

          {/* Arms */}
          <g className="panda-arms">
            <path className="panda-arm left" d="M 50,140 Q 30,170 45,190" fill="none" stroke="#4F3527" strokeWidth="18" strokeLinecap="round" data-tauri-drag-region />
            <path className="panda-arm right" d="M 150,140 Q 170,170 155,190" fill="none" stroke="#4F3527" strokeWidth="18" strokeLinecap="round" data-tauri-drag-region />
          </g>

          {/* Head */}
          <g className="panda-head-group" data-tauri-drag-region>
            {/* Left Ear */}
            <g className="panda-ear left-ear" data-tauri-drag-region>
              <circle cx="55" cy="45" r="22" fill="#E86A33" />
              <circle cx="55" cy="45" r="12" fill="#FFF9ED" />
              <path d="M 40,45 Q 30,65 55,65" fill="none" stroke="#E86A33" strokeWidth="4" strokeLinecap="round" />
            </g>
            
            {/* Right Ear */}
            <g className="panda-ear right-ear" data-tauri-drag-region>
              <circle cx="145" cy="45" r="22" fill="#E86A33" />
              <circle cx="145" cy="45" r="12" fill="#FFF9ED" />
              <path d="M 160,45 Q 170,65 145,65" fill="none" stroke="#E86A33" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* Main Head Shape (Squishy Oval) */}
            <ellipse cx="100" cy="90" rx="70" ry="55" fill="#E86A33" data-tauri-drag-region />

            {/* White Face Markings (Brows/Cheeks) */}
            <path d="M 100,60 Q 60,55 45,85 Q 35,105 55,125 Q 80,140 100,110 Q 120,140 145,125 Q 165,105 155,85 Q 140,55 100,60 Z" fill="#FFF9ED" data-tauri-drag-region />

            {/* Dark Red/Brown Eye Mask Lines */}
            <path d="M 45,95 Q 65,125 90,115" fill="none" stroke="#C24F1E" strokeWidth="6" strokeLinecap="round" data-tauri-drag-region />
            <path d="M 155,95 Q 135,125 110,115" fill="none" stroke="#C24F1E" strokeWidth="6" strokeLinecap="round" data-tauri-drag-region />

            {/* Blush */}
            <ellipse className="panda-blush" cx="65" cy="115" rx="14" ry="8" fill="url(#blush)" data-tauri-drag-region />
            <ellipse className="panda-blush" cx="135" cy="115" rx="14" ry="8" fill="url(#blush)" data-tauri-drag-region />

            {/* Muzzle */}
            <ellipse cx="100" cy="120" rx="20" ry="14" fill="#FFFFFF" data-tauri-drag-region />

            {/* Nose */}
            <path d="M 94,115 Q 100,113 106,115 Q 108,118 100,121 Q 92,118 94,115 Z" fill="#4F3527" data-tauri-drag-region />

            {/* Mouth */}
            <g className="panda-mouth-group" data-tauri-drag-region>
              {isHappy ? (
                /* Big Smile */
                <path className="panda-mouth-happy" d="M 90,123 Q 100,135 110,123" fill="none" stroke="#4F3527" strokeWidth="3" strokeLinecap="round" />
              ) : isSad ? (
                /* Sad mouth */
                <path className="panda-mouth-sad" d="M 94,128 Q 100,124 106,128" fill="none" stroke="#4F3527" strokeWidth="2.5" strokeLinecap="round" />
              ) : (
                /* Cute 'w' mouth */
                <path className="panda-mouth" d="M 92,125 Q 96,130 100,125 Q 104,130 108,125" fill="none" stroke="#4F3527" strokeWidth="2.5" strokeLinecap="round" />
              )}
              
              {/* Open mouth for Yawn/Observe */}
              <path className="panda-mouth-open" d="M 94,124 Q 100,138 106,124 Z" fill="#4F3527" />
            </g>

            {/* Eyes */}
            <g className="panda-eyes" data-tauri-drag-region>
              {/* Left Eye */}
              <g className="panda-eye-wrapper" style={{ transformOrigin: '70px 100px' }}>
                <circle cx="70" cy="100" r="10" fill="#4F3527" className="panda-eye" />
                <circle cx="67" cy="97" r="3.5" fill="#FFFFFF" className="panda-eye-glint" />
                <circle cx="73" cy="103" r="1.5" fill="#FFFFFF" className="panda-eye-glint" />
                <path className="panda-sleep-eye left" d="M 60,103 Q 70,110 80,103" fill="none" stroke="#4F3527" strokeWidth="3.5" strokeLinecap="round" />
              </g>
              
              {/* Right Eye */}
              <g className="panda-eye-wrapper" style={{ transformOrigin: '130px 100px' }}>
                <circle cx="130" cy="100" r="10" fill="#4F3527" className="panda-eye" />
                <circle cx="127" cy="97" r="3.5" fill="#FFFFFF" className="panda-eye-glint" />
                <circle cx="133" cy="103" r="1.5" fill="#FFFFFF" className="panda-eye-glint" />
                <path className="panda-sleep-eye right" d="M 120,103 Q 130,110 140,103" fill="none" stroke="#4F3527" strokeWidth="3.5" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </g>
      </svg>

      {isSleeping && (
        <div className="mock-zzz-container" data-tauri-drag-region>
          <span className="mock-zzz z1" data-tauri-drag-region>Z</span>
          <span className="mock-zzz z2" data-tauri-drag-region>z</span>
          <span className="mock-zzz z3" data-tauri-drag-region>z</span>
        </div>
      )}

      {isReminder && (
        <div className="reminder-bubble" onClick={handleReminderClick}>
          {reminderType === "water" && "💧 Time for water!"}
          {reminderType === "stretch" && "🤸 Stand & Stretch"}
          {reminderType === "eyes" && "👀 Rest your eyes"}
          {reminderType === "lunch" && "🍽️ Eat lunch!"}
        </div>
      )}
    </div>
  );
}
