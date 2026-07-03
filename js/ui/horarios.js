import { HORARIOS } from "../config/horarios.js";

/**
 * Renderiza los horarios disponibles en la grilla visual de botones del HTML
 * @param {HTMLSelectElement} horaSelect - El select oculto del HTML
 * @param {number} numeroDia 
 * @param {Array<string>} ocupados 
 * @param {boolean} esHoy 
 * @param {number} horaActual 
 * @param {number} minutoActual 
 */
export function renderizarHorariosDisponibles(horaSelect, numeroDia, ocupados, esHoy, horaActual, minutoActual) {
    if (!horaSelect) return;
    
    // Obtenemos el contenedor visual de la grilla (el div del formulario)
    const horariosGrid = document.getElementById('horariosGrid');
    if (!horariosGrid) return;

    // Limpiamos tanto el select oculto como la grilla visual
    horaSelect.innerHTML = '<option value="" disabled selected>Elegí una hora</option>';
    horariosGrid.innerHTML = '';
    
    const turnosBase = (numeroDia === 6) ? HORARIOS.sabado : HORARIOS.semana;
    let horariosDisponibles = 0;

    turnosBase.forEach(slot => {
        const [hStr, mStr] = slot.split(':');
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);

        let yaPaso = false;
        if (esHoy) {
            if (h < horaActual || (h === horaActual && m <= minutoActual)) {
                yaPaso = true;
            }
        }

        // Si el horario está libre y no ha pasado:
        if (!ocupados.includes(slot) && !yaPaso) {
            // 1. Creamos la opción para el select oculto (así app.js puede leer el formulario al enviarlo)
            let opt = document.createElement('option');
            opt.value = slot;
            opt.textContent = `${slot} hs`;
            horaSelect.appendChild(opt);

            // 2. Creamos el BOTÓN VISUAL para la cuadrícula
            let btnHora = document.createElement('button');
            btnHora.type = 'button'; // Evita que envíe el formulario al clickearlo
            btnHora.className = 'btn-horario-slot'; // La clase CSS para darle estilo de bloque
            btnHora.textContent = `${slot} hs`;
            
            // Asignamos el evento de selección al hacer clic en el bloque
            btnHora.addEventListener('click', () => {
                // Quitamos la clase 'active' de cualquier otro botón seleccionado antes
                horariosGrid.querySelectorAll('.btn-horario-slot').forEach(b => b.classList.remove('active'));
                
                // Marcamos este botón como activo/seleccionado
                btnHora.classList.add('active');
                
                // Le pasamos el valor al select oculto para que app.js lo procese
                horaSelect.value = slot;
            });

            horariosGrid.appendChild(btnHora);
            horariosDisponibles++;
        }
    });

    // Si no quedan horarios libres en todo el día, mostramos el aviso en la grilla
    if (horariosDisponibles === 0) {
        horaSelect.innerHTML = '<option value="" disabled selected>No hay horarios disponibles</option>';
        horariosGrid.innerHTML = '<p class="mensaje-horario">⚠️ No quedan turnos disponibles para este día.</p>';
    }
}