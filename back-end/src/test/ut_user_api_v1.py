import json
import sys
import unittest

from app import app
from model.types import LlmApiType
from util.uid_gen import gen_uuid

sys.path.append("../")


class TestUserAPI(unittest.TestCase):
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

    def test_ping(self):
        resp = self.client.get('/ping')

        # Assert that the returned status code is 200
        self.assertEqual(200, resp.status_code)

        # Assert that the returned content meets expectations
        self.assertEqual('Pong!', resp.text)

    def test_register(self):
        request_obj = {"username": "test1",
                       "email": "test1@mail.com", "password": "123"}

        resp = self.client.post('/v1/user/register', json=request_obj)

        # Assert that the returned status code is 200
        self.assertEqual(200, resp.status_code)

    def test_login(self):
        request_obj = {"email": "unknown", "password": "123"}

        resp = self.client.post('/v1/user/login', json=request_obj)

        # Assert that the returned status code is 401
        self.assertEqual(resp.status_code, 401)

    def test_get_api_key(self):
        resp = self.client.get(
            '/v1/user/apikey', headers={"XAuthorization": self.token})

        # Assert that the returned status code is 200
        self.assertEqual(resp.status_code, 200)

    def test_update_delete_api_key(self):
        random_key = gen_uuid()
        api_type = LlmApiType.OPENAI.value
        resp = self.client.post('/v1/user/apikey', headers={"XAuthorization": self.token}, json={
            "api_key": random_key,
            "api_type": api_type
        })

        # Assert that the returned status code is 200
        self.assertEqual(resp.status_code, 200)

        resp = self.client.get(
            '/v1/user/apikey', headers={"XAuthorization": self.token})
        res = json.loads(resp.text)
        self.assertEqual(random_key, res['data'][0]['api_key'])
        self.assertEqual(api_type, res['data'][0]['api_type'])
        resp = self.client.delete('/v1/user/apikey', headers={"XAuthorization": self.token}, json={
            "api_key": random_key,
            "api_type": api_type
        })
        self.assertEqual(resp.status_code, 200)
        resp = self.client.get(
            '/v1/user/apikey', headers={"XAuthorization": self.token})
        res = json.loads(resp.text)
        exists = False
        for ak in res['data']:
            if ak == random_key:
                exists = True
        self.assertEqual(False, exists)


if __name__ == "__main__":
    unittest.main()
