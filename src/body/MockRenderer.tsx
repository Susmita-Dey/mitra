import type { RendererProps } from "./types";
import "./MockRenderer.css";

import { useAnimationRig } from "./useAnimationRig";

/**
 * MockRenderer — Super cute SVG based visual representation of a Red Panda.
 * Features dynamic postures, props, and detailed anatomy (tail rings, toe beans).
 */
export function MockRenderer({ character }: RendererProps) {
  const proceduralState = character.proceduralState || {
    eyes: "open" as const,
    mouth: "neutral" as const,
    ears: "up" as const,
    tail: "wag" as const,
    posture: "stand" as const,
    bodyMotion: "breathe" as const,
    props: [] as string[],
    rootScale: 1
  };

  const { posture, eyes, mouth } = proceduralState;
  const rig = useAnimationRig(proceduralState);
  
  const hasBubble = !!character.bubbleText;
  
  const isReminder = character.interaction?.startsWith("reminder:");
  const reminderType = isReminder ? character.interaction.split(":")[1] : null;

  const handleReminderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reminderType) {
      window.dispatchEvent(
        new CustomEvent("companion:reminder:ack", { detail: { id: reminderType } })
      );
    } else {
       // fallback for non-reminder bubbles if needed
       window.dispatchEvent(
          new CustomEvent("companion:reminder:ack", { detail: { id: "generic" } })
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
        // Only trigger drag if the click wasn't on the tummy
        if (e.button === 0 && !(e.target as HTMLElement).classList.contains('panda-tummy')) {
          window.dispatchEvent(new CustomEvent("companion:drag:start"));
        }
      }}
    >
      <svg
        className="panda-svg"
        viewBox="0 -20 200 260"
        xmlns="http://www.w3.org/2000/svg"
       
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
        <g className="panda-group" style={{ 
            transform: `translateY(${rig.rootY}px) scale(${rig.bodyScaleX}, ${rig.bodyScaleY})`,
            transformOrigin: '100px 180px'
          }}>
          
          {/* Tail with Thick Rings */}
          <g className="panda-tail-group"
             style={{ 
               pointerEvents: 'auto', 
               cursor: 'pointer',
               transform: `rotate(${rig.tailRot}deg)`,
               transformOrigin: '140px 180px'
             }}
             onPointerDown={(e) => {
               e.stopPropagation();
               window.dispatchEvent(new CustomEvent("companion:interaction:tail"));
             }}>
            {/* Orange Base */}
            <path className="panda-tail-base" d="M 140,180 C 190,200 210,130 180,100 C 160,80 140,110 150,130" fill="none" stroke="#E86A33" strokeWidth="36" strokeLinecap="round" />
            
            {/* Real Red Panda Stripes (Deep Auburn/Reddish Brown) */}
            <path className="panda-tail-rings" d="M 140,180 C 190,200 210,130 180,100 C 160,80 140,110 150,130" fill="none" stroke="#9A3712" strokeWidth="36" strokeLinecap="round" strokeDasharray="18 24" />
          </g>

          {/* Legs with Toe Beans */}
          <g className="panda-legs">
            <g className="panda-leg left"
               style={{
                 transform: `rotate(${rig.leftLegRot}deg)`,
                 transformOrigin: '65px 215px'
               }}>
              <ellipse cx="65" cy="215" rx="18" ry="14" fill="#150A05" />
              <circle cx="53" cy="217" r="3.5" fill="#5c2915" />
              <circle cx="65" cy="221" r="3.5" fill="#5c2915" />
              <circle cx="77" cy="217" r="3.5" fill="#5c2915" />
              <ellipse cx="65" cy="210" rx="7" ry="5" fill="#5c2915" />
            </g>
            <g className="panda-leg right"
               style={{
                 transform: `rotate(${rig.rightLegRot}deg)`,
                 transformOrigin: '135px 215px'
               }}>
              <ellipse cx="135" cy="215" rx="18" ry="14" fill="#150A05" />
              <circle cx="123" cy="217" r="3.5" fill="#5c2915ff" />
              <circle cx="135" cy="221" r="3.5" fill="#5c2915ff" />
              <circle cx="147" cy="217" r="3.5" fill="#5c2915ff" />
              <ellipse cx="135" cy="210" rx="7" ry="5" fill="#5c2915ff" />
            </g>
          </g>

          {/* Torso */}
          <ellipse className="panda-torso" cx="100" cy="160" rx="55" ry="60" fill="#E86A33" />
          {/* Soft Tummy Fur Fluffs (Orange curves) */}
          <path d="M 45,150 Q 35,152 47,160 Z" fill="#E86A33" />
          <path d="M 44,170 Q 32,172 46,180 Z" fill="#E86A33" />
          <path d="M 155,150 Q 165,152 153,160 Z" fill="#E86A33" />
          <path d="M 156,170 Q 168,172 154,180 Z" fill="#E86A33" />
          
          {/* Tummy Fluff (Ticklish!) */}
          <ellipse 
            className="panda-tummy" 
            cx="100" cy="170" rx="35" ry="40" 
            fill="#FFF9ED" 
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent("companion:interaction:tummy"));
            }}
          />

          {/* Props Layer (Behind Arms) */}
          <g className="panda-props">
            {/* Laptop Prop */}
            {proceduralState.props?.includes("laptop") && (
              <g className="prop-laptop">
                <rect x="40" y="150" width="120" height="70" rx="6" fill="#E2E8F0" />
                <rect x="45" y="155" width="110" height="50" rx="4" fill="#1E293B" />
                <rect x="35" y="220" width="130" height="8" rx="4" fill="#CBD5E1" />
                {/* Glowing logo */}
                <circle cx="100" cy="180" r="6" fill="#38BDF8" opacity="0.9" />
                {/* Keyboard suggestion */}
                <rect x="50" y="222" width="100" height="2" rx="1" fill="#94A3B8" opacity="0.5" />
              </g>
            )}


            {/* Thermometer Prop (For Sick/Low Battery) */}
            {proceduralState.props?.includes("thermometer") && (
              <g className="prop-thermometer">
                <rect x="75" y="130" width="8" height="35" rx="4" fill="#FFF" transform="rotate(-30 75 130)" />
                <circle cx="88" cy="155" r="7" fill="#EF4444" />
                <line x1="88" y1="155" x2="78" y2="135" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}

            {/* Mug Prop */}
            {proceduralState.props?.includes("mug") && (
              <g className="prop-mug">
                <rect x="130" y="140" width="30" height="35" rx="3" fill="#60A5FA" />
                <path d="M 160,150 Q 175,150 170,165 Q 165,170 160,170" fill="none" stroke="#60A5FA" strokeWidth="5" strokeLinecap="round" />
                {/* Coffee/Tea surface inside */}
                <ellipse cx="145" cy="140" rx="15" ry="5" fill="#93C5FD" />
                {/* Steam */}
                <path className="steam" d="M 140,135 Q 135,120 145,115" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}

            {/* Food Prop (Bamboo) */}
            {proceduralState.props?.includes("food") && (
              <g className="prop-food">
                <rect x="130" y="120" width="12" height="60" rx="4" fill="#4ADE80" />
                <rect x="128" y="140" width="16" height="4" rx="2" fill="#22C55E" />
                <rect x="128" y="160" width="16" height="4" rx="2" fill="#22C55E" />
                {/* Leaves */}
                <path d="M 142,125 Q 155,120 150,135 Q 140,130 142,125" fill="#16A34A" />
                <path d="M 130,145 Q 115,140 120,155 Q 130,150 130,145" fill="#16A34A" />
              </g>
            )}

            {/* Beach Towel Prop */}
            {proceduralState.props?.includes("beach-towel") && (
              <g className="prop-towel">
                <rect x="0" y="210" width="200" height="20" rx="4" fill="#FCD34D" />
                <path d="M 20,210 L 20,230 M 60,210 L 60,230 M 100,210 L 100,230 M 140,210 L 140,230 M 180,210 L 180,230" stroke="#F59E0B" strokeWidth="8" />
                {/* Sunglasses resting on towel */}
                <path d="M 150,215 Q 160,210 170,215 Q 165,225 155,225 Z" fill="#1F2937" />
                <path d="M 175,215 Q 185,210 195,215 Q 190,225 180,225 Z" fill="#1F2937" />
                <path d="M 170,215 L 175,215" stroke="#1F2937" strokeWidth="2" />
              </g>
            )}

            {/* Laptop Prop */}
            {proceduralState.props?.includes("laptop") && (
              <g className="prop-laptop">
                {/* Base */}
                <path d="M 40,220 L 160,220 L 170,230 L 30,230 Z" fill="#9CA3AF" />
                {/* Screen */}
                <rect x="50" y="160" width="100" height="60" rx="4" fill="#4B5563" />
                <rect x="55" y="165" width="90" height="50" rx="2" fill="#111827" />
                {/* Code lines */}
                <path d="M 60,175 L 100,175 M 60,185 L 120,185 M 60,195 L 90,195 M 60,205 L 110,205" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                {/* Apple logo-ish */}
                <circle cx="100" cy="190" r="4" fill="#6EE7B7" opacity="0.3" />
              </g>
            )}


          </g>

          {/* Arms with Paws */}
          <g className="panda-arms">
            <g className="panda-arm left"
               style={{ 
                 pointerEvents: 'auto', 
                 cursor: 'pointer',
                 transform: `rotate(${rig.leftArmRot}deg)`,
                 transformOrigin: '50px 140px'
               }}
               onPointerDown={(e) => {
                 e.stopPropagation();
                 window.dispatchEvent(new CustomEvent("companion:interaction:paws"));
               }}>
              <path d="M 50,140 Q 30,170 45,190" fill="none" stroke="#150A05" strokeWidth="24" strokeLinecap="round" />
              <ellipse cx="44" cy="186" rx="4" ry="6" fill="#5c2915" transform="rotate(-20 44 186)" />
            </g>
            <g className="panda-arm right"
               style={{ 
                 pointerEvents: 'auto', 
                 cursor: 'pointer',
                 transform: `rotate(${rig.rightArmRot}deg)`,
                 transformOrigin: '150px 140px'
               }}
               onPointerDown={(e) => {
                 e.stopPropagation();
                 window.dispatchEvent(new CustomEvent("companion:interaction:paws"));
               }}>
              <path d="M 150,140 Q 170,170 155,190" fill="none" stroke="#150A05" strokeWidth="24" strokeLinecap="round" />
              <ellipse cx="156" cy="186" rx="4" ry="6" fill="#5c2915" transform="rotate(20 156 186)" />
            </g>
          </g>

          {/* Head */}
          <g className="panda-head-group"
             style={{ 
               pointerEvents: 'auto', 
               cursor: 'pointer',
               transform: `translateY(${rig.headY + (posture === "lie-down" || posture === "sit" ? 40 : 0)}px) rotate(${rig.headRot}deg)`,
               transformOrigin: '100px 90px'
             }}
             onPointerDown={(e) => {
               e.stopPropagation();
               window.dispatchEvent(new CustomEvent("companion:interaction:head"));
             }}>
            {/* Left Ear */}
            <g className="panda-ear left-ear"
               style={{
                 transform: `rotate(${rig.leftEarRot}deg)`,
                 transformOrigin: '55px 45px'
               }}
               onPointerDown={(e) => {
                 e.stopPropagation();
                 window.dispatchEvent(new CustomEvent("companion:interaction:ears"));
               }}>
              <circle cx="55" cy="45" r="22" fill="#E86A33" />
              {/* Extra ear fluff */}
              <path d="M 40,40 Q 25,35 35,50" fill="#E86A33" />
              <circle cx="55" cy="45" r="14" fill="#FFF9ED" />
              <path d="M 40,45 Q 30,65 55,65" fill="none" stroke="#E86A33" strokeWidth="4" strokeLinecap="round" />
            </g>
            
            {/* Right Ear */}
            <g className="panda-ear right-ear"
               style={{
                 transform: `rotate(${rig.rightEarRot}deg)`,
                 transformOrigin: '145px 45px'
               }}
               onPointerDown={(e) => {
                 e.stopPropagation();
                 window.dispatchEvent(new CustomEvent("companion:interaction:ears"));
               }}>
              <circle cx="145" cy="45" r="22" fill="#E86A33" />
              {/* Extra ear fluff */}
              <path d="M 160,40 Q 175,35 165,50" fill="#E86A33" />
              <circle cx="145" cy="45" r="14" fill="#FFF9ED" />
              <path d="M 160,45 Q 170,65 145,65" fill="none" stroke="#E86A33" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* Main Head Shape */}
            <ellipse cx="100" cy="90" rx="72" ry="58" fill="#E86A33" />
            
            {/* Top Head Fur Tufts (Smooth curves) */}
            <path d="M 90,32 Q 95,20 100,32 Q 105,20 110,32 Z" fill="#E86A33" />
            
            {/* Cheek Fluff Tufts (Smooth curves) */}
            <path d="M 28,95 Q 15,100 30,105 Q 12,110 32,112 Z" fill="#E86A33" />
            <path d="M 172,95 Q 185,100 170,105 Q 188,110 168,112 Z" fill="#E86A33" />

            {/* White Face Markings */}
            <path d="M 100,58 Q 55,50 40,85 Q 30,110 50,130 Q 80,145 100,115 Q 120,145 150,130 Q 170,110 160,85 Q 145,50 100,58 Z" fill="#FFF9ED" />

            {/* Dark Red/Brown Eye Mask Lines */}
            <path d="M 40,95 Q 65,125 90,115" fill="none" stroke="#C24F1E" strokeWidth="6" strokeLinecap="round" />
            <path d="M 160,95 Q 135,125 110,115" fill="none" stroke="#C24F1E" strokeWidth="6" strokeLinecap="round" />

            {/* Blush */}
            <ellipse className="panda-blush" cx="60" cy="120" rx="16" ry="10" fill="url(#blush)" />
            <ellipse className="panda-blush" cx="140" cy="120" rx="16" ry="10" fill="url(#blush)" />

            {/* Muzzle */}
            <ellipse cx="100" cy="122" rx="22" ry="15" fill="#FFFFFF" />

            {/* Nose */}
            <path d="M 93,116 Q 100,114 107,116 Q 109,119 100,123 Q 91,119 93,116 Z" fill="#2E1C12" />

            {/* Mouth */}
            <g className="panda-mouth-group">
              {mouth === "grin" || mouth === "smile" ? (
                <path className="panda-mouth-happy" d="M 90,125 Q 100,138 110,125" fill="none" stroke="#2E1C12" strokeWidth="3" strokeLinecap="round" />
              ) : mouth === "sad" ? (
                <path className="panda-mouth-sad" d="M 94,130 Q 100,126 106,130" fill="none" stroke="#2E1C12" strokeWidth="2.5" strokeLinecap="round" />
              ) : (
                <path className="panda-mouth" d="M 90,127 Q 95,133 100,127 Q 105,133 110,127" fill="none" stroke="#2E1C12" strokeWidth="2.5" strokeLinecap="round" />
              )}
              
              <path className="panda-mouth-open" d="M 94,126 Q 100,140 106,126 Z" fill="#2E1C12" />
            </g>

            {/* Eyes */}
            <g className="panda-eyes">
              {/* Left Eye */}
              <g className="panda-eye-wrapper" style={{ transformOrigin: '70px 100px' }}>
                <circle cx="70" cy="100" r="11" fill="#2E1C12" className="panda-eye" />
                {eyes === "sparkle" && <circle cx="70" cy="100" r="11" fill="#ffeb3b" opacity="0.3" />}
                <circle cx="66" cy="96" r="4" fill="#FFFFFF" className="panda-eye-glint" />
                <circle cx="74" cy="104" r="1.5" fill="#FFFFFF" className="panda-eye-glint" />
                {(eyes === "closed" || eyes === "squint") && (
                   <path className="panda-sleep-eye left" d="M 58,103 Q 70,110 82,103" fill="none" stroke="#2E1C12" strokeWidth="4" strokeLinecap="round" />
                )}
              </g>
              
              {/* Right Eye */}
              <g className="panda-eye-wrapper" style={{ transformOrigin: '130px 100px' }}>
                <circle cx="130" cy="100" r="11" fill="#2E1C12" className="panda-eye" />
                {eyes === "sparkle" && <circle cx="130" cy="100" r="11" fill="#ffeb3b" opacity="0.3" />}
                <circle cx="126" cy="96" r="4" fill="#FFFFFF" className="panda-eye-glint" />
                <circle cx="134" cy="104" r="1.5" fill="#FFFFFF" className="panda-eye-glint" />
                {(eyes === "closed" || eyes === "squint") && (
                   <path className="panda-sleep-eye right" d="M 118,103 Q 130,110 142,103" fill="none" stroke="#2E1C12" strokeWidth="4" strokeLinecap="round" />
                )}
              </g>
            </g>
            
            {/* Sunglasses Prop */}
            {proceduralState.props?.includes("sunglasses") && (
              <g className="prop-sunglasses">
                <path d="M 45,95 Q 100,90 155,95" fill="none" stroke="#1F2937" strokeWidth="3" />
                <rect x="50" y="85" width="40" height="25" rx="8" fill="#111827" />
                <rect x="110" y="85" width="40" height="25" rx="8" fill="#111827" />
                <path d="M 55,90 L 75,90" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                <path d="M 115,90 L 135,90" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
              </g>
            )}
          </g>
          
          {/* Umbrella Prop (Drawn ON TOP of everything, held in right hand) */}
          {proceduralState.props?.includes("umbrella") && (
            <g className="prop-umbrella">
              {/* Stick (Angled from canopy center to right hand) */}
              <path d="M 100,30 L 160,190" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />
              {/* Handle */}
              <path d="M 160,190 Q 165,200 155,200" fill="none" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />
              {/* Canopy (Blue, covering the head) */}
              <path d="M 20,40 Q 100,-40 180,40 Q 140,30 100,40 Q 60,30 20,40 Z" fill="#2563EB" />
              {/* Canopy Scallops */}
              <path d="M 20,40 Q 40,50 60,40 Q 80,50 100,40 Q 120,50 140,40 Q 160,50 180,40" fill="#2563EB" />
              {/* Ribs */}
              <path d="M 100,-5 L 100,40 M 60,15 L 60,40 M 140,15 L 140,40" stroke="#1D4ED8" strokeWidth="2" />
              {/* Top nub */}
              <path d="M 100,-5 L 100,-15" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}
        </g>
        
        {/* Celebration Sparks (SVG) */}
        {character.animation === "celebrate" && (
          <g className="celebration-sparks">
            <circle cx="20" cy="50" r="4" fill="#FBBF24" />
            <circle cx="180" cy="40" r="5" fill="#34D399" />
            <circle cx="50" cy="20" r="3" fill="#60A5FA" />
            <circle cx="150" cy="10" r="4" fill="#F472B6" />
            <path d="M 30,80 L 40,90 M 170,80 L 160,90" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
      </svg>

      {eyes === "closed" && (
        <div className="mock-zzz-container">
          <span className="mock-zzz z1">Z</span>
          <span className="mock-zzz z2">z</span>
          <span className="mock-zzz z3">z</span>
        </div>
      )}

      {/* Dynamic Action Bubble (Reminders, Greetings, Summaries) */}
      {hasBubble && (
        <div className="reminder-bubble" onClick={handleReminderClick}>
          {character.bubbleText}
        </div>
      )}
    </div>
  );
}
