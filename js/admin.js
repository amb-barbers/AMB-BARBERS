// >>> CORREGIDO: Ruta de importación alineada con tu carpeta firebase/ <<<
import { db } from './firebase/firebase-config.js';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- MEJORA DE SONIDO ---
const sonidoTurno = new Audio('/assets/audio/notificacion.mp3');
let primeraCarga = true; 
// ------------------------

// Estado global para el filtrado por barbero (Unificado a Alejandro)
window.barberoActivo = 'Todos'; 
let arrayReservasGlobal = []; // Guarda las reservas para recalcular el resumen dinámicamente

// LÓGICA DE FILTRADO + FILTRO BARBERO + RESUMEN SEMANAL
window.filtrarVista = (tipo) => {
    document.getElementById('btn-ver-turnos').classList.toggle('activo', tipo === 'turnos');
    document.getElementById('btn-ver-bloqueos').classList.toggle('activo', tipo === 'bloqueos');
    
    const btnResumen = document.getElementById('btn-ver-resumen');
    if (btnResumen) btnResumen.classList.toggle('activo', tipo === 'resumen');

    // Control de contenedores independientes para no pesar la vista
    const seccionResumen = document.getElementById('seccion-resumen');
    const contenedorTabla = document.getElementById('contenedor-tabla-general');

    if (tipo === 'resumen') {
        if (seccionResumen) seccionResumen.style.display = 'block';
        if (contenedorTabla) contenedorTabla.style.display = 'none';
        // Renderiza las tarjetas usando los datos globales actuales
        calcularYMostrarResumenSemanal(arrayReservasGlobal);
    } else {
        if (seccionResumen) seccionResumen.style.display = 'none';
        if (contenedorTabla) contenedorTabla.style.display = 'block';
        window.actualizarFiltrosVisuales();
    }
};

// Función para cambiar la pestaña del barbero visualizado (Corregido para Alejandro)
window.cambiarBarberoVisualizacion = (barbero) => {
    window.barberoActivo = barbero;
    
    // Cambiar clases activas en los botones de barbero
    document.getElementById('btn-filtro-todos').classList.toggle('activo', barbero === 'Todos');
    document.getElementById('btn-filtro-seba').classList.toggle('activo', barbero === 'Seba');
    
    // Maneja de forma segura si tu ID en el HTML es btn-filtro-ale o btn-filtro-alejandro
    const btnAlejandro = document.getElementById('btn-filtro-alejandro') || document.getElementById('btn-filtro-ale');
    if (btnAlejandro) btnAlejandro.classList.toggle('activo', barbero === 'Alejandro');

    // Cambiar etiquetas dinámicas en los labels de las estadísticas
    const sufijo = barbero === 'Todos' ? ' (Total)' : ` (${barbero})`;
    document.getElementById('labelHoy').innerText = `Turnos Hoy` + sufijo;
    document.getElementById('labelMes').innerText = `Cortes Realizados` + sufijo;
    document.getElementById('labelCaja').innerText = `Caja Hoy (Est.)` + sufijo;

    // Redibujar la vista activa o actualizar el resumen si está parado en la pestaña resumen
    const seccionResumen = document.getElementById('seccion-resumen');
    if (seccionResumen && seccionResumen.style.display === 'block') {
        calcularYMostrarResumenSemanal(arrayReservasGlobal);
    } else {
        window.actualizarFiltrosVisuales();
    }
};

