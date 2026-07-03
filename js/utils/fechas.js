/**
 * Obtiene la fecha actual en formato de string 'YYYY-MM-DD' de manera local.
 * @returns {string}
 */
export function obtenerFechaHoyString() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

/**
 * Convierte un string de fecha 'YYYY-MM-DD' en un objeto Date configurado a las 00:00.
 * Esto evita problemas de desfase por zonas horarias al usar New Date(fecha).
 * @param {string} fechaStr 
 * @returns {Date}
 */
export function crearFechaLocal(fechaStr) {
    return new Date(fechaStr + 'T00:00:00');
}