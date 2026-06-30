import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useScroll } from "motion/react";

export const CustomCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  // Scroll Progress indicator for smooth scroll visual feedback
  const { scrollYProgress } = useScroll();
  const scrollProgressX = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 25,
    restDelta: 0.001
  });

  // Mouse coordinates motion values
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Ultra-responsive, snappy springs for fast cursor-follow
  const ringX = useSpring(mouseX, { damping: 22, stiffness: 450, mass: 0.15 });
  const ringY = useSpring(mouseY, { damping: 22, stiffness: 450, mass: 0.15 });

  const dotX = useSpring(mouseX, { damping: 24, stiffness: 800, mass: 0.05 });
  const dotY = useSpring(mouseY, { damping: 24, stiffness: 800, mass: 0.05 });

  useEffect(() => {
    // Check if pointer is fine (desktop/mouse) or coarse (mobile/touch)
    const checkDevice = () => {
      const hasMouse = window.matchMedia("(pointer: fine)").matches;
      setIsMobile(!hasMouse);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseDown = () => {
      setIsClicked(true);
    };

    const handleMouseUp = () => {
      setIsClicked(false);
    };

    // Detect if hovering over clickable/interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if target or any of its ancestors are interactive
      const isInteractive = 
        target.closest("a, button, input, select, textarea, [role='button'], .cursor-pointer") !== null;

      setIsHovered(isInteractive);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseover", handleMouseOver);

    // Hide native cursor for fine devices
    document.documentElement.classList.add("cursor-none");

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseover", handleMouseOver);
      document.documentElement.classList.remove("cursor-none");
    };
  }, [isMobile, isVisible]);

  if (isMobile) return null;

  return (
    <>
      {/* Global CSS injection to hide the default browser cursor cleanly and safely */}
      <style>{`
        @media (pointer: fine) {
          a, button, input, select, textarea, [role='button'], .cursor-pointer {
            cursor: none !important;
          }
          body, html, #root {
            cursor: none !important;
          }
        }
      `}</style>

      {/* Floating horizontal scroll indicator at the top of the screen */}
      <motion.div 
        id="scroll-progress-bar"
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 origin-left z-[99999] shadow-[0_1px_10px_rgba(34,211,238,0.5)]"
        style={{ scaleX: scrollProgressX }}
      />

      {isVisible && (
        <>
          {/* Outer Premium Snappy Glow Ring */}
          <motion.div
            id="custom-cursor-outer"
            style={{
              x: ringX,
              y: ringY,
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{
              scale: isClicked ? 0.8 : 1.0,
              backgroundColor: isHovered ? "rgba(34, 211, 238, 0.12)" : "rgba(34, 211, 238, 0.02)",
              borderColor: isHovered ? "rgba(34, 211, 238, 0.7)" : "rgba(34, 211, 238, 0.3)",
              borderWidth: "1px",
              width: isHovered ? "24px" : "16px",
              height: isHovered ? "24px" : "16px",
            }}
            transition={{
              type: "spring",
              stiffness: 550,
              damping: 24,
              mass: 0.1
            }}
            className="fixed top-0 left-0 rounded-full border pointer-events-none z-[9999] mix-blend-screen backdrop-blur-[0.5px] shadow-[0_0_12px_rgba(34,211,238,0.12)]"
          />

          {/* Inner Snappy Indicator Dot */}
          <motion.div
            id="custom-cursor-inner"
            style={{
              x: dotX,
              y: dotY,
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{
              scale: isClicked ? 0.7 : isHovered ? 1.2 : 1.0,
              backgroundColor: isHovered ? "#22d3ee" : "#3D81E3",
              boxShadow: isHovered 
                ? "0 0 8px rgba(34, 211, 238, 0.7)" 
                : "0 0 4px rgba(61, 129, 227, 0.4)",
            }}
            transition={{
              type: "spring",
              stiffness: 750,
              damping: 20,
            }}
            className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full pointer-events-none z-[9999]"
          />
        </>
      )}
    </>
  );
};
