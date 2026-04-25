import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  hue: number;
  opacity: number;
  length: number;
  type: 'star' | 'meteor' | 'spark';
}

interface Lightning {
  x: number;
  y: number;
  alpha: number;
  branches: {x: number, y: number}[];
}

export const DynamicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let lightnings: Lightning[] = [];
    const starCount = 250;
    const meteorCount = 12;
    const sparkCount = 40;
    const nebulaCount = 4;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = (type: 'star' | 'meteor' | 'spark', isInitial = false): Particle => {
      const isStar = type === 'star';
      const isMeteor = type === 'meteor';
      const isSpark = type === 'spark';

      let angle = isStar ? Math.PI : Math.PI / 4 + (Math.random() - 0.5) * 0.4;
      if (isSpark) angle = Math.random() * Math.PI * 2;
      
      return {
        x: Math.random() * canvas.width,
        y: isInitial ? Math.random() * canvas.height : (isMeteor ? -200 : Math.random() * canvas.height),
        size: isStar ? Math.random() * 1.8 + 0.3 : (isMeteor ? Math.random() * 4 + 2 : Math.random() * 1.2),
        speed: isStar ? Math.random() * 0.12 + 0.03 : (isMeteor ? Math.random() * 25 + 15 : Math.random() * 3 + 1),
        angle,
        hue: isStar ? (Math.random() > 0.7 ? Math.random() * 360 : 220) : (isMeteor ? Math.random() * 360 : 180),
        opacity: isStar ? Math.random() * 0.7 + 0.3 : (isMeteor ? Math.random() * 1 + 0.5 : Math.random() * 0.6),
        length: isMeteor ? Math.random() * 400 + 200 : (isSpark ? Math.random() * 15 : 0),
        type
      };
    };

    const createLightning = () => {
      const startX = Math.random() * canvas.width;
      const startY = 0;
      const branches = [];
      let curX = startX;
      let curY = startY;
      const hue = Math.random() > 0.5 ? 200 : 280; // Electric blue or deep purple
      
      for(let i = 0; i < 25; i++) {
        curX += (Math.random() - 0.5) * 100;
        curY += Math.random() * 70;
        branches.push({x: curX, y: curY});
        if(curY > canvas.height) break;
      }
      
      return {
        x: startX,
        y: startY,
        alpha: 1,
        branches,
        hue
      };
    };

    const init = () => {
      resize();
      particles = [
        ...Array.from({ length: starCount }, () => createParticle('star', true)),
        ...Array.from({ length: meteorCount }, () => createParticle('meteor', true)),
        ...Array.from({ length: sparkCount }, () => createParticle('spark', true))
      ];
    };

    const draw = () => {
      // Deep Space background with slight gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#02000a');
      bgGrad.addColorStop(1, '#080015');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Multi-Layered Galaxyous Nebula
      const time = Date.now() * 0.0002;
      
      const drawNebula = (x: number, y: number, color1: string, color2: string, size: number, speedMult = 1) => {
        const pulse = Math.sin(time * speedMult + x) * 0.15 + 0.85;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, size * pulse);
        grad.addColorStop(0, color1);
        grad.addColorStop(0.4, color2);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        // Apply slight blend mode for depth
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      };

      // Nebula Clusters
      drawNebula(canvas.width * 0.5, canvas.height * 0.5, 'rgba(100, 50, 255, 0.25)', 'rgba(80, 20, 180, 0.1)', canvas.width * 1.2, 0.5);
      drawNebula(canvas.width * 0.2, canvas.height * 0.3, 'rgba(0, 255, 230, 0.12)', 'rgba(0, 100, 255, 0.05)', canvas.width * 0.8, 0.8);
      drawNebula(canvas.width * 0.8, canvas.height * 0.7, 'rgba(255, 0, 150, 0.08)', 'rgba(150, 0, 255, 0.03)', canvas.width * 0.7, 1.2);
      drawNebula(canvas.width * 0.4, canvas.height * 0.8, 'rgba(50, 150, 255, 0.1)', 'rgba(0, 50, 150, 0.04)', canvas.width * 0.6, 0.6);

      // Atmospheric lightning randomly
      if (Math.random() > 0.992) {
        lightnings.push(createLightning());
      }

      // Draw lightnings
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      lightnings = lightnings.filter(l => {
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${(l as any).hue}, 100%, 80%, ${l.alpha})`;
        ctx.lineWidth = 3 * l.alpha;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${(l as any).hue}, 100%, 50%, ${l.alpha})`;
        ctx.moveTo(l.x, l.y);
        l.branches.forEach(b => ctx.lineTo(b.x, b.y));
        ctx.stroke();
        
        l.alpha -= 0.04;
        return l.alpha > 0;
      });
      ctx.restore();

      particles.forEach((p, i) => {
        ctx.save();
        if (p.type === 'star') {
          const twinkle = Math.sin(Date.now() * (0.001 + p.size * 0.002) + p.x) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.shadowBlur = p.size * 4;
          ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, ${p.opacity * twinkle})`;
          ctx.fillStyle = `hsla(${p.hue}, 100%, 90%, ${p.opacity * twinkle})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          
          p.y += p.speed;
          if (p.y > canvas.height) p.y = 0;
        } else if (p.type === 'spark') {
           ctx.beginPath();
           ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.opacity * Math.random()})`;
           ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
           ctx.fill();
           p.x += Math.cos(p.angle) * p.speed;
           p.y += Math.sin(p.angle) * p.speed;
           if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
             particles[i] = createParticle('spark');
           }
        } else {
          // Beautiful Color Changing Meteoroid
          p.hue = (p.hue + 2) % 360; 

          // Meteor with Intense Lightning Trail
          const trailGrad = ctx.createLinearGradient(
            p.x, p.y, 
            p.x - Math.cos(p.angle) * p.length, 
            p.y - Math.sin(p.angle) * p.length
          );
          trailGrad.addColorStop(0, `hsla(${p.hue}, 100%, 85%, ${p.opacity})`);
          trailGrad.addColorStop(0.3, `hsla(${(p.hue + 45) % 360}, 100%, 70%, ${p.opacity * 0.8})`);
          trailGrad.addColorStop(0.6, `hsla(${(p.hue + 90) % 360}, 100%, 50%, ${p.opacity * 0.4})`);
          trailGrad.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.shadowBlur = 10;
          ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${p.opacity})`;
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = p.size * 1.5;
          ctx.lineCap = 'round';
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - Math.cos(p.angle) * p.length, p.y - Math.sin(p.angle) * p.length);
          ctx.stroke();

          // Spark emission from head
          if (Math.random() > 0.4) {
             ctx.beginPath();
             ctx.fillStyle = `hsla(${p.hue}, 100%, 90%, ${p.opacity})`;
             ctx.arc(p.x + (Math.random()-0.5)*10, p.y + (Math.random()-0.5)*10, 1, 0, Math.PI * 2);
             ctx.fill();
          }

          // Lightning aura around head
          if (Math.random() > 0.75) {
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${(p.hue + 180) % 360}, 100%, 90%, ${p.opacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + (Math.random()-0.5)*30, p.y + (Math.random()-0.5)*30);
            ctx.stroke();
          }

          p.x += Math.cos(p.angle) * p.speed;
          p.y += Math.sin(p.angle) * p.speed;

          if (p.x > canvas.width + 400 || p.y > canvas.height + 400 || p.x < -400 || p.y < -400) {
            particles[i] = createParticle('meteor');
            particles[i].x = Math.random() * canvas.width * 0.7;
          }
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    init();
    draw();

    window.addEventListener('resize', resize);
    const observer = new ResizeObserver(resize);
    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="block w-full h-full"
      style={{ opacity: 0.8 }}
    />
  );
};
