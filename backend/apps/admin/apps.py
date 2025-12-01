from django.apps import AppConfig


class AdminConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.admin'
    label = 'platform_admin'  # Change label to avoid conflict with Django's admin

