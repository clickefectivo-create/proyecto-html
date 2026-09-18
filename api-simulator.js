/**
 * Simulador de API — Consulta de Estatus de Siniestros Mercantil
 *
 * Contrato de datos:
 *   Request : { Tipo_Consulta: "PLACA" | "SINIESTRO", Valor_Consulta: string }
 *   Response: ver estructura completa debajo
 *
 * Placas de prueba : GAV99R · ABC123 · MMM777 · ZZZ111 · RRR444
 * Siniestros de prueba: SL-000001 · SL-000125 · SL-000201 · SL-000303
 *                       SL-000401 · SL-000402 · SL-000403 · SL-000555
 */

const _BASE_URL = "http://208.109.245.130/AutoFast/reclg03.nsf/0/";

/* =====================================================================
   BANCO DE ESCENARIOS
   ===================================================================== */

const _SCENARIOS = {

    /* ------------------------------------------------------------------
       ESCENARIO 1: GAV99R
       1 expediente · 1 estado (PENDIENTE POR SOLICITAR AJUSTE) · 1 doc
       Caso más simple: siniestro recién registrado, ajuste aún no solicitado
    ------------------------------------------------------------------ */
    "PLACA:GAV99R": {
        Estatus: "OK",
        Mensaje: "Consulta realizada exitosamente",
        Polizas: {
            NroPoliza: "POL-00012345",
            Fecha_Desde: "2026-01-01",
            Fecha_Hasta: "2026-12-31",
            Estatus: "ACTIVA",
            Marca: "TOYOTA",
            Modelo: "COROLLA",
            Version: "1.6",
            Color: "BLANCO",
            Placa: "GAV99R",
            SerialCarroceria: "8Y4FJ67V9X1828197",
            Expedientes: [
                {
                    Nro_Siniestro: "SL-000001",
                    Nro_Ajuste: "AJ-000001",
                    Fecha_Accidente: "2026-08-15",
                    Fecha_Notificacion: "2026-08-16",
                    Estados_WorkFlow: [
                        { Estado: "1", Descripcion: "PENDIENTE POR SOLICITAR AJUSTE" }
                    ],
                    Documentos: [
                        { Tipo_Documento: "Declaración del Siniestro", Enlace_Documento: _BASE_URL + "DECL001?OpenDocument" }
                    ]
                }
            ]
        }
    },

    /* ------------------------------------------------------------------
       ESCENARIO 2: ABC123
       2 expedientes (muestra tabs) · estados y documentos variados
       Primer expediente: en reparación parcial
       Segundo expediente: en proceso de pago
    ------------------------------------------------------------------ */
    "PLACA:ABC123": {
        Estatus: "OK",
        Mensaje: "Consulta realizada exitosamente",
        Polizas: {
            NroPoliza: "POL-00098765",
            Fecha_Desde: "2026-01-15",
            Fecha_Hasta: "2026-12-14",
            Estatus: "ACTIVA",
            Marca: "TOYOTA",
            Modelo: "COROLLA",
            Version: "XEI",
            Color: "GRIS",
            Placa: "ABC123",
            SerialCarroceria: "8XTCF31F9FG004261",
            Expedientes: [
                {
                    Nro_Siniestro: "SL-000125",
                    Nro_Ajuste: "AJ-000125",
                    Fecha_Accidente: "2026-03-10",
                    Fecha_Notificacion: "2026-03-11",
                    Estados_WorkFlow: [
                        { Estado: "6", Descripcion: "PENDIENTE POR FACTURA DE REPARACIÓN" },
                        { Estado: "9", Descripcion: "PENDIENTE POR COMPRAS DE REPUESTOS" }
                    ],
                    Documentos: [
                        { Tipo_Documento: "Declaración del Siniestro",  Enlace_Documento: _BASE_URL + "DECL125?OpenDocument" },
                        { Tipo_Documento: "Solicitud del Ajuste",        Enlace_Documento: _BASE_URL + "SOLAJ125?OpenDocument" },
                        { Tipo_Documento: "Ajuste",                      Enlace_Documento: _BASE_URL + "AJUST125?OpenDocument" },
                        { Tipo_Documento: "Dictamen",                    Enlace_Documento: _BASE_URL + "DICTA125?OpenDocument" },
                        { Tipo_Documento: "Orden de Reparación",         Enlace_Documento: _BASE_URL + "ORREP125?OpenDocument" }
                    ]
                },
                {
                    Nro_Siniestro: "SL-000201",
                    Nro_Ajuste: "AJ-000201",
                    Fecha_Accidente: "2026-04-22",
                    Fecha_Notificacion: "2026-04-23",
                    Estados_WorkFlow: [
                        { Estado: "7",  Descripcion: "PENDIENTE POR SOLICITUD DE PAGO DE FACTURA DE REPARACIÓN" },
                        { Estado: "10", Descripcion: "PENDIENTE POR SOLICITUD DE PAGO FACTURA DE COMPRA DE REPUESTOS" }
                    ],
                    Documentos: [
                        { Tipo_Documento: "Declaración del Siniestro",                           Enlace_Documento: _BASE_URL + "DECL201?OpenDocument" },
                        { Tipo_Documento: "Solicitud del Ajuste",                                 Enlace_Documento: _BASE_URL + "SOLAJ201?OpenDocument" },
                        { Tipo_Documento: "Ajuste",                                               Enlace_Documento: _BASE_URL + "AJUST201?OpenDocument" },
                        { Tipo_Documento: "Dictamen",                                             Enlace_Documento: _BASE_URL + "DICTA201?OpenDocument" },
                        { Tipo_Documento: "Orden de Reparación",                                  Enlace_Documento: _BASE_URL + "ORREP201?OpenDocument" },
                        { Tipo_Documento: "Factura de Reparación",                                Enlace_Documento: _BASE_URL + "FACREP201?OpenDocument" },
                        { Tipo_Documento: "Solicitud de Pago de Factura de Reparación",           Enlace_Documento: _BASE_URL + "SPFREP201?OpenDocument" },
                        { Tipo_Documento: "Orden de Compra de Repuestos",                         Enlace_Documento: _BASE_URL + "OCREP201?OpenDocument" },
                        { Tipo_Documento: "Factura de Repuestos",                                 Enlace_Documento: _BASE_URL + "FAREP201?OpenDocument" },
                        { Tipo_Documento: "Solicitud de Pago de Factura de Compra de Repuestos",  Enlace_Documento: _BASE_URL + "SPFCREP201?OpenDocument" }
                    ]
                }
            ]
        }
    },

    /* ------------------------------------------------------------------
       ESCENARIO 3: MMM777
       1 expediente · 3 estados SIMULTÁNEOS · 4 documentos
       Muestra que varios estados pueden estar activos al mismo tiempo
    ------------------------------------------------------------------ */
    "PLACA:MMM777": {
        Estatus: "OK",
        Mensaje: "Consulta realizada exitosamente",
        Polizas: {
            NroPoliza: "POL-00054321",
            Fecha_Desde: "2025-09-01",
            Fecha_Hasta: "2026-08-31",
            Estatus: "ACTIVA",
            Marca: "CHEVROLET",
            Modelo: "AVEO",
            Version: "1.4",
            Color: "ROJO",
            Placa: "MMM777",
            SerialCarroceria: "KL1TJ52643B208833",
            Expedientes: [
                {
                    Nro_Siniestro: "SL-000303",
                    Nro_Ajuste: "AJ-000303",
                    Fecha_Accidente: "2026-07-01",
                    Fecha_Notificacion: "2026-07-02",
                    Estados_WorkFlow: [
                        { Estado: "3", Descripcion: "PENDIENTE POR DICTAMEN" },
                        { Estado: "4", Descripcion: "PENDIENTE POR COTIZACIONES DE REPUESTOS" },
                        { Estado: "5", Descripcion: "PENDIENTE POR ORDEN DE REPARACIÓN" }
                    ],
                    Documentos: [
                        { Tipo_Documento: "Declaración del Siniestro", Enlace_Documento: _BASE_URL + "DECL303?OpenDocument" },
                        { Tipo_Documento: "Fotografía Vehículo",       Enlace_Documento: _BASE_URL + "FOTO303?OpenDocument" },
                        { Tipo_Documento: "Solicitud del Ajuste",      Enlace_Documento: _BASE_URL + "SOLAJ303?OpenDocument" },
                        { Tipo_Documento: "Informe de Ajuste",         Enlace_Documento: _BASE_URL + "INFAJ303?OpenDocument" }
                    ]
                }
            ]
        }
    },

    /* ------------------------------------------------------------------
       ESCENARIO 4: ZZZ111
       3 expedientes (tabs: SL-401, SL-402, SL-403)
       Muestra navegación entre múltiples siniestros en la misma póliza
    ------------------------------------------------------------------ */
    "PLACA:ZZZ111": {
        Estatus: "OK",
        Mensaje: "Consulta realizada exitosamente",
        Polizas: {
            NroPoliza: "POL-00077788",
            Fecha_Desde: "2025-12-01",
            Fecha_Hasta: "2026-11-30",
            Estatus: "ACTIVA",
            Marca: "FORD",
            Modelo: "EXPLORER",
            Version: "2.3 EcoBoost",
            Color: "NEGRO",
            Placa: "ZZZ111",
            SerialCarroceria: "1FMSK7FH9HGA01234",
            Expedientes: [
                {
                    Nro_Siniestro: "SL-000401",
                    Nro_Ajuste: "AJ-000401",
                    Fecha_Accidente: "2025-12-15",
                    Fecha_Notificacion: "2025-12-16",
                    Estados_WorkFlow: [
                        { Estado: "2", Descripcion: "PENDIENTE POR AJUSTE" }
                    ],
                    Documentos: [
                        { Tipo_Documento: "Declaración del Siniestro", Enlace_Documento: _BASE_URL + "DECL401?OpenDocument" },
                        { Tipo_Documento: "Fotografía Vehículo",       Enlace_Documento: _BASE_URL + "FOTO401?OpenDocument" }
                    ]
                },
                {
                    Nro_Siniestro: "SL-000402",
                    Nro_Ajuste: "AJ-000402",
                    Fecha_Accidente: "2026-02-20",
                    Fecha_Notificacion: "2026-02-21",
                    Estados_WorkFlow: [
                        { Estado: "6", Descripcion: "PENDIENTE POR FACTURA DE REPARACIÓN" }
                    ],
                    Documentos: [
                        { Tipo_Documento: "Declaración del Siniestro", Enlace_Documento: _BASE_URL + "DECL402?OpenDocument" },
                        { Tipo_Documento: "Solicitud del Ajuste",      Enlace_Documento: _BASE_URL + "SOLAJ402?OpenDocument" },
                        { Tipo_Documento: "Ajuste",                    Enlace_Documento: _BASE_URL + "AJUST402?OpenDocument" },
                        { Tipo_Documento: "Dictamen",                  Enlace_Documento: _BASE_URL + "DICTA402?OpenDocument" },
                        { Tipo_Documento: "Orden de Reparación",       Enlace_Documento: _BASE_URL + "ORREP402?OpenDocument" }
                    ]
                },
                {
                    Nro_Siniestro: "SL-000403",
                    Nro_Ajuste: "AJ-000403",
                    Fecha_Accidente: "2026-06-05",
                    Fecha_Notificacion: "2026-06-06",
                    Estados_WorkFlow: [
                        { Estado: "1", Descripcion: "PENDIENTE POR SOLICITAR AJUSTE" }
                    ],
                    Documentos: [
                        { Tipo_Documento: "Declaración del Siniestro", Enlace_Documento: _BASE_URL + "DECL403?OpenDocument" }
                    ]
                }
            ]
        }
    },

    /* ------------------------------------------------------------------
       ESCENARIO 5: RRR444
       1 expediente · estado PENDIENTE POR CIERRE · expediente completo
       Muestra caso casi cerrado con todos los documentos presentes
    ------------------------------------------------------------------ */
    "PLACA:RRR444": {
        Estatus: "OK",
        Mensaje: "Consulta realizada exitosamente",
        Polizas: {
            NroPoliza: "POL-00033322",
            Fecha_Desde: "2026-03-01",
            Fecha_Hasta: "2027-02-28",
            Estatus: "ACTIVA",
            Marca: "NISSAN",
            Modelo: "SENTRA",
            Version: "2.0",
            Color: "PLATA",
            Placa: "RRR444",
            SerialCarroceria: "3N1AB7AP5JL658921",
            Expedientes: [
                {
                    Nro_Siniestro: "SL-000555",
                    Nro_Ajuste: "AJ-000555",
                    Fecha_Accidente: "2026-05-10",
                    Fecha_Notificacion: "2026-05-11",
                    Estados_WorkFlow: [
                        { Estado: "99", Descripcion: "PENDIENTE POR CIERRE" }
                    ],
                    Documentos: [
                        { Tipo_Documento: "Declaración del Siniestro",                 Enlace_Documento: _BASE_URL + "DECL555?OpenDocument" },
                        { Tipo_Documento: "Solicitud del Ajuste",                       Enlace_Documento: _BASE_URL + "SOLAJ555?OpenDocument" },
                        { Tipo_Documento: "Ajuste",                                     Enlace_Documento: _BASE_URL + "AJUST555?OpenDocument" },
                        { Tipo_Documento: "Dictamen",                                   Enlace_Documento: _BASE_URL + "DICTA555?OpenDocument" },
                        { Tipo_Documento: "Orden de Reparación",                        Enlace_Documento: _BASE_URL + "ORREP555?OpenDocument" },
                        { Tipo_Documento: "Factura de Reparación",                      Enlace_Documento: _BASE_URL + "FACREP555?OpenDocument" },
                        { Tipo_Documento: "Solicitud de Pago de Factura de Reparación", Enlace_Documento: _BASE_URL + "SPFREP555?OpenDocument" }
                    ]
                }
            ]
        }
    }

};

