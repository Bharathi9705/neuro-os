from openai import OpenAI
import os

class CodingAgent:
    def __init__(self, client: OpenAI):
        self.client = client

    def process(self, prompt: str):
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a specialized Coding Agent in NEURO-OS. Provide high-quality code and technical explanations."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
