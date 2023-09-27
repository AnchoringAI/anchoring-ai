from app import app
import json
import sys
import time
import unittest

sys.path.append("../")


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

    def tearDown(self):
        # Clean up resources after each test method is executed
        pass

    def test_create_embedding(self):
        created_by = "b6c326ed"
        file_id = "66dfc2df"
        embedding_name = "test_db"

        doc_transformer = {
            "type": "text_splitter",
            "parameters":
                    {
                        "chunk_size": 100,
                        "chunk_overlap": 0
                    }
        }

        embedding_model = {
            "model_provider": "openai",
            "parameters":
            {
                "model": "text-embedding-ada-002",
                "embedding_ctx_length": 8191,
                "chunk_size": 100,
                "max_retries": 6,
                "request_timeout": 60
            }
        }

        vector_store = {
            "vector_store_provider": "lancedb",
            "parameters":
                {
                    "mode": "overwrite"  # create, overwrite
                }
        }

        request_obj = {
            "created_by": created_by,
            "file_id": file_id,
            "embedding_name": embedding_name,
            "doc_transformer": doc_transformer,
            "embedding_model": embedding_model,
            "vector_store": vector_store
        }

        response = self.client.post(
            "/v1/embedding/create", headers={"XAuthorization": self.token}, json=request_obj)

        print(response.text)

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

        # Assert that the returned content meets expectations
        self.assertIn("embedding_id", res)

        embedding_id = res["embedding_id"]

        success = False

        while not success:
            time.sleep(1)
            response = self.client.get(
                "/v1/embedding/status/{}".format(embedding_id), headers={"XAuthorization": self.token})
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

    def test_stop_embedding(self):
        created_by = "b6c326ed"
        file_id = "66dfc2df"
        embedding_name = "test_db"

        doc_transformer = {
            "type": "text_splitter",
            "parameters":
                {
                    "chunk_size": 100,
                    "chunk_overlap": 0
                }
        }

        embedding_model = {
            "model_provider": "openai",
            "parameters":
                {
                    "model": "text-embedding-ada-002",
                    "embedding_ctx_length": 8191,
                    "chunk_size": 100,
                    "max_retries": 6,
                    "request_timeout": 60
                }
        }

        vector_store = {
            "vector_store_provider": "lancedb",
            "parameters":
                {
                    "mode": "overwrite"  # create, overwrite
                }
        }

        request_obj = {
            "created_by": created_by,
            "file_id": file_id,
            "embedding_name": embedding_name,
            "doc_transformer": doc_transformer,
            "embedding_model": embedding_model,
            "vector_store": vector_store
        }

        response = self.client.post(
            "/v1/embedding/create", json=request_obj, headers={"XAuthorization": self.token})
        res = json.loads(response.text)
        print(res)
        embedding_id = res["embedding_id"]

        time.sleep(5)

        response = self.client.get(
            "/v1/embedding/stop/{}".format(embedding_id), headers={"XAuthorization": self.token})
        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

        # Assert that the returned content meets expectations
        self.assertIn("success", res)

    def test_list_embedding_tasks(self):
        created_by = "b6c326ed"
        file_id = "66dfc2df"

        response = self.client.get(
            "/v1/embedding/list?created_by={}&file_id={}".format(created_by, file_id), headers={"XAuthorization": self.token})

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

    def test_delete_batch_task(self):
        embedding_id = "0668f20d-e6bb-41f2-bffe-b836a2e253fd"

        response = self.client.delete(
            "/v1/embedding/delete/{}".format(embedding_id), headers={"XAuthorization": self.token})

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

    def test_doc_search(self):
        embedding_id = "486443c3-d5df-4054-8996-50397c80c596"
        input = "你好, {city}"
        top_n = 3
        input_variables = {"city": "北京"}

        request_obj = {
            "embedding_id": embedding_id,
            "input": input,
            "input_variables": input_variables,
            "parameters": {"top_n": top_n}
        }

        response = self.client.post(
            "/v1/embedding/search", headers={"XAuthorization": self.token}, json=request_obj)

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)


if __name__ == "__main__":
    unittest.main()
