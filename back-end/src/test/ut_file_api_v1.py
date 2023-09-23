import json
import sys
import unittest
import pandas as pd
import requests
from werkzeug.datastructures import FileStorage

sys.path.append("../")

from app import app


class TestFileAPI(unittest.TestCase):
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

    def test_upload_file(self):
        file_content = [{"city": "New york", "vehicle": "Boat"}, {
            "city": "Beijing", "vehicle": "Plane"}]
        df = pd.DataFrame.from_records(file_content)

        file_path = "/Users/maxi/Downloads/Startup/Data/temp/task.tsv"
        df.to_csv(file_path, sep="\t", index=False)

        with open(file_path, "rb") as file:
            file_storage = FileStorage(
                file, filename='task.tsv', content_type='text/tab-separated-values')

            request_obj = {'file': file_storage, 'uploaded_by': 'b6c326ed'}

            response = self.client.post(
                "/v1/file/upload", headers={"XAuthorization": self.token},
                data=request_obj
            )

            print(response.text)

            # Assert that the returned status code is 200
            self.assertEqual(200, response.status_code)

            res = json.loads(response.text)
            print(res)

        file_content = "The Impact of Modern Technology on Human Life" \
                        "As technology rapidly advances, contemporary society has entered a brand-new era, bringing about transformative changes in human life. Technology has not only altered our way of life but also profoundly influences our modes of thinking, social structures, and cultural heritage." \
                        "Firstly, technological progress has changed people's lifestyles. The widespread use of smartphones has made information acquisition and communication more convenient. People can stay in touch with friends and family anytime, anywhere, and keep abreast of global events. Additionally, the rise of e-commerce has made online shopping a common way to shop, eliminating the need to visit stores in person and saving a lot of time. However, the advancement of technology has also brought some problems, such as addiction due to excessive use of smartphones, privacy leaks, and so on." \
                        "Secondly, technology has had a profound impact on ways of thinking. The internet provides people with vast resources for information, making it easy to acquire all sorts of knowledge. However, information overload can also make people restless and find it difficult to concentrate. Furthermore, the emergence of social media has changed people's social habits, making them more focused on others' opinions and approval, potentially affecting one's sense of self-worth." \
                        "Moreover, technology is also shaping social structures and cultural heritage. The rise of online education allows knowledge to be spread more equitably, freeing people from geographical and temporal constraints. Meanwhile, the development of artificial intelligence is also changing the working patterns of many industries; some repetitive tasks are being replaced by automation, posing new challenges for career planning." \
                        "In summary, modern technology has had a tremendous impact on human life. The advancement of technology has made our lives more convenient and diverse, but it has also brought new problems and challenges. While enjoying the conveniences brought by technology, we also need to consider how to better cope with the possible negative impacts of technology, maintaining a rational attitude towards it, to achieve harmonious development between technology and human society."

        file_path = "/Users/maxi/Downloads/Startup/Data/temp/embedding.txt"

        with open(file_path, "w", encoding="utf-8") as fp:
            fp.write(file_content)

        with open(file_path, "rb") as file:
            file_storage = FileStorage(
                file, filename='embedding.txt', content_type='text/tab-separated-values')

            request_obj = {'file': file_storage, 'uploaded_by': 'b6c326ed'}

            response = self.client.post(
                "/v1/file/upload", headers={"XAuthorization": self.token},
                data=request_obj
            )

            print(response.text)

            # Assert that the returned status code is 200
            self.assertEqual(200, response.status_code)

            res = json.loads(response.text)
            print(res)

    def test_list_file(self):
        response = self.client.get("/v1/file/list", headers={"XAuthorization": self.token})

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)

    def test_load_file(self):
        response = self.client.get("/v1/file/load/4c8b9129", headers={"XAuthorization": self.token})
        print("response.text: ", response.text)
        print("response", response)

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print("res", res)

    def test_delete_file(self):
        file_id = "79652485"
        response = self.client.delete("/v1/file/delete/{}".format(file_id), headers={"XAuthorization": self.token})

        # Assert that the returned status code is 200
        self.assertEqual(200, response.status_code)

        res = json.loads(response.text)
        print(res)


if __name__ == "__main__":
    unittest.main()
