from django.forms.models import model_to_dict 
from rest_framework.decorators import api_view
from rest_framework.response import Response
 
from products.models import Product
from products.serialisers import ProductSerializer

@api_view(["POST"])
def api_home(request, **args):
    data = request.data

    serializer = ProductSerializer(data=request.data)
    if serializer.is_valid(raise_exception=True):
        # instance = serializer.save()
        print(serializer.data)
        return Response(serializer.data)
        # json_data_str = json.dumps(data )
    return Response({'invalid': 'Data not good'}, status=400)

    # return HttpResponse(data, headers={'content-type': 'application/json'})

