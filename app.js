/* =====================================================================
   ESTADO DE LA APLICACIÓN
   ===================================================================== */
let currentMode       = 'placa';
let lastAPIResponse   = null;   // Última respuesta OK del simulador
let activeExpIndex    = 0;      // Índice del expediente activo (tabs)

/* =====================================================================
   DEFINICIONES DE ESTATUS (para el modal de ayuda)
   ===================================================================== */
const statusDefinitions = {
    "PENDIENTE POR SOLICITAR AJUSTE":
        "Todavía el analista y el asegurado no han coordinado la visita con el Perito Mercantil para el levantamiento de daños del siniestro.",
    "PENDIENTE POR AJUSTE":
        "Ya fue coordinado el levantamiento de daños con el Perito Mercantil. Revisa el documento 'Solicitud del Ajuste' para más detalle.",
    "PENDIENTE POR DICTAMEN":
        "El caso espera la decisión del analista de siniestros del SAM, basada en la declaración y los datos levantados en el ajuste.",
    "PENDIENTE POR COTIZACIONES DE REPUESTOS":
        "El caso está a la espera de recibir y evaluar las cotizaciones de los repuestos necesarios para la reparación.",
    "PENDIENTE POR ORDEN DE REPARACIÓN":
        "Ya fue emitido el Dictamen por el analista SAM y solo falta traducir las decisiones a las órdenes transaccionales respectivas.",
    "PENDIENTE POR FACTURA DE REPARACIÓN":
        "Se espera la factura correspondiente a los trabajos de reparación autorizados (puede ser parcial).",
    "PENDIENTE POR SOLICITUD DE PAGO DE FACTURA DE REPARACIÓN":
        "Recibidas las facturas de reparación; solo queda solicitar y emitir sus pagos respectivos.",
    "PENDIENTE POR COMPRAS DE REPUESTOS":
        "Aún no se ha emitido al menos una compra de los repuestos listados en el ajuste (pueden ser parciales).",
    "PENDIENTE POR FACTURA DE REPUESTOS":
        "Se espera recibir la factura por parte del proveedor de los repuestos comprados.",
    "PENDIENTE POR SOLICITUD DE PAGO FACTURA DE COMPRA DE REPUESTOS":
        "Recibidas las facturas de repuestos; solo queda solicitar y emitir sus pagos respectivos.",
    "PENDIENTE POR CIERRE":
        "El expediente está en la fase final. Todos los documentos y pagos han sido procesados y el caso está siendo cerrado formalmente por el analista SAM."
};

/* =====================================================================
   CAMBIO DE MODO (Placa / Siniestro)
   ===================================================================== */
function setMode(mode) {
    currentMode = mode;
    const btnPlaca     = document.getElementById('btn-mode-placa');
    const btnSiniestro = document.getElementById('btn-mode-siniestro');
    const input        = document.getElementById('search-input');

    const activeStyle   = "padding:.375rem 1rem;font-size:.875rem;font-weight:700;border-radius:.375rem;background:#fff;box-shadow:0 1px 2px 0 rgba(0,0,0,.05);color:#1d4ed8;border:1px solid #e2e8f0;transition:all .15s;cursor:pointer;";
    const inactiveStyle = "padding:.375rem 1rem;font-size:.875rem;font-weight:500;border-radius:.375rem;color:#64748b;border:0;transition:all .15s;cursor:pointer;background:transparent;";

    if (mode === 'placa') {
        btnPlaca.style.cssText     = activeStyle;
        btnSiniestro.style.cssText = inactiveStyle;
        input.placeholder = "GAV99R";
        input.maxLength   = 7;
    } else {
        btnSiniestro.style.cssText = activeStyle;
        btnPlaca.style.cssText     = inactiveStyle;
        input.placeholder = "SL-000001";
        input.maxLength   = 20;
    }
    input.value = '';
    input.focus();
    document.getElementById('status-message-container').style.display = 'none';
    document.getElementById('results-container').innerHTML = '';
    lastAPIResponse = null;
}

/* =====================================================================
   LIMPIAR BÚSQUEDA
   ===================================================================== */
function clearSearch() {
    const input = document.getElementById('search-input');
    input.value = '';
    input.focus();
    document.getElementById('status-message-container').style.display = 'none';
    document.getElementById('results-container').innerHTML = '';
    lastAPIResponse = null;
}

