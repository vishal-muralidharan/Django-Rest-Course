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
    tags = kwargs.pop("tags", None)
    if tags:
        params['tagFilters'] = tags

    index_filters = [f"{key}:{str(value).lower() if isinstance(value, bool) else value}" for key, value in kwargs.items()]
    if index_filters:
        params['facetFilters'] = index_filters

    print(params)
    results = index.search(query, params)
    return results
