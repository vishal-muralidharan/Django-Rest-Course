from rest_framework import generics
from rest_framework.response import Response

from products.models import Product
from products.serialisers import ProductSerializer

from . import client


class SearchListOldView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_queryset(self, *args, **kwargs):
        qs = super().get_queryset(*args, **kwargs)
        q = self.request.GET.get('q')
        results = Product.objects.none()
        if q is not None:
            user = None
            if hasattr(self.request, 'user') and self.request.user.is_authenticated:
                user = self.request.user
            results = qs.search(q, user=user)
        return results


class SearchListView(generics.GenericAPIView):
    def get(self, request, *args, **kwargs):
        q = request.GET.get('q')
        results = {}
        if q:
            # allow passing multiple tags as repeated query params: ?tags=foo&tags=bar
            tags = request.GET.getlist('tags')
            if tags:
                results = client.perform_search(q, tags=tags)
            else:
                results = client.perform_search(q)
        return Response(results)
