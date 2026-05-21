from django.shortcuts import render
from django.http import JsonResponse
import json

def api_home(request, **args):
    print(request.GET) #URL Query Parameters
    print(request.POST)

    body = request.body
    data = {}

    try:
        data = json.loads(body)
    except:
        pass

    print(data)

    data['params'] = dict(request.GET)
    data['headers'] = dict(request.headers)
    data['content_type'] = request.content_type

    return JsonResponse(data)

