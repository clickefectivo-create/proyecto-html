const claimsDatabase = [
    {
        placa: "ABC123",
        siniestros: [
            {
                numero: "RCV-240819-111137",
                poliza: "02-01-1234-10",
                fechaRegistro: "15/03/2026",
                vehiculo: "Toyota Corolla XEI 2020",
                ajustes: [
                    {
                        id: "AJU-00125",
                        estatus: ["PENDIENTE POR SOLICITAR AJUSTE"],
                        documentos: [{ titulo: "Declaración del Siniestro" }]
                    },
                    {
                        id: "AJU-00126",
                        estatus: ["PENDIENTE POR FACTURA DE REPARACIÓN", "PENDIENTE POR COMPRAS DE REPUESTOS"],
                        documentos: [
                            { titulo: "Declaración del Siniestro" },
                            { titulo: "Solicitud del Ajuste" },
                            { titulo: "Ajuste" },
                            { titulo: "Dictamen" },
                            { titulo: "Orden de Reparación" }
                        ]
                    }
                ]
            },
            {
                numero: "RCV-240819-222288",
                poliza: "02-01-1234-10",
                fechaRegistro: "02/05/2026",
                vehiculo: "Toyota Corolla XEI 2020",
                ajustes: [
                    {
                        id: "AJU-00201",
                        estatus: ["PENDIENTE POR SOLICITUD DE PAGO DE FACTURA DE REPARACIÓN", "PENDIENTE POR SOLICITUD DE PAGO FACTURA DE COMPRA DE REPUESTOS"],
                        documentos: [
                            { titulo: "Declaración del Siniestro" }, { titulo: "Solicitud del Ajuste" }, { titulo: "Ajuste" },
                            { titulo: "Dictamen" }, { titulo: "Orden de Reparación" }, { titulo: "Factura de Reparación" },
                            { titulo: "Solicitud de Pago de Factura de Reparación" }, { titulo: "Orden de Compra de Repuestos" },
                            { titulo: "Factura de Repuestos" }, { titulo: "Solicitud de Pago de Factura de Compra de Repuestos" }
                        ]
                    }
                ]
            }
        ]
    }
];

let currentMode = 'placa';
let lastFoundSiniestros = [];
let activeSiniestroIndex = 0;

const statusDefinitions = {
    "PENDIENTE POR SOLICITAR AJUSTE": "Significa que todavía el analista y el asegurado no han coordinado la visita con Perito Mercantil para el levantamiento de daños del siniestro.",
    "PENDIENTE POR AJUSTE": "Significa que ya ha sido coordinado el levantamiento de daños con el Perito Mercantil, tal como se vé en el documento 'solicitud de ajuste'.",
    "PENDIENTE POR DICTAMEN": "Significa que el caso espera por la decisión del analista de siniestros del SAM, basada en la declaración y los datos levantados en el ajuste respectivo.",
    "PENDIENTE POR COTIZACIONES DE REPUESTOS": "El caso se encuentra a la espera de la recepción y evaluación de las cotizaciones de los repuestos necesarios.",
    "PENDIENTE POR ORDEN DE REPARACIÓN": "Significa que ya ha sido emitido Dictamen por parte del analista SAM y solo falta traducir las decisiones tomadas a su forma transaccional en órdenes respectivas, a cargo de talleres, repuesteros, o a cargo del asegurado directamente.",
    "PENDIENTE POR FACTURA DE REPARACIÓN": "Se encuentra a la espera de recibir la factura correspondiente a los trabajos de reparación autorizados (puede ser parcial).",
    "PENDIENTE POR SOLICITUD DE PAGO DE FACTURA DE REPARACIÓN": "Recibidas las facturas de reparación y solo en espera por solicitar y emitir sus pagos respectivos.",
    "PENDIENTE POR COMPRAS DE REPUESTOS": "Aún no ha sido emitida al menos una compra de los repuestos listados en el respectivo Ajuste (pueden ser parciales).",
    "PENDIENTE POR FACTURA DE REPUESTOS": "Se encuentra a la espera de recibir la factura por parte del proveedor de los repuestos comprados (generalmente sobre órdenes completas al proveedor).",
    "PENDIENTE POR SOLICITUD DE PAGO FACTURA DE COMPRA DE REPUESTOS": "Recibidas las facturas de repuestos y solo en espera por solicitar y emitir sus pagos respectivos."
};

