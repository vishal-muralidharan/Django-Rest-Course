from rest_framework.routers import DefaultRouter

from products.viewssets import ProductViewSet

router = DefaultRouter()
router.register('products-abc', ProductViewSet, basename='products')
print(router.urls)
urlpatterns = router.urls
