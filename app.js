/* Simple inventory system using localStorage
   - users: admin/admin (admin), maria/juan/ana (employee)
   - admin: add/edit/delete products, manage employees, view activity
   - employee: add products only, cannot delete/edit or view employees
*/

// --- Utilities for storage ---
const STORAGE_KEYS = { PRODUCTS: 'inv_products', EMPLOYEES: 'inv_employees', ACTIVITIES: 'inv_activities', CURRENT: 'inv_current_user' };
function load(key){ try { return JSON.parse(localStorage.getItem(key)||'null') } catch(e){ return null } }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)) }

// --- Initialize demo data if empty ---
function ensureDemoData(){
  if(!load(STORAGE_KEYS.PRODUCTS)){
    const demoProducts = [
      {id:1,name:'Pan Blanco',category:'Pan',qty:150,min:50,price:1.5,updated:new Date().toISOString()},
      {id:2,name:'Pan Integral',category:'Pan',qty:80,min:40,price:2.0,updated:new Date().toISOString()},
      {id:3,name:'Croissant',category:'Bollería',qty:45,min:30,price:2.5,updated:new Date().toISOString()},
      {id:4,name:'Pastel de Chocolate',category:'Pasteles',qty:12,min:5,price:25.0,updated:new Date().toISOString()},
      {id:5,name:'Galletas de Mantequilla',category:'Galletas',qty:200,min:100,price:0.75,updated:new Date().toISOString()},
      {id:6,name:'Harina',category:'Ingredientes',qty:25,min:50,price:1.2,updated:new Date().toISOString()},
    ];
    save(STORAGE_KEYS.PRODUCTS, demoProducts);
  }
  if(!load(STORAGE_KEYS.EMPLOYEES)){
    const demoEmployees = [
      {username:'admin', name:'Dueño', role:'admin', lastAccess:new Date().toISOString()},
      {username:'maria', name:'María García', role:'employee', lastAccess:new Date().toISOString()},
      {username:'juan', name:'Juan Pérez', role:'employee', lastAccess:new Date().toISOString()},
      {username:'ana', name:'Ana Martínez', role:'employee', lastAccess:new Date().toISOString()}
    ];
    save(STORAGE_KEYS.EMPLOYEES, demoEmployees);
  }
  if(!load(STORAGE_KEYS.ACTIVITIES)){
    save(STORAGE_KEYS.ACTIVITIES, []);
  }
}
ensureDemoData();

// --- Auth on login.html ---
function doLogin(username, password){
  const emps = load(STORAGE_KEYS.EMPLOYEES) || [];
  if(username==='admin' && password==='admin'){
    const user = {username:'admin', name:'Dueño', role:'admin', lastAccess:new Date().toISOString()};
    save(STORAGE_KEYS.CURRENT, user);
    recordActivity(user.username, 'Inicio sesión');
    location.href = 'dashboard_admin.html';
    return true;
  }
  const found = emps.find(e=>e.username===username);
  if(found && password==='123456'){
    found.lastAccess = new Date().toISOString();
    save(STORAGE_KEYS.EMPLOYEES, emps);
    save(STORAGE_KEYS.CURRENT, found);
    recordActivity(found.username, 'Inicio sesión');
    location.href = 'dashboard_empleado.html';
    return true;
  }
  return false;
}

// --- Activity logging ---
function recordActivity(user, action, product){
  const acts = load(STORAGE_KEYS.ACTIVITIES) || [];
  acts.unshift({user, action, product:product||'', timestamp:new Date().toISOString()});
  save(STORAGE_KEYS.ACTIVITIES, acts.slice(0,500));
}

// --- Products API ---
function listProducts(){ return load(STORAGE_KEYS.PRODUCTS) || []; }
function addProduct(data){
  const prods = listProducts();
  const id = prods.length ? Math.max(...prods.map(p=>p.id))+1 : 1;
  const toAdd = {...data, id:id, updated:new Date().toISOString()};
  prods.push(toAdd);
  save(STORAGE_KEYS.PRODUCTS, prods);
  const cur = load(STORAGE_KEYS.CURRENT) || {username:'?'}; recordActivity(cur.username, 'Agregó producto', toAdd.name);
  return toAdd;
}
function editProduct(id, data){
  const prods = listProducts();
  const idx = prods.findIndex(p=>p.id===id);
  if(idx===-1) return null;
  prods[idx] = {...prods[idx], ...data, updated:new Date().toISOString()};
  save(STORAGE_KEYS.PRODUCTS, prods);
  const cur = load(STORAGE_KEYS.CURRENT) || {username:'?'}; recordActivity(cur.username, 'Editó producto', prods[idx].name);
  return prods[idx];
}
function deleteProduct(id){
  const prods = listProducts();
  const idx = prods.findIndex(p=>p.id===id);
  if(idx===-1) return false;
  const removed = prods.splice(idx,1)[0];
  save(STORAGE_KEYS.PRODUCTS, prods);
  const cur = load(STORAGE_KEYS.CURRENT) || {username:'?'}; recordActivity(cur.username, 'Eliminó producto', removed.name);
  return true;
}

