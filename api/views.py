from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.db.models import Q
import json
import xlwt
from .models import Product, Patient, PatientPurchaseHistory, Sale, SaleItem, Appointment, Purchase

@csrf_exempt
@require_http_methods(["GET"])
def dashboard_view(request):
    """Vista del dashboard con datos completos"""
    from django.db.models import Sum, Count
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    start_of_month = today.replace(day=1)
    
    # Calcular ventas diarias y mensuales
    daily_sales = Sale.objects.filter(created_at__date=today).aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    monthly_sales = Sale.objects.filter(created_at__date__gte=start_of_month).aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    # Citas de hoy
    today_appointments = Appointment.objects.filter(date=today).count()
    
    # Productos en inventario
    total_inventory = Product.objects.aggregate(total=Sum('stock'))['total'] or 0
    
    # Productos de consignación
    consignments_count = Product.objects.filter(type='consignacion').count()
    
    # Ventas recientes (últimas 5)
    recent_sales = Sale.objects.select_related('patient')[:5]
    recent_sales_data = []
    for sale in recent_sales:
        recent_sales_data.append({
            'id': sale.id,
            'customer': sale.patient.name,
            'amount': float(sale.total_amount),
            'date': sale.created_at.strftime('%Y-%m-%d'),
            'status': sale.get_status_display()
        })
    
    # Citas recientes (próximas 5)
    recent_appointments = Appointment.objects.select_related('patient').filter(
        date__gte=today
    ).order_by('date', 'time')[:5]
    recent_appointments_data = []
    for apt in recent_appointments:
        recent_appointments_data.append({
            'id': apt.id,
            'patient': apt.patient.name,
            'time': apt.time.strftime('%H:%M'),
            'date': apt.date.strftime('%Y-%m-%d'),
            'type': apt.get_type_display(),
            'status': apt.get_status_display()
        })
    
    # Resumen de inventario por categoría
    inventory_summary = Product.objects.values('category').annotate(
        count=Count('id'),
        total_stock=Sum('stock')
    )
    inventory_by_category = []
    for item in inventory_summary:
        category_display = dict(Product.CATEGORY_CHOICES).get(item['category'], item['category'])
        inventory_by_category.append({
            'category': category_display,
            'count': item['count'],
            'total_stock': item['total_stock'] or 0
        })
    
    # Ventas por categoría (último mes)
    sales_by_category = []
    for category_code, category_name in Product.CATEGORY_CHOICES:
        sales_count = SaleItem.objects.filter(
            sale__created_at__date__gte=start_of_month,
            product__category=category_code
        ).aggregate(
            total_quantity=Sum('quantity'),
            total_amount=Sum('total_price')
        )
        
        if sales_count['total_quantity']:
            sales_by_category.append({
                'category': category_name,
                'quantity': sales_count['total_quantity'],
                'amount': float(sales_count['total_amount'] or 0)
            })
    
    # Productos con stock bajo/crítico
    low_stock_products = Product.objects.filter(
        status__in=['bajo', 'critico']
    ).order_by('stock')[:10]
    low_stock_data = []
    for product in low_stock_products:
        low_stock_data.append({
            'id': product.id,
            'name': product.name,
            'code': product.code,
            'stock': product.stock,
            'status': product.get_status_display(),
            'category': product.get_category_display()
        })
    
    data = {
        'dailySales': float(daily_sales),
        'monthlySales': float(monthly_sales),
        'appointments': today_appointments,
        'inventory': total_inventory,
        'consignments': consignments_count,
        'recentSales': recent_sales_data,
        'recentAppointments': recent_appointments_data,
        'inventoryByCategory': inventory_by_category,
        'salesByCategory': sales_by_category,
        'lowStockProducts': low_stock_data,
        'stats': {
            'totalProducts': Product.objects.count(),
            'totalPatients': Patient.objects.count(),
            'pendingAppointments': Appointment.objects.filter(status='pendiente').count(),
            'activeSales': Sale.objects.filter(status__in=['nuevo', 'en_proceso']).count()
        }
    }
    
    return JsonResponse(data)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def products_view(request):
    """Vista para gestión de productos"""
    if request.method == 'GET':
        # Get query parameters for filtering and pagination
        search = request.GET.get('search', '')
        category = request.GET.get('category', '')
        supplier = request.GET.get('supplier', '')
        product_type = request.GET.get('type', '')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))

        # Build query
        products = Product.objects.all()

        if search:
            products = products.filter(
                Q(name__icontains=search) | 
                Q(category__icontains=search) | 
                Q(supplier__icontains=search) |
                Q(code__icontains=search)
            )

        if category:
            products = products.filter(category=category)

        if supplier:
            products = products.filter(supplier__icontains=supplier)

        if product_type:
            products = products.filter(type=product_type)

        # Paginate
        paginator = Paginator(products, page_size)
        page_obj = paginator.get_page(page)

        # Serialize products
        products_data = []
        for product in page_obj:
            products_data.append({
                'id': product.id,
                'code': product.code,
                'name': product.name,
                'category': product.get_category_display(),
                'supplier': product.supplier,
                'stock': product.stock,
                'price': float(product.price),
                'status': product.get_status_display(),
                'type': product.get_type_display(),
                'created_at': product.created_at.isoformat(),
            })

        # Get unique suppliers and categories for filters
        suppliers = list(Product.objects.values_list('supplier', flat=True).distinct())
        categories = [choice[0] for choice in Product.CATEGORY_CHOICES]
        types = [choice[0] for choice in Product.TYPE_CHOICES]

        return JsonResponse({
            'products': products_data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_items': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            },
            'filters': {
                'suppliers': suppliers,
                'categories': categories,
                'types': types,
            }
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            product = Product.objects.create(
                name=data['name'],
                category=data['category'],
                supplier=data['supplier'],
                stock=int(data['stock']),
                price=float(data['price']),
                type=data.get('type', 'propio')
            )
            return JsonResponse({
                'success': True, 
                'message': 'Producto creado exitosamente',
                'product': {
                    'id': product.id,
                    'code': product.code,
                    'name': product.name,
                    'category': product.get_category_display(),
                    'supplier': product.supplier,
                    'stock': product.stock,
                    'price': float(product.price),
                    'status': product.get_status_display(),
                    'type': product.get_type_display(),
                }
            })
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET"])
def export_products_view(request):
    """Export products to Excel"""
    response = HttpResponse(content_type='application/ms-excel')
    response['Content-Disposition'] = 'attachment; filename="productos.xls"'

    wb = xlwt.Workbook(encoding='utf-8')
    ws = wb.add_sheet('Productos')

    # Header row
    headers = ['Código', 'Nombre', 'Categoría', 'Proveedor', 'Stock', 'Precio', 'Estado', 'Tipo', 'Fecha Creación']
    for col, header in enumerate(headers):
        ws.write(0, col, header)

    # Data rows
    products = Product.objects.all()
    for row, product in enumerate(products, 1):
        ws.write(row, 0, product.code)
        ws.write(row, 1, product.name)
        ws.write(row, 2, product.get_category_display())
        ws.write(row, 3, product.supplier)
        ws.write(row, 4, product.stock)
        ws.write(row, 5, float(product.price))
        ws.write(row, 6, product.get_status_display())
        ws.write(row, 7, product.get_type_display())
        ws.write(row, 8, product.created_at.strftime('%Y-%m-%d %H:%M'))

    wb.save(response)
    return response

@csrf_exempt
@require_http_methods(["GET", "POST"])
def patients_view(request):
    """Vista para gestión de pacientes"""
    if request.method == 'GET':
        # Get query parameters
        search = request.GET.get('search', '')
        status = request.GET.get('status', '')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))

        # Build query
        patients = Patient.objects.all()

        if search:
            patients = patients.filter(
                Q(name__icontains=search) | 
                Q(email__icontains=search) | 
                Q(phone__icontains=search)
            )

        if status:
            patients = patients.filter(status=status)

        # Paginate
        paginator = Paginator(patients, page_size)
        page_obj = paginator.get_page(page)

        # Serialize patients with purchase history
        patients_data = []
        for patient in page_obj:
            # Get purchase history
            purchase_history = PatientPurchaseHistory.objects.filter(patient=patient)[:5]
            history_data = []
            for purchase in purchase_history:
                history_data.append({
                    'product': purchase.product.name,
                    'quantity': purchase.quantity,
                    'price': float(purchase.price),
                    'date': purchase.date.isoformat(),
                })

            patients_data.append({
                'id': patient.id,
                'name': patient.name,
                'email': patient.email,
                'phone': patient.phone,
                'status': patient.get_status_display(),
                'address': patient.address,
                'notes': patient.notes,
                'created_at': patient.created_at.isoformat(),
                'purchase_history': history_data,
                'total_purchases': purchase_history.count(),
            })

        return JsonResponse({
            'patients': patients_data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'total_items': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            },
            'filters': {
                'statuses': [choice[0] for choice in Patient.STATUS_CHOICES],
            }
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            patient = Patient.objects.create(
                name=data['name'],
                email=data['email'],
                phone=data['phone'],
                status=data.get('status', 'activo'),
                address=data.get('address', ''),
                notes=data.get('notes', ''),
            )
            return JsonResponse({
                'success': True, 
                'message': 'Paciente registrado exitosamente',
                'patient': {
                    'id': patient.id,
                    'name': patient.name,
                    'email': patient.email,
                    'phone': patient.phone,
                    'status': patient.get_status_display(),
                    'address': patient.address,
                    'notes': patient.notes,
                }
            })
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET"])
def export_patients_view(request):
    """Export patients to Excel"""
    response = HttpResponse(content_type='application/ms-excel')
    response['Content-Disposition'] = 'attachment; filename="pacientes.xls"'

    wb = xlwt.Workbook(encoding='utf-8')
    ws = wb.add_sheet('Pacientes')

    # Header row
    headers = ['Nombre', 'Email', 'Teléfono', 'Estado', 'Dirección', 'Notas', 'Total Compras', 'Fecha Registro']
    for col, header in enumerate(headers):
        ws.write(0, col, header)

    # Data rows
    patients = Patient.objects.all()
    for row, patient in enumerate(patients, 1):
        total_purchases = PatientPurchaseHistory.objects.filter(patient=patient).count()
        ws.write(row, 0, patient.name)
        ws.write(row, 1, patient.email)
        ws.write(row, 2, patient.phone)
        ws.write(row, 3, patient.get_status_display())
        ws.write(row, 4, patient.address or '')
        ws.write(row, 5, patient.notes or '')
        ws.write(row, 6, total_purchases)
        ws.write(row, 7, patient.created_at.strftime('%Y-%m-%d %H:%M'))

    wb.save(response)
    return response

@csrf_exempt
@require_http_methods(["GET", "POST"])
def appointments_view(request):
    """Vista para gestión de citas"""
    if request.method == 'GET':
        appointments = [
            {'id': 1, 'patient': 'Ana Martín', 'date': '2024-01-16', 'time': '10:00', 'type': 'Examen Visual', 'status': 'Confirmada'},
            {'id': 2, 'patient': 'Luis Pérez', 'date': '2024-01-16', 'time': '11:30', 'type': 'Control', 'status': 'Pendiente'},
        ]
        return JsonResponse({'appointments': appointments})

    elif request.method == 'POST':
        data = json.loads(request.body)
        return JsonResponse({'success': True, 'message': 'Cita agendada exitosamente'})

@csrf_exempt
@require_http_methods(["GET", "POST"])
def sales_view(request):
    """Vista para gestión de ventas"""
    if request.method == 'GET':
        sales = [
            {'id': 1, 'customer': 'María González', 'amount': 350, 'date': '2024-01-15', 'status': 'Entregado'},
            {'id': 2, 'customer': 'Carlos López', 'amount': 520, 'date': '2024-01-15', 'status': 'En Proceso'},
        ]
        return JsonResponse({'sales': sales})

    elif request.method == 'POST':
        data = json.loads(request.body)
        return JsonResponse({'success': True, 'message': 'Venta registrada exitosamente'})

@csrf_exempt
@require_http_methods(["GET", "POST"])
def purchases_view(request):
    """Vista para gestión de compras"""
    if request.method == 'GET':
        purchases = [
            {'id': 1, 'supplier': 'Proveedor A', 'amount': 1200, 'date': '2024-01-10', 'status': 'Recibido'},
            {'id': 2, 'supplier': 'Proveedor B', 'amount': 800, 'date': '2024-01-12', 'status': 'Pendiente'},
        ]
        return JsonResponse({'purchases': purchases})

    elif request.method == 'POST':
        data = json.loads(request.body)
        return JsonResponse({'success': True, 'message': 'Compra registrada exitosamente'})

@csrf_exempt
@require_http_methods(["GET", "POST"])
def consignments_view(request):
    """Vista para gestión de consignaciones"""
    if request.method == 'GET':
        consignments = [
            {'id': 1, 'supplier': 'Telko', 'product': 'Lentes Premium', 'quantity': 10, 'status': 'Activa'},
            {'id': 2, 'supplier': 'Telko', 'product': 'Armazones Designer', 'quantity': 5, 'status': 'Vendida'},
        ]
        return JsonResponse({'consignments': consignments})

    elif request.method == 'POST':
        data = json.loads(request.body)
        return JsonResponse({'success': True, 'message': 'Consignación registrada exitosamente'})

@csrf_exempt
@require_http_methods(["GET"])
def export_purchases_view(request):
    """Export purchases to Excel"""
    response = HttpResponse(content_type='application/ms-excel')
    response['Content-Disposition'] = 'attachment; filename="compras.xls"'

    wb = xlwt.Workbook(encoding='utf-8')
    ws = wb.add_sheet('Compras')

    # Header row
    headers = ['Número', 'Proveedor', 'Valor Total', 'Estado', 'Notas', 'Fecha Creación']
    for col, header in enumerate(headers):
        ws.write(0, col, header)

    # Data rows
    purchases = Purchase.objects.all()
    for row, purchase in enumerate(purchases, 1):
        ws.write(row, 0, purchase.purchase_number)
        ws.write(row, 1, purchase.supplier)
        ws.write(row, 2, float(purchase.total_amount))
        ws.write(row, 3, purchase.get_status_display())
        ws.write(row, 4, purchase.notes or '')
        ws.write(row, 5, purchase.created_at.strftime('%Y-%m-%d %H:%M'))

    wb.save(response)
    return response