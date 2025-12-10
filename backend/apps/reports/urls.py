from django.urls import path
from .views import (
    sales_report, products_report, customers_report, profit_loss_report, stock_movement_report,
    daily_sales_report, top_products_report, cash_summary_report, shift_summary_report
)

urlpatterns = [
    path('reports/sales/', sales_report, name='sales-report'),
    path('reports/products/', products_report, name='products-report'),
    path('reports/customers/', customers_report, name='customers-report'),
    path('reports/profit-loss/', profit_loss_report, name='profit-loss-report'),
    path('reports/stock-movement/', stock_movement_report, name='stock-movement-report'),
    # New reporting endpoints
    path('reports/daily-sales/', daily_sales_report, name='daily-sales-report'),
    path('reports/top-products/', top_products_report, name='top-products-report'),
    path('reports/cash-summary/', cash_summary_report, name='cash-summary-report'),
    path('reports/shift-summary/', shift_summary_report, name='shift-summary-report'),
]

