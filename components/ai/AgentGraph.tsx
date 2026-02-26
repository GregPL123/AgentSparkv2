'use client';

import React, { useRef, useEffect } from 'react';
import { Agent } from '@/types/agent';

interface AgentGraphProps {
    agents: Agent[];
}

export const AgentGraph = ({ agents }: AgentGraphProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        // Draw Connections
        ctx.beginPath();
        ctx.strokeStyle = '#1e1e24';
        ctx.lineWidth = 2;
        agents.forEach((_, i) => {
            const angle = (i / agents.length) * Math.PI * 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            agents.forEach((_, j) => {
                if (i === j) return;
                const angle2 = (j / agents.length) * Math.PI * 2;
                const x2 = centerX + radius * Math.cos(angle2);
                const y2 = centerY + radius * Math.sin(angle2);
                ctx.moveTo(x, y);
                ctx.lineTo(x2, y2);
            });
        });
        ctx.stroke();

        // Draw Agents
        agents.forEach((agent, i) => {
            const angle = (i / agents.length) * Math.PI * 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            // Node shadow/glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(0, 229, 255, 0.2)';

            // Circle
            ctx.beginPath();
            ctx.arc(x, y, 24, 0, Math.PI * 2);
            ctx.fillStyle = '#121217';
            ctx.fill();
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Emoji
            ctx.shadowBlur = 0;
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(agent.emoji, x, y);

            // Label
            ctx.font = 'bold 10px Inter';
            ctx.fillStyle = '#8b8b9e';
            ctx.fillText(agent.name.toUpperCase(), x, y + 40);
        });
    }, [agents]);

    return (
        <div className="relative w-full aspect-square glass rounded-2xl border border-border/50 overflow-hidden flex items-center justify-center">
            <canvas
                ref={canvasRef}
                width={600}
                height={600}
                className="w-full h-full"
            />
            <div className="absolute top-4 left-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent font-bold">Architecture Graph</span>
            </div>
        </div>
    );
};
