/**
 * API de Producción — Consulta de Estatus de Siniestros Mercantil
 *
 * Endpoint : http://208.109.245.130/AutoFast/int_wsrv.nsf/GestorConsultaSiniestroAPI?OpenAgent
 * Método   : POST
 * Request  : { Tipo_Consulta: "PLACA" | "SINIESTRO", Valor_Consulta: string }
 * Response : { Estatus, Mensaje, Polizas: { ...datos, Expedientes[] } }
 */

const API_ENDPOINT =
    "http://208.109.245.130/AutoFast/int_wsrv.nsf/GestorConsultaSiniestroAPI?OpenAgent";

async function consultarSiniestros(request) {
    const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
    });
    if (!response.ok) {
        throw new Error("HTTP " + response.status);
    }
    return response.json();
}
