from django.forms.models import model_to_dict 
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
 
from products.models import Product
from products.serialisers import ProductSerializer

@api_view(["POST"])
def api_home(request, **args):
    data = request.data
    return JsonResponse(data)
        # json_data_str = json.dumps(data )

    # return HttpResponse(data, headers={'content-type': 'application/json'})

