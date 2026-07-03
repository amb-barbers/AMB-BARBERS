import { db } from "../firebase/firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function crearReserva(datosTurno) {
    return await addDoc(collection(db, "turnos"), {
        ...datosTurno,
        creadoEn: new Date()
    });
}