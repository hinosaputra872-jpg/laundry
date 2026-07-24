/**
 * Laundry Management System
 * Vanilla JS CRUD Operations with LocalStorage
 */

// --- Constants & State ---
const STORAGE_KEY = 'luxe_laundry_orders';
const SETTINGS_KEY = 'luxe_laundry_settings';
let orders = [];
let currentFilter = 'all';
let searchQuery = '';

// Pricing logic per kg (can be updated via settings)
let pricingSettings = {
  'Wash & Fold': 8000,
  'Dry Clean': 25000,
  'Ironing Only': 10000,
  'Premium Wash': 15000
};

// --- DOM Elements ---
const ordersTable = document.getElementById('ordersTable');
const ordersList = document.getElementById('ordersList');
const emptyState = document.getElementById('emptyState');
const totalOrdersStat = document.getElementById('totalOrdersStat');
const totalRevenueStat = document.getElementById('totalRevenueStat');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const revenueFilter = document.getElementById('revenueFilter');

// Modal Elements
const orderModal = document.getElementById('orderModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const orderForm = document.getElementById('orderForm');
const addOrderBtn = document.getElementById('addOrderBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const modalTitle = document.getElementById('modalTitle');

// Settings Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsForm = document.getElementById('settingsForm');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const priceWashFold = document.getElementById('priceWashFold');
const priceDryClean = document.getElementById('priceDryClean');
const priceIroning = document.getElementById('priceIroning');
const pricePremium = document.getElementById('pricePremium');

// Form Inputs
const orderIdInput = document.getElementById('orderId');
const customerNameInput = document.getElementById('customerName');
const serviceTypeInput = document.getElementById('serviceType');
const weightInput = document.getElementById('weight');
const statusInput = document.getElementById('status');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadOrders();
  renderOrders();
  setupEventListeners();
});

// --- Data Operations ---
function loadSettings() {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    pricingSettings = JSON.parse(stored);
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(pricingSettings));
}

function loadOrders() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    orders = JSON.parse(stored);
  }
}

function saveOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  renderOrders(); // Re-render whenever data changes
}

function generateId() {
  return 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function calculatePrice(service, weight) {
  const rate = pricingSettings[service] || 8000;
  return rate * parseFloat(weight);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('id-ID', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// --- CRUD Operations ---
function addOrder(orderData) {
  const newOrder = {
    id: generateId(),
    customerName: orderData.customerName,
    serviceType: orderData.serviceType,
    weight: parseFloat(orderData.weight),
    totalPrice: calculatePrice(orderData.serviceType, orderData.weight),
    status: orderData.status,
    createdAt: new Date().toISOString()
  };
  orders.unshift(newOrder); // Add to beginning
  saveOrders();
}

function updateOrder(id, orderData) {
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index] = {
      ...orders[index],
      customerName: orderData.customerName,
      serviceType: orderData.serviceType,
      weight: parseFloat(orderData.weight),
      totalPrice: calculatePrice(orderData.serviceType, orderData.weight),
      status: orderData.status
    };
    saveOrders();
  }
}

function deleteOrder(id) {
  if (confirm('Are you sure you want to delete this order?')) {
    orders = orders.filter(o => o.id !== id);
    saveOrders();
  }
}

function changeStatus(id, newStatus) {
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index].status = newStatus;
    saveOrders();
  }
}

