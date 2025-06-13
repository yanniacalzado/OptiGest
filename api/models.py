
from django.db import models
from django.utils import timezone
import uuid

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('armazones', 'Armazones'),
        ('lentes', 'Lentes'),
        ('lentes_contacto', 'Lentes de contacto'),
        ('accesorios', 'Accesorios'),
    ]
    
    STATUS_CHOICES = [
        ('normal', 'Normal'),
        ('bajo', 'Bajo'),
        ('critico', 'Crítico'),
    ]
    
    TYPE_CHOICES = [
        ('propio', 'Propio'),
        ('consignacion', 'Consignación'),
    ]
    
    code = models.CharField(max_length=20, unique=True, editable=False)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    supplier = models.CharField(max_length=100)
    stock = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='normal')
    type = models.CharField(max_length=15, choices=TYPE_CHOICES, default='propio')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Generate unique product code
            self.code = f"PROD-{str(uuid.uuid4())[:8].upper()}"
        
        # Auto-update status based on stock
        if self.stock == 0:
            self.status = 'critico'
        elif self.stock <= 5:
            self.status = 'bajo'
        else:
            self.status = 'normal'
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    class Meta:
        ordering = ['-created_at']

class Patient(models.Model):
    STATUS_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]
    
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='activo')
    address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class PatientPurchaseHistory(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='purchase_history')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.patient.name} - {self.product.name}"
    
    class Meta:
        ordering = ['-date']

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('cancelada', 'Cancelada'),
    ]
    
    TYPE_CHOICES = [
        ('examen_visual', 'Examen Visual'),
        ('control', 'Control'),
        ('entrega', 'Entrega'),
        ('consulta', 'Consulta'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField()
    time = models.TimeField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    doctor = models.CharField(max_length=100, default='Dr. Principal')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pendiente')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.patient.name} - {self.date} {self.time}"
    
    class Meta:
        ordering = ['date', 'time']

class Sale(models.Model):
    STATUS_CHOICES = [
        ('nuevo', 'Nuevo'),
        ('en_proceso', 'En Proceso'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]
    
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='sales')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='nuevo')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            import uuid
            self.order_number = f"ORD-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.order_number} - {self.patient.name}"
    
    class Meta:
        ordering = ['-created_at']

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        
        # Update sale total
        sale_total = sum(item.total_price for item in self.sale.items.all())
        self.sale.total_amount = sale_total
        self.sale.save()
    
    def __str__(self):
        return f"{self.sale.order_number} - {self.product.name}"

class Purchase(models.Model):
    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('procesando', 'Procesando'),
        ('recibido', 'Recibido'),
        ('cancelado', 'Cancelado'),
    ]
    
    purchase_number = models.CharField(max_length=20, unique=True, editable=False)
    supplier = models.CharField(max_length=100)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pendiente')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.purchase_number:
            import uuid
            self.purchase_number = f"PUR-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.purchase_number} - {self.supplier}"
    
    class Meta:
        ordering = ['-created_at']

class PurchaseItem(models.Model):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        self.total_cost = self.quantity * self.unit_cost
        super().save(*args, **kwargs)
        
        # Update purchase total
        purchase_total = sum(item.total_cost for item in self.purchase.items.all())
        self.purchase.total_amount = purchase_total
        self.purchase.save()
    
    def __str__(self):
        return f"{self.purchase.purchase_number} - {self.product.name}"
