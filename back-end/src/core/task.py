"""Task."""
import openai


def completion(prompt, parameters):
    """Completion."""
    params = {
        "prompt": prompt,
        **parameters
    }
    resp = openai.Completion.create(**params)
    return resp.choice[0]['text']