// --- Employees API (admin only) ---
function listEmployees(){ return load(STORAGE_KEYS.EMPLOYEES) || []; }
function addEmployee(emp){ const emps = listEmployees(); emps.push(emp); save(STORAGE_KEYS.EMPLOYEES, emps); recordActivity('admin', 'Agregó empleado', emp.username); }
function deleteEmployee(username){ let emps = listEmployees(); emps = emps.filter(e=>e.username!==username); save(STORAGE_KEYS.EMPLOYEES, emps); recordActivity('admin', 'Eliminó empleado', username); }

// --- Helpers for rendering pages ---
function formatDate(iso){ const d=new Date(iso); return d.toLocaleString(); }

// --- Page: dashboard_admin.html renderer ---
function renderAdminDashboard(){
  const cur = load(STORAGE_KEYS.CURRENT);
  if(!cur || cur.role!=='admin'){ location.href='login.html'; return; }
  document.getElementById('brandName').innerText = 'Panadería Dulce Hogar';
  document.getElementById('welcomeName').innerText = `Bienvenido, ${cur.name}`;

  const prods = listProducts();
  document.getElementById('statTotal').innerText = prods.length;
  document.getElementById('statLow').innerText = prods.filter(p=>p.qty<=p.min).length;
  document.getElementById('statItems').innerText = prods.reduce((s,p)=>s+p.qty,0);
  document.getElementById('statValue').innerText = '$' + prods.reduce((s,p)=>s + (p.qty * p.price),0).toFixed(2);

  const tbody = document.getElementById('productsTbody');
  tbody.innerHTML='';
  const q = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
  prods.filter(p=> !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>${p.category}</td><td>${p.qty}</td><td>${p.min}</td><td>$${p.price.toFixed(2)}</td><td>${formatDate(p.updated)}</td>
      <td>
        <button class="btn" onclick="openEdit(${p.id})">✏️</button>
        <button class="btn" onclick="handleDelete(${p.id})">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });

  const empWrap = document.getElementById('employeesWrap'); empWrap.innerHTML='';
  listEmployees().filter(e=>e.username!=='admin').forEach(e=>{
    const div = document.createElement('div'); div.className='emp-card';
    div.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${e.name}</strong><div style="color:#6b7280">@${e.username}</div></div><div><button class="btn btn-ghost" onclick="removeEmployee('${e.username}')">Eliminar</button></div></div>`;
    empWrap.appendChild(div);
  });

  const acts = load(STORAGE_KEYS.ACTIVITIES) || [];
  const actTbody = document.getElementById('activityTbody'); actTbody.innerHTML='';
  acts.forEach(a=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${a.user}</td><td>${a.action}</td><td>${a.product}</td><td>${formatDate(a.timestamp)}</td>`;
    actTbody.appendChild(tr);
  });
}

