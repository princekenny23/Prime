from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'created_at')
    list_filter = ('tenant', 'created_at')
    search_fields = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'tenant', 'category', 'price', 'stock', 'is_active', 'created_at')
    list_filter = ('tenant', 'category', 'is_active', 'created_at')
    search_fields = ('name', 'sku', 'barcode')
    readonly_fields = ('created_at', 'updated_at')

