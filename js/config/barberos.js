// =====================================================
// CONFIGURACIÓN DE BARBEROS
// AMB VIP Booking System V2
// =====================================================

export const BARBEROS = {

    Seba: {

        id: "seba",

        nombre: "Sebastian",

        apodo: "BARBER VIP",

        telefono: "5492643212176",

        foto: "assets/img/seba.jpeg",

        saludo: "¡Hola! Soy Sebastian, agendá tu turno conmigo en AMB VIP.",

        servicios: [

            {
                nombre: "Corte moderno (incluye lavado)",
                precio: "$12.000",
                disponible: true
            },

            {
                nombre: "Corte moderno + Mascarilla facial (puntos negros)",
                precio: "$15.000",
                disponible: true
            },

            {
                nombre: "Corte moderno + Nutrición capilar",
                precio: "$20.000",
                disponible: true
            },

            {
                nombre: "Corte moderno + Mascarilla facial + Nutrición capilar",
                precio: "$25.000",
                disponible: true
            }

        ]

    },

    Ale: {

        id: "ale",

        nombre: "Ale",

        apodo: "BARBER",

        telefono: "5492645623274",

        foto: "assets/img/ale.jpeg",

        saludo: "¡Qué onda! Soy Ale, reservá tu turno conmigo.",

        servicios: [

            {
                nombre: "Corte moderno",
                precio: "$12.000",
                disponible: true
            },

            {
                nombre: "Corte moderno + Mascarilla",
                precio: "$15.000",
                disponible: true
            }

        ]

    }

};