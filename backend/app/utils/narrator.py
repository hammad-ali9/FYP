import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

class StudioNarrator:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            self.client = None

    def get_instruction(self, step):
        """Generates a professional instruction for a given capture step."""
        if not self.client:
            # Fallback high-quality messages
            fallbacks = {
                "FRONT": "Please stand tall and face the camera directly.",
                "BACK": "Great! Now please turn around 180 degrees so we can scan your back profile.",
                "LEFT": "Perfect. Now turn to your left for a side-profile view.",
                "RIGHT": "Final step! Turn to your right for the remaining side view.",
                "COMPLETED": "Studio session complete! We are now generating your virtual look."
            }
            return fallbacks.get(step, "Position yourself for the next capture.")

        try:
            prompt = f"Write a professional, encouraging 1-sentence instruction for a user in a virtual fitting room. Move: {step}. Be concise."
            completion = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=60
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"Narrator Error: {e}")
            return "Please focus on the camera and stay still."

narrator = StudioNarrator()
