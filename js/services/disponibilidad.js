import { db } from "../firebase/firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function obtenerHorariosOcupados(fecha, barbero) {

    const q = query(
        collection(db, "turnos"),
        where("fecha", "==", fecha),
        where("barbero", "==", barbero)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data().hora);

}