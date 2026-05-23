from django.shortcuts import get_object_or_404
from rest_framework import generics, mixins, permissions, authentication
from rest_framework_simplejwt.authentication import JWTAuthentication

from products.models import Product
from products.serialisers import ProductSerializer
from api.authentication import TokenAuthentication
from api.mixins import StaffEditorPermissionMixin, UserQuerySetMixin
from api.permissions import IsStaffEditorPermission
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

class ProductMixinView(
    UserQuerySetMixin,
    StaffEditorPermissionMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    generics.GenericAPIView
):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'pk'

    def get(self, request, *args, **kwargs):
        print(args, kwargs)
        pk = kwargs.get("pk")
        if pk is not None:
            return self.retrieve(request, *args, **kwargs)
        
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
 
    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)

product_mixin_view = ProductMixinView.as_view()


class ProductListCreateAPIView(
    UserQuerySetMixin,
    StaffEditorPermissionMixin,
    generics.ListCreateAPIView
):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    # allow session auth, DRF token auth (custom) and JWT auth
    authentication_classes = [authentication.SessionAuthentication, JWTAuthentication]

    def perform_create(self, serializer):
        # serializer.save(user=self.request.user)
        print(serializer.validated_data)

        title = serializer.validated_data.get('title')
        body = serializer.validated_data.get('body') or None

        if body is None:
            body = title

        serializer.save(user=self.request.user, content=body)

product_list_create_view = ProductListCreateAPIView.as_view()

class ProductDetailAPIView(
    UserQuerySetMixin,
    StaffEditorPermissionMixin,
    generics.RetrieveAPIView
):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

product_detail_view = ProductDetailAPIView.as_view()

class ProductUpdateAPIView(
    UserQuerySetMixin,
    StaffEditorPermissionMixin,
    generics.UpdateAPIView
):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'pk'

    def perform_update(self, serializer):
        instance = serializer.save()

        if not instance.content:
            instance.content = instance.title

product_update_view = ProductUpdateAPIView.as_view()

class ProductDeleteAPIView(
    UserQuerySetMixin,
    StaffEditorPermissionMixin,
    generics.DestroyAPIView
):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'pk'

    def perform_destroy(self, instance):
        super().perform_destroy(instance)

product_delete_view = ProductDeleteAPIView.as_view()

class ProductListAPIView(
    UserQuerySetMixin,
    StaffEditorPermissionMixin,
    generics.RetrieveAPIView
):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

product_list_view = ProductListAPIView.as_view()

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAdminUser, IsStaffEditorPermission])
def product_alt_view(request, pk=None, *args):
    method = request.method

    if method == "GET":
        if pk is not None:
            obj = get_object_or_404(Product, pk=pk)
            data = ProductSerializer(obj, many=False).data
            return Response(data)
        else:
            qs = Product.objects.all()
            data = ProductSerializer(qs, many=True).data
            return Response(data)
    elif method == "POST": 
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            title = serializer.validated_data.get('title')
            body = serializer.validated_data.get('body') or None

            if body is None:
                body = title

            serializer.save(content=body)
            return Response(serializer.data)
        return Response({'invalid': 'Data not good'}, status=400)