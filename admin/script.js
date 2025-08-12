// script.js: advanced dashboard logic

// --- UTILITIES ---
function showToast(msg, type='success') {
    const toastElem = document.getElementById('toastNotif');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.textContent = msg;
    toastElem.className = `toast align-items-center text-bg-${type} border-0`;
    let bsToast = bootstrap.Toast.getOrCreateInstance(toastElem);
    bsToast.show();
}

function confirmDelete(msg, callback) {
    document.getElementById('confirmDeleteMsg').textContent = msg;
    let modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    modal.show();
    document.getElementById('deleteConfirmedBtn').onclick = () => {
        modal.hide();
        callback();
    };
}

// --- SECTION NAVIGATION ---
const sections = document.querySelectorAll('.main-content section');
document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const sec = link.getAttribute('data-section');
        sections.forEach(s => {
            s.classList.remove('active');
            if (s.id === sec) s.classList.add('active');
        });
    });
});
// Show dashboard on load
sections.forEach(s => s.classList.remove('active'));
document.getElementById('dashboard').classList.add('active');
document.querySelector('.sidebar .nav-link[data-section="dashboard"]').classList.add('active');

// --- PRODUCTS (localStorage, CRUD, filter, sort) ---
let products = JSON.parse(localStorage.getItem('products')) || [];
let editingIndex = null;
let productSortBy = null, productSortAsc = true;

function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}
function renderProducts() {
    let filtered = [...products];
    let q = document.getElementById('searchProduct').value.trim().toLowerCase();
    if(q) filtered = filtered.filter(p=>{
        return p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            String(p.price).includes(q);
    });
    if(productSortBy) {
        filtered.sort((a,b)=>{
            if(a[productSortBy] < b[productSortBy]) return productSortAsc?-1:1;
            if(a[productSortBy] > b[productSortBy]) return productSortAsc?1:-1;
            return 0;
        });
    }

    let tbody = document.querySelector('#productTable tbody');
    tbody.innerHTML = '';
    filtered.forEach((p,i) => {
        tbody.innerHTML += `
        <tr>
            <td>${p.name}</td>
            <td>${parseFloat(p.price).toFixed(2)}</td>
            <td>${p.category}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editProductModal(${i})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete('Delete product \"${p.name}\"?', () => deleteProduct(${i}))">Delete</button>
            </td>
        </tr>`;
    });
}

// Add/Edit Product Modal
function editProductModal(index) {
    editingIndex = index;
    let product = products[index];
    document.getElementById('editingIndex').value = index;
    document.getElementById('modalProductName').value = product.name;
    document.getElementById('modalProductPrice').value = product.price;
    document.getElementById('modalProductCategory').value = product.category;
    document.getElementById('addProductModalLabel').textContent = 'Edit Product';
    let modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal'));
    modal.show();
}
function deleteProduct(i){
    products.splice(i,1);
    saveProducts();
    renderProducts();
    showToast('Product deleted', 'danger');
}

// Modal Reset/Add
document.getElementById('addProductModal').addEventListener('hidden.bs.modal', function(){
    document.getElementById('productForm').reset();
    editingIndex = null;
    document.getElementById('addProductModalLabel').textContent = 'Add/Edit Product';
});

// Save Product from Modal
document.getElementById('productForm').onsubmit = function(e) {
    e.preventDefault();
    let name = document.getElementById('modalProductName').value.trim(),
        price = document.getElementById('modalProductPrice').value,
        category = document.getElementById('modalProductCategory').value.trim();

    if (!name || !price || !category) return showToast("Fill all fields", "danger");

    if(editingIndex !== null){
        products[editingIndex] = {name, price, category};
        showToast('Product updated');
    }else{
        products.push({name, price, category});
        showToast('Product added');
    }
    editingIndex=null;
    saveProducts();
    renderProducts();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal')).hide();
};

document.getElementById('searchProduct').addEventListener('input', renderProducts);

document.querySelectorAll('.sortable').forEach(th=>{
    th.addEventListener('click',function(){
        let sortBy = th.getAttribute('data-sort');
        if(productSortBy == sortBy)
            productSortAsc = !productSortAsc;
        else {
            productSortBy = sortBy;
            productSortAsc = true;
        }
        renderProducts();
    });
});

