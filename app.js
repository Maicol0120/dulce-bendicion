// --- Funciones de almacenamiento ---
const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
const productos = JSON.parse(localStorage.getItem('productos')) || [];

const pedidosList = document.getElementById('pedidos');
const productosList = document.getElementById('productos');

// Mostrar datos al cargar
mostrarPedidos();
mostrarProductos();

// --- Agregar Pedido ---
document.getElementById('pedidoForm').addEventListener('submit', e => {
  e.preventDefault();
  const cliente = document.getElementById('cliente').value;
  const producto = document.getElementById('producto').value;
  const cantidad = parseInt(document.getElementById('cantidad').value);

  pedidos.push({ cliente, producto, cantidad, fecha: new Date().toLocaleString() });
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  mostrarPedidos();
  e.target.reset();
});

function mostrarPedidos() {
  pedidosList.innerHTML = '';
  pedidos.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `Cliente: ${p.cliente} | Producto: ${p.producto} | Cantidad: ${p.cantidad} | Fecha: ${p.fecha}`;
    pedidosList.appendChild(li);
  });
}

// --- Agregar Producto ---
document.getElementById('productoForm').addEventListener('submit', e => {
  e.preventDefault();
  const nombre = document.getElementById('nombreProducto').value;
  const stock = parseInt(document.getElementById('stock').value);

  productos.push({ nombre, stock });
  localStorage.setItem('productos', JSON.stringify(productos));
  mostrarProductos();
  e.target.reset();
});

function mostrarProductos() {
  productosList.innerHTML = '';
  productos.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.nombre} - Stock: ${p.stock}`;
    productosList.appendChild(li);
  });
}
