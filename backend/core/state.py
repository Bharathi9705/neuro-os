from typing import TypedDict, Annotated, List
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage

class NeuroOSState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    active_agent: str
    context_data: dict
    is_busy: bool