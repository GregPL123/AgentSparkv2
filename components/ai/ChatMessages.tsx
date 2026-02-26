'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'ai';
    text: string;
}

interface ChatMessagesProps {
    messages: Message[];
    isTyping?: boolean;
}

export const ChatMessages = ({ messages, isTyping }: ChatMessagesProps) => {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    return (
        <div className="flex flex-col gap-6 py-4 overflow-y-auto max-h-full">
            {messages.map((msg, idx) => (
                <div
                    key={idx}
                    className={`
            flex flex-col max-w-[85%] animate-fade-in
            ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}
          `}
                >
                    <div className={`
            px-5 py-3 rounded-2xl text-sm leading-relaxed
            ${msg.role === 'user'
                            ? 'bg-accent text-bg font-medium rounded-tr-none'
                            : 'bg-card border border-border text-text rounded-tl-none glass'}
          `}>
                        {msg.role === 'ai' ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown>{msg.text.split('[INTERVIEW_COMPLETE]')[0]}</ReactMarkdown>
                            </div>
                        ) : (
                            msg.text
                        )}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-muted mt-1 px-1 font-mono">
                        {msg.role === 'user' ? 'You' : 'AgentSpark'}
                    </span>
                </div>
            ))}

            {isTyping && (
                <div className="flex flex-col max-w-[85%] mr-auto items-start animate-fade-in">
                    <div className="px-5 py-4 bg-card border border-border rounded-2xl rounded-tl-none glass">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                        </div>
                    </div>
                </div>
            )}
            <div ref={endRef} />
        </div>
    );
};
