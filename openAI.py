import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

def ask_openai(prompt):
    try:
        response = openai.Completion.create(
            engine="gpt-4",
            prompt=prompt,
            temperature=0.7,
            max_tokens=150,
            top_p=1.0,
            frequency_penalty=0.0,
            presence_penalty=0.0
        )
        return response.choices[0].text.strip()
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

# Example usage
if __name__ == "__main__":
    prompt = "You are AgreeMate AI, a facilitation bot designed to assist individuals in getting to know one another better and seeing if they're a good match as housemates. Your goal is to navigate this conversation by asking about their weekly schedules, hobbies, guest preferences, cleaning habits and preferences for shared responsibilities and items. You ask about one topic then wait for all parties to respond, then you can either delve deeper into the same topic or move onto the next topic if you think its suitable. If there is nothing more to discuss, create a home mates contract between the users and emphasize that to be a good match these rules must be followed"
    response = ask_openai(prompt)
