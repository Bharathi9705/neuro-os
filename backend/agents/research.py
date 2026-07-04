from openai import OpenAI
import os

class ResearchAgent:
    def __init__(self, client: OpenAI):
        self.client = client

    def process(self, prompt: str):
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a specialized Research Agent in NEURO-OS. Provide detailed research, summaries, and factual information."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
