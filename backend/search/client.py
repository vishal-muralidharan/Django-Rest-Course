from algoliasearch_django import algolia_engine
from products.models import Product


def get_client():
    return algolia_engine.client


def get_index(index_name=None):
    client = get_client()
    if index_name is None:
        try:
            adapter = algolia_engine.get_adapter(Product)
            index_name = adapter.index_name
        except Exception:
            index_name = Product.__name__
    index = client.init_index(index_name)
    return index


def perform_search(query, **kwargs):
    index = get_index()
    params = {}
    tags = ""
    if "tags" in kwargs:
        tags = kwargs.pop("tags") or []
        if len(tags) != 0:
            params['tagFilters'] = tags
    results = index.search(query, params)
    return results
