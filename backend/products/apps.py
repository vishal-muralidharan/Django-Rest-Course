from django.apps import AppConfig


class ProductsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'products'

    def ready(self):
        # ensure algolia registrations are imported when the app is ready
        try:
            import products.algolia  # noqa: F401
        except Exception:
            pass
