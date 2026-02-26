import { Agent } from '@/types/agent';

// Pure functions for framework generation (Session C)

export function generateCrewAI(topic: string, agents: Agent[]): string {
    const agentDefs = agents.map(a => `
${a.id.replace(/-/g, '_')} = Agent(
  role='${a.role}',
  goal='${a.name} Goal',
  backstory="""${a.description}""",
  verbose=True,
  allow_delegation=False,
  llm=llm
)`).join('\n');

    return `"""
AgentSpark → CrewAI Export
Topic: ${topic}
Docs: https://docs.crewai.com
"""

from crewai import Agent, Task, Crew, Process

# llm = ... (Define your LLM here)

${agentDefs}

# Tasks & Crew integration logic here...
`;
}

export function generateLangGraph(topic: string, agents: Agent[]): string {
    return `"""
AgentSpark → LangGraph Export
Topic: ${topic}
Docs: https://langchain-ai.github.io/langgraph
"""

from typing import TypedDict
from langgraph.graph import StateGraph, END

class AgentState(TypedDict):
    input: str
    chat_history: list

# Node definitions for ${agents.length} agents...

graph = StateGraph(AgentState)
// ... Implementation nodes
`;
}

export function generateAutoGen(topic: string, agents: Agent[]): string {
    const agentConfigs = agents.map(a => `
${a.id.replace(/-/g, '_')} = AssistantAgent(
    name="${a.name}",
    llm_config=llm_config,
    system_message="""${a.role}. ${a.description}"""
)`).join('\n');

    return `"""
AgentSpark → AutoGen Export
Topic: ${topic}
Docs: https://microsoft.github.io/autogen
"""

from autogen import AssistantAgent, UserProxyAgent

llm_config = {"config_list": [{"model": "gpt-4o", "api_key": "YOUR_KEY"}]}

${agentConfigs}

user_proxy = UserProxyAgent(name="user", code_execution_config={"work_dir": "coding"})
# Kick off conversation logic here...
`;
}

export function generateSwarm(topic: string, agents: Agent[]): string {
    const agentDefs = agents.map(a => `
def transfer_to_${a.id.replace(/-/g, '_')}():
    return ${a.id.replace(/-/g, '_')}

${a.id.replace(/-/g, '_')} = Agent(
    name="${a.name}",
    instructions="""${a.role}. ${a.description}""",
    functions=[# Add transfer functions here]
)`).join('\n');

    return `"""
AgentSpark → OpenAI Swarm Export
Topic: ${topic}
Docs: https://github.com/openai/swarm
"""

from swarm import Swarm, Agent

client = Swarm()

${agentDefs}

# Orchestration logic here...
`;
}
