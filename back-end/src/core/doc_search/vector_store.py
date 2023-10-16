"""Vector store."""
from langchain.vectorstores import LanceDB

import lancedb


class VectorStoreLanceDB:
    """Vector store lance DB."""
    def __init__(self, db_path, table_name, mode, embedding_model):
        self.db = lancedb.connect(db_path)
        self.embedding_model = embedding_model

        print(db_path)

        hello_world_vector = self.embedding_model.embed_text("Hello world")

        if mode == "read":
            table = self.db.open_table(table_name)
        elif mode == "overwrite":
            # pylint: disable=unexpected-keyword-arg
            table = self.db.create_table(name=table_name,
                                         data=[
                                             {
                                                 "vector": hello_world_vector,
                                                 "text": "Hello World",
                                                 "id": "1"
                                             }
                                         ],
                                         mode="overwrite")
        else:
            table = self.db.create_table(name=table_name,
                                         data=[
                                             {
                                                 "vector": hello_world_vector,
                                                 "text": "Hello World",
                                                 "id": "1"
                                             }
                                         ])

        # pylint: disable=not-callable
        self.vec_db = LanceDB(
            connection=table, embedding=self.embedding_model.embedding_model)

    def drop_table(self, table_name):
        """Drop table."""
        self.db.drop_table(table_name)

    def add_text(self, text):
        """Add text."""
        self.vec_db.add_texts([text])

    def add_text_list(self, text_list):
        """Add text list."""
        self.vec_db.add_texts(text_list)

    def add_document(self, doc):
        """Add document."""
        self.vec_db.add_documents([doc])

    def add_document_list(self, doc_list):
        """Add document list."""
        self.vec_db.add_documents(doc_list)

    def similarity_search(self, query, k=3):
        """Similarity search."""
        docs = self.vec_db.similarity_search(query, k=k)
        text_list = [doc.page_content for doc in docs]
        return text_list