// Procesa de forma unificada qué filas mostrar u ocultar en base al tipo y barbero
window.actualizarFiltrosVisuales = () => {
    let tipo = 'turnos';
    if (document.getElementById('btn-ver-bloqueos')?.classList.contains('activo')) tipo = 'bloqueos';
    if (document.getElementById('btn-ver-resumen')?.classList.contains('activo')) tipo = 'resumen';

    if (tipo === 'resumen') return; // Si es resumen, la tabla no procesa nada

    const hoyStr = new Date().toISOString().split('T')[0];
    const filas = document.querySelectorAll('#tabla-turnos tr');

    filas.forEach(fila => {
        const estado = fila.getAttribute('data-estado');
        const fecha = fila.getAttribute('data-fecha');
        const barberoFila = fila.getAttribute('data-barbero');
        
        const esBloqueado = estado === 'bloqueado';
        const esCompletado = estado === 'completado';
        const esPasado = fecha < hoyStr;

        // Filtro por barbero estricto con la variable global
        const coincideBarbero = (window.barberoActivo === 'Todos' || barberoFila === window.barberoActivo);

        fila.style.display = 'none';

        if (coincideBarbero) {
            if (tipo === 'turnos') {
                if (!esBloqueado && !esCompletado && !esPasado) fila.style.display = '';
            } else if (tipo === 'bloqueos') {
                if (esBloqueado && !esPasado) fila.style.display = '';
            }
        }
    });
};

// FUNCIÓN DE LOGICA FINANCIERA SEMANAL (CORREGIDA AL 100%)
function calcularYMostrarResumenSemanal(todasLasReservas) {
    const semanaGrid = document.getElementById('semanaGrid');
    if (!semanaGrid) return;

    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const datosDias = {};
    
    diasSemana.forEach(dia => {
        datosDias[dia] = { cortes: 0, totalDinero: 0 };
    });

    // Calcular el rango real de la semana actual en hora local argentina
    const hoy = new Date();
    const diaActual = hoy.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const distanciaLunes = diaActual === 0 ? -6 : 1 - diaActual; 
    
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() + distanciaLunes);
    inicioSemana.setHours(0,0,0,0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 5); // Hasta el Sábado
    finSemana.setHours(23,59,59,999);

    todasLasReservas.forEach(reserva => {
        if (reserva.estado === 'completado') {
            const coincideBarbero = (window.barberoActivo === 'Todos' || reserva.barbero === window.barberoActivo);
            
            if (coincideBarbero && reserva.fecha) {
                // CORRECCIÓN CLAVE: Parsear YYYY-MM-DD usando enteros para evitar desvíos UTC de JS
                const partes = reserva.fecha.split('-');
                if (partes.length === 3) {
                    const anio = parseInt(partes[0], 10);
                    const mes = parseInt(partes[1], 10) - 1; // Enero es 0
                    const dia = parseInt(partes[2], 10);
                    
                    const fechaReserva = new Date(anio, mes, dia, 12, 0, 0); // Forzado a mediodía local
                    
                    if (fechaReserva >= inicioSemana && fechaReserva <= finSemana) {
                        const numeroDia = fechaReserva.getDay(); // 1 = Lunes, ..., 6 = Sábado
                        if (numeroDia >= 1 && numeroDia <= 6) {
                            const nombreDia = diasSemana[numeroDia - 1];
                            const precioLimpio = parseInt(String(reserva.precio || "0").replace(/[^0-9]/g, '')) || 0;
                            
                            datosDias[nombreDia].cortes += 1;
                            datosDias[nombreDia].totalDinero += precioLimpio;
                        }
                    }
                }
            }
        }
    });

    semanaGrid.innerHTML = '';
    let granTotalSemanal = 0;

    diasSemana.forEach(dia => {
        const info = datosDias[dia];
        granTotalSemanal += info.totalDinero;

        const tarjetaDia = document.createElement('div');
        tarjetaDia.className = `tarjeta-dia-resumen ${info.cortes > 0 ? 'con-actividad' : ''}`;
        
        tarjetaDia.innerHTML = `
            <div class="header-tarjeta-dia">${dia}</div>
            <div class="cuerpo-tarjeta-dia">
                <p>✂️ <span>${info.cortes}</span> cortes</p>
                <h3>💰 $${info.totalDinero.toLocaleString('es-AR')}</h3>
            </div>
        `;
        semanaGrid.appendChild(tarjetaDia);
    });

    const totalBox = document.createElement('div');
    totalBox.className = 'tarjeta-gran-total-semanal';
    totalBox.innerHTML = `
        <div class="header-tarjeta-dia global">🔥 TOTAL RECAUDACIÓN SEMANAL</div>
        <div class="cuerpo-tarjeta-dia">
            <h2>$${granTotalSemanal.toLocaleString('es-AR')}</h2>
        </div>
    `;
    semanaGrid.appendChild(totalBox);
}

