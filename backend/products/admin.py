from django.contrib import admin
from django.utils.html import format_html

from .models import Product
from .forms import ProductForm


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
	form = ProductForm
	list_display = ('title', 'body', 'price')

	def body(self, obj):
		return obj.content
	body.short_description = 'body'