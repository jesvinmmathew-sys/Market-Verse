import React, { useEffect, useRef, useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, RefreshCw, Zap } from "lucide-react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";

const greenBullImg = new URL("../assets/images/green_bull_market_1782602289763.jpg", import.meta.url).href;
const redBearImg = new URL("../assets/images/red_bear_market_1782602304881.jpg", import.meta.url).href;

// Floating Financial Particles background canvas
export const FloatingFinancialParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle pool representing financial data nodes
    const particles: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      text: string;
      color: string;
    }[] = [];

    const financialSymbols = [
      "₹RELIANCE", "₹TCS", "₹INFY", "▲ NIFTY 50", "▼ SENSEX", "▲ +1.5%", "▼ -0.8%", 
      "₹HDFCBANK", "₹SBIN", "₹ITC", "₹", "NSE", "BSE", "₹TATAMOTORS", "₹MRF", "₹BHARTIARTL"
    ];
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 18 : 45;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.35 + 0.1,
        text: Math.random() > 0.6 ? financialSymbols[Math.floor(Math.random() * financialSymbols.length)] : "",
        color: Math.random() > 0.5 ? "rgba(34, 211, 238, " : "rgba(16, 185, 129, "
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const time = Date.now() * 0.0003;

      // 1. Draw Apple Vision Pro style drifting glowing light effects (glowing orbs)
      const orb1X = width * 0.25 + Math.sin(time * 0.7) * 200;
      const orb1Y = height * 0.35 + Math.cos(time * 0.5) * 120;
      const radGlow1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, 450);
      radGlow1.addColorStop(0, "rgba(14, 116, 144, 0.08)"); // Cyan/Sky blue
      radGlow1.addColorStop(0.5, "rgba(8, 47, 73, 0.04)");
      radGlow1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radGlow1;
      ctx.fillRect(0, 0, width, height);

      const orb2X = width * 0.75 + Math.cos(time * 0.6) * 220;
      const orb2Y = height * 0.65 + Math.sin(time * 0.8) * 150;
      const radGlow2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, 500);
      radGlow2.addColorStop(0, "rgba(49, 46, 129, 0.08)"); // Deep Indigo/Navy
      radGlow2.addColorStop(0.5, "rgba(30, 27, 75, 0.04)");
      radGlow2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radGlow2;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw moving financial grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 1;
      const gridSize = 120;
      const gridShiftX = (Date.now() * 0.01) % gridSize;
      const gridShiftY = (Date.now() * 0.005) % gridSize;

      for (let x = -gridSize; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + gridShiftX, 0);
        ctx.lineTo(x + gridShiftX, height);
        ctx.stroke();
      }
      for (let y = -gridSize; y < height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + gridShiftY);
        ctx.lineTo(width, y + gridShiftY);
        ctx.stroke();
      }

      // 3. Draw a slow moving abstract stock graph wave at the bottom
      ctx.beginPath();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.04)";
      ctx.lineWidth = 1.5;
      for (let x = 0; x < width + 10; x += 15) {
        const y = height - 120 + Math.sin(x * 0.002 + time * 1.5) * 35 + Math.cos(x * 0.006 + time) * 15;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = "rgba(16, 185, 129, 0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width + 10; x += 20) {
        const y = height - 150 + Math.cos(x * 0.003 - time * 1.1) * 25 + Math.sin(x * 0.008 - time * 0.7) * 10;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 4. Draw interactive connection lines between particles
      ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // 5. Draw particles & text tags
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap edges
        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;
        if (p.y < -50) p.y = height + 50;
        if (p.y > height + 50) p.y = -50;

        ctx.fillStyle = p.color + p.opacity + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // If particle contains text symbol
        if (p.text) {
          ctx.font = "9px monospace";
          ctx.fillStyle = "rgba(255, 255, 255, " + (p.opacity * 1.2) + ")";
          ctx.fillText(p.text, p.x + 8, p.y + 3);
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 bg-[#020204]" />;
};

// Premium Interactive Bull Asset (3D holographic hover card + slow floating + sweeps of light)
export const GlowingBullModel: React.FC<{ size?: number }> = ({ size = 180 }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shineX, setShineX] = useState(0);
  const [shineY, setShineY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    const rotX = -(mouseY / height) * 20; // max 20 degrees
    const rotY = (mouseX / width) * 20;

    setRotateX(rotX);
    setRotateY(rotY);

    // Calculate sheen position
    const percentX = (e.clientX - rect.left) / width * 100;
    const percentY = (e.clientY - rect.top) / height * 100;
    setShineX(percentX);
    setShineY(percentY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        y: isHovered ? -15 : [0, -10, 0],
        rotate: isHovered ? 0 : [0, 1.2, -1.2, 0]
      }}
      transition={
        isHovered
          ? { type: "spring", stiffness: 400, damping: 25 }
          : { repeat: Infinity, duration: 6, ease: "easeInOut" }
      }
      style={{
        width: size,
        height: size + 40,
        perspective: 1000,
      }}
      className="relative flex flex-col items-center justify-center cursor-pointer select-none"
    >
      <motion.div
        animate={{
          rotateX: rotateX,
          rotateY: rotateY,
          scale: isHovered ? 1.05 : 1
        }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
        className="relative z-10 w-full h-full rounded-2xl border border-emerald-500/25 bg-[#030706]/90 overflow-hidden flex flex-col items-center justify-between p-4 shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:border-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.35)] transition-shadow duration-300"
      >
        {/* Holographic grid scan lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none z-10" />

        {/* Ambient neon radial glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 rounded-full bg-emerald-500/10 blur-[30px] pointer-events-none" />

        {/* Dynamic Sweep / Light Reflection sheen overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.8 : 0.25,
            backgroundImage: isHovered
              ? `radial-gradient(circle 120px at ${shineX}% ${shineY}%, rgba(52, 211, 153, 0.15), transparent 70%)`
              : "linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.08) 50%, transparent 60%)",
            backgroundSize: isHovered ? "auto" : "200% 200%",
            animation: isHovered ? "none" : "sweeplight 4s infinite linear"
          }}
        />

        {/* Rotating cybernetic vector lines backdrop */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
          className="absolute inset-0 pointer-events-none z-0 border border-dashed border-emerald-500/5 rounded-full scale-75 m-4"
        />

        {/* Image Frame */}
        <div className="relative z-10 w-full flex-1 rounded-xl overflow-hidden border border-emerald-500/15 bg-black">
          <img
            src={greenBullImg}
            alt="Bullish Trend Scene (Green Bull)"
            className="w-full h-full object-cover filter brightness-[1.05] contrast-[1.2] group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Badge & Meta Label */}
        <div className="relative z-10 w-full mt-3 flex items-center justify-between border-t border-emerald-500/10 pt-2.5">
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-mono tracking-widest text-emerald-400/60 uppercase">DOMINANCE</span>
            <span className="text-xs font-black text-emerald-400 font-sans tracking-wide">BULL MARKET</span>
          </div>
          <div className="bg-emerald-950/90 border border-emerald-500/35 text-emerald-400 text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 shadow-md">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="font-bold">NSE +1.64%</span>
          </div>
        </div>
      </motion.div>

      {/* Cybernetic floor projection */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-2 bg-emerald-500/20 blur-[6px] rounded-full opacity-60 z-0 animate-pulse" />
    </motion.div>
  );
};

// Premium Interactive Bear Asset (3D holographic hover card + slow floating + sweeps of light)
export const GlowingBearModel: React.FC<{ size?: number }> = ({ size = 180 }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shineX, setShineX] = useState(0);
  const [shineY, setShineY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    const rotX = -(mouseY / height) * 20;
    const rotY = (mouseX / width) * 20;

    setRotateX(rotX);
    setRotateY(rotY);

    const percentX = (e.clientX - rect.left) / width * 100;
    const percentY = (e.clientY - rect.top) / height * 100;
    setShineX(percentX);
    setShineY(percentY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        y: isHovered ? -15 : [0, -10, 0],
        rotate: isHovered ? 0 : [0, -1.2, 1.2, 0]
      }}
      transition={
        isHovered
          ? { type: "spring", stiffness: 400, damping: 25 }
          : { repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }
      }
      style={{
        width: size,
        height: size + 40,
        perspective: 1000,
      }}
      className="relative flex flex-col items-center justify-center cursor-pointer select-none"
    >
      <motion.div
        animate={{
          rotateX: rotateX,
          rotateY: rotateY,
          scale: isHovered ? 1.05 : 1
        }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
        className="relative z-10 w-full h-full rounded-2xl border border-rose-500/25 bg-[#080304]/90 overflow-hidden flex flex-col items-center justify-between p-4 shadow-[0_0_25px_rgba(244,63,94,0.15)] hover:border-rose-400 hover:shadow-[0_0_40px_rgba(244,63,94,0.35)] transition-shadow duration-300"
      >
        {/* Holographic grid scan lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.03)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none z-10" />

        {/* Ambient neon radial glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 rounded-full bg-rose-500/10 blur-[30px] pointer-events-none" />

        {/* Dynamic Sweep / Light Reflection sheen overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.8 : 0.25,
            backgroundImage: isHovered
              ? `radial-gradient(circle 120px at ${shineX}% ${shineY}%, rgba(251, 113, 133, 0.15), transparent 70%)`
              : "linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.08) 50%, transparent 60%)",
            backgroundSize: isHovered ? "auto" : "200% 200%",
            animation: isHovered ? "none" : "sweeplight 4s infinite linear"
          }}
        />

        {/* Rotating cybernetic vector lines backdrop */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
          className="absolute inset-0 pointer-events-none z-0 border border-dashed border-rose-500/5 rounded-full scale-75 m-4"
        />

        {/* Image Frame */}
        <div className="relative z-10 w-full flex-1 rounded-xl overflow-hidden border border-rose-500/15 bg-black">
          <img
            src={redBearImg}
            alt="Bearish Trend Scene (Red Bear)"
            className="w-full h-full object-cover filter brightness-[1.05] contrast-[1.2] group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Badge & Meta Label */}
        <div className="relative z-10 w-full mt-3 flex items-center justify-between border-t border-rose-500/10 pt-2.5">
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-mono tracking-widest text-rose-400/60 uppercase">RISK SCORE</span>
            <span className="text-xs font-black text-rose-400 font-sans tracking-wide">BEAR CONTEXT</span>
          </div>
          <div className="bg-rose-950/90 border border-rose-500/35 text-rose-400 text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 shadow-md">
            <TrendingDown className="w-3 h-3 text-rose-400" />
            <span className="font-bold">NSE -0.92%</span>
          </div>
        </div>
      </motion.div>

      {/* Cybernetic floor projection */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-2 bg-rose-500/20 blur-[6px] rounded-full opacity-60 z-0 animate-pulse" />
    </motion.div>
  );
};