/* =====================================================================
   EJECUTAR BÚSQUEDA — llama al simulador de API
   ===================================================================== */
async function executeSearch() {
    const query = document.getElementById('search-input').value.trim().toUpperCase();
    const msgContainer = document.getElementById('status-message-container');
    const msgEl        = document.getElementById('status-message');
    const container    = document.getElementById('results-container');

    if (!query) {
        msgContainer.style.display = 'flex';
        msgEl.innerHTML = `<span style="color:#e11d48;font-weight:500;">Ingresa un término de búsqueda válido.</span>`;
        container.innerHTML = '';
        return;
    }

    // Estado: cargando
    msgContainer.style.display = 'flex';
    msgEl.innerHTML = `
        <svg style="width:1.25rem;height:1.25rem;color:#64748b;animation:spin 1s linear infinite;" fill="none" viewBox="0 0 24 24">
            <circle style="opacity:.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path style="opacity:.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span style="color:#64748b;font-weight:500;">Consultando...</span>`;
    container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;flex:1;min-height:0;">
            <div style="text-align:center;color:#94a3b8;">
                <svg style="width:2.5rem;height:2.5rem;margin:0 auto .75rem;animation:spin 1s linear infinite;" fill="none" viewBox="0 0 24 24">
                    <circle style="opacity:.2;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                    <path style="opacity:.8;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <p style="font-size:.875rem;font-weight:500;margin:0;">Consultando datos...</p>
            </div>
        </div>`;

    try {
        const response = await consultarSiniestros({
            Tipo_Consulta:  currentMode === 'placa' ? 'PLACA' : 'SINIESTRO',
            Valor_Consulta: query
        });

        if (response.Estatus === 'OK' && response.Polizas && response.Polizas.Expedientes.length > 0) {
            const count = response.Polizas.Expedientes.length;
            const iconOk = `<svg style="width:1.25rem;height:1.25rem;color:#059669;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
            msgEl.innerHTML = currentMode === 'placa'
                ? `${iconOk}<span style="color:#047857;font-weight:500;">Póliza activa · ${count} expediente(s) encontrado(s).</span>`
                : `${iconOk}<span style="color:#047857;font-weight:500;">Siniestro encontrado.</span>`;
            lastAPIResponse = response;
            activeExpIndex  = 0;
            renderResults();
        } else {
            const iconErr = `<svg style="width:1.25rem;height:1.25rem;color:#e11d48;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>`;
            msgEl.innerHTML = `${iconErr}<span style="color:#e11d48;font-weight:500;">${response.Mensaje}</span>`;
            container.innerHTML = '';
        }
    } catch (err) {
        const iconErr = `<svg style="width:1.25rem;height:1.25rem;color:#e11d48;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>`;
        msgEl.innerHTML = `${iconErr}<span style="color:#e11d48;font-weight:500;">Error al consultar. Intente nuevamente.</span>`;
        container.innerHTML = '';
    }
}

/* =====================================================================
   COLOR DE BADGE SEGÚN ESTADO
   ===================================================================== */
function getBadgeStyle(status) {
    const s = status.toUpperCase();
    const map = {
        "PENDIENTE POR SOLICITAR AJUSTE":                                    "background:#fbbf24;color:#000;border-color:#f59e0b;",
        "PENDIENTE POR AJUSTE":                                              "background:#f97316;color:#fff;border-color:#ea580c;",
        "PENDIENTE POR DICTAMEN":                                            "background:#4f46e5;color:#fff;border-color:#4338ca;",
        "PENDIENTE POR COTIZACIONES DE REPUESTOS":                           "background:#0891b2;color:#fff;border-color:#0e7490;",
        "PENDIENTE POR ORDEN DE REPARACIÓN":                                 "background:#2563eb;color:#fff;border-color:#1d4ed8;",
        "PENDIENTE POR FACTURA DE REPARACIÓN":                               "background:#0d9488;color:#fff;border-color:#0f766e;",
        "PENDIENTE POR SOLICITUD DE PAGO DE FACTURA DE REPARACIÓN":          "background:#059669;color:#fff;border-color:#047857;",
        "PENDIENTE POR COMPRAS DE REPUESTOS":                                "background:#e11d48;color:#fff;border-color:#be123c;",
        "PENDIENTE POR FACTURA DE REPUESTOS":                                "background:#c026d3;color:#fff;border-color:#a21caf;",
        "PENDIENTE POR SOLICITUD DE PAGO FACTURA DE COMPRA DE REPUESTOS":    "background:#9333ea;color:#fff;border-color:#7e22ce;",
        "PENDIENTE POR CIERRE":                                              "background:#1e293b;color:#fff;border-color:#0f172a;"
    };
    return map[s] || "background:#64748b;color:#fff;border-color:#475569;";
}

