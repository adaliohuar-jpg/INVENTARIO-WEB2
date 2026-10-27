const claveBienes = "bienesInventario";
const claveMovimientos = "movimientosInventario";
let errorLecturaDatos = false;
let bienes = cargarDatos(claveBienes, []);
let movimientos = cargarDatos(claveMovimientos, []);
let codigoEnEdicion = null;

const formularioBien = document.getElementById("formulario-bien");
const formularioMovimiento = document.getElementById("formulario-movimiento");
const listaBienes = document.getElementById("lista-bienes");
const listaMovimientos = document.getElementById("lista-movimientos");
const botonGuardarBien = formularioBien.querySelector("button[type='submit']");

const ejemplos = [
	{ codigo: "FT-001", nombre: "Computadora", categoria: "Informática", modelo: "Lenovo ThinkCentre", cantidad: 12, ubicacion: "Sala de computación", area: "Secundaria", responsable: "Prof. Ana Pérez", estado: "Bueno", situacion: "Asignado", fecha: "2024-02-15", observaciones: "" },
	{ codigo: "FT-002", nombre: "Escritorio", categoria: "Mobiliario", modelo: "Estándar", cantidad: 25, ubicacion: "Aula 3", area: "Primaria", responsable: "Prof. Luis Rojas", estado: "Regular", situacion: "Asignado", fecha: "2023-08-10", observaciones: "" },
	{ codigo: "FT-003", nombre: "Balón de fútbol", categoria: "Deportivo", modelo: "Clásico", cantidad: 8, ubicacion: "Depósito", area: "Educación Física", responsable: "Prof. Marta Silva", estado: "Bueno", situacion: "Disponible", fecha: "2025-01-20", observaciones: "" }
];

function cargarDatos(clave, valorInicial) {
	try {
		const guardado = localStorage.getItem(clave);
		if (guardado === null) return valorInicial;
		const datos = JSON.parse(guardado);
		if (!Array.isArray(datos)) throw new Error(`Los datos de ${clave} no tienen un formato válido.`);
		return datos;
	} catch (error) {
		errorLecturaDatos = true;
		console.error(`No se pudieron leer los datos guardados (${clave}). Se conservan sin sobrescribir.`, error);
		return valorInicial;
	}
}

function guardarDatos() {
	localStorage.setItem(claveBienes, JSON.stringify(bienes));
	localStorage.setItem(claveMovimientos, JSON.stringify(movimientos));
}

