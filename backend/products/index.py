from algoliasearch_django.decorators import register
from algoliasearch_django import AlgoliaIndex

from .models import Product


@register(Product)
class ProductIndex(AlgoliaIndex):
    should_index = 'is_public'
    fields = [
        'title',
        'content',
        'price',
        'user',
        'public',
        'get_tags_list'
    ]

    settings = {
        'searchableAttributes': ['title', 'content'],
        'attributesForFaceting': ['public', 'user', 'get_tags_list'],
    }
    