/* =====================================================================
   RENDERIZAR RESULTADOS — mapea la respuesta de la API a la UI
   ===================================================================== */
function renderResults() {
    const container  = document.getElementById('results-container');
    const polizas    = lastAPIResponse.Polizas;
    const expedientes = polizas.Expedientes;
    const exp        = expedientes[activeExpIndex];
    const isMulti    = expedientes.length > 1;

    /* --- TABS (solo si hay más de un expediente) ------------------- */
    let tabsHtml = '';
    if (isMulti) {
        const tabs = expedientes.map((e, idx) => {
            const active = idx === activeExpIndex;
            const st = active
                ? 'background:#fff;color:#1e3a8a;font-weight:800;border-top:2px solid #cbd5e1;border-left:2px solid #cbd5e1;border-right:2px solid #cbd5e1;padding:.625rem 1.25rem .625rem 1rem;z-index:10;border-radius:.75rem .75rem 0 0;box-shadow:0 -2px 8px rgba(0,0,0,.06);font-size:.875rem;'
                : 'background:#e2e8f0;color:#475569;font-weight:700;border-top:1px solid #cbd5e1;border-left:1px solid #cbd5e1;border-right:1px solid #cbd5e1;padding:.5rem 1rem;border-radius:.5rem .5rem 0 0;margin-bottom:-1px;font-size:.75rem;';
            const iconColor = active ? '#2563eb' : '#94a3b8';
            return `<div data-action="selectTab" data-index="${idx}"
                style="${st}display:flex;align-items:center;cursor:pointer;white-space:nowrap;flex-shrink:0;">
                <svg style="width:1rem;height:1rem;margin-right:.5rem;color:${iconColor};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
                ${e.Nro_Siniestro}
            </div>`;
        }).join('');
        tabsHtml = `<div style="display:flex;overflow-x:auto;align-items:flex-end;gap:.5rem;padding:0 .5rem;scrollbar-width:none;flex-shrink:0;">${tabs}</div>`;
    }

    /* --- CABECERA DE LA TARJETA (datos de póliza + expediente) ----- */
    const vehiculo = `${polizas.Marca} ${polizas.Modelo} ${polizas.Version} · ${polizas.Color}`;
    const borderTop = isMulti ? 'border-radius:0 .75rem 0 0;' : 'border-radius:.75rem .75rem 0 0;';
    const cardHeader = `
    <div style="background:linear-gradient(135deg,#002b66 0%,#004b87 100%);${borderTop}padding:.75rem 1rem;color:#fff;display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;flex-shrink:0;">
        <div style="width:2.5rem;height:2.5rem;border-radius:.5rem;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg style="width:1.5rem;height:1.5rem;opacity:.9;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
        </div>
        <div style="flex:1;min-width:0;">
            <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:.5rem .75rem;">
                <h2 style="font-size:.875rem;font-weight:900;font-family:ui-monospace,monospace;letter-spacing:.05em;line-height:1;margin:0;">${exp.Nro_Siniestro}</h2>
                <span style="font-size:.75rem;opacity:.6;font-family:ui-monospace,monospace;">${exp.Nro_Ajuste}</span>
            </div>
            <p style="font-size:.75rem;color:#dbeafe;display:flex;flex-wrap:wrap;gap:.4rem .75rem;margin:.25rem 0 0;font-weight:500;">
                <span>${vehiculo}</span>
                <span style="opacity:.4;">·</span>
                <span>Póliza: ${polizas.NroPoliza}</span>
                <span style="opacity:.4;">·</span>
                <span>Placa: ${polizas.Placa}</span>
                <span style="opacity:.4;">·</span>
                <span>Accidente: ${exp.Fecha_Accidente}</span>
                <span style="opacity:.4;">·</span>
                <span>Notif.: ${exp.Fecha_Notificacion}</span>
            </p>
        </div>
    </div>`;

    /* --- ACCIÓN PENDIENTE (badges de estado) ----------------------- */
    const estados    = exp.Estados_WorkFlow || [];
    const badges     = estados.map(e => `
        <div style="padding:.25rem .625rem;border-radius:.375rem;font-size:.75rem;font-weight:700;border:1px solid;display:inline-flex;align-items:center;gap:.375rem;text-transform:uppercase;letter-spacing:.025em;${getBadgeStyle(e.Descripcion)}box-shadow:0 1px 2px 0 rgba(0,0,0,.05);">
            <span>${e.Descripcion}</span>
            <span data-action="showStatusHelp" data-status="${e.Descripcion}"
                style="width:1.25rem;height:1.25rem;border-radius:9999px;background:rgba(0,0,0,.1);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;" title="Más información">
                <svg style="width:.875rem;height:.875rem;opacity:.9;pointer-events:none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </span>
        </div>`).join('');

    /* --- FILTRO + TABLA DE DOCUMENTOS ------------------------------ */
    const docs       = exp.Documentos || [];
    const hasMulti   = docs.length > 1;
    const adjId      = exp.Nro_Siniestro.replace(/[^a-z0-9]/gi, '_');

    const filterRow  = hasMulti ? `
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.5rem;justify-content:space-between;align-items:center;">
            <div style="position:relative;flex:1;min-width:160px;max-width:280px;">
                <input type="text" data-action="filterDocs" data-adj="${adjId}" placeholder="Buscar documento..."
                    style="width:100%;padding:.375rem .75rem .375rem 2.25rem;background:#fff;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem;font-weight:500;cursor:text;">
                <svg style="position:absolute;left:.75rem;top:.5rem;width:1rem;height:1rem;color:#94a3b8;pointer-events:none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
            </div>
            <button data-action="sortDocs" data-adj="${adjId}" data-order="asc"
                style="background:#fff;color:#334155;padding:.375rem .75rem;border-radius:.5rem;font-size:.875rem;font-weight:700;border:1px solid #e2e8f0;box-shadow:0 1px 2px 0 rgba(0,0,0,.05);display:inline-flex;align-items:center;cursor:pointer;">
                A-Z <svg style="width:1rem;height:1rem;margin-left:.25rem;pointer-events:none;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
            </button>
        </div>` : '';

    const rows = docs.map(doc => `
        <tr class="doc-row-${adjId}" data-title="${doc.Tipo_Documento}" style="border-top:1px solid #f1f5f9;">
            <td style="padding:.625rem .875rem;font-weight:600;color:#1e293b;font-size:.875rem;display:flex;align-items:center;gap:.75rem;">
                <svg style="width:1.25rem;height:1.25rem;color:#2563eb;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>${doc.Tipo_Documento}</span>
            </td>
            <td style="padding:.625rem .875rem;text-align:right;width:7rem;">
                <a href="${doc.Enlace_Documento}" target="_blank" rel="noopener noreferrer"
                    style="color:#1d4ed8;font-weight:700;font-size:.875rem;background:#eff6ff;padding:.375rem .75rem;border-radius:.5rem;border:1px solid #bfdbfe;display:inline-flex;align-items:center;gap:.375rem;cursor:pointer;width:100%;justify-content:center;text-decoration:none;">
                    Ver
                    <svg style="width:1rem;height:1rem;pointer-events:none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                </a>
            </td>
        </tr>`).join('');

    /* --- ACCORDION (expediente) ------------------------------------ */
    const accordion = `
    <details style="background:#fff;border-radius:.75rem;border:1px solid #e2e8f0;box-shadow:0 1px 2px 0 rgba(0,0,0,.05);overflow:hidden;" open>
        <summary style="padding:.625rem .75rem;background:#fff;cursor:pointer;display:flex;justify-content:space-between;align-items:center;list-style:none;">
            <div style="display:flex;align-items:center;gap:.625rem;flex:1;overflow:hidden;flex-wrap:wrap;">
                <div style="width:2.25rem;height:2.25rem;border-radius:.5rem;background:#f8fafc;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;color:#64748b;flex-shrink:0;">
                    <svg style="width:1.25rem;height:1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:.375rem;flex:1;">${badges}</div>
            </div>
            <svg style="width:1.25rem;height:1.25rem;color:#2563eb;flex-shrink:0;margin-left:.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
        </summary>
        <div style="padding:.5rem .75rem .75rem;border-top:1px solid #f1f5f9;background:rgba(248,250,252,.5);">
            ${filterRow}
            <div style="border-radius:.75rem;border:1px solid #e2e8f0;background:#fff;overflow:hidden;box-shadow:0 1px 2px 0 rgba(0,0,0,.05);">
                <table style="width:100%;text-align:left;border-collapse:collapse;">
                    <tbody id="doc-tbody-${adjId}">${rows}</tbody>
                </table>
            </div>
        </div>
    </details>`;

    /* --- TARJETA COMPLETA ------------------------------------------ */
    const cardBorderRadius = isMulti ? 'border-radius:0 .75rem .75rem .75rem;border-top:0;' : 'border-radius:.75rem;';
    const html = `
        ${tabsHtml}
        <div style="background:#fff;${cardBorderRadius}box-shadow:0 4px 20px -2px rgba(0,0,0,.05);border:1px solid rgba(226,232,240,.8);display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;">
            ${cardHeader}
            <div style="padding:.5rem;display:flex;flex-direction:column;gap:.5rem;flex:1;min-height:0;overflow-y:auto;background:rgba(248,250,252,.8);scrollbar-width:none;">
                ${accordion}
            </div>
        </div>`;

    container.innerHTML = html;
}

