import { useCallback, useEffect, useRef } from "react";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; rotation: number;
  rotationSpeed: number; opacity: number;
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))", "hsl(45 100% 55%)", "hsl(210 100% 56%)",
  "hsl(0 80% 55%)", "hsl(140 60% 50%)", "hsl(280 70% 60%)",
];

export default function ConfettiCanvas({ active, count = 100 }: { active: boolean; count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animRef = useRef<number>();

  const spawn = useCallback(() => {
    const p: Particle[] = [];
    for (let i = 0; i < count; i++) {
      p.push({
        x: Math.random() * window.innerWidth, y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 6, vy: Math.random() * 3 + 2,
        size: Math.random() * 8 + 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 10, opacity: 1,
      });
    }
    particles.current = p;
  }, [count]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    spawn();
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((p) => p.opacity > 0.01);
      for (const p of particles.current) {
        p.x += p.vx; p.vy += 0.08; p.y += p.vy;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height - 50) p.opacity *= 0.96;
        ctx.save(); ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (particles.current.length > 0) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [active, spawn]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
}
