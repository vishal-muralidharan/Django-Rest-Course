from django.forms.models import model_to_dict 
from rest_framework.decorators import api_view
from rest_framework.response import Response
 
from products.models import Product
from products.serialisers import ProductSerializer

@api_view(["GET"])
def api_home(request, **args):
    instance = Product.objects.all().order_by("?").first()

    data = {}

    if instance:
        # data = model_to_dict(model_data, fields=['id', 'title', 'price', 'sale_price'])
        data = ProductSerializer(instance).data
    return Response(data)
        # json_data_str = json.dumps(data )

    # return HttpResponse(data, headers={'content-type': 'application/json'})

