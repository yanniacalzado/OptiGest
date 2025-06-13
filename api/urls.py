
from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('products/', views.products_view, name='products'),
    path('products/export/', views.export_products_view, name='export_products'),
    path('patients/', views.patients_view, name='patients'),
    path('patients/export/', views.export_patients_view, name='export_patients'),
    path('appointments/', views.appointments_view, name='appointments'),
    path('sales/', views.sales_view, name='sales'),
    path('purchases/', views.purchases_view, name='purchases'),
    path('purchases/export/', views.export_purchases_view, name='export_purchases'),
    path('consignments/', views.consignments_view, name='consignments'),
]
