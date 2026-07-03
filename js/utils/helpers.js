/**
 * Limpia y valida que un número de teléfono de WhatsApp solo contenga números.
 * @param {string} telefono 
 * @returns {string}
 */
export function limpiarNumeroWhatsApp(telefono) {
    return telefono.replace(/\D/g, ''); // Elimina cualquier caracter que no sea un número
}

/**
 * Valida si un texto está vacío o contiene solo espacios.
 * @param {string} texto 
 * @returns {boolean}
 */
export function esTextoVacio(texto) {
    return !texto || texto.trim().length === 0;
}