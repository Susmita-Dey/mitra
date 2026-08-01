import { useEffect, useRef, useState } from "react";
import { ProceduralAnimationState } from "../brain/core/types";

// The skeletal bone values we will interpolate and apply to the SVG
export interface RigState {
  rootY: number;
  bodyScaleX: number;
  bodyScaleY: number;
  bodyRot: number;
  headRot: number;
  headY: number;
  tailRot: number;
  leftArmRot: number;
  rightArmRot: number;
  leftLegRot: number;
  rightLegRot: number;
  leftEarRot: number;
  rightEarRot: number;
}



// Simple spring physics
const spring = (current: number, target: number, velocity: number, dt: number, tension: number, friction: number) => {
  const accel = tension * (target - current) - friction * velocity;
  const newVelocity = velocity + accel * dt;
  const newPosition = current + newVelocity * dt;
  return { pos: newPosition, vel: newVelocity };
};

export function useAnimationRig(proceduralState: ProceduralAnimationState | null) {
  const reqRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  
  // The actual values applied to the SVG each frame
  const currentRig = useRef<RigState>({
    rootY: 0,
    bodyScaleX: 1,
    bodyScaleY: 1,
    bodyRot: 0,
    headRot: 0,
    headY: 0,
    tailRot: 0,
    leftArmRot: 0,
    rightArmRot: 0,
    leftLegRot: 0,
    rightLegRot: 0,
    leftEarRot: 0,
    rightEarRot: 0,
  });

  // Track velocities for spring physics
  const velocities = useRef<RigState>({
    rootY: 0, bodyScaleX: 0, bodyScaleY: 0, bodyRot: 0,
    headRot: 0, headY: 0, tailRot: 0, leftArmRot: 0, rightArmRot: 0, leftLegRot: 0, rightLegRot: 0, leftEarRot: 0, rightEarRot: 0,
  });

  // State used to trigger React re-renders
  const [, setFrame] = useState(0);

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      timeRef.current += dt;
      const t = timeRef.current;

      const state = proceduralState || {
        eyes: "open" as const, mouth: "neutral" as const, ears: "up" as const, tail: "still" as const, posture: "stand" as const, bodyMotion: "breathe" as const, props: [] as string[]
      };

      // 1. Determine TARGET values based on Posture/Action
      let target: RigState = {
        rootY: 0, bodyScaleX: 1, bodyScaleY: 1, bodyRot: 0,
        headRot: 0, headY: 0, tailRot: 5, 
        leftArmRot: 10, rightArmRot: -10, // Slight natural curve to arms when standing
        leftLegRot: 5, rightLegRot: -5,    // Slight stance
        leftEarRot: 0, rightEarRot: 0
      };

      if (state.posture === "sit") {
        target.rootY = 15; // Sit slightly lower
        target.bodyScaleY = 0.98; // Natural squish, not flat
        target.bodyScaleX = 1.02; // Very slight widening
        target.bodyRot = 0; // Upright
        target.headY = 5; // Head relaxed
        target.headRot = 0;
        // Legs tucked neatly under the body (pointing forward, soles on the ground)
        target.leftLegRot = -10;
        target.rightLegRot = 10;
        // Arms coming down to support weight in front
        target.leftArmRot = -20;
        target.rightArmRot = 20;
        // Tail wrapping around the side naturally
        target.tailRot = -60;
      } else if (state.posture === "lie-down") {
        target.rootY = 25;
        target.bodyScaleY = 0.85;
        target.bodyScaleX = 1.1;
        target.headRot = 10;
        target.leftLegRot = -20;
        target.rightLegRot = 20;
        target.tailRot = -100;
      } else if (state.posture === "sleep") {
        // Curled up sleeping pose perfectly matching reference
        target.rootY = 65; // Very low
        target.bodyScaleY = 0.8;
        target.bodyScaleX = 1.1; 
        target.bodyRot = 85; // Torso curled sideways
        target.headRot = 65; // Head tucked deeply
        target.headY = 55; // Head lowered into chest
        target.leftLegRot = -80; // Legs tucked flat
        target.rightLegRot = 80;
        target.leftArmRot = 75; // Arms tucked flat
        target.rightArmRot = -75;
        target.tailRot = -210; // Tail wraps completely over the head/body
      } else if (state.posture === "stretch") {
        target.rootY = -25;
        target.bodyScaleY = 1.25;
        target.bodyScaleX = 0.8;
        target.headRot = -15;
        target.leftArmRot = 150;
        target.rightArmRot = -150;
        target.leftLegRot = 10;
        target.rightLegRot = -10;
        target.tailRot = 20;
      } else if (state.posture === "high-five") {
        target.rootY = -10;
        target.bodyScaleY = 1.1;
        target.bodyScaleX = 0.95;
        target.headRot = -10;
        target.leftArmRot = 20;
        target.rightArmRot = -150;
        target.leftLegRot = 5;
        target.rightLegRot = -5;
        target.tailRot = 30;
      } else if (state.posture === "thinking") {
        target.headRot = -10; // Tilted slightly up/right
        target.headY = -5;
        target.rightArmRot = -130; // Right paw to chin
        target.leftArmRot = -10;   // Left arm resting naturally
        target.bodyRot = 5;        // Slight body tilt
        target.leftLegRot = 5;
        target.rightLegRot = -5;
      } else if (state.posture === "shy") {
        target.headRot = 15;       // Tilted down shyly
        target.headY = 10;
        target.rightArmRot = -140; // Right paw covering mouth
        target.leftArmRot = -10;
        target.bodyRot = -5;
        target.leftLegRot = 15;    // Legs slightly inward
        target.rightLegRot = -15;
      } else if (state.posture === "concerned") {
        target.headRot = 5;
        target.headY = 15;         // Head lowered
        target.bodyScaleY = 0.95;  // Shoulders slumped
        target.leftArmRot = -45;   // Paws clasped low
        target.rightArmRot = 45;
        target.leftLegRot = 0;
        target.rightLegRot = 0;
        target.tailRot = -30;      // Tail tucked slightly
      } else if (state.posture === "cheer") {
        target.rootY = -15;        // Standing tall
        target.bodyScaleY = 1.1;
        target.bodyScaleX = 0.95;
        target.headRot = -15;      // Looking up happily
        target.leftArmRot = 160;   // Both arms up
        target.rightArmRot = -160;
        target.leftLegRot = 5;
        target.rightLegRot = -5;
        target.tailRot = 40;       // Tail up
      }

      // 2. Add Oscillation layers based on bodyMotion
      if (state.bodyMotion === "breathe") {
        const breathe = Math.sin(t * 2); // 4 sec loop roughly
        target.bodyScaleY += breathe * 0.02;
        target.bodyScaleX -= breathe * 0.01;
        target.headRot += breathe * 1.5;
        target.rootY += breathe * 1;
      } else if (state.bodyMotion === "bounce") {
        const bounce = Math.abs(Math.sin(t * 8));
        target.rootY -= bounce * 15;
        target.bodyScaleY += bounce * 0.1;
        target.bodyScaleX -= bounce * 0.1;
        target.leftArmRot -= bounce * 20;
        target.rightArmRot += bounce * 20;
      } else if (state.bodyMotion === "dance") {
        const danceSpeed = t * 12;
        const b = Math.sin(danceSpeed);
        target.rootY -= Math.abs(b) * 20;
        target.bodyScaleY += Math.abs(b) * 0.15;
        target.bodyScaleX -= Math.abs(b) * 0.15;
        target.bodyRot += b * 15;
        target.headRot -= b * 10;
        target.leftArmRot -= b * 40;
        target.rightArmRot -= b * 40;
        target.leftLegRot += Math.sin(danceSpeed + Math.PI) * 10;
        target.rightLegRot += b * 10;
      } else if (state.bodyMotion === "look-around") {
        // Gentle sweep left and right
        const look = Math.sin(t * 3);
        target.headRot += look * 20;
        target.bodyRot += look * 5;
      }

      // Food prop override: both paws holding the bamboo centrally
      if (state.props?.includes("food")) {
        target.leftArmRot = 110;
        target.rightArmRot = -110;
      }

      // 3. Add Secondary Motion (Tail Follow-through)
      // The tail naturally lags behind the body rotation/movement.
      if (state.tail === "wag") {
        target.tailRot += Math.sin(t * 15) * 25;
      } else if (state.tail === "flick") {
        target.tailRot += Math.sin(t * 3) * 10;
      } else {
        // Idle lazy tail
        target.tailRot += Math.sin(t) * 5;
      }

      // Micro-interactions (ears)
      if (state.ears === "twitch") {
        target.leftEarRot += Math.sin(t * 30) * 15;
        target.rightEarRot += Math.sin(t * 30 + 1) * 15;
      } else if (state.ears === "down") {
        target.leftEarRot = -30;
        target.rightEarRot = 30;
      }

      // 4. Spring physics application
      const rig = currentRig.current;
      const vels = velocities.current;
      
      // Tension and friction parameters (higher tension = faster, higher friction = less bouncy)
      const tension = 120;
      const friction = 14;
      const tailFriction = 8; // Tail is bouncier
      const armTension = 180; // Arms snap faster

      const applySpring = (key: keyof RigState, t: number, f: number) => {
        const res = spring(rig[key], target[key], vels[key], dt, t, f);
        rig[key] = res.pos;
        vels[key] = res.vel;
      };

      applySpring('rootY', tension, friction);
      applySpring('bodyScaleX', tension, friction);
      applySpring('bodyScaleY', tension, friction);
      applySpring('bodyRot', tension, friction);
      applySpring('headRot', tension, friction);
      applySpring('headY', tension, friction);
      applySpring('tailRot', tension * 0.8, tailFriction); // Bouncy tail
      applySpring('leftArmRot', armTension, friction);
      applySpring('rightArmRot', armTension, friction);
      applySpring('leftLegRot', armTension, friction);
      applySpring('rightLegRot', armTension, friction);
      applySpring('leftEarRot', armTension * 1.5, friction * 0.8);
      applySpring('rightEarRot', armTension * 1.5, friction * 0.8);

      // Trigger a render frame if we want React to apply inline styles (or we can use refs directly in DOM)
      setFrame(f => f + 1);
      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [proceduralState]);

  return currentRig.current;
}
