from typing import List, Dict

class Memory:
    def __init__(self):
        self.history: List[Dict[str, str]] = []

    def add_message(self, role: str, content: str):
        self.history.append({"role": role, "content": content})

    def get_history(self) -> List[Dict[str, str]]:
        return self.history

    def clear(self):
        self.history = []
