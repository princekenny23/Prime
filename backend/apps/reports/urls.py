from django.urls import path
from .views import sales_report, products_report, customers_report, profit_loss_report, stock_movement_report

urlpatterns = [
    path('reports/sales/', sales_report, name='sales-report'),
    path('reports/products/', products_report, name='products-report'),
    path('reports/customers/', customers_report, name='customers-report'),
    path('reports/profit-loss/', profit_loss_report, name='profit-loss-report'),
    path('reports/stock-movement/', stock_movement_report, name='stock-movement-report'),
]

