import { renderizarSelectBarberos, actualizarSelectServicios } from "./ui/barberos.js";
import { renderizarHorariosDisponibles } from "./ui/horarios.js";
import { toggleLoading, mostrarModalExito } from "./ui/formulario.js";
import { obtenerHorariosOcupados } from "./services/disponibilidad.js";
import { crearReserva } from "./services/reservas.js";
import { enviarNotificacionWhatsApp } from "./services/whatsapp.js";
import { BARBEROS } from './config/barberos.js';
import { obtenerFechaHoyString, crearFechaLocal } from "./utils/fechas.js";
import { esTextoVacio } from "./utils/helpers.js";

// ELEMENTOS DEL DOM
const formulario = document.getElementById('turnoForm'); 
const loadingOverlay = document.getElementById('loadingOverlay');
const fechaInput = document.getElementById('fecha');
const horaSelect = document.getElementById('hora');
const servicioSelect = document.getElementById('servicio');
const selectBarbero = document.getElementById('barbero');
const tarjetasBarbero = document.querySelectorAll('.barbero-card');

// Control de fecha mínima usando la utilidad de fechas
const fechaHoyStr = obtenerFechaHoyString();
fechaInput.min = fechaHoyStr;

// 1. Inicializar combo de barberos dinámicamente
renderizarSelectBarberos(selectBarbero);
actualizarSelectServicios(selectBarbero.value, servicioSelect);

// Escuchador de cambios en el barbero
selectBarbero.addEventListener('change', (e) => {
    const barberoElegido = e.target.value;
    tarjetasBarbero.forEach(tarjeta => {
        tarjeta.classList.toggle('active', tarjeta.dataset.barbero === barberoElegido);
    });
    actualizarSelectServicios(barberoElegido, servicioSelect);
    if (fechaInput.value) cargarHorarios();
});

// Tarjetas visuales
tarjetasBarbero.forEach(tarjeta => {
    tarjeta.addEventListener('click', () => {
        selectBarbero.value = tarjeta.dataset.barbero;
        selectBarbero.dispatchEvent(new Event('change'));
    });
});

// Carga de horarios delegando a la UI
async function cargarHorarios() {
    const fecha = fechaInput.value;
    const barberoSeleccionado = selectBarbero.value;
    if (!fecha || !barberoSeleccionado) return;

    // Uso de la utilidad para crear la fecha local de forma correcta
    const fechaObj = crearFechaLocal(fecha);
    if (fechaObj.getDay() === 0) {
        horaSelect.innerHTML = '<option value="" disabled selected>Cerrado los Domingos</option>';
        horaSelect.disabled = true;
        return;
    }

    horaSelect.innerHTML = '<option>Consultando disponibilidad...</option>';
    horaSelect.disabled = true;
    
    try {
        const ocupados = await obtenerHorariosOcupados(fecha, barberoSeleccionado);
        const ahora = new Date();
        
        // Llamada a nuestro archivo UI de horarios
        renderizarHorariosDisponibles(
            horaSelect, 
            fechaObj.getDay(), 
            ocupados, 
            (fecha === fechaHoyStr), 
            ahora.getHours(), 
            ahora.getMinutes()
        );
    } catch (e) { 
        console.error(e);
        horaSelect.innerHTML = '<option>Error al cargar</option>';
    }
}

fechaInput.addEventListener('change', cargarHorarios);

// Envío de datos
formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const servicioNombre = servicioSelect.value; 
    const fecha = fechaInput.value;
    const hora = horaSelect.value;
    const barbero = selectBarbero.value;

    // Validación usando el helper para verificar campos vacíos
    if (esTextoVacio(nombre) || esTextoVacio(whatsapp) || esTextoVacio(servicioNombre) || esTextoVacio(fecha) || esTextoVacio(hora) || esTextoVacio(barbero)) {
        alert("⚠️ Por favor, completa todos los campos.");
        return;
    }

    const serviciosDelBarbero = BARBEROS[barbero]?.servicios || [];
    const servicioInfo = serviciosDelBarbero.find(s => s.nombre === servicioNombre);
    const precioFinal = servicioInfo ? servicioInfo.precio : "A convenir";
    const numeroTelefono = BARBEROS[barbero]?.telefono || "5492643212176";

    try {
        toggleLoading(loadingOverlay, true);

        await crearReserva({ nombre, whatsapp, barbero, servicio: servicioNombre, precio: precioFinal, fecha, hora });
        
        toggleLoading(loadingOverlay, false);
        mostrarModalExito(document.getElementById('modal-exito'));
        
        setTimeout(() => {
            enviarNotificacionWhatsApp(barbero, numeroTelefono, nombre, servicioNombre, precioFinal, fecha, hora);
        }, 1500);

    } catch (error) {
        toggleLoading(loadingOverlay, false);
        alert("Error al reservar. Intentá de nuevo.");
        console.error(error);
    }
});