// FUNCIÓN PARA EXPORTAR LOS CORTES DE LA SEMANA A EXCEL (CSV)
function exportarSemanaACSV() {
    const hoy = new Date();
    const diaActual = hoy.getDay();
    const distanciaLunes = diaActual === 0 ? -6 : 1 - diaActual;
    
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() + distanciaLunes);
    inicioSemana.setHours(0,0,0,0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 5);
    finSemana.setHours(23,59,59,999);

    const turnosExportar = arrayReservasGlobal.filter(reserva => {
        if (reserva.estado !== 'completado' || !reserva.fecha) return false;
        
        const coincideBarbero = (window.barberoActivo === 'Todos' || reserva.barbero === window.barberoActivo);
        if (!coincideBarbero) return false;

        const partes = reserva.fecha.split('-');
        if (partes.length === 3) {
            const anio = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const dia = parseInt(partes[2], 10);
            const fechaReserva = new Date(anio, mes, dia, 12, 0, 0);
            return fechaReserva >= inicioSemana && fechaReserva <= finSemana;
        }
        return false;
    });

    if (turnosExportar.length === 0) {
        alert("No hay cortes registrados en esta semana para exportar.");
        return;
    }

    let csvContent = "\uFEFF"; 
    csvContent += "Fecha;Hora;Barbero;Cliente;WhatsApp;Servicio;Precio\n";

    turnosExportar.forEach(t => {
        const fila = [
            t.fecha,
            t.hora,
            t.barbero,
            (t.nombre || '').replace(/;/g, ','), 
            t.whatsapp,
            (t.servicio || '').replace(/;/g, ','),
            t.precio
        ];
        csvContent += fila.join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const nombreArchivo = `Reporte_AMB_Semana_${window.barberoActivo}.csv`;
    link.setAttribute("download", nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', () => {
    
    // PARCHE IPHONE AUDIO
    document.body.addEventListener('click', () => {
        sonidoTurno.play().then(() => {
            sonidoTurno.pause();
            sonidoTurno.currentTime = 0;
        }).catch(e => console.log("Audio preparado para iPhone"));
    }, { once: true });

    const tablaBody = document.getElementById('tabla-turnos');
    if (!tablaBody) return;

    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0]; 

    const horaInicio = document.getElementById('horaInicio');
    const horaFin = document.getElementById('horaFin');
    
    if (horaInicio && horaFin) {
        horaInicio.innerHTML = '<option value="" disabled selected>Desde</option>';
        horaFin.innerHTML = '<option value="" disabled selected>Hasta</option>';
        for (let h = 9; h <= 21; h++) {
            let hora = `${h.toString().padStart(2, '0')}:00`;
            horaInicio.innerHTML += `<option value="${hora}">${hora}</option>`;
            horaFin.innerHTML += `<option value="${hora}">${hora}</option>`;
        }
    }

    // === VALIDACIÓN DE SELECCIÓN EN EL CALENDARIO (PREVENTIVO DOMINGOS) ===
    const inputFechaBloqueo = document.getElementById('fechaBloqueo');
    if (inputFechaBloqueo) {
        inputFechaBloqueo.addEventListener('change', (e) => {
            const fechaSeleccionada = e.target.value;
            if (!fechaSeleccionada) return;

            const partes = fechaSeleccionada.split('-');
            const anio = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const dia = parseInt(partes[2], 10);
            const fechaEvaluar = new Date(anio, mes, dia);

            // 0 representa el Domingo en JavaScript
            if (fechaEvaluar.getDay() === 0) {
                alert("¡DÍA CERRADO! La barbería no atiende los domingos. Por favor, seleccioná un día de lunes a sábado.");
                e.target.value = ''; // Resetea el input inmediatamente
            }
        });
    }

    const btnBloquear = document.getElementById('btnBloquear');
    if (btnBloquear) {
        btnBloquear.addEventListener('click', async () => {
            const fecha = document.getElementById('fechaBloqueo').value;
            const hInicio = horaInicio.value;
            const hFin = horaFin.value;
            const barberoSeleccionado = document.getElementById('barberoBloqueo').value;

            if (!fecha || !hInicio || !hFin) { alert("Completá todos los campos"); return; }
            
            // Doble validación de seguridad estricta al intentar enviar el formulario
            const partes = fecha.split('-');
            const fechaEvaluar = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
            if (fechaEvaluar.getDay() === 0) {
                alert("No se pueden realizar bloqueos un día domingo.");
                document.getElementById('fechaBloqueo').value = '';
                return;
            }

            const [hI, mI] = hInicio.split(':').map(Number);
            const [hF, mF] = hFin.split(':').map(Number);
            let inicioMin = hI * 60 + mI;
            let finMin = hF * 60 + mF;

            if (inicioMin > finMin) { alert("La hora de inicio no puede ser mayor a la de fin"); return; }

            try {
                const promesas = [];
                let barberoNormalizado = barberoSeleccionado;
                if (barberoNormalizado === 'Ale') barberoNormalizado = 'Alejandro';

                const listaBarberosABloquear = barberoNormalizado === 'Todos' ? ['Seba', 'Alejandro'] : [barberoNormalizado];

                for (let t = inicioMin; t <= finMin; t += 60) {
                    let h = Math.floor(t / 60).toString().padStart(2, '0');
                    let m = (t % 60).toString().padStart(2, '0');
                    
                    listaBarberosABloquear.forEach(b => {
                        promesas.push(addDoc(collection(db, "turnos"), {
                            fecha,
                            hora: `${h}:${m}`,
                            barbero: b,
                            nombre: "BLOQUEADO",
                            whatsapp: "0000000000",
                            servicio: "SIN SERVICIO",
                            precio: "$0",
                            estado: 'bloqueado',
                            creadoEn: new Date()
                        }));
                    });
                }
                await Promise.all(promesas);
                document.getElementById('modal-bloqueo').style.display = 'flex';
                document.getElementById('fechaBloqueo').value = '';
            } catch (e) { alert("Error: " + e.message); }
        });
    }

    // BOTÓN ASIGNADO PARA EXPORTACIÓN A EXCEL
    const btnDescargar = document.getElementById('btnDescargarExcel');
    if (btnDescargar) {
        btnDescargar.addEventListener('click', exportarSemanaACSV);
    }

    // CONSULTA REALTIME
    const q = query(collection(db, "turnos"), orderBy("fecha", "asc"), orderBy("hora", "asc"));

    onSnapshot(q, (snapshot) => {
        if (!primeraCarga && snapshot.docChanges().some(change => change.type === "added")) {
            sonidoTurno.play().catch(e => console.log("Error de audio"));
        }
        primeraCarga = false; 

        tablaBody.innerHTML = '';
        arrayReservasGlobal = []; // Limpiamos el acumulador global

        // SORTING FRONT-END INDEPENDIENTE
        const docsOrdenados = snapshot.docs.sort((a, b) => {
            const dataA = a.data();
            const dataB = b.data();
            const fullA = `${dataA.fecha} ${dataA.hora}`;
            const fullB = `${dataB.fecha} ${dataB.hora}`;
            return fullA.localeCompare(fullB);
        });

        docsOrdenados.forEach((turnoDoc) => {
            const turno = turnoDoc.data();
            const id = turnoDoc.id;

            // PARCHE INTELIGENTE: Mapea 'Ale' a 'Alejandro' para evitar conflictos con la DB
            let barberoLimpio = turno.barbero || 'Seba';
            if (barberoLimpio === 'Ale') barberoLimpio = 'Alejandro';

            arrayReservasGlobal.push({ id, ...turno, barbero: barberoLimpio });

            const numLimpio = turno.whatsapp.replace(/\D/g, '');
            const msjConfirmar = `¡Hola ${turno.nombre}! Tu turno en *AMB BARBERS ®︎* para el ${turno.fecha} a las ${turno.hora} hs ha sido *CONFIRMADO*. ¡Te esperamos! ✂️`;
            const msjRecordar = `¡Buen día ${turno.nombre}! Te recordamos tu turno de *HOY* en *AMB BARBERS ®︎* a las ${turno.hora} hs. ¡Nos vemos! 💈`;

            const fila = document.createElement('tr');
            const esCompletado = turno.estado === 'completado';

            fila.setAttribute('data-estado', turno.estado || 'pendiente');
            fila.setAttribute('data-fecha', turno.fecha);
            fila.setAttribute('data-barbero', barberoLimpio); 
            
            if (esCompletado) fila.classList.add('fila-completada');
            
            fila.innerHTML = `
                <td data-label="Fecha">${turno.fecha}</td>
                <td data-label="Hora">${turno.hora} hs</td>
                <td data-label="Barbero" style="font-weight: bold; color: #fff;">${barberoLimpio}</td>
                <td data-label="Cliente">${turno.nombre}</td>
                <td data-label="WhatsApp">${turno.whatsapp}</td>
                <td data-label="Servicio">${turno.servicio}</td>
                <td data-label="Precio" style="color: #aeff00; font-weight: bold;">${turno.precio || '-'}</td>
                <td class="acciones-celda">
                    <div class="botones-gestion-mobile">
                        ${turno.estado !== 'bloqueado' ? `
                            <a href="https://wa.me/${numLimpio}?text=${encodeURIComponent(msjConfirmar)}" target="_blank" title="Confirmar" class="btn-accion-mobile btn-confirmar-mobile">
                                <i class="fas fa-check-circle"></i> <span>Confirmar</span>
                            </a>
                            <a href="https://wa.me/${numLimpio}?text=${encodeURIComponent(msjRecordar)}" target="_blank" title="Recordar" class="btn-accion-mobile btn-recordar-mobile">
                                <i class="fas fa-bell"></i> <span>Avisar</span>
                            </a>
                        ` : ''}
                        
                        ${turno.estado !== 'completado' && turno.estado !== 'bloqueado' ? 
                            `<button class="btn-accion-mobile btn-check-mobile btn-check" data-id="${id}"><i class="fas fa-cash-register"></i> <span>Cobrar</span></button>` : 
                            (turno.estado === 'completado' ? '<span class="estado-completado">✔️ Cobrado</span>' : '')}
                        
                        <button class="btn-accion-mobile btn-delete-mobile btn-delete" data-id="${id}"><i class="fas fa-trash"></i> <span>Borrar</span></button>
                    </div>
                </td>
            `;
            tablaBody.appendChild(fila);
        });

        // Función encargada de calcular métricas basadas en 'Alejandro'
        window.recalcularMetricasMural = () => {
            let turnosHoyCount = 0; 
            let totalCortesMensualCount = 0; 
            let recaudacionHoySum = 0;

            arrayReservasGlobal.forEach(turno => {
                const coincideBarbero = (window.barberoActivo === 'Todos' || turno.barbero === window.barberoActivo);

                if (coincideBarbero) {
                    if (turno.estado === 'completado') {
                        totalCortesMensualCount++;
                    }
                    if (turno.fecha === fechaHoy && turno.estado !== 'bloqueado') {
                        turnosHoyCount++;
                        const valor = parseInt(turno.precio?.replace(/[^0-9]/g, '')) || 0;
                        recaudacionHoySum += valor;
                    }
                }
            });

            const domCuentaHoy = document.getElementById('cantHoy');
            const domTotalMensual = document.getElementById('cantTotal');
            const domCajaHoy = document.getElementById('cajaHoy');

            if (domCuentaHoy) domCuentaHoy.innerText = turnosHoyCount;
            if (domTotalMensual) domTotalMensual.innerText = totalCortesMensualCount;
            if (domCajaHoy) domCajaHoy.innerText = `$${recaudacionHoySum.toLocaleString('es-AR')}`;
        };

        window.actualizarFiltrosVisuales();
        window.recalcularMetricasMural();

        // Si el usuario está parado mirando el resumen semanal, forzar actualización en caliente
        const seccionResumen = document.getElementById('seccion-resumen');
        if (seccionResumen && seccionResumen.style.display === 'block') {
            calcularYMostrarResumenSemanal(arrayReservasGlobal);
        }
    });

    const originalActualizarFiltros = window.actualizarFiltrosVisuales;
    window.actualizarFiltrosVisuales = () => {
        originalActualizarFiltros();
        if (typeof window.recalcularMetricasMural === 'function') window.recalcularMetricasMural();
    };

    // EVENTOS DE CLICK OPTIMIZADOS CON MODALES PREMIUM
    tablaBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.getAttribute('data-id');

        if (target.classList.contains('btn-check')) {
            // Llamamos al modal personalizado para cobrar
            const confirmado = await mostrarConfirmacionPremium(
                "¿Registrar Cobro?", 
                "El turno cambiará al estado 'Cobrado' y se sumará automáticamente a las cajas del día y de la semana.",
                "cobrar"
            );
            
            if (confirmado) {
                await updateDoc(doc(db, "turnos", id), { estado: 'completado' });
            }
        }
        
        if (target.classList.contains('btn-delete')) {
            // Llamamos al modal personalizado para eliminar
            const confirmado = await mostrarConfirmacionPremium(
                "¿Eliminar Registro?", 
                "Esta acción es permanente. El turno o bloqueo seleccionado será removido por completo del sistema.",
                "eliminar"
            );
            
            if (confirmado) {
                await deleteDoc(doc(db, "turnos", id));
            }
        }
    });
});

