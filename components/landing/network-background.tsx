"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface NetworkBackgroundProps {
    className?: string;
}

export function NetworkBackground({ className }: NetworkBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let particles: Particle[] = [];

        // Configuration
        const particleCount = width < 768 ? 40 : 80;
        const connectionDistance = width < 768 ? 100 : 150;
        const mouseDistance = 200;

        // Colors based on theme (approximate values, will adjust dynamically)
        const particleColor = theme === "dark" ? "rgba(99, 102, 241, 0.5)" : "rgba(79, 70, 229, 0.5)"; // Indigo
        const lineColor = theme === "dark" ? "rgba(99, 102, 241, 0.15)" : "rgba(79, 70, 229, 0.15)";

        canvas.width = width;
        canvas.height = height;

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = particleColor;
                ctx.fill();
            }
        }

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Mouse interaction
        let mouse = { x: -1000, y: -1000 };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        window.addEventListener("mousemove", handleMouseMove);

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Update and draw particles
            particles.forEach((particle) => {
                particle.update();
                particle.draw();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = lineColor;
                        ctx.lineWidth = 1 - distance / connectionDistance;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }

                // Connect to mouse
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = lineColor;
                    ctx.lineWidth = 1 - distance / mouseDistance;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();

                    // Subtle attraction to mouse
                    if (distance > 50) {
                        particles[i].x -= dx * 0.0005;
                        particles[i].y -= dy * 0.0005;
                    }
                }
            }

            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            // Re-init particles on resize to prevent clustering
            particles = [];
            const newCount = width < 768 ? 40 : 80;
            for (let i = 0; i < newCount; i++) {
                particles.push(new Particle());
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 pointer-events-none opacity-60 ${className}`}
        />
    );
}
