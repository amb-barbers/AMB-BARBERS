/**
 * Muestra u oculta el overlay de carga.
 * @param {HTMLElement} overlay 
 * @param {boolean} mostrar 
 */
export function toggleLoading(overlay, mostrar) {
    if (overlay) {
        overlay.style.display = mostrar ? 'flex' : 'none';
    }
}

/**
 * Muestra el modal de éxito en pantalla.
 * @param {HTMLElement} modal 
 */
export function mostrarModalExito(modal) {
    if (modal) {
        modal.style.display = 'flex';
    }
}