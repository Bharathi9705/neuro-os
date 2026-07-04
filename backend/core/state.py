from pydantic import BaseModel
from typing import Optional

class State(BaseModel):
    current_agent: str = "general"
    is_busy: bool = False
    last_action: Optional[str] = None

class GlobalState:
    def __init__(self):
        self.state = State()

    def update_agent(self, agent_name: str):
        self.state.current_agent = agent_name

    def set_busy(self, busy: bool):
        self.state.is_busy = busy

    def get_state(self) -> State:
        return self.state
