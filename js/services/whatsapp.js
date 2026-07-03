export function enviarNotificacionWhatsApp(barberoNombre, numeroTelefono, clienteNombre, servicio, precio, fecha, hora) {
    const mensaje = `Hola *AMB BARBERS*, hay un NUEVO TURNO reservado:%0A%0A` +
                    `👤 *Cliente:* ${clienteNombre}%0A` +
                    `💈 *Barbero:* ${barberoNombre}%0A` +
                    `✂️ *Servicio:* ${servicio}%0A` +
                    `💰 *Precio:* ${precio}%0A` +
                    `📅 *Fecha:* ${fecha}%0A` +
                    `⏰ *Hora:* ${hora} hs%0A%0A` +
                    `_Confirmar disponibilidad en el panel._`;

    window.location.href = `https://wa.me/${numeroTelefono}?text=${mensaje}`;
}