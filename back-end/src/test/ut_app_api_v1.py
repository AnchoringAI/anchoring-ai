import json
import sys
import unittest

sys.path.append("../")
from app import app

class TestAppAPI(unittest.TestCase):

    app_id = None

    def setUp(self):
        self.app = app
        # Create a test client before each test method is executed
        self.app.config["TESTING"] = True
        self.client = app.test_client()
        request_obj = {"email": "test1@mail.com", "password": "123"}
        resp = self.client.post('/v1/user/login', json=request_obj)
        self.assertEqual(200, resp.status_code)
        res = json.loads(resp.text)
        self.token = res['data']['token']

    def tearDown(self):
        # Clean up resources after each test method is executed
        pass

    def test_modify_app(self):
        request_obj = {
            "id": "",  # Include ID for updates, omit for new entries
            "app_name": "Test 1743",  # optional if update
            "created_by": "b6c326ed",  # Optional for updates. Will add permission system and JWT authentication in the future.
            "tags": ["Programming", "GPT-3.5", "Code Generation", "Unit Test"],
            "published": False,
            "chain":
            [
                {
                    "id": "1",
                    "type": "batch-input",
                    "input": "",
                    "title": "input 1",
                    "is_app_input": 1,
                    "is_app_output": 0
                },
                {
                    "id": "2",
                    "type": "text-input",
                    "input": "{input 1}",
                    "title": "input 2",
                    "is_app_input": 1,
                    "is_app_output": 0
                },
                {
                    "id": "3",
                    "type": "text-input",
                    "input": "I want to take a {vehicle} to visit {city} ",
                    "title": "input 3",
                    "is_app_input": 0, # Determine if this component‘s input will be required
                    "is_app_output": 1  # Determine if this component‘s output will be returned and displayed
                },
                {
                    "id": "4",
                    "type": "openai",  # "text", "table", "tag_parser", "openai"
                    "title": "model 1",
                    "is_app_input": 0,
                    "is_app_output": 1,
                    "input": "{input 2}. Please tell me the weather here in {input 1}. Output Format: <Weather>XXX</Weather>",
                    "parameters":
                        {
                            "model_name": "text-davinci-003",
                            "temperature": 0.7,
                            "max_tokens": 256,
                            "top_p": 1,
                            "frequency_penalty": 0,
                            "presence_penalty": 0,
                            "n": 1,
                            "request_timeout": 600,
                            "logit_bias": None,
                            "cache_enable": True
                        }
                },
                {
                    "id": "5",
                    "type": "tag-parser",
                    "input": "{model 1}",
                    "title": "plug-in 1",
                    "parameters":
                        {
                            "extract_pattern": "Weather",
                        },
                    # "name": "action3",
                    "is_app_input": 0,
                    "is_app_output": 1
                },
                {
                    "id": "6",
                    "type": "openai",  # "openai", "tag-parser", "text", "table"
                    "title": "model 2",
                    "is_app_input": 0,
                    "is_app_output": 1,
                    "input": "{input 2}. Please tell me the weather here in {input 1}. Output Format: <Weather>XXX</Weather>",
                    "parameters":
                        {
                            "model_name": "text-davinci-003",
                            "temperature": 0.7,
                            "max_tokens": 256,
                            "top_p": 1,
                            "frequency_penalty": 0,
                            "presence_penalty": 0,
                            "n": 1,
                            "request_timeout": 600,
                            "logit_bias": None,
                            "cache_enable": True
                        }
                },
                {
                    "id": "7",
                    "type": "doc-search",  # "openai", "tag-parser", "text", "table"
                    "title": "plug-in 2",
                    "is_app_input": 0,
                    "is_app_output": 1,
                    "embedding_id": "4a811ac4-5f46-4bce-90a8-47723e16ecb5",
                    "input": "{model 2}",
                    "parameters":
                        {
                            "top_n": 1,
                        }
                },
                {
                    "id": "8",
                    "type": "tag-parser",
                    "input": "{model 2}",
                    "title": "plug-in 3",
                    "parameters":
                        {
                            "extract_pattern": "Weather",
                        },
                    "is_app_input": 0,
                    "is_app_output": 1
                }
            ],
        }

        # res = requests.get("http://127.0.0.1:5001/v1/app/modify")
        response = self.client.post("/v1/app/modify", headers={"XAuthorization": self.token}, json=request_obj)

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.data.decode('utf-8'))
        print(res)

        self.__class__.app_id = res.get("id")

    def test_list_app(self):
        response = self.client.get("/v1/app/list", headers={"XAuthorization": self.token})

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

    def test_load_app(self):
        if self.__class__.app_id is not None:  # Check if app_id was set
            response = self.client.get("/v1/app/load/{}".format(self.__class__.app_id), headers={"XAuthorization": self.token})
            self.assertEqual(200, response.status_code)

            res = json.loads(response.data.decode('utf-8'))
            print(res)

    def test_delete_app(self):
        if self.__class__.app_id is not None:  # Check if app_id was set
            response = self.client.delete("/v1/app/delete/{}".format(self.__class__.app_id), headers={"XAuthorization": self.token})
            self.assertEqual(200, response.status_code)

            res = json.loads(response.data.decode('utf-8'))
            print(res)


if __name__ == "__main__":
    unittest.main()