function escapar(texto) {
	return String(texto || "").replace(/[&<>"']/g, caracter => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[caracter]));
}

function mostrarBienes() {
	const busqueda = document.getElementById("buscar-bien").value.toLowerCase();
	const categoria = document.getElementById("filtro-categoria").value;
	const estado = document.getElementById("filtro-estado").value;
	const situacion = document.getElementById("filtro-situacion").value;
	const filtrados = bienes.filter(bien => {
		const coincideTexto = `${bien.codigo} ${bien.nombre}`.toLowerCase().includes(busqueda);
		return coincideTexto && (!categoria || bien.categoria === categoria) && (!estado || bien.estado === estado) && (!situacion || bien.situacion === situacion);
	});
	listaBienes.innerHTML = filtrados.map(bien => `<tr>
		<td>${escapar(bien.codigo)}</td><td>${escapar(bien.nombre)}</td><td>${escapar(bien.categoria)}</td><td>${escapar(bien.modelo)}</td>
		<td>${escapar(bien.cantidad)}</td><td>${escapar(bien.ubicacion)}</td><td>${escapar(bien.area)}</td><td>${escapar(bien.responsable)}</td>
		<td>${escapar(bien.estado)}</td><td>${escapar(bien.situacion)}</td><td>${escapar(bien.fecha)}</td>
		<td><button type="button" class="ver-bien" data-codigo="${escapar(bien.codigo)}">Ver</button>
		<button type="button" class="editar-bien" data-codigo="${escapar(bien.codigo)}">Editar</button>
		<button type="button" class="eliminar-bien" data-codigo="${escapar(bien.codigo)}">Eliminar</button></td>
	</tr><tr class="resumen-bien"><td colspan="12"><strong>TOTAL REGISTRADO: ${escapar(bien.totalCantidad || bien.cantidad)} unidades de ${escapar(bien.nombre)}</strong>${mensajeUltimoMovimiento(bien)}</td></tr>`).join("");
	actualizarResumen();
}

function mensajeUltimoMovimiento(bien) {
	const historial = movimientos.filter(movimiento => movimiento.codigo === bien.codigo);
	const ultimo = historial[historial.length - 1];
	if (!ultimo) return "";
	const accion = ultimo.tipo === "Entrada" ? "ingresaron" : ultimo.tipo === "Salida" ? "se movieron" : `se registró ${ultimo.tipo.toLowerCase()}`;
	const destino = ultimo.destino ? ` a ${ultimo.destino}` : "";
	const responsable = ultimo.responsable ? ` por ${ultimo.responsable}` : "";
	return ` <span>Último movimiento: ${accion} ${ultimo.cantidad || 0} unidades de ${escapar(bien.nombre)}${destino}${responsable}.</span>`;
}

function mostrarMovimientos() {
	listaMovimientos.innerHTML = movimientos.map(movimiento => `<tr>
		<td>${escapar(movimiento.fecha)}</td><td>${escapar(movimiento.codigo)}</td><td>${escapar(movimiento.nombre)}</td>
		<td>${escapar(movimiento.tipo)}</td><td>${escapar(movimiento.cantidad)}</td><td>${escapar(movimiento.origen)}</td><td>${escapar(movimiento.destino)}</td>
		<td>${escapar(movimiento.responsable)}</td><td>${escapar(movimiento.observacion)}</td>
	</tr>`).join("");
}

function actualizarResumen() {
	const total = lista => lista.reduce((suma, bien) => suma + Number(bien.totalCantidad || bien.cantidad || 0), 0);
	document.getElementById("total-bienes").textContent = total(bienes);
	document.getElementById("bienes-disponibles").textContent = bienes.filter(bien => bien.situacion === "Disponible").reduce((suma, bien) => suma + Number(bien.cantidad || 0), 0);
	document.getElementById("bienes-asignados").textContent = bienes.filter(bien => bien.situacion === "Asignado").reduce((suma, bien) => suma + Number(bien.cantidad || 0), 0);
	document.getElementById("bienes-mantenimiento").textContent = total(bienes.filter(bien => bien.estado === "En mantenimiento"));
	document.getElementById("bienes-danados").textContent = total(bienes.filter(bien => bien.estado === "Dañado"));
	mostrarAlertas(); mostrarCategorias();
}

function mostrarAlertas() {
	const alertas = [];
	if (bienes.some(bien => bien.estado === "Dañado")) alertas.push("Hay bienes dañados.");
	if (bienes.some(bien => bien.estado === "En mantenimiento")) alertas.push("Hay bienes en mantenimiento.");
	if (bienes.some(bien => Number(bien.cantidad) <= 2)) alertas.push("Hay bienes con cantidad baja (2 o menos).");
	if (bienes.some(bien => bien.situacion === "Asignado")) alertas.push("Hay bienes asignados a un área o responsable.");
	document.getElementById("lista-alertas").innerHTML = alertas.length ? alertas.map(escapar).map(alerta => `<li>${alerta}</li>`).join("") : "<li>Sin alertas</li>";
}

function mostrarCategorias() {
	const categorias = {};
	bienes.forEach(bien => categorias[bien.categoria] = (categorias[bien.categoria] || 0) + Number(bien.totalCantidad || bien.cantidad || 0));
	const mayor = Math.max(...Object.values(categorias), 1);
	document.getElementById("distribucion-categorias").innerHTML = Object.entries(categorias).map(([categoria, cantidad]) => `<div class="barra-categoria"><span>${escapar(categoria)}</span><i style="width:${cantidad / mayor * 100}%"></i><b>${cantidad}</b></div>`).join("") || "<span>Sin datos</span>";
}

function datosDelFormulario(formulario) {
	const datos = new FormData(formulario);
	return Object.fromEntries(datos.entries());
}

function guardarBien(evento) {
	evento.preventDefault();
	const bien = datosDelFormulario(formularioBien);
	bien.codigo = bien.codigo.trim();
	bien.nombre = bien.nombre.trim();
	bien.ubicacion = bien.ubicacion.trim();
	bien.cantidad = Number(bien.cantidad);
	if (!bien.codigo || !bien.nombre || !bien.categoria || !bien.ubicacion || !Number.isInteger(bien.cantidad) || bien.cantidad < 1) {
		return alert("Completa los campos obligatorios con datos válidos.");
	}
	if (codigoEnEdicion) {
		const posicion = bienes.findIndex(item => item.codigo === codigoEnEdicion);
		const codigoRepetido = bienes.some(item => item.codigo === bien.codigo && item.codigo !== codigoEnEdicion);
		if (codigoRepetido) return alert("El código ya está registrado.");
		if (posicion !== -1) bienes[posicion] = bien;
		codigoEnEdicion = null;
	} else {
		if (bienes.some(item => item.codigo === bien.codigo)) return alert("El código ya está registrado.");
		bien.totalCantidad = bien.cantidad;
		bienes.push(bien);
	}
	guardarDatos();
	formularioBien.reset();
	botonGuardarBien.textContent = "Guardar bien";
	mostrarBienes();
}

function llenarFormulario(codigo) {
	const bien = bienes.find(item => item.codigo === codigo);
	if (!bien) return;
	codigoEnEdicion = codigo;
	botonGuardarBien.textContent = "Actualizar bien";
	Object.keys(bien).forEach(campo => {
		if (formularioBien.elements[campo]) formularioBien.elements[campo].value = bien[campo];
	});
	document.getElementById("registrar").scrollIntoView({ behavior: "smooth" });
}

function consultarBien(codigo) {
	const bien = bienes.find(item => item.codigo === codigo);
	if (!bien) return;
	const historial = movimientos.filter(movimiento => movimiento.codigo.toLowerCase() === codigo.toLowerCase());
	const detalle = Object.entries(bien).map(([campo, valor]) => `${campo}: ${valor}`).join("\n");
	const seguimiento = historial.length ? historial.map(movimiento => `\n${movimiento.fecha} | ${movimiento.tipo} | cantidad: ${movimiento.cantidad}\nOrigen: ${movimiento.origen} | Destino: ${movimiento.destino}\nResponsable: ${movimiento.responsable}\nObservación: ${movimiento.observacion}`).join("\n") : "\n\nSin movimientos registrados.";
	alert(`${detalle}\n\nHISTORIAL DE MOVIMIENTOS${seguimiento}`);
}

function eliminarBien(codigo) {
	const bien = bienes.find(item => item.codigo === codigo);
	if (!bien || !confirm(`¿Eliminar el bien ${bien.nombre}?`)) return;
	bienes = bienes.filter(item => item.codigo !== codigo);
	guardarDatos();
	mostrarBienes();
}

function registrarMovimiento(evento) {
	evento.preventDefault();
	const movimiento = datosDelFormulario(formularioMovimiento);
	movimiento.codigo = movimiento["codigo-movimiento"];
	movimiento.tipo = movimiento["tipo-movimiento"];
	movimiento.fecha = movimiento["fecha-movimiento"];
	movimiento.cantidad = movimiento["cantidad-movimiento"];
	movimiento.responsable = movimiento["responsable-movimiento"];
	movimiento.observacion = movimiento["observacion-movimiento"];
	const bien = bienes.find(item => item.codigo.toLowerCase() === movimiento.codigo.trim().toLowerCase());
	movimiento.cantidad = Number(movimiento.cantidad);
	if (!bien) return alert("El código no corresponde a un bien registrado.");
	if (!Number.isInteger(movimiento.cantidad) || movimiento.cantidad < 1) return alert("La cantidad debe ser un número entero positivo.");
	if (movimiento.tipo === "Salida" && movimiento.cantidad > Number(bien.cantidad)) return alert(`No hay suficiente cantidad disponible. Disponible: ${bien.cantidad}.`);
	if (movimiento.tipo === "Entrada") { bien.cantidad = Number(bien.cantidad) + movimiento.cantidad; bien.totalCantidad = Number(bien.totalCantidad || bien.cantidad) + movimiento.cantidad; }
	if (movimiento.tipo === "Salida") bien.cantidad = Number(bien.cantidad) - movimiento.cantidad;
	if (movimiento.tipo === "Asignación") bien.situacion = "Asignado";
	if (movimiento.tipo === "Devolución") bien.situacion = "Disponible";
	if (movimiento.tipo === "Traslado") bien.ubicacion = movimiento.destino.trim() || bien.ubicacion;
	if (movimiento.tipo === "Mantenimiento") bien.estado = "En mantenimiento";
	movimiento.codigo = bien.codigo; movimiento.nombre = bien.nombre;
	movimientos.push(movimiento);
	guardarDatos();
	formularioMovimiento.reset();
	mostrarMovimientos(); mostrarBienes();
}

function completarNombreMovimiento() {
	const codigo = document.getElementById("codigo-movimiento").value.trim().toLowerCase();
	const bien = bienes.find(item => item.codigo.toLowerCase() === codigo);
	document.getElementById("nombre-movimiento").value = bien ? bien.nombre : "";
}

function colocarFechaActual() {
	const fecha = new Date().toISOString().split("T")[0];
	document.getElementById("fecha-movimiento").value = fecha;
}

function manejarAcciones(evento) {
	const boton = evento.target.closest("button");
	if (!boton) return;
	const codigo = boton.dataset.codigo;
	if (boton.classList.contains("ver-bien")) consultarBien(codigo);
	if (boton.classList.contains("editar-bien")) llenarFormulario(codigo);
	if (boton.classList.contains("eliminar-bien")) eliminarBien(codigo);
}

function cargarEjemplos() {
	if (!errorLecturaDatos && localStorage.getItem(claveBienes) === null && !bienes.length) {
		bienes = ejemplos;
		guardarDatos();
	}
}

function prepararTotales() {
	bienes.forEach(bien => {
		if (bien.totalCantidad) return;
		const salidas = movimientos.filter(movimiento => movimiento.codigo === bien.codigo && movimiento.tipo === "Salida").reduce((suma, movimiento) => suma + Number(movimiento.cantidad || 0), 0);
		const entradas = movimientos.filter(movimiento => movimiento.codigo === bien.codigo && movimiento.tipo === "Entrada").reduce((suma, movimiento) => suma + Number(movimiento.cantidad || 0), 0);
		bien.totalCantidad = Number(bien.cantidad || 0) + salidas - entradas;
	});
	guardarDatos();
}

formularioBien.addEventListener("submit", guardarBien);
formularioBien.addEventListener("reset", () => { codigoEnEdicion = null; botonGuardarBien.textContent = "Guardar bien"; });
formularioMovimiento.addEventListener("submit", registrarMovimiento);
formularioMovimiento.addEventListener("reset", colocarFechaActual);
document.getElementById("codigo-movimiento").addEventListener("input", completarNombreMovimiento);
listaBienes.addEventListener("click", manejarAcciones);
["imprimir-inventario"].forEach(id => document.getElementById(id).addEventListener("click", () => window.print()));
["buscar-bien", "filtro-categoria", "filtro-estado", "filtro-situacion"].forEach(id => document.getElementById(id).addEventListener("input", mostrarBienes));

cargarEjemplos();
if (!errorLecturaDatos) prepararTotales();
mostrarBienes();
mostrarMovimientos();
colocarFechaActual();
document.getElementById("fecha").max = new Date().toISOString().split("T")[0];
