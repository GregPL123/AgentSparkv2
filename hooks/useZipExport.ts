'use client';

import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { Agent } from '@/types/agent';

export function useZipExport() {
    const [loading, setLoading] = useState(false);

    const exportZip = useCallback(async (projectName: string, agents: Agent[], extraFiles: Record<string, string> = {}) => {
        setLoading(true);
        try {
            const zip = new JSZip();
            const root = zip.folder(projectName.replace(/\s+/g, '-').toLowerCase());

            if (!root) return;

            // 1. Agents Documentation
            const agentsFolder = root.folder('agents');
            agents.forEach(agent => {
                const agentFile = agentsFolder?.folder(agent.id);
                agentFile?.file('agent.md', agent.agentMd);
                agentFile?.file('skill.md', agent.skillMd);
            });

            // 2. Project Summary
            let summaryMd = `# ${projectName}\n\n## Agent Team\n\n`;
            agents.forEach(a => {
                summaryMd += `- **${a.name}** (${a.role})\n`;
            });
            root.file('README.md', summaryMd);

            // 3. Extra files (e.g. generated framework code)
            Object.entries(extraFiles).forEach(([filename, content]) => {
                root.file(filename, content);
            });

            // 4. Generate and download
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export ZIP:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { exportZip, loading };
}