// --- UI Rendering ---
function renderOrders() {
  // Apply Filters & Search
  let filteredOrders = orders.filter(order => {
    const matchesFilter = currentFilter === 'all' || order.status === currentFilter;
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Update Stats
  totalOrdersStat.textContent = orders.length;
  // Calculate Revenue based on Filter
  const revenueFilterVal = revenueFilter ? revenueFilter.value : 'all';
  const now = new Date();
  
  const revenueOrders = orders.filter(order => {
    if (revenueFilterVal === 'all') return true;
    
    const orderDate = new Date(order.createdAt);
    if (revenueFilterVal === 'today') {
      return orderDate.getDate() === now.getDate() && 
             orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    }
    if (revenueFilterVal === 'month') {
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    }
    if (revenueFilterVal === 'year') {
      return orderDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalRev = revenueOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  totalRevenueStat.textContent = formatCurrency(totalRev);

  // Toggle Empty State
  if (filteredOrders.length === 0) {
    ordersTable.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.classList.add('flex');
  } else {
    ordersTable.classList.remove('hidden');
    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');
  }

  // Clear list
  ordersList.innerHTML = '';

  // Render Rows
  filteredOrders.forEach(order => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors group';
    
    tr.innerHTML = `
      <td class="py-4 px-4">
        <div class="font-medium text-indigo-300">${order.id}</div>
        <div class="text-xs text-slate-500">${formatDate(order.createdAt)}</div>
      </td>
      <td class="py-4 px-4 font-medium">${order.customerName}</td>
      <td class="py-4 px-4 text-slate-300">${order.serviceType}</td>
      <td class="py-4 px-4 text-slate-300">${order.weight} kg</td>
      <td class="py-4 px-4 font-medium text-emerald-400">${formatCurrency(order.totalPrice)}</td>
      <td class="py-4 px-4">
        <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
      </td>
      <td class="py-4 px-4 text-right">
        <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- Status Dropdown Trigger -->
          <div class="relative group/status">
             <button class="w-8 h-8 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition-colors" title="Change Status">
               <i class="ph ph-arrows-clockwise text-lg"></i>
             </button>
             <div class="absolute right-0 top-full mt-1 w-32 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden hidden group-hover/status:block z-10">
               <button onclick="changeStatus('${order.id}', 'Pending')" class="w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${order.status==='Pending'?'text-amber-400':''}">Pending</button>
               <button onclick="changeStatus('${order.id}', 'Processing')" class="w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${order.status==='Processing'?'text-blue-400':''}">Processing</button>
               <button onclick="changeStatus('${order.id}', 'Completed')" class="w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${order.status==='Completed'?'text-emerald-400':''}">Completed</button>
             </div>
          </div>
          
          <button onclick="openEditModal('${order.id}')" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-colors" title="Edit">
            <i class="ph ph-pencil-simple text-lg"></i>
          </button>
          
          <button onclick="printReceipt('${order.id}')" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition-colors" title="Print Receipt">
            <i class="ph ph-printer text-lg"></i>
          </button>
          
          <button onclick="deleteOrder('${order.id}')" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors" title="Delete">
            <i class="ph ph-trash text-lg"></i>
          </button>
        </div>
      </td>
    `;
    
    ordersList.appendChild(tr);
  });
}

// --- Modal Logic ---
function openModal(title) {
  modalTitle.textContent = title;
  modalBackdrop.classList.remove('hidden');
  orderModal.classList.remove('hidden');
  
  // Trigger animations
  setTimeout(() => {
    modalBackdrop.classList.remove('opacity-0');
    orderModal.classList.remove('opacity-0', 'scale-95');
  }, 10);
}

function closeModal() {
  modalBackdrop.classList.add('opacity-0');
  orderModal.classList.add('opacity-0', 'scale-95');
  
  setTimeout(() => {
    modalBackdrop.classList.add('hidden');
    orderModal.classList.add('hidden');
    orderForm.reset();
    orderIdInput.value = '';
  }, 300);
}

function openSettingsModal() {
  priceWashFold.value = pricingSettings['Wash & Fold'];
  priceDryClean.value = pricingSettings['Dry Clean'];
  priceIroning.value = pricingSettings['Ironing Only'];
  pricePremium.value = pricingSettings['Premium Wash'];
  
  modalBackdrop.classList.remove('hidden');
  settingsModal.classList.remove('hidden');
  
  setTimeout(() => {
    modalBackdrop.classList.remove('opacity-0');
    settingsModal.classList.remove('opacity-0', 'scale-95');
  }, 10);
}

function closeSettingsModal() {
  modalBackdrop.classList.add('opacity-0');
  settingsModal.classList.add('opacity-0', 'scale-95');
  
  setTimeout(() => {
    modalBackdrop.classList.add('hidden');
    settingsModal.classList.add('hidden');
  }, 300);
}

// Expose to window for inline onclick handlers
window.openEditModal = function(id) {
  const order = orders.find(o => o.id === id);
  if (order) {
    orderIdInput.value = order.id;
    customerNameInput.value = order.customerName;
    serviceTypeInput.value = order.serviceType;
    weightInput.value = order.weight;
    statusInput.value = order.status;
    
    openModal('Edit Order');
  }
};

window.deleteOrder = deleteOrder;
window.changeStatus = changeStatus;
window.printReceipt = function(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;
  
  const printSection = document.getElementById('printSection');
  if (!printSection) return;
  
  printSection.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="font-size: 24px; font-weight: bold; margin: 0;">LuxeLaundry</h2>
      <p style="font-size: 14px; color: #555; margin: 5px 0;">Premium Management System</p>
    </div>
    <div style="border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 15px 0; margin-bottom: 20px;">
      <p style="margin: 0 0 5px 0;"><strong>Order ID:</strong> ${order.id}</p>
      <p style="margin: 0 0 5px 0;"><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
      <p style="margin: 0;"><strong>Customer:</strong> ${order.customerName}</p>
    </div>
    <table style="width: 100%; text-align: left; margin-bottom: 20px; font-size: 14px;">
      <tr>
        <th style="padding-bottom: 5px;">Service</th>
        <th style="padding-bottom: 5px; text-align: right;">Weight</th>
      </tr>
      <tr>
        <td>${order.serviceType}</td>
        <td style="text-align: right;">${order.weight} kg</td>
      </tr>
    </table>
    <div style="text-align: right; font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px;">
      Total: ${formatCurrency(order.totalPrice)}
    </div>
    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #555;">
      Thank you for choosing LuxeLaundry!
    </div>
  `;
  
  window.print();
};

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Modal toggles
  addOrderBtn.addEventListener('click', () => openModal('Add New Order'));
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  settingsBtn.addEventListener('click', openSettingsModal);
  closeSettingsBtn.addEventListener('click', closeSettingsModal);
  cancelSettingsBtn.addEventListener('click', closeSettingsModal);
  
  modalBackdrop.addEventListener('click', () => {
    closeModal();
    closeSettingsModal();
  });

  // Settings form submit
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    pricingSettings['Wash & Fold'] = parseFloat(priceWashFold.value) || 0;
    pricingSettings['Dry Clean'] = parseFloat(priceDryClean.value) || 0;
    pricingSettings['Ironing Only'] = parseFloat(priceIroning.value) || 0;
    pricingSettings['Premium Wash'] = parseFloat(pricePremium.value) || 0;
    saveSettings();
    closeSettingsModal();
  });

  // Form submit
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
      customerName: customerNameInput.value,
      serviceType: serviceTypeInput.value,
      weight: weightInput.value,
      status: statusInput.value
    };

    if (orderIdInput.value) {
      updateOrder(orderIdInput.value, formData);
    } else {
      addOrder(formData);
    }
    
    closeModal();
  });

  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderOrders();
  });

  // Revenue Filter
  if (revenueFilter) {
    revenueFilter.addEventListener('change', () => {
      renderOrders();
    });
  }

  // Filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update active state
      filterBtns.forEach(b => {
        b.classList.remove('active', 'text-indigo-400');
        b.classList.add('text-slate-400');
        b.style.background = '';
      });
      
      const target = e.currentTarget;
      target.classList.add('active');
      target.classList.remove('text-slate-400');
      
      currentFilter = target.getAttribute('data-filter');
      renderOrders();
    });
  });
}
