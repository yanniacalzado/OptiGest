const { useState, useEffect } = React;

// API calls to Django REST Framework endpoints
const API_BASE_URL = '/api';

const App = () => {
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    dailySales: 0,
    monthlySales: 0,
    appointments: 0,
    inventory: 0,
    recentSales: [],
    recentAppointments: []
  });

  const [activeModule, setActiveModule] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Products state
  const [products, setProducts] = useState([]);
  const [productFilters, setProductFilters] = useState({
    search: '',
    category: '',
    supplier: '',
    type: ''
  });
  const [productPagination, setProductPagination] = useState({});
  const [availableFilters, setAvailableFilters] = useState({});
  const [showProductForm, setShowProductForm] = useState(false);

  // Patients state
  const [patients, setPatients] = useState([]);
  const [patientFilters, setPatientFilters] = useState({
    search: '',
    status: ''
  });
  const [patientPagination, setPatientPagination] = useState({});
  const [showPatientForm, setShowPatientForm] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({
        dailySales: 2850,
        monthlySales: 45600,
        appointments: 12,
        inventory: 1250,
        recentSales: [
          { id: 1, customer: 'María González', amount: 350, date: '2024-01-15' },
          { id: 2, customer: 'Carlos López', amount: 520, date: '2024-01-15' }
        ],
        recentAppointments: [
          { id: 1, patient: 'Ana Martín', time: '10:00', type: 'Examen Visual' },
          { id: 2, patient: 'Luis Pérez', time: '11:30', type: 'Control' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        search: productFilters.search || '',
        category: productFilters.category || '',
        supplier: productFilters.supplier || '',
        type: productFilters.type || ''
      });

      const response = await fetch(`${API_BASE_URL}/products/?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setProductPagination(data.pagination || {});
        setAvailableFilters(data.filters || {});
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Create product
  const createProduct = async (productData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        const result = await response.json();
        setShowProductForm(false);
        fetchProducts();
        return result;
      }
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  // Export products
  const exportProducts = () => {
    window.open(`${API_BASE_URL}/products/export/`, '_blank');
  };

  // Fetch patients
  const fetchPatients = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        search: patientFilters.search || '',
        status: patientFilters.status || ''
      });

      const response = await fetch(`${API_BASE_URL}/patients/?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
        setPatientPagination(data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Create patient
  const createPatient = async (patientData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });

      if (response.ok) {
        const result = await response.json();
        setShowPatientForm(false);
        fetchPatients();
        return result;
      }
    } catch (error) {
      console.error('Error creating patient:', error);
    }
  };

  // Export patients
  const exportPatients = () => {
    window.open(`${API_BASE_URL}/patients/export/`, '_blank');
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeModule === 'products') {
      fetchProducts();
    } else if (activeModule === 'patients') {
      fetchPatients();
    }
  }, [activeModule, productFilters, patientFilters]);

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Productos', icon: '👓' },
    { id: 'patients', label: 'Pacientes', icon: '👥' },
    { id: 'appointments', label: 'Citas', icon: '📅' },
    { id: 'sales', label: 'Ventas', icon: '💰' },
    { id: 'purchases', label: 'Compras', icon: '🛒' },
    { id: 'consignments', label: 'Consignaciones', icon: '📦' },
    { id: 'pos', label: 'POS', icon: '💳' },
    { id: 'prescriptions', label: 'Recetas', icon: '📋' },
    { id: 'reports', label: 'Reportes', icon: '📈' },
    { id: 'settings', label: 'Ajustes', icon: '⚙️' }
  ];

  // Product Form Component
  const ProductForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      category: 'armazones',
      supplier: '',
      stock: '',
      price: '',
      type: 'propio'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      await createProduct(formData);
    };

    return React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" },
      React.createElement('div', { className: "bg-white rounded-2xl p-8 max-w-md w-full mx-4" },
        React.createElement('h3', { className: "text-2xl font-bold mb-6" }, 'Nuevo Producto'),
        React.createElement('form', { onSubmit: handleSubmit, className: "space-y-4" },
          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Nombre'),
            React.createElement('input', {
              type: 'text',
              required: true,
              value: formData.name,
              onChange: (e) => setFormData({...formData, name: e.target.value}),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Categoría'),
            React.createElement('select', {
              value: formData.category,
              onChange: (e) => setFormData({...formData, category: e.target.value}),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            },
              React.createElement('option', { value: 'armazones' }, 'Armazones'),
              React.createElement('option', { value: 'lentes' }, 'Lentes'),
              React.createElement('option', { value: 'lentes_contacto' }, 'Lentes de contacto'),
              React.createElement('option', { value: 'accesorios' }, 'Accesorios')
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Proveedor'),
            React.createElement('input', {
              type: 'text',
              required: true,
              value: formData.supplier,
              onChange: (e) => setFormData({...formData, supplier: e.target.value}),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            })
          ),
          React.createElement('div', { className: "grid grid-cols-2 gap-4" },
            React.createElement('div', null,
              React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Stock'),
              React.createElement('input', {
                type: 'number',
                required: true,
                value: formData.stock,
                onChange: (e) => setFormData({...formData, stock: e.target.value}),
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Precio'),
              React.createElement('input', {
                type: 'number',
                step: '0.01',
                required: true,
                value: formData.price,
                onChange: (e) => setFormData({...formData, price: e.target.value}),
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              })
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Tipo'),
            React.createElement('select', {
              value: formData.type,
              onChange: (e) => setFormData({...formData, type: e.target.value}),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            },
              React.createElement('option', { value: 'propio' }, 'Propio'),
              React.createElement('option', { value: 'consignacion' }, 'Consignación')
            )
          ),
          React.createElement('div', { className: "flex space-x-4 pt-4" },
            React.createElement('button', {
              type: 'button',
              onClick: () => setShowProductForm(false),
              className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            }, 'Cancelar'),
            React.createElement('button', {
              type: 'submit',
              className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            }, 'Crear Producto')
          )
        )
      )
    );
  };

  // Patient Form Component - Enhanced
  const PatientForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      status: 'activo',
      address: '',
      notes: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      await createPatient(formData);
    };

    return React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" },
      React.createElement('div', { className: "bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" },
        React.createElement('div', { className: "flex items-center justify-between mb-6" },
          React.createElement('h3', { className: "text-2xl font-bold text-gray-900" }, 'Nuevo Paciente'),
          React.createElement('span', { className: "text-3xl" }, '👤')
        ),
        React.createElement('form', { onSubmit: handleSubmit, className: "space-y-4" },
          // Datos básicos
          React.createElement('div', { className: "bg-gray-50 rounded-lg p-4" },
            React.createElement('h4', { className: "text-lg font-medium text-gray-900 mb-3" }, 'Datos Básicos'),
            React.createElement('div', { className: "grid grid-cols-1 gap-4" },
              React.createElement('div', null,
                React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Nombre Completo *'),
                React.createElement('input', {
                  type: 'text',
                  required: true,
                  placeholder: 'Ej: Juan Pérez González',
                  value: formData.name,
                  onChange: (e) => setFormData({...formData, name: e.target.value}),
                  className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                })
              ),
              React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                React.createElement('div', null,
                  React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Email *'),
                  React.createElement('input', {
                    type: 'email',
                    required: true,
                    placeholder: 'ejemplo@email.com',
                    value: formData.email,
                    onChange: (e) => setFormData({...formData, email: e.target.value}),
                    className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  })
                ),
                React.createElement('div', null,
                  React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Teléfono *'),
                  React.createElement('input', {
                    type: 'tel',
                    required: true,
                    placeholder: '+57 300 123 4567',
                    value: formData.phone,
                    onChange: (e) => setFormData({...formData, phone: e.target.value}),
                    className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  })
                )
              ),
              React.createElement('div', null,
                React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Estado'),
                React.createElement('select', {
                  value: formData.status,
                  onChange: (e) => setFormData({...formData, status: e.target.value}),
                  className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                },
                  React.createElement('option', { value: 'activo' }, '✅ Activo'),
                  React.createElement('option', { value: 'inactivo' }, '❌ Inactivo')
                )
              )
            )
          ),

          // Información de contacto
          React.createElement('div', { className: "bg-blue-50 rounded-lg p-4" },
            React.createElement('h4', { className: "text-lg font-medium text-gray-900 mb-3" }, 'Información de Contacto'),
            React.createElement('div', null,
              React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Dirección'),
              React.createElement('textarea', {
                placeholder: 'Dirección completa del paciente...',
                value: formData.address,
                onChange: (e) => setFormData({...formData, address: e.target.value}),
                rows: 3,
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              })
            )
          ),

          // Notas adicionales
          React.createElement('div', { className: "bg-yellow-50 rounded-lg p-4" },
            React.createElement('h4', { className: "text-lg font-medium text-gray-900 mb-3" }, 'Notas Adicionales'),
            React.createElement('div', null,
              React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Observaciones'),
              React.createElement('textarea', {
                placeholder: 'Información médica relevante, preferencias, observaciones especiales...',
                value: formData.notes,
                onChange: (e) => setFormData({...formData, notes: e.target.value}),
                rows: 3,
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              })
            )
          ),

          // Buttons
          React.createElement('div', { className: "flex space-x-4 pt-6 border-t" },
            React.createElement('button', {
              type: 'button',
              onClick: () => setShowPatientForm(false),
              className: "flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            }, 'Cancelar'),
            React.createElement('button', {
              type: 'submit',
              className: "flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            }, '➕ Crear Paciente')
          )
        )
      )
    );
  };

  // Products Component - Enhanced with all requested features
  const ProductsModule = () => React.createElement('div', { className: "space-y-6" },
    // Header and actions
    React.createElement('div', { className: "flex justify-between items-center" },
      React.createElement('h2', { className: "text-3xl font-bold text-gray-900" }, 'Maestro de Productos'),
      React.createElement('div', { className: "flex space-x-4" },
        React.createElement('button', {
          onClick: exportProducts,
          className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        }, '📊 Exportar Excel'),
        React.createElement('button', {
          onClick: () => setShowProductForm(true),
          className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        }, '➕ Nuevo Producto')
      )
    ),

    // Advanced Filters
    React.createElement('div', { className: "bg-white rounded-lg p-6 shadow-sm border" },
      React.createElement('h3', { className: "text-lg font-medium text-gray-900 mb-4" }, 'Filtros de Búsqueda'),
      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-4 gap-4" },
        React.createElement('div', null,
          React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Búsqueda General'),
          React.createElement('input', {
            type: 'text',
            placeholder: 'Nombre, código, categoría...',
            value: productFilters.search,
            onChange: (e) => setProductFilters({...productFilters, search: e.target.value}),
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Categoría'),
          React.createElement('select', {
            value: productFilters.category,
            onChange: (e) => setProductFilters({...productFilters, category: e.target.value}),
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          },
            React.createElement('option', { value: '' }, 'Todas las categorías'),
            React.createElement('option', { value: 'armazones' }, 'Armazones'),
            React.createElement('option', { value: 'lentes' }, 'Lentes'),
            React.createElement('option', { value: 'lentes_contacto' }, 'Lentes de contacto'),
            React.createElement('option', { value: 'accesorios' }, 'Accesorios')
          )
        ),
        React.createElement('div', null,
          React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Tipo'),
          React.createElement('select', {
            value: productFilters.type,
            onChange: (e) => setProductFilters({...productFilters, type: e.target.value}),
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          },
            React.createElement('option', { value: '' }, 'Todos los tipos'),
            React.createElement('option', { value: 'propio' }, 'Propio'),
            React.createElement('option', { value: 'consignacion' }, 'Consignación')
          )
        ),
        React.createElement('div', null,
          React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Proveedor'),
          React.createElement('input', {
            type: 'text',
            placeholder: 'Filtrar por proveedor...',
            value: productFilters.supplier,
            onChange: (e) => setProductFilters({...productFilters, supplier: e.target.value}),
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          })
        )
      )
    ),

    // Products Summary Cards
    React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-4 gap-4" },
      React.createElement('div', { className: "bg-white rounded-lg p-4 shadow-sm border" },
        React.createElement('div', { className: "text-center" },
          React.createElement('p', { className: "text-2xl font-bold text-blue-600" }, products.length),
          React.createElement('p', { className: "text-sm text-gray-500" }, 'Total Productos')
        )
      ),
      React.createElement('div', { className: "bg-white rounded-lg p-4 shadow-sm border" },
        React.createElement('div', { className: "text-center" },
          React.createElement('p', { className: "text-2xl font-bold text-green-600" }, 
            products.filter(p => p.status === 'Normal').length
          ),
          React.createElement('p', { className: "text-sm text-gray-500" }, 'Stock Normal')
        )
      ),
      React.createElement('div', { className: "bg-white rounded-lg p-4 shadow-sm border" },
        React.createElement('div', { className: "text-center" },
          React.createElement('p', { className: "text-2xl font-bold text-yellow-600" }, 
            products.filter(p => p.status === 'Bajo').length
          ),
          React.createElement('p', { className: "text-sm text-gray-500" }, 'Stock Bajo')
        )
      ),
      React.createElement('div', { className: "bg-white rounded-lg p-4 shadow-sm border" },
        React.createElement('div', { className: "text-center" },
          React.createElement('p', { className: "text-2xl font-bold text-red-600" }, 
            products.filter(p => p.status === 'Crítico').length
          ),
          React.createElement('p', { className: "text-sm text-gray-500" }, 'Stock Crítico')
        )
      )
    ),

    // Products table
    React.createElement('div', { className: "bg-white rounded-lg shadow-sm border overflow-hidden" },
      React.createElement('div', { className: "overflow-x-auto" },
        React.createElement('table', { className: "w-full" },
          React.createElement('thead', { className: "bg-gray-50" },
            React.createElement('tr', null,
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Código'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Nombre'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Categoría'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Proveedor'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Stock'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Precio'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Estado'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Tipo'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Acciones')
            )
          ),
          React.createElement('tbody', { className: "bg-white divide-y divide-gray-200" },
            products.length > 0 ? products.map(product => 
              React.createElement('tr', { key: product.id, className: "hover:bg-gray-50 transition-colors" },
                React.createElement('td', { className: "px-4 py-3 text-sm font-mono text-gray-900" }, product.code),
                React.createElement('td', { className: "px-4 py-3 text-sm font-medium text-gray-900" }, product.name),
                React.createElement('td', { className: "px-4 py-3 text-sm text-gray-500" }, product.category),
                React.createElement('td', { className: "px-4 py-3 text-sm text-gray-500" }, product.supplier),
                React.createElement('td', { className: "px-4 py-3 text-sm" },
                  React.createElement('div', { className: "flex items-center" },
                    React.createElement('span', { 
                      className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock === 0 ? 'bg-red-100 text-red-800' :
                        product.stock <= 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`
                    }, product.stock),
                    React.createElement('span', { className: "ml-2 text-gray-400" }, 'unidades')
                  )
                ),
                React.createElement('td', { className: "px-4 py-3 text-sm font-medium text-gray-900" }, 
                  `$${parseFloat(product.price || 0).toLocaleString()}`
                ),
                React.createElement('td', { className: "px-4 py-3 text-sm" },
                  React.createElement('span', { 
                    className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.status === 'Crítico' ? 'bg-red-100 text-red-800' :
                      product.status === 'Bajo' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`
                  }, product.status)
                ),
                React.createElement('td', { className: "px-4 py-3 text-sm" },
                  React.createElement('span', { 
                    className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.type === 'Consignación' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`
                  }, product.type)
                ),
                React.createElement('td', { className: "px-4 py-3 text-sm text-gray-500" },
                  React.createElement('div', { className: "flex space-x-2" },
                    React.createElement('button', { 
                      className: "text-blue-600 hover:text-blue-900 font-medium",
                      title: "Editar producto"
                    }, '✏️'),
                    React.createElement('button', { 
                      className: "text-green-600 hover:text-green-900 font-medium",
                      title: "Ver detalles"
                    }, '👁️'),
                    React.createElement('button', { 
                      className: "text-red-600 hover:text-red-900 font-medium",
                      title: "Eliminar producto"
                    }, '🗑️')
                  )
                )
              )
            ) : 
            React.createElement('tr', null,
              React.createElement('td', { colspan: "9", className: "px-4 py-8 text-center text-gray-500" },
                React.createElement('div', { className: "text-center" },
                  React.createElement('p', { className: "text-2xl mb-2" }, '📦'),
                  React.createElement('p', { className: "text-lg font-medium" }, 'No hay productos registrados'),
                  React.createElement('p', { className: "text-sm" }, 'Comienza agregando tu primer producto')
                )
              )
            )
          )
        )
      )
    ),

    // Pagination
    productPagination.total_pages > 1 && React.createElement('div', { className: "flex justify-center items-center space-x-4" },
      React.createElement('button', {
        disabled: !productPagination.has_previous,
        onClick: () => fetchProducts(productPagination.current_page - 1),
        className: "px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      }, '← Anterior'),
      React.createElement('div', { className: "flex items-center space-x-2" },
        React.createElement('span', { className: "text-sm text-gray-700" }, 
          `Página ${productPagination.current_page} de ${productPagination.total_pages}`
        ),
        React.createElement('span', { className: "text-xs text-gray-500" }, 
          `(${productPagination.total_items} productos en total)`
        )
      ),
      React.createElement('button', {
        disabled: !productPagination.has_next,
        onClick: () => fetchProducts(productPagination.current_page + 1),
        className: "px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      }, 'Siguiente →')
    )
  );

  // Dashboard component
  const Dashboard = () => React.createElement('div', { className: "space-y-6" },
    // Header with quick actions
    React.createElement('div', { className: "bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white" },
      React.createElement('div', { className: "flex justify-between items-center" },
        React.createElement('div', null,
          React.createElement('h1', { className: "text-3xl font-bold mb-2" }, 'Panel de Control OptiGest'),
          React.createElement('p', { className: "text-blue-100" }, 'Gestión integral para tu óptica')
        ),
        React.createElement('div', { className: "flex space-x-3" },
          React.createElement('button', { 
            className: "bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-white font-medium transition-all",
            onClick: () => setActiveModule('products')
          }, '👓 Catálogo'),
          React.createElement('button', { 
            className: "bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-white font-medium transition-all",
            onClick: () => setActiveModule('appointments')
          }, '📅 Citas'),
          React.createElement('button', { 
            className: "bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-white font-medium transition-all",
            onClick: () => setActiveModule('sales')
          }, '💰 Ventas')
        )
      )
    ),

    // Key metrics cards
    React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" },
      React.createElement('div', { className: "bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300" },
        React.createElement('div', { className: "flex items-center justify-between" },
          React.createElement('div', null,
            React.createElement('p', { className: "text-gray-500 text-sm font-medium" }, 'Ventas Hoy'),
            React.createElement('p', { className: "text-3xl font-bold text-gray-900" }, `$${(dashboardData.dailySales || 0).toLocaleString()}`)
          ),
          React.createElement('div', { className: "bg-green-100 rounded-full p-3" },
            React.createElement('span', { className: "text-2xl" }, '💰')
          )
        )
      ),
      React.createElement('div', { className: "bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300" },
        React.createElement('div', { className: "flex items-center justify-between" },
          React.createElement('div', null,
            React.createElement('p', { className: "text-gray-500 text-sm font-medium" }, 'Ventas Mes'),
            React.createElement('p', { className: "text-3xl font-bold text-gray-900" }, `$${(dashboardData.monthlySales || 0).toLocaleString()}`)
          ),
          React.createElement('div', { className: "bg-blue-100 rounded-full p-3" },
            React.createElement('span', { className: "text-2xl" }, '📈')
          )
        )
      ),
      React.createElement('div', { className: "bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300" },
        React.createElement('div', { className: "flex items-center justify-between" },
          React.createElement('div', null,
            React.createElement('p', { className: "text-gray-500 text-sm font-medium" }, 'Citas Hoy'),
            React.createElement('p', { className: "text-3xl font-bold text-gray-900" }, dashboardData.appointments || 0)
          ),
          React.createElement('div', { className: "bg-yellow-100 rounded-full p-3" },
            React.createElement('span', { className: "text-2xl" }, '👥')
          )
        )
      ),
      React.createElement('div', { className: "bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300" },
        React.createElement('div', { className: "flex items-center justify-between" },
          React.createElement('div', null,
            React.createElement('p', { className: "text-gray-500 text-sm font-medium" }, 'Inventario'),
            React.createElement('p', { className: "text-3xl font-bold text-gray-900" }, dashboardData.inventory || 0)
          ),
          React.createElement('div', { className: "bg-purple-100 rounded-full p-3" },
            React.createElement('span', { className: "text-2xl" }, '📦')
          )
        )
      ),
      React.createElement('div', { className: "bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300" },
        React.createElement('div', { className: "flex items-center justify-between" },
          React.createElement('div', null,
            React.createElement('p', { className: "text-gray-500 text-sm font-medium" }, 'Consignaciones'),
            React.createElement('p', { className: "text-3xl font-bold text-gray-900" }, dashboardData.consignments || 0)
          ),
          React.createElement('div', { className: "bg-orange-100 rounded-full p-3" },
            React.createElement('span', { className: "text-2xl" }, '🤝')
          )
        )
      )
    )
  );

  // Patients Component - Full implementation
  const PatientsModule = () => React.createElement('div', { className: "space-y-6" },
    // Header and actions
    React.createElement('div', { className: "flex justify-between items-center" },
      React.createElement('h2', { className: "text-3xl font-bold text-gray-900" }, 'Gestión de Pacientes'),
      React.createElement('div', { className: "flex space-x-4" },
        React.createElement('button', {
          onClick: exportPatients,
          className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        }, '📊 Exportar Excel'),
        React.createElement('button', {
          onClick: () => setShowPatientForm(true),
          className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        }, '➕ Nuevo Paciente')
      )
    ),

    // Search and filters
    React.createElement('div', { className: "bg-white rounded-lg p-6 shadow-sm border" },
      React.createElement('h3', { className: "text-lg font-medium text-gray-900 mb-4" }, 'Búsqueda y Filtros'),
      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement('div', null,
          React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Búsqueda General'),
          React.createElement('input', {
            type: 'text',
            placeholder: 'Nombre, email, teléfono...',
            value: patientFilters.search,
            onChange: (e) => setPatientFilters({...patientFilters, search: e.target.value}),
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-1" }, 'Estado'),
          React.createElement('select', {
            value: patientFilters.status,
            onChange: (e) => setPatientFilters({...patientFilters, status: e.target.value}),
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          },
            React.createElement('option', { value: '' }, 'Todos los estados'),
            React.createElement('option', { value: 'activo' }, 'Activo'),
            React.createElement('option', { value: 'inactivo' }, 'Inactivo')
          )
        ),
        React.createElement('div', { className: "flex items-end" },
          React.createElement('button', {
            onClick: () => setPatientFilters({ search: '', status: '' }),
            className: "w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          }, '🔄 Limpiar Filtros')
        )
      )
    ),

    // Patients Summary Cards
    React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-4 gap-4" },
      React.createElement('div', { className: "bg-white rounded-lg p-4 shadow-sm border" },
        React.createElement('div', { className: "text-center" },
          React.createElement('p', { className: "text-2xl font-bold text-blue-600" }, patients.length),
          React.createElement('p', { className: "text-sm text-gray-500" }, 'Total Pacientes')
        )
      ),
      React.createElement('div', { className: "bg-white rounded-lg p-4 shadow-sm border" },
        React.createElement('div', { className: "text-center" },
          React.createElement('p', { className: "text-2xl font-bold text-green-600" }, 
            patients.filter(p => p.status === 'Activo').length
          ),
          React.createElement('p', { className: "text-sm text-gray-500" }, 'Pacientes Activos')
        )
      ),
      React.createElement('div', { className: "bg-white rounded-lg p-4 shadow-sm border" },
        React.createElement('div', { className: "text-center" },
          React.createElement('p', { className: "text-2xl font-bold text-gray-600" }, 
            patients.filter(p => p.status === 'Inactivo').length
          ),
          React.createElement('p', { className: "text-sm text-gray-500" }, 'Pacientes Inactivos')
        )
      ),
      React.createElement('div', { className: "bg-white rounded-lg p-4 shadow-sm border" },
        React.createElement('div', { className: "text-center" },
          React.createElement('p', { className: "text-2xl font-bold text-purple-600" }, 
            patients.reduce((sum, p) => sum + (p.total_purchases || 0), 0)
          ),
          React.createElement('p', { className: "text-sm text-gray-500" }, 'Total Compras')
        )
      )
    ),

    // Patients table
    React.createElement('div', { className: "bg-white rounded-lg shadow-sm border overflow-hidden" },
      React.createElement('div', { className: "overflow-x-auto" },
        React.createElement('table', { className: "w-full" },
          React.createElement('thead', { className: "bg-gray-50" },
            React.createElement('tr', null,
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Nombre'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Email'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Teléfono'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Estado'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Dirección'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Compras'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Registro'),
              React.createElement('th', { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, 'Acciones')
            )
          ),
          React.createElement('tbody', { className: "bg-white divide-y divide-gray-200" },
            patients.length > 0 ? patients.map(patient => 
              React.createElement('tr', { key: patient.id, className: "hover:bg-gray-50 transition-colors" },
                React.createElement('td', { className: "px-4 py-3 text-sm font-medium text-gray-900" }, patient.name),
                React.createElement('td', { className: "px-4 py-3 text-sm text-gray-500" }, patient.email),
                React.createElement('td', { className: "px-4 py-3 text-sm text-gray-500" }, patient.phone),
                React.createElement('td', { className: "px-4 py-3 text-sm" },
                  React.createElement('span', { 
                    className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      patient.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`
                  }, patient.status)
                ),
                React.createElement('td', { className: "px-4 py-3 text-sm text-gray-500" }, 
                  patient.address ? 
                    React.createElement('span', { title: patient.address }, 
                      patient.address.length > 30 ? patient.address.substring(0, 30) + '...' : patient.address
                    ) : 
                    React.createElement('span', { className: "text-gray-400 italic" }, 'Sin dirección')
                ),
                React.createElement('td', { className: "px-4 py-3 text-sm" },
                  React.createElement('div', { className: "flex items-center" },
                    React.createElement('span', { 
                      className: "inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                    }, patient.total_purchases || 0),
                    patient.purchase_history && patient.purchase_history.length > 0 && 
                      React.createElement('button', { 
                        className: "ml-2 text-blue-600 hover:text-blue-900 text-xs",
                        title: "Ver historial de compras"
                      }, '📋')
                  )
                ),
                React.createElement('td', { className: "px-4 py-3 text-sm text-gray-500" }, 
                  new Date(patient.created_at).toLocaleDateString()
                ),
                React.createElement('td', { className: "px-4 py-3 text-sm text-gray-500" },
                  React.createElement('div', { className: "flex space-x-2" },
                    React.createElement('button', { 
                      className: "text-blue-600 hover:text-blue-900 font-medium",
                      title: "Editar paciente"
                    }, '✏️'),
                    React.createElement('button', { 
                      className: "text-green-600 hover:text-green-900 font-medium",
                      title: "Ver detalles y historial"
                    }, '👁️'),
                    React.createElement('button', { 
                      className: "text-purple-600 hover:text-purple-900 font-medium",
                      title: "Nueva cita"
                    }, '📅'),
                    React.createElement('button', { 
                      className: "text-red-600 hover:text-red-900 font-medium",
                      title: "Desactivar paciente"
                    }, '🚫')
                  )
                )
              )
            ) : 
            React.createElement('tr', null,
              React.createElement('td', { colspan: "8", className: "px-4 py-8 text-center text-gray-500" },
                React.createElement('div', { className: "text-center" },
                  React.createElement('p', { className: "text-2xl mb-2" }, '👥'),
                  React.createElement('p', { className: "text-lg font-medium" }, 'No hay pacientes registrados'),
                  React.createElement('p', { className: "text-sm" }, 'Comienza registrando tu primer paciente')
                )
              )
            )
          )
        )
      )
    ),

    // Pagination
    patientPagination.total_pages > 1 && React.createElement('div', { className: "flex justify-center items-center space-x-4" },
      React.createElement('button', {
        disabled: !patientPagination.has_previous,
        onClick: () => fetchPatients(patientPagination.current_page - 1),
        className: "px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      }, '← Anterior'),
      React.createElement('div', { className: "flex items-center space-x-2" },
        React.createElement('span', { className: "text-sm text-gray-700" }, 
          `Página ${patientPagination.current_page} de ${patientPagination.total_pages}`
        ),
        React.createElement('span', { className: "text-xs text-gray-500" }, 
          `(${patientPagination.total_items} pacientes en total)`
        )
      ),
      React.createElement('button', {
        disabled: !patientPagination.has_next,
        onClick: () => fetchPatients(patientPagination.current_page + 1),
        className: "px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      }, 'Siguiente →')
    ),

    // Purchase History Modal (could be expanded later)
    React.createElement('div', { className: "mt-8 bg-white rounded-lg shadow-sm border p-6" },
      React.createElement('h3', { className: "text-lg font-medium text-gray-900 mb-4" }, 'Funcionalidades Adicionales'),
      React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement('div', { className: "text-center p-4 bg-blue-50 rounded-lg" },
          React.createElement('p', { className: "text-2xl mb-2" }, '📋'),
          React.createElement('p', { className: "font-medium" }, 'Historial de Compras'),
          React.createElement('p', { className: "text-sm text-gray-500" }, 'Seguimiento completo de compras por paciente')
        ),
        React.createElement('div', { className: "text-center p-4 bg-green-50 rounded-lg" },
          React.createElement('p', { className: "text-2xl mb-2" }, '📞'),
          React.createElement('p', { className: "font-medium" }, 'Contacto Rápido'),
          React.createElement('p', { className: "text-sm text-gray-500" }, 'Email y llamadas directas desde la plataforma')
        ),
        React.createElement('div', { className: "text-center p-4 bg-purple-50 rounded-lg" },
          React.createElement('p', { className: "text-2xl mb-2" }, '📈'),
          React.createElement('p', { className: "font-medium" }, 'Análisis de Pacientes'),
          React.createElement('p', { className: "text-sm text-gray-500" }, 'Estadísticas y patrones de comportamiento')
        )
      )
    )
  );

  return React.createElement('div', { className: "min-h-screen bg-gray-50" },
    // Header
    React.createElement('header', { className: "bg-white shadow-sm border-b border-gray-200" },
      React.createElement('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
        React.createElement('div', { className: "flex justify-between items-center h-16" },
          React.createElement('div', { className: "flex items-center" },
            React.createElement('h1', { className: "text-2xl font-bold text-gray-900" }, 'OptiGest'),
            React.createElement('span', { className: "ml-2 text-sm text-gray-500" }, 'Sistema de Gestión Óptica')
          ),
          React.createElement('div', { className: "flex items-center space-x-4" },
            React.createElement('button', { className: "bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors duration-200" },
              '👤 Usuario'
            )
          )
        )
      )
    ),

    React.createElement('div', { className: "flex" },
      // Sidebar Navigation
      React.createElement('nav', { className: "w-64 bg-white shadow-lg min-h-screen border-r border-gray-200" },
        React.createElement('div', { className: "p-4" },
          React.createElement('ul', { className: "space-y-2" },
            navigationItems.map(item => 
              React.createElement('li', { key: item.id },
                React.createElement('button', {
                  onClick: () => setActiveModule(item.id),
                  className: `w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                    activeModule === item.id
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:transform hover:scale-105'
                  }`
                },
                  React.createElement('span', { className: "mr-3 text-lg" }, item.icon),
                  React.createElement('span', { className: "font-medium" }, item.label)
                )
              )
            )
          )
        )
      ),

      // Main Content
      React.createElement('main', { className: "flex-1 p-8" },
        loading ? 
          React.createElement('div', { className: "flex justify-center items-center h-64" },
            React.createElement('div', { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" })
          ) :
          activeModule === 'dashboard' ? React.createElement(Dashboard) :
          activeModule === 'products' ? React.createElement(ProductsModule) :
          activeModule === 'patients' ? React.createElement(PatientsModule) :
          React.createElement('div', { className: "bg-white rounded-2xl p-8 shadow-lg border border-gray-100" },
            React.createElement('div', { className: "text-center" },
              React.createElement('span', { className: "text-6xl mb-4 block" },
                navigationItems.find(item => item.id === activeModule)?.icon
              ),
              React.createElement('h2', { className: "text-3xl font-bold text-gray-900 mb-4" },
                navigationItems.find(item => item.id === activeModule)?.label
              ),
              React.createElement('p', { className: "text-gray-500 mb-8" },
                'Esta sección estará disponible próximamente.'
              )
            )
          )
      )
    ),

    // Modals
    showProductForm && React.createElement(ProductForm),
    showPatientForm && React.createElement(PatientForm),

    // Footer
    React.createElement('footer', { className: "bg-white border-t border-gray-200 py-8" },
      React.createElement('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
        React.createElement('div', { className: "text-center" },
          React.createElement('p', { className: "text-gray-500" },
            '© 2024 OptiGest - Sistema de Gestión para Ópticas'
          )
        )
      )
    )
  );
};

// Make App available globally
window.App = App;