import { ProjectLevel, ProjectLang } from '@/types/project';
import { Agent } from '@/types/agent';

interface InterviewParams {
    topic: string;
    level: ProjectLevel;
    lang: ProjectLang;
    maxQuestions: number;
    agentCount: string;
    focus: string;
}

export function getInterviewSystemPrompt({ topic, level, lang, maxQuestions, agentCount, focus }: InterviewParams) {
    const langText = lang === 'pl' ? 'Odpowiadaj po polsku.' : 'Respond in English.';

    return `You are AgentSpark, an expert AI system designer.
Your goal is to interview the user to design a team of AI agents for their project.

Project Topic: ${topic}
Depth Level: ${level} (${focus})
Target Agent Count: ${agentCount}
Max Questions: ${maxQuestions}

RULES:
1. ${langText}
2. Ask ONLY multiple-choice questions with 4 options (A, B, C, D).
3. Each option must include an IMPACT note (max 15 words) explaining the consequence of that choice.
4. Format:
   QUESTION: [Your question here]
   A) [Option A] | IMPACT: [Impact A]
   B) [Option B] | IMPACT: [Impact B]
   C) [Option C] | IMPACT: [Impact C]
   D) [Option D] | IMPACT: [Impact D]
5. Calibration:
   - iskra: Simple features, core flow.
   - plomien: Balanced complexity, common integrations.
   - pozar: Technical architecture, scalability, security.
   - inferno: Enterprise grade, microservices, compliance, SLAs.
6. After exactly ${maxQuestions} questions, append the marker [INTERVIEW_COMPLETE] to your final response.
7. If the interview is complete, summarize the requirements briefly before the marker.
`;
}

export function getGenerationSystemPrompt(params: InterviewParams) {
    const base = getInterviewSystemPrompt(params);
    return `${base}

The interview is now finish. Based on the previous conversation, generate the final team of agents.
You must respond with a JSON object containing the agents and the team configuration.

JSON Structure:
{
  "agents": [
    {
      "id": "slug-name",
      "name": "Display Name",
      "emoji": "🤖",
      "type": "technical|business",
      "role": "ROLE_LABEL",
      "description": "Short description",
      "agentMd": "# Agent: Name\\n\\n## Identity\\n...\\n\\n## Goal\\n...\\n\\n## Personality\\n...\\n\\n## Context\\n...",
      "skillMd": "# Skill: Name\\n\\n## Capabilities\\n...\\n\\n## Instructions\\n...\\n\\n## Tools\\n...\\n\\n## Output Format\\n..."
    }
  ],
  "teamConfig": "# Team Configuration\\n\\n## Architecture\\n..."
}

Agent Distribution:
- iskra: 2 technical + 1 business
- plomien: 2 technical + 2 business
- pozar: 3 technical + 2 business
- inferno: 4 technical + 2 business

Ensure the agentMd and skillMd are comprehensive and high-quality.
Respond ONLY with the JSON block.
`;
}

export function getRefineSystemPrompt({ topic, level, lang, currentAgents }: { topic: string, level: ProjectLevel, lang: ProjectLang, currentAgents: Agent[] }) {
    const langText = lang === 'pl' ? 'Odpowiadaj po polsku.' : 'Respond in English.';

    return `You are in REFINE mode for AgentSpark.
Current Project: ${topic} (${level})
${langText}

Current Team:
${JSON.stringify(currentAgents, null, 2)}

Your task is to update the team based on the user's request.
RESPOND IN TWO PARTS:
1. A brief summary of changes (1-3 sentences) using HTML tags for diff highlighting:
   - Added: <span class="refine-diff-added">+AgentName</span>
   - Removed: <span class="refine-diff-removed">-AgentName</span>
   - Changed: <span class="refine-diff-changed">~AgentName</span>

2. The full updated team JSON after the marker [UPDATED_TEAM].

RULES:
- Always return the FULL array of agents, including unchanged ones.
- Ensure agentMd and skillMd are full content, not placeholders.
- If an agent is changed, significantly improve their documentation.
`;
}

export function getScoringPrompt({ topic, level, lang, interviewHistory }: { topic: string, level: ProjectLevel, lang: ProjectLang, interviewHistory: string }) {
    return `Analyze the following project interview and provide a complexity score in JSON format.

Project: ${topic}
Level: ${level}
Language: ${lang}
History: ${interviewHistory}

Required JSON structure:
{
  "overallScore": 0-100,
  "overallLabel": "Short summary of complexity",
  "metrics": [
    { "label": "Technical Complexity", "value": 0-100, "color": "#7c3aff" },
    { "label": "Business Complexity", "value": 0-100, "color": "#ff6b35" },
    { "label": "Integration Needs", "value": 0-100, "color": "#00e5ff" },
    { "label": "Scalability Demand", "value": 0-100, "color": "#00ff88" }
  ],
  "risks": ["Risk 1 (max 12 words)", "Risk 2", "Risk 3"],
  "levelMatch": "ok|upgrade|downgrade",
  "levelSuggestion": "Why this level is appropriate or why it should change",
  "suggestedLevel": "iskra|plomien|pozar|inferno"
}
`;
}