/**
 * Muestra un modal de confirmación personalizado alineado con el estilo AMB VIP
 * @param {string} titulo - Título principal del modal
 * @param {string} mensaje - Mensaje descriptivo
 * @param {string} tipo - 'cobrar' o 'eliminar' para adaptar el ícono
 * @returns {Promise<boolean>} Devuelve true si el usuario confirma, false si cancela
 */
function mostrarConfirmacionPremium(titulo, mensaje, tipo) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirmacion');
        const txtTitulo = document.getElementById('confirm-titulo');
        const txtMensaje = document.getElementById('confirm-mensaje');
        const iconContainer = document.getElementById('confirm-icon-container');
        const btnAceptar = document.getElementById('btn-confirm-aceptar');
        const btnCancelar = document.getElementById('btn-confirm-cancelar');

        if (!modal) return resolve(false);

        // Personalizamos el ícono según la acción para que sea bien gráfico
        if (tipo === 'cobrar') {
            iconContainer.innerHTML = `<i class="fas fa-cash-register" style="color: #aeff00; font-size: 3.5rem; text-shadow: 0 0 15px rgba(174,255,0,0.4);"></i>`;
        } else if (tipo === 'eliminar') {
            iconContainer.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: #ff3333; font-size: 3.5rem; text-shadow: 0 0 15px rgba(255,51,51,0.4);"></i>`;
        } else {
            iconContainer.innerHTML = `<i class="fas fa-question-circle" style="color: #aeff00; font-size: 3.5rem;"></i>`;
        }

        txtTitulo.innerText = titulo.toUpperCase();
        txtMensaje.innerText = mensaje;

        modal.style.display = 'flex';
        setTimeout(() => { modal.style.opacity = '1'; }, 10);

        const cerrarYResolver = (resultado) => {
            modal.style.opacity = '0';
            setTimeout(() => { modal.style.display = 'none'; }, 300);
            btnAceptar.onclick = null;
            btnCancelar.onclick = null;
            resolve(resultado);
        };

        btnAceptar.onclick = () => cerrarYResolver(true);
        btnCancelar.onclick = () => cerrarYResolver(false);
        
        modal.onclick = (e) => {
            if (e.target === modal) cerrarYResolver(false);
        };
    });
}