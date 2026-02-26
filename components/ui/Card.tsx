import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
    glow?: boolean;
}

export const Card = ({ children, className = '', onClick, hoverable = false, glow = false }: CardProps) => {
    return (
        <div
            onClick={onClick}
            className={`
        bg-card border border-border rounded-xl p-6 transition-all duration-300
        ${hoverable ? 'hover:border-accent hover:bg-card/80 cursor-pointer' : ''}
        ${glow ? 'neo-glow' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
};