/* =====================================================================
   ÍNDICE PARA BÚSQUEDA POR SINIESTRO
   Mapea Nro_Siniestro / Nro_Ajuste → clave de escenario
   ===================================================================== */
const _SIN_INDEX = {
    "SL-000001":     "PLACA:GAV99R",
    "AJ-000001":"PLACA:GAV99R",
    "SL-000125":     "PLACA:ABC123",
    "AJ-000125":"PLACA:ABC123",
    "SL-000201":     "PLACA:ABC123",
    "AJ-000201":"PLACA:ABC123",
    "SL-000303":     "PLACA:MMM777",
    "AJ-000303":"PLACA:MMM777",
    "SL-000401":     "PLACA:ZZZ111",
    "AJ-000401":"PLACA:ZZZ111",
    "SL-000402":     "PLACA:ZZZ111",
    "AJ-000402":"PLACA:ZZZ111",
    "SL-000403":     "PLACA:ZZZ111",
    "AJ-000403":"PLACA:ZZZ111",
    "SL-000555":     "PLACA:RRR444",
    "AJ-000555":"PLACA:RRR444"
};

/* =====================================================================
   FUNCIÓN PÚBLICA
   ===================================================================== */

/**
 * Simula la llamada al endpoint de consulta de siniestros.
 * @param {{ Tipo_Consulta: string, Valor_Consulta: string }} request
 * @returns {Promise<Object>} Respuesta JSON con la estructura del contrato
 */
