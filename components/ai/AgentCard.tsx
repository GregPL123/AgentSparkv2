'use client';

import React from 'react';
import { Agent } from '@/types/agent';

interface AgentCardProps {
    agent: Agent;
    onClick?: () => void;
    selected?: boolean;
}

export const AgentCard = ({ agent, onClick, selected }: AgentCardProps) => {
    return (
        <div
            onClick={onClick}
            className={`
        relative p-5 rounded-2xl glass border transition-all duration-300 cursor-pointer
        ${selected
                    ? 'border-accent bg-accent-dim/10 neo-glow translate-y-[-4px]'
                    : 'border-border bg-card hover:border-accent/50 hover:bg-card/80'}
      `}
        >
            <div className="flex items-start gap-4">
                <div className="text-3xl bg-bg border border-border w-12 h-12 rounded-xl flex items-center justify-center shadow-inner">
                    {agent.emoji}
                </div>

                <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-text truncate">{agent.name}</h4>
                        <span className={`
              text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border
              ${agent.type === 'technical'
                                ? 'border-accent/40 text-accent bg-accent-dim/20'
                                : 'border-warning/40 text-warning bg-warning/10'}
            `}>
                            {agent.type}
                        </span>
                    </div>

                    <div className="text-[10px] font-mono text-accent/70 uppercase tracking-tighter mb-2">
                        {agent.role}
                    </div>

                    <p className="text-xs text-muted leading-relaxed line-clamp-2">
                        {agent.description}
                    </p>
                </div>
            </div>

            {selected && (
                <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
                </div>
            )}
        </div>
    );
};
