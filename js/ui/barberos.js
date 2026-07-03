import { BARBEROS } from "../config/barberos.js";

/**
 * Inicializa las opciones del selector de barberos basadas en la configuración.
 * @param {HTMLSelectElement} selectElement 
 */
export function renderizarSelectBarberos(selectElement) {
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="" disabled selected>Elegí un Barbero</option>';
    
    Object.keys(BARBEROS).forEach(clave => {
        const barbero = BARBEROS[clave];
        const opt = document.createElement('option');
        opt.value = clave; // "Seba" o "Ale"
        opt.textContent = barbero.nombre;
        selectElement.appendChild(opt);
    });
}

/**
 * Renderiza dinámicamente los servicios disponibles en el select según el barbero elegido.
 * @param {string} barberoActual 
 * @param {HTMLSelectElement} servicioSelect 
 */
export function actualizarSelectServicios(barberoActual, servicioSelect) {
    if (!servicioSelect) return;
    
    const servicios = BARBEROS[barberoActual]?.servicios || [];

    servicioSelect.innerHTML = '<option value="" disabled selected>Elegí un servicio</option>';
    
    servicios.forEach(servicio => {
        let opt = document.createElement('option');
        opt.value = servicio.nombre;
        if (servicio.disponible) {
            opt.textContent = `${servicio.nombre} — ${servicio.precio}`;
        } else {
            opt.textContent = `${servicio.nombre} — (No disponible)`;
            opt.disabled = true;
            opt.style.color = "#888";
        }
        servicioSelect.appendChild(opt);
    });
}