function consultarSiniestros(request) {
    return new Promise((resolve) => {
        // Latencia simulada: 300–700 ms
        setTimeout(() => resolve(_process(request)), 300 + Math.random() * 400);
    });
}

function _process(request) {
    const tipo  = String(request.Tipo_Consulta  || "").trim().toUpperCase();
    const valor = String(request.Valor_Consulta || "").trim().toUpperCase();

    if (!valor) {
        return { Estatus: "ERROR", Mensaje: "Parámetro de consulta vacío.", Polizas: null };
    }

    if (tipo === "PLACA") {
        const sc = _SCENARIOS["PLACA:" + valor];
        if (sc) return sc;
        return { Estatus: "ERROR", Mensaje: "Placa no registrada o sin siniestros activos.", Polizas: null };
    }

    if (tipo === "SINIESTRO") {
        const scKey = _SIN_INDEX[valor];
        if (scKey) {
            const sc = _SCENARIOS[scKey];
            // Filtrar solo el expediente que corresponde al número consultado
            const exps = sc.Polizas.Expedientes.filter(
                e => e.Nro_Siniestro.toUpperCase() === valor ||
                     e.Nro_Ajuste.toUpperCase() === valor
            );
            if (exps.length > 0) {
                return { ...sc, Polizas: { ...sc.Polizas, Expedientes: exps } };
            }
        }
        return { Estatus: "ERROR", Mensaje: "Siniestro no encontrado o ya cerrado.", Polizas: null };
    }

    return { Estatus: "ERROR", Mensaje: "Tipo de consulta no reconocido.", Polizas: null };
}