function setMode(mode) {
    currentMode = mode;
    const btnPlaca = document.getElementById('btn-mode-placa');
    const btnSiniestro = document.getElementById('btn-mode-siniestro');
    const input = document.getElementById('search-input');

    if (mode === 'placa') {
        btnPlaca.className = "px-4 py-1.5 text-sm font-bold rounded-md bg-white shadow-sm text-blue-700 transition-all border border-slate-200";
        btnSiniestro.className = "px-4 py-1.5 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 transition-all";
        input.placeholder = "ABC123"; input.maxLength = 6; input.value = "ABC123";
    } else {
        btnSiniestro.className = "px-4 py-1.5 text-sm font-bold rounded-md bg-white shadow-sm text-blue-700 transition-all border border-slate-200";
        btnPlaca.className = "px-4 py-1.5 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 transition-all";
        input.placeholder = "RCV-240819..."; input.maxLength = 15; input.value = "RCV-240819-111137";
    }
    input.focus();
    document.getElementById('status-message-container').classList.add('hidden');
    document.getElementById('results-container').innerHTML = '';
}

function clearSearch() {
    const input = document.getElementById('search-input');
    input.value = ''; input.focus();
    document.getElementById('status-message-container').classList.add('hidden');
    document.getElementById('results-container').innerHTML = '';
}

