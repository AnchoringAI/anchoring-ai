import json
import sys
import time
import unittest

sys.path.append("../")

from app import app


class TestTaskAPI(unittest.TestCase):
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

    def test_text_convert(self):
        text = "ad{a}s{d}"
        input_variables = {"a": "11", "c": "22"}

        request_obj = {"input": text, "input_variables": input_variables}
        response = self.client.post("/v1/task/text_convert", headers={"XAuthorization": self.token}, json=request_obj)

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

        # Assert that the returned content meets expectations
        self.assertEqual("ad11s{d}", res["result"])

    def test_complete(self):
        input = "What is a good name for a company that makes {product}?"
        input_variables = {"product": "colorful socks"}
        parameters = dict(model_name="text-davinci-003",
            temperature=0.7,
            max_tokens=256,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
            n=1,
            request_timeout=600,
            logit_bias=None,
            cache_enable=True)

        request_obj = {"model_provider": "openai", "input": input, "input_variables": input_variables,
                       "parameters": parameters}

        print(request_obj)

        # res = requests.get("http://127.0.0.1:5001/v1/task/complete")
        response = self.client.post("/v1/task/complete", headers={"XAuthorization": self.token}, json=request_obj)

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

        # Assert that the returned content meets expectations
        self.assertIn("result", res)

        input = "What is a good name for a company that makes {product}? Output Format: <Name>XXX</Name>"
        input_variables = {"product": "colorful socks"}
        parameters = dict(model_name="text-davinci-003",
            temperature=0.7,
            max_tokens=256,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
            n=1,
            request_timeout=600,
            logit_bias=None,
            cache_enable=True
        )

        request_obj = {"model_provider": "openai", "input": input, "input_variables": input_variables,
                       "parameters": parameters}

        # res = requests.get("http://127.0.0.1:5001/v1/task/complete")
        response = self.client.post("/v1/task/complete", headers={"XAuthorization": self.token}, json=request_obj)

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)

        print(res)

        # Assert that the returned content meets expectations
        self.assertIn("result", res)

    def test_tag_parse(self):
        tag = "City"
        input = "<City>{a}</City> aa  <City>Beijing</City>"
        input_variables = {"a": "New York"}

        request_obj = {"tag": tag, "input": input,
                       "input_variables": input_variables}
        print(request_obj)

        # res = requests.get("http://127.0.0.1:5001/v1/task/tag_parse")
        response = self.client.post("/v1/task/tag_parse", headers={"XAuthorization": self.token}, json=request_obj)

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

        # Assert that the returned content meets expectations
        self.assertEqual("New York", res["result"])

    def test_run_chain(self):
        action_list = [
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
                "is_app_input": 0,
                "is_app_output": 1
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
                "embedding_id": "45e5f8a2-c802-4ec1-9c16-b45b6bae0ed8",
                "input": "{model 2}",
                "parameters":
                    {
                        "top_n": 3,
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
        ]

        input_variables = {"city": "Beijing",
                           "vehicle": "Boat", "input 1": "Tomorrow"}

        request_obj = {"chain": action_list,
                       "input_variables": input_variables}

        # res = requests.get("http://127.0.0.1:5001/v1/task/run_chain")
        response = self.client.post("/v1/task/run_chain", headers={"XAuthorization": self.token}, json=request_obj)

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

        # Assert that the returned content meets expectations
        self.assertIn("result", res)

    def test_run_chain_v2(self):
        app_id = "855b8g8g"
        input_variables = {"city": "Beijing",
                           "vehicle": "Boat", "input 1": "Tomorrow"}

        request_obj = {"app_id": app_id, "input_variables": input_variables}

        # res = requests.get("http://127.0.0.1:5001/v1/task/run_chain")
        response = self.client.post("/v1/task/run_chain_v2", headers={"XAuthorization": self.token}, json=request_obj)

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

        # Assert that the returned content meets expectations
        self.assertIn("result", res)

    def test_batch_task(self):
        task_name = "batch_test"
        created_by = "b6c326ed"
        app_id = "2gf74d23"
        file_id = "6b1a5ad9"

        input_variables = {"input 1": "Tomorrow"}

        request_obj = {"task_name": task_name, "created_by": created_by,
                       "app_id": app_id, "file_id": file_id, "input_variables": input_variables}

        # res = requests.post("http://127.0.0.1:5001/v1/task/start_batch_task", json=data)
        response = self.client.post("/v1/task/start", headers={"XAuthorization": self.token}, json=request_obj)

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

        # Assert that the returned content meets expectations
        self.assertIn("task_id", res)

        task_id = res["task_id"]

        success = False

        while not success:
            time.sleep(1)
            # res = requests.get("http://127.0.0.1:5001/v1/task/batch_task_status/{}".format(task_id)).json()
            response = self.client.get("/v1/task/status/{}".format(task_id), headers={"XAuthorization": self.token})
            # Assert that the returned status code is 200
            self.assertEqual(200, response.status_code)

            res = json.loads(response.text)
            print(res)

            # Assert that the returned content meets expectations
            self.assertIn("status", res)
            self.assertIn("progress", res)
            self.assertIn("message", res)

            if res["status"] == "completed":
                success = True

        # res = requests.get("http://127.0.0.1:5001/v1/task/batch_task_result/{}".format(task_id)).json()
        response = self.client.get("/v1/task/load/{}".format(task_id), headers={"XAuthorization": self.token})
        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

        # Assert that the returned content meets expectations
        self.assertIn("result", res)

    def test_stop_task(self):
        task_name = "batch_test"
        created_by = "b6c326ed"
        app_id = "31ff4gg6"
        file_id = "2834a1eg"

        input_variables = {"input 1": "Tomorrow"}

        request_obj = {"task_name": task_name, "created_by": created_by,
                       "app_id": app_id, "file_id": file_id, "input_variables": input_variables}

        response = self.client.post("/v1/task/start", headers={"XAuthorization": self.token}, json=request_obj)
        res = json.loads(response.text)
        print(res)
        task_id = res["task_id"]

        time.sleep(5)

        # res = requests.get("http://127.0.0.1:5001/v1/task/stop_task/{}".format(task_id)).json()
        response = self.client.get("/v1/task/stop/{}".format(task_id))
        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

        # Assert that the returned content meets expectations
        self.assertIn("success", res)

    def test_list_batch_tasks(self):
        created_by = "b6c326ed"
        app_id = "31ff4gg6"
        file_id = "2834a1eg"

        response = self.client.get(
            "/v1/task/list?created_by={}&app_id={}&file_id={}".format(created_by, app_id, file_id),
            headers={"XAuthorization": self.token})

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

    def test_delete_batch_task(self):
        task_id = '07e2ab41-ca9f-4fd0-85a1-4973fd2b25ae'

        response = self.client.delete("/v1/task/delete/{}".format(task_id), headers={"XAuthorization": self.token})

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)


if __name__ == "__main__":
    unittest.main()
