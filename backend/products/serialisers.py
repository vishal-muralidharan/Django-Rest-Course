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
            'content',
            'price',
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