// --- Page: dashboard_empleado.html renderer ---
function renderEmployeeDashboard(){
  const cur = load(STORAGE_KEYS.CURRENT);
  if(!cur || cur.role!=='employee'){ location.href='login.html'; return; }
  document.getElementById('brandName').innerText = 'Panadería Dulce Hogar';
  document.getElementById('welcomeName').innerText = `Bienvenido, ${cur.name}`;

  const prods = listProducts();
  document.getElementById('statTotal').innerText = prods.length;
  document.getElementById('statLow').innerText = prods.filter(p=>p.qty<=p.min).length;
  document.getElementById('statItems').innerText = prods.reduce((s,p)=>s+p.qty,0);
  document.getElementById('statValue').innerText = '$' + prods.reduce((s,p)=>s + (p.qty * p.price),0).toFixed(2);

  const tbody = document.getElementById('productsTbodyEmp'); tbody.innerHTML='';
  const q = document.getElementById('searchInputEmp') ? document.getElementById('searchInputEmp').value.toLowerCase() : '';
  prods.filter(p=> !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>${p.category}</td><td>${p.qty}</td><td>${p.min}</td><td>$${p.price.toFixed(2)}</td><td>${formatDate(p.updated)}</td><td><button class="btn" onclick="openAddFromEmployee(${p.id})">+1</button></td>`;
    tbody.appendChild(tr);
  });
}

// --- Actions used by admin page ---
function handleDelete(id){
  if(!confirm('¿Eliminar producto?')) return;
  deleteProduct(id);
  renderAdminDashboard();
}
function openEdit(id){
  const prods = listProducts(); const p = prods.find(x=>x.id===id);
  if(!p) return alert('No encontrado');
  document.getElementById('modalTitle').innerText = 'Editar producto';
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodCat').value = p.category;
  document.getElementById('prodQty').value = p.qty;
  document.getElementById('prodMin').value = p.min;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('saveProdBtn').onclick = function(){ saveEdit(id); };
  document.getElementById('modal').style.display='flex';
}
function saveEdit(id){
  const data = {
    name: document.getElementById('prodName').value,
    category: document.getElementById('prodCat').value,
    qty: Number(document.getElementById('prodQty').value),
    min: Number(document.getElementById('prodMin').value),
    price: Number(document.getElementById('prodPrice').value)
  };
  editProduct(id, data);
  document.getElementById('modal').style.display='none';
  renderAdminDashboard();
}
function openAddModal(){
  document.getElementById('modalTitle').innerText = 'Agregar producto';
  document.getElementById('prodName').value = '';
  document.getElementById('prodCat').value = '';
  document.getElementById('prodQty').value = 1;
  document.getElementById('prodMin').value = 1;
  document.getElementById('prodPrice').value = 0;
  document.getElementById('saveProdBtn').onclick = saveNew;
  document.getElementById('modal').style.display='flex';
}
function saveNew(){
  const data = {
    name: document.getElementById('prodName').value,
    category: document.getElementById('prodCat').value,
    qty: Number(document.getElementById('prodQty').value),
    min: Number(document.getElementById('prodMin').value),
    price: Number(document.getElementById('prodPrice').value)
  };
  addProduct(data);
  document.getElementById('modal').style.display='none';
  renderAdminDashboard();
}

// employee add product action (from their view)
function openAddFromEmployee(id){
  const prods = listProducts(); const p = prods.find(x=>x.id===id);
  if(!p) return;
  p.qty = Number(p.qty) + 1;
  editProduct(p.id, {qty: p.qty});
  renderEmployeeDashboard();
  renderAdminDashboard();
}

// employee add via modal
function openAddModalEmployee(){
  document.getElementById('modalTitle').innerText = 'Agregar producto (Empleado)';
  document.getElementById('prodName').value = '';
  document.getElementById('prodCat').value = '';
  document.getElementById('prodQty').value = 1;
  document.getElementById('prodMin').value = 1;
  document.getElementById('prodPrice').value = 0;
  document.getElementById('saveProdBtn').onclick = saveNewFromEmployee;
  document.getElementById('modal').style.display='flex';
}
function saveNewFromEmployee(){
  const data = {
    name: document.getElementById('prodName').value,
    category: document.getElementById('prodCat').value,
    qty: Number(document.getElementById('prodQty').value),
    min: Number(document.getElementById('prodMin').value),
    price: Number(document.getElementById('prodPrice').value)
  };
  addProduct(data);
  document.getElementById('modal').style.display='none';
  renderEmployeeDashboard();
  renderAdminDashboard();
}

// admin remove employee
function removeEmployee(username){
  if(!confirm('Eliminar empleado?')) return;
  deleteEmployee(username);
  renderAdminDashboard();
}

// prompt add employee
function promptAddEmployee(){
  const username = prompt('Usuario (ej: juan)');
  if(!username) return;
  const name = prompt('Nombre completo (ej: Juan Pérez)');
  if(!name) return;
  addEmployee({username, name, role:'employee', lastAccess: new Date().toISOString()});
  renderAdminDashboard();
}

// logout
function logout(){ localStorage.removeItem(STORAGE_KEYS.CURRENT); location.href='login.html'; }

// on load helpers for pages
window.onload = function(){
  if(document.getElementById('brandName')){ renderAdminDashboard(); }
  if(document.getElementById('empRoot')){ renderEmployeeDashboard(); }

  const modal = document.getElementById('modal'); if(modal){ modal.querySelector('.close').onclick = ()=> modal.style.display='none'; }
  const first= document.querySelectorAll('.page'); if(first.length){ first.forEach(p=>p.style.display='none'); const el = document.querySelector('.page'); if(el) el.style.display='block'; }
}

