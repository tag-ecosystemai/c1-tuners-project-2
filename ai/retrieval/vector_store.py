import chromadb


class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path="data/chroma"
        )

        self.collection = self.client.get_or_create_collection(
            name="study_materials"
        )

    def add(self, ids, documents, embeddings, metadatas):
        self.collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )

    def search(self, query_embedding, top_k=3, course_id=None):
        query_kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": top_k
        }

        if course_id:
            query_kwargs["where"] = {
                "course_id": course_id
            }

        return self.collection.query(**query_kwargs)