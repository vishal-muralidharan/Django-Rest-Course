from algoliasearch_django.decorators import register
from algoliasearch_django import AlgoliaIndex

from .models import Product


@register(Product)
class ProductIndex(AlgoliaIndex):
    # fields to index (ensure these exist on the model)
    fields = ('title', 'content', 'price', 'public', 'user')
    # attributes to make searchable/filtered in Algolia
    settings = {
        'searchableAttributes': ['title', 'content'],
        'attributesForFaceting': ['public', 'user']
    }
*** End Patch