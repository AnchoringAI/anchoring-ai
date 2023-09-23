from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import LanceDB

import lancedb

from config import logger


class VectorStoreLanceDB:
    # Constructor (initialize object)
    def __init__(self, db_path, table_name, mode, embedding_model):
        self.db = lancedb.connect(db_path)
        self.embedding_model = embedding_model

        print(db_path)

        if mode == "read":
            table = self.db.open_table(table_name)
        elif mode == "overwrite":
            table = self.db.create_table(table_name,
                                         data=[
                                             {
                                                 "vector": self.embedding_model.embed_text("Hello world"),
                                                 "text": "Hello World",
                                                 "id": "1"
                                             }
                                         ], mode=mode)
        else:
            table = self.db.create_table(table_name,
                                         data=[
                                             {
                                                 "vector": self.embedding_model.embed_text("Hello world"),
                                                 "text": "Hello World",
                                                 "id": "1"
                                             }
                                         ])

        self.vec_db = LanceDB(connection=table, embedding=self.embedding_model.embedding_model)

    def drop_table(self, table_name):
        self.db.drop_table(table_name)

    def add_text(self, text):
        self.vec_db.add_texts([text])

    def add_text_list(self, text_list):
        self.vec_db.add_texts(text_list)

    def add_document(self, doc):
        self.vec_db.add_documents([doc])

    def add_document_list(self, doc_list):
        self.vec_db.add_documents(doc_list)

    def similarity_search(self, query, k=3):
        docs = self.vec_db.similarity_search(query, k=k)

        text_list = [doc.page_content for doc in docs]

        return text_list




