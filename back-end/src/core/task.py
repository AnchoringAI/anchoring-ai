import openai


def completion(prompt, parameters):
    params = {
        "prompt": prompt,
        **parameters
    }
    resp = openai.Completion.create(**params)
    return resp.choice[0]['text']