/* =====================================================================
   ORDENAR DOCUMENTOS (A-Z / Z-A)
   ===================================================================== */
function sortDocuments(adjId, btn) {
    const tbody  = document.getElementById(`doc-tbody-${adjId}`);
    const rows   = Array.from(tbody.querySelectorAll('tr'));
    const order  = btn.getAttribute('data-order') || 'asc';
    rows.sort((a, b) => order === 'asc'
        ? b.getAttribute('data-title').localeCompare(a.getAttribute('data-title'))
        : a.getAttribute('data-title').localeCompare(b.getAttribute('data-title')));
    btn.setAttribute('data-order', order === 'asc' ? 'desc' : 'asc');
    const arrow = order === 'asc'
        ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>`
        : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/>`;
    btn.innerHTML = `A-Z <svg style="width:1rem;height:1rem;margin-left:.25rem;pointer-events:none;" fill="none" stroke="currentColor" viewBox="0 0 24 24">${arrow}</svg>`;
    rows.forEach(r => tbody.appendChild(r));
}

/* =====================================================================
   MODAL: AYUDA DE ESTATUS
   ===================================================================== */
function showStatusHelp(status) {
    const desc = statusDefinitions[status] || "Estatus en proceso de validación.";
    document.getElementById('modal-status-title').innerText = status;
    document.getElementById('modal-status-desc').innerText  = desc;
    document.getElementById('modal-status-help').style.display = 'flex';
}