function executeSearch() {
    const query = document.getElementById('search-input').value.trim().toUpperCase();
    const msgContainer = document.getElementById('status-message-container');
    const msgEl = document.getElementById('status-message');
    const container = document.getElementById('results-container');

    if (!query) {
        msgContainer.classList.remove('hidden'); msgContainer.classList.add('flex');
        msgEl.innerHTML = `<span class="text-rose-600 font-medium">Ingresa un término de búsqueda válido.</span>`;
        container.innerHTML = ''; return;
    }

    let foundSiniestros = [];
    if (currentMode === 'placa') {
        const match = claimsDatabase.find(item => item.placa === query);
        if (match) foundSiniestros = match.siniestros;
    } else {
        claimsDatabase.forEach(item => {
            const matchSin = item.siniestros.find(s => s.numero.toUpperCase() === query);
            if (matchSin) foundSiniestros.push(matchSin);
        });
    }

    msgContainer.classList.remove('hidden'); msgContainer.classList.add('flex');

    if (foundSiniestros.length > 0) {
        const icon = `<svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
        msgEl.innerHTML = currentMode === 'placa'
            ? `${icon} <span class="text-emerald-700 font-medium">Placa registrada. ${foundSiniestros.length} expediente(s) en curso encontrados.</span>`
            : `${icon} <span class="text-emerald-700 font-medium">Siniestro encontrado en curso.</span>`;
        lastFoundSiniestros = foundSiniestros;
        activeSiniestroIndex = 0;
        renderSingleScreenView();
    } else {
        const icon = `<svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>`;
        msgEl.innerHTML = currentMode === 'placa'
            ? `${icon} <span class="text-rose-600 font-medium">Placa no registrada o sin siniestros en curso.</span>`
            : `${icon} <span class="text-rose-600 font-medium">Siniestro no registrado o cerrado.</span>`;
        container.innerHTML = '';
    }
}

function getStatusBadgeStyle(status) {
    const s = status.toUpperCase();
    switch(s) {
        case "PENDIENTE POR SOLICITAR AJUSTE": return 'bg-amber-400 text-black border-amber-500';
        case "PENDIENTE POR AJUSTE": return 'bg-orange-500 text-white border-orange-600';
        case "PENDIENTE POR DICTAMEN": return 'bg-indigo-600 text-white border-indigo-700';
        case "PENDIENTE POR COTIZACIONES DE REPUESTOS": return 'bg-cyan-600 text-white border-cyan-700';
        case "PENDIENTE POR ORDEN DE REPARACIÓN": return 'bg-blue-600 text-white border-blue-700';
        case "PENDIENTE POR FACTURA DE REPARACIÓN": return 'bg-teal-600 text-white border-teal-700';
        case "PENDIENTE POR SOLICITUD DE PAGO DE FACTURA DE REPARACIÓN": return 'bg-emerald-600 text-white border-emerald-700';
        case "PENDIENTE POR COMPRAS DE REPUESTOS": return 'bg-rose-600 text-white border-rose-700';
        case "PENDIENTE POR FACTURA DE REPUESTOS": return 'bg-fuchsia-600 text-white border-fuchsia-700';
        case "PENDIENTE POR SOLICITUD DE PAGO FACTURA DE COMPRA DE REPUESTOS": return 'bg-purple-600 text-white border-purple-700';
        default: return 'bg-slate-500 text-white border-slate-600';
    }
}

function renderSingleScreenView() {
    const container = document.getElementById('results-container');
    const siniestros = lastFoundSiniestros;
    const currentSin = siniestros[activeSiniestroIndex];
    const isMulti = siniestros.length > 1;

    let tabsHtml = '';
    if (isMulti) {
        tabsHtml = `<div class="swiper-native-container px-2 gap-2 items-end shrink-0">
            ${siniestros.map((sin, idx) => {
                const isActive = idx === activeSiniestroIndex;
                const activeClass = "bg-white text-blue-900 font-extrabold border-t-2 border-x-2 border-slate-300 pb-2.5 pt-3 z-10 rounded-t-xl shadow-[0_-2px_8px_rgba(0,0,0,0.06)] text-sm md:text-base";
                const inactiveClass = "bg-slate-200 text-slate-600 hover:bg-slate-300 font-bold border-t border-x border-slate-300 pb-2 pt-2.5 rounded-t-lg -mb-px text-xs md:text-sm";
                return `<div data-action="selectTab" data-index="${idx}" class="swiper-native-slide px-4 md:px-5 tracking-wide transition-all whitespace-nowrap flex items-center cursor-pointer ${isActive ? activeClass : inactiveClass}">
                    <svg class="w-4 h-4 md:w-5 md:h-5 mr-2 ${isActive ? 'text-blue-600' : 'text-slate-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                    ${sin.numero}
                </div>`;
            }).join('')}
        </div>`;
    }

    let html = `${tabsHtml}
    <div class="apple-card flex flex-col flex-1 min-h-0 overflow-hidden ${isMulti ? 'rounded-tl-none border-t-0 shadow-none ring-1 ring-slate-200' : ''}">
        <div class="mercantil-gradient ${isMulti ? 'rounded-tr-xl' : 'rounded-t-xl'} shrink-0 px-4 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                    <svg class="w-6 h-6 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <div>
                    <h2 class="text-sm md:text-base font-black font-mono tracking-wide leading-none">${currentSin.numero}</h2>
                    <p class="text-xs md:text-sm text-blue-100 flex flex-wrap gap-x-2 mt-1 font-medium">
                        <span>${currentSin.vehiculo}</span><span class="opacity-50">•</span><span>Póliza: ${currentSin.poliza}</span><span class="opacity-50">•</span><span>Reg: ${currentSin.fechaRegistro}</span>
                    </p>
                </div>
            </div>
        </div>
        <div class="p-2 space-y-2 flex-1 overflow-y-auto bg-slate-50/80 hide-scrollbar">
            ${currentSin.ajustes.map((adj, adjIdx) => {
                const estatusArray = Array.isArray(adj.estatus) ? adj.estatus : [adj.estatus];
                const isPendienteSolicitar = estatusArray.includes("PENDIENTE POR SOLICITAR AJUSTE");
                const hasMultipleDocs = adj.documentos.length > 1;

                const badgesHtml = estatusArray.map(s => `
                    <div class="px-2.5 py-1 rounded-md text-xs md:text-sm font-bold border flex items-center gap-1.5 ${getStatusBadgeStyle(s)} shadow-sm uppercase">
                        <span>${s}</span>
                        <span data-action="showStatusHelp" data-status="${s}" class="w-5 h-5 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition cursor-pointer" title="Más información">
                            <svg class="w-3.5 h-3.5 opacity-90 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </span>
                    </div>
                `).join('');

                return `
                <details class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group transition-all" ${adjIdx === 0 ? 'open' : ''}>
                    <summary class="px-3 md:px-4 py-2.5 md:py-3 bg-white cursor-pointer flex justify-between items-center hover:bg-slate-50 transition select-none">
                        <div class="flex items-center gap-2.5 md:gap-3 w-full overflow-hidden">
                            <div class="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                            </div>
                            <div class="flex flex-1 items-center gap-2 overflow-hidden flex-wrap">
                                ${!isPendienteSolicitar ? `<h3 class="text-sm md:text-base font-black text-slate-900 font-mono tracking-tight shrink-0 mr-1">${adj.id}</h3>` : ''}
                                <div class="flex flex-wrap gap-1.5">${badgesHtml}</div>
                            </div>
                        </div>
                        <svg class="w-5 h-5 md:w-6 md:h-6 text-blue-600 group-open:rotate-180 transition transform duration-200 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </summary>
                    <div class="px-3 md:px-4 pb-3 pt-2 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2.5">
                        ${hasMultipleDocs ? `
                        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div class="relative w-full sm:max-w-[280px]">
                                <input type="text" data-action="filterDocs" data-adj="${adj.id}" placeholder="Buscar documento..." class="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 shadow-inner font-medium">
                                <svg class="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                            </div>
                            <button data-action="sortDocs" data-adj="${adj.id}" data-order="asc" class="bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold transition border border-slate-200 shadow-sm flex items-center shrink-0 w-fit">
                                A-Z <svg class="w-4 h-4 ml-1 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
                            </button>
                        </div>` : ''}
                        <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                            <table class="w-full text-left">
                                <tbody id="doc-tbody-${adj.id}" class="divide-y divide-slate-100">
                                    ${adj.documentos.map(doc => `
                                    <tr class="hover:bg-blue-50/60 transition doc-row-${adj.id}" data-title="${doc.titulo}">
                                        <td class="px-3.5 py-2.5 font-semibold text-slate-800 text-sm md:text-base flex items-center space-x-3">
                                            <svg class="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                            <span class="leading-snug">${doc.titulo}</span>
                                        </td>
                                        <td class="px-3.5 py-2.5 text-right w-28 sm:w-36">
                                            <button data-action="openDoc" data-title="${doc.titulo}" data-fecha="${currentSin.fechaRegistro}" class="text-blue-700 hover:text-blue-900 font-bold transition text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm flex items-center justify-center gap-1.5 w-full">
                                                Ver <svg class="w-4 h-4 hidden sm:block pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                            </button>
                                        </td>
                                    </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </details>`;
            }).join('')}
        </div>
    </div>`;
    container.innerHTML = html;
}

function sortDocuments(adjId, btnElement) {
    const tbody = document.getElementById(`doc-tbody-${adjId}`);
    const rowsArray = Array.from(tbody.querySelectorAll('tr'));
    const currentOrder = btnElement.getAttribute('data-order') || 'asc';

    rowsArray.sort((a, b) => {
        const titleA = a.getAttribute('data-title');
        const titleB = b.getAttribute('data-title');
        return currentOrder === 'asc' ? titleB.localeCompare(titleA) : titleA.localeCompare(titleB);
    });

    btnElement.setAttribute('data-order', currentOrder === 'asc' ? 'desc' : 'asc');
    const iconSvg = currentOrder === 'asc'
        ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>`
        : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/>`;
    btnElement.innerHTML = `A-Z <svg class="w-4 h-4 ml-1 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">${iconSvg}</svg>`;
    rowsArray.forEach(row => tbody.appendChild(row));
}

function showStatusHelp(status) {
    const desc = statusDefinitions[status] || "Estatus en proceso de validación por parte del analista.";
    document.getElementById('modal-status-title').innerText = status;
    document.getElementById('modal-status-desc').innerText = desc;
    document.getElementById('modal-status-help').classList.remove('hidden');
}

function openDocModal(title, fecha, contenido) {
    document.getElementById('modal-doc-title').innerHTML = `<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> ${title}`;
    document.getElementById('modal-doc-body').innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between border-b pb-2 text-sm text-slate-500 font-bold tracking-wide"><span>SEGUROS MERCANTIL</span><span>Reg: ${fecha}</span></div>
            <h4 class="font-black text-base md:text-lg text-slate-900 uppercase tracking-wide leading-snug">${title}</h4>
            <div class="text-slate-700 text-sm md:text-base leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-200 min-h-[200px] shadow-inner">${contenido}</div>
        </div>`;
    document.getElementById('modal-doc').classList.remove('hidden');
}

document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');

    if (action === 'setMode') { setMode(target.getAttribute('data-mode')); }
    else if (action === 'executeSearch') { executeSearch(); }
    else if (action === 'clearSearch') { clearSearch(); }
    else if (action === 'selectTab') {
        activeSiniestroIndex = parseInt(target.getAttribute('data-index'));
        renderSingleScreenView();
    }
    else if (action === 'sortDocs') { sortDocuments(target.getAttribute('data-adj'), target); }
    else if (action === 'showStatusHelp') {
        e.preventDefault(); e.stopPropagation();
        showStatusHelp(target.getAttribute('data-status'));
    }
    else if (action === 'closeStatusHelp') { document.getElementById('modal-status-help').classList.add('hidden'); }
    else if (action === 'openDoc') { openDocModal(target.getAttribute('data-title'), target.getAttribute('data-fecha'), 'Documento oficial derivado del sistema Premium/AutoFast.'); }
    else if (action === 'closeDoc') { document.getElementById('modal-doc').classList.add('hidden'); }
    else if (action === 'printDoc') { window.print(); }
});

document.addEventListener('keyup', function(e) {
    if (e.target.id === 'search-input' && e.key === 'Enter') {
        executeSearch();
    } else if (e.target.hasAttribute('data-action') && e.target.getAttribute('data-action') === 'filterDocs') {
        const adjId = e.target.getAttribute('data-adj');
        const inputVal = e.target.value.toLowerCase();
        document.querySelectorAll(`.doc-row-${adjId}`).forEach(row => {
            row.style.display = row.getAttribute('data-title').toLowerCase().includes(inputVal) ? '' : 'none';
        });
    }
});

window.onload = function() {
    setMode('placa');
    executeSearch();
};