// --- ORDERS (demo only, can extend to localStorage) ---
function updateOrderStatus(btn){
    let cell = btn.parentElement.parentElement.querySelector('.order-status');
    let opts = ['Pending','Shipped','Delivered','Cancelled'];
    let idx = opts.indexOf(cell.textContent.trim());
    idx = (idx+1)%opts.length;
    cell.textContent = opts[idx];
    showToast('Order status updated');
}

// --- USERS (localStorage, CRUD) ---
let users = JSON.parse(localStorage.getItem('users')) || [];
function saveUsers(){ localStorage.setItem('users',JSON.stringify(users)); }
function renderUsers(){
    let tbody = document.querySelector('#userTable tbody');
    tbody.innerHTML = '';
    users.forEach((u,i)=>{
        tbody.innerHTML += `
        <tr>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete('Delete user \"${u.name}\"?',()=>deleteUser(${i}))">Delete</button>
            </td>
        </tr>`;
    });
}
function deleteUser(i){
    users.splice(i,1);
    saveUsers();
    renderUsers();
    showToast('User deleted', 'danger');
}

document.getElementById('addUserBtn').onclick = ()=>{
    let name = document.getElementById('userName').value.trim(),
        email = document.getElementById('userEmail').value.trim();
    if(!name||!email) return showToast("Fill user fields", "danger");
    users.push({name,email});
    saveUsers();
    renderUsers();
    document.getElementById('userName').value='';
    document.getElementById('userEmail').value='';
    showToast('User added');
};

// --- SETTINGS ---
let settings = JSON.parse(localStorage.getItem('settings')) || {};
function loadSettings(){
    if(settings.storeName) document.getElementById('storeName').value = settings.storeName;
    if(settings.storeTagline) document.getElementById('storeTagline').value = settings.storeTagline;
}
document.getElementById('saveSettingsBtn').onclick = ()=>{
    settings.storeName = document.getElementById('storeName').value.trim();
    settings.storeTagline = document.getElementById('storeTagline').value.trim();
    localStorage.setItem('settings',JSON.stringify(settings));
    showToast("Settings saved");
};

// --- DASHBOARD/ANALYTICS ---
function renderDashboardStats(){
    const statsDiv = document.getElementById('dashboardStats');
    let prodCount = products.length;
    let userCount = users.length;
    let totalRev = products.reduce((sum,p)=> sum+parseFloat(p.price),0).toFixed(2);
    statsDiv.innerHTML = `
        <div class="col-md-3">
            <div class="card text-bg-primary mb-3"><div class="card-body">
                <h5 class="card-title">Products</h5>
                <p class="card-text fs-4">${prodCount}</p>
            </div></div>
        </div>
        <div class="col-md-3">
            <div class="card text-bg-success mb-3"><div class="card-body">
                <h5 class="card-title">Users</h5>
                <p class="card-text fs-4">${userCount}</p>
            </div></div>
        </div>
        <div class="col-md-3">
            <div class="card text-bg-warning mb-3"><div class="card-body">
                <h5 class="card-title">Total Product Value</h5>
                <p class="card-text fs-4">$${totalRev}</p>
            </div></div>
        </div>
    `;
}

// Chart.js for sales analytics
function renderSalesChart(){
    const ctx = document.getElementById('salesChart').getContext('2d');
    if(window.salesChartInstance) window.salesChartInstance.destroy();
    let data = {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul'],
        datasets: [{
            label: 'Sales ($)',
            data: [540, 460, 700, 850, 560, 950, 1100],
            backgroundColor: '#198754'
        }]
    };
    window.salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data,
        options: {
            responsive:true,
            plugins: { legend: { display:false }},
            scales: { y: { beginAtZero:true }}
        }
    });
}

// INIT
window.editProductModal = editProductModal;
window.confirmDelete = confirmDelete;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;

renderProducts();
renderUsers();
loadSettings();
renderSalesChart();
renderDashboardStats();

document.querySelector('.sidebar .nav-link[data-section="dashboard"]').click();