/* =====================================================================
   DELEGACIÓN DE EVENTOS
   ===================================================================== */
document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');

    if      (action === 'setMode')         setMode(target.getAttribute('data-mode'));
    else if (action === 'executeSearch')   executeSearch();
    else if (action === 'clearSearch')     clearSearch();
    else if (action === 'selectTab') {
        activeExpIndex = parseInt(target.getAttribute('data-index'));
        renderResults();
    }
    else if (action === 'sortDocs')        sortDocuments(target.getAttribute('data-adj'), target);
    else if (action === 'showStatusHelp') {
        e.preventDefault(); e.stopPropagation();
        showStatusHelp(target.getAttribute('data-status'));
    }
    else if (action === 'closeStatusHelp') document.getElementById('modal-status-help').style.display = 'none';
});

document.addEventListener('keyup', function(e) {
    if (e.target.id === 'search-input' && e.key === 'Enter') {
        executeSearch();
    } else if (e.target.dataset.action === 'filterDocs') {
        const adjId = e.target.dataset.adj;
        const val   = e.target.value.toLowerCase();
        document.querySelectorAll(`.doc-row-${adjId}`).forEach(row => {
            row.style.display = row.getAttribute('data-title').toLowerCase().includes(val) ? '' : 'none';
        });
    }
});

/* =====================================================================
   INIT
   ===================================================================== */
window.onload = function() { setMode('placa'); };
