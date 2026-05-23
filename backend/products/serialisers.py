from rest_framework import serializers
from rest_framework.reverse import reverse

from api.serialisers import UserPublicSerializer, UserProductInlineSerializer
from .models import Product
from .validators import validate_title, validate_title_no_hello, unique_product_title

class ProductSerializer(serializers.ModelSerializer):
    owner = UserPublicSerializer(source='user', read_only=True)
    related_products = UserProductInlineSerializer(
        source='user.product_set.all',
        many=True,
        read_only=True,
    )
    my_discount = serializers.SerializerMethodField(read_only=True)
    edit_url = serializers.SerializerMethodField(read_only=True)
    url = serializers.HyperlinkedIdentityField(
        view_name='product-detail',
        lookup_field='pk'
    )
    name = serializers.CharField(source='title', read_only=True)
    title = serializers.CharField(
        validators=[validate_title_no_hello, unique_product_title]
    )
    body = serializers.CharField(source='content', allow_blank=True, required=False)
    path = serializers.CharField(read_only=True)
    urlp = serializers.CharField(read_only=True)
    # Accept legacy 'content' key on input as well (maps to the same model field)
    content = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = [
            'url',
            'edit_url',
            'pk',
            'owner',
            'related_products',
            'title',
            'name',
            'body',
            'content',
            'path',
            'urlp',
            'price',
            'public',
            'sale_price',
            'my_discount'
        ]

    def create(self, validated_data):
        return super().create(validated_data)

    def get_edit_url(self, obj):
        request = self.context.get("request")
        if request is None:
            return None
        return reverse("product-update", kwargs={"pk": obj.pk}, request=request)

    def get_my_discount(self, obj):
        if not hasattr(obj, 'id'):
            return None
        if not isinstance(obj, Product):
            return None
        return obj.get_discount()