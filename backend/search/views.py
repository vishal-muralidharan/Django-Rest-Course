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
        user = None
        if request.user.is_authenticated:
            user = request.user.username
        q = request.GET.get('q')
        public = str(request.GET.get('public')) != '0'
        tag = request.GET.get('tag') or None
        if not q:
            return Response('', status=400)
        results = client.perform_search(q, tags=tag, user=user, public=public)
        return Response(results)
