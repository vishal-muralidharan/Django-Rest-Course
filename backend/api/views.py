from django.shortcuts import render
from django.http import JsonResponse

def api_home(request, **args):
    return JsonResponse({'message': 'Django API Response!'})

