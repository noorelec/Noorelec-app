// NOORELEC V4 ENHANCED - Application JavaScript Complète

// ============================================================================
// ÉTAT GLOBAL
// ============================================================================

const state = {
    client: { name: '', phone: '', email: '', address: '' },
    pieces: [],
    tableau: { enabled: false, type: 0, items: [] },
    admin: { packAllIn: false, packPrice: 800, services: [] },
    settings: { tarif: 50, tva: 0.06 },
    nextId: 1
};

// ============================================================================
// CATALOGUE D'ARTICLES (temps corrigé: 1.0 = 1h, 0.5 = 30min)
// ============================================================================

const CATALOGUE = [
    { id: 1, name: "Prise Niko blanc", price: 8.50, temps: 0.5 },
    { id: 2, name: "Prise Niko anthracite", price: 9.20, temps: 0.5 },
    { id: 3, name: "Prise USB Niko", price: 28.50, temps: 0.75 },
    { id: 4, name: "Interrupteur Niko", price: 6.90, temps: 0.33 },
    { id: 5, name: "Va-et-vient Niko", price: 12.50, temps: 0.5 },
    { id: 6, name: "Variateur LED", price: 45.80, temps: 0.75 },
    { id: 7, name: "Spot LED 5W", price: 12.50, temps: 0.5 },
    { id: 8, name: "Spot LED 10W", price: 18.90, temps: 0.5 },
    { id: 9, name: "Plafonnier LED", price: 35.00, temps: 1.0 },
    { id: 10, name: "Disjoncteur 16A", price: 12, temps: 0.25 },
    { id: 11, name: "Disjoncteur 20A", price: 15, temps: 0.25 },
    { id: 12, name: "Différentiel 30mA", price: 45, temps: 0.5 }
];

const CABLES = [
    { name: "XVB 3G2.5mm²", prixM: 2.45, moM: 2.8 },
    { name: "XVB 3G1.5mm²", prixM: 1.85, moM: 2.5 },
    { name: "XVB 3G6mm²", prixM: 5.25, moM: 3.8 },
    { name: "XVB 5G2.5mm²", prixM: 3.95, moM: 3.5 }
];

// ============================================================================
// INITIALISATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderCatalogue();
    calcTotal();
});

// ============================================================================
// NAVIGATION
// ============================================================================

function switchPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    event.target.closest('.nav-item').classList.add('active');
    if (page === 'recap') calcTotal();
}

// ============================================================================
// GESTION DES PIÈCES
// ============================================================================

function addPiece() {
    const nom = document.getElementById('newPieceName').value.trim();
    if (!nom) { alert('Entrez un nom de pièce'); return; }
    
    state.pieces.push({
        id: state.nextId++,
        nom: nom,
        articles: [],
        cablesInt: [],
        cablesTab: []
    });
    
    document.getElementById('newPieceName').value = '';
    saveData();
    renderPieces();
}

function renderPieces() {
    const container = document.getElementById('piecesContainer');
    if (state.pieces.length === 0) {
        container.innerHTML = '<div class="empty-state">Aucune pièce ajoutée</div>';
        return;
    }
    
    let html = '';
    state.pieces.forEach((piece, idx) => {
        const total = calcPieceTotal(piece);
        html += `
            <div class="piece-card">
                <div class="piece-header">
                    <div class="piece-title">🏠 ${piece.nom}</div>
                    <div style="display:flex;gap:15px;align-items:center;">
                        <div class="piece-total">${total.toFixed(2)}€</div>
                        <button class="btn-delete" onclick="deletePiece(${idx})">🗑️</button>
                    </div>
                </div>
                
                <h4>Articles</h4>
                <div class="form-grid three-cols">
                    <select id="art${piece.id}">
                        ${CATALOGUE.map(a => `<option value="${a.id}">${a.name} (${a.price}€)</option>`).join('')}
                    </select>
                    <input type="number" id="qty${piece.id}" value="1" min="1">
                    <button class="btn btn-success" onclick="addArtToPiece(${idx})">➕</button>
                </div>
                <div id="arts${piece.id}" style="margin:15px 0;">
                    ${renderPieceItems(piece.articles, 'article', idx)}
                </div>
                
                <h4>🔌 Câbles internes</h4>
                <div class="form-grid three-cols">
                    <select id="cint${piece.id}">
                        ${CABLES.map((c,i) => `<option value="${i}">${c.name}</option>`).join('')}
                    </select>
                    <input type="number" id="cintlen${piece.id}" value="5" step="0.5">
                    <button class="btn btn-info" onclick="addCableInt(${idx})">➕</button>
                </div>
                <div>${renderPieceItems(piece.cablesInt, 'cable', idx)}</div>
                
                <h4>⚡ Câbles vers tableau</h4>
                <div class="form-grid three-cols">
                    <select id="ctab${piece.id}">
                        ${CABLES.map((c,i) => `<option value="${i}">${c.name}</option>`).join('')}
                    </select>
                    <input type="number" id="ctablen${piece.id}" value="10" step="0.5">
                    <button class="btn btn-warning" onclick="addCableTab(${idx})">➕</button>
                </div>
                <div>${renderPieceItems(piece.cablesTab, 'cabletab', idx)}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderPieceItems(items, type, pieceIdx) {
    if (!items || items.length === 0) return '<div class="empty-state">Aucun élément</div>';
    return items.map((item, idx) => `
        <div class="article-card" style="display:flex;justify-content:space-between;padding:10px;margin:5px 0;">
            <div>${item.nom} - ${item.total.toFixed(2)}€</div>
            <button class="btn-delete" onclick="deleteItem(${pieceIdx}, '${type}', ${idx})">🗑️</button>
        </div>
    `).join('');
}

function addArtToPiece(idx) {
    const piece = state.pieces[idx];
    const artId = parseInt(document.getElementById(`art${piece.id}`).value);
    const qty = parseFloat(document.getElementById(`qty${piece.id}`).value);
    const art = CATALOGUE.find(a => a.id === artId);
    
    const mat = art.price * qty;
    const mo = art.temps * qty * state.settings.tarif;
    
    piece.articles.push({
        nom: `${qty}× ${art.name}`,
        materiel: mat,
        mo: mo,
        temps: art.temps * qty,
        total: mat + mo
    });
    
    saveData();
    renderPieces();
}

function addCableInt(idx) {
    const piece = state.pieces[idx];
    const cIdx = parseInt(document.getElementById(`cint${piece.id}`).value);
    const len = parseFloat(document.getElementById(`cintlen${piece.id}`).value);
    const cable = CABLES[cIdx];
    
    const total = (cable.prixM + cable.moM) * len;
    
    piece.cablesInt.push({
        nom: `${cable.name} ${len}m (interne)`,
        total: total
    });
    
    saveData();
    renderPieces();
}

function addCableTab(idx) {
    const piece = state.pieces[idx];
    const cIdx = parseInt(document.getElementById(`ctab${piece.id}`).value);
    const len = parseFloat(document.getElementById(`ctablen${piece.id}`).value);
    const cable = CABLES[cIdx];
    
    const total = (cable.prixM + cable.moM) * len;
    
    piece.cablesTab.push({
        nom: `${cable.name} ${len}m (vers tableau)`,
        total: total
    });
    
    saveData();
    renderPieces();
}

function deletePiece(idx) {
    if (confirm('Supprimer cette pièce ?')) {
        state.pieces.splice(idx, 1);
        saveData();
        renderPieces();
    }
}

function deleteItem(pieceIdx, type, itemIdx) {
    const piece = state.pieces[pieceIdx];
    if (type === 'article') piece.articles.splice(itemIdx, 1);
    else if (type === 'cable') piece.cablesInt.splice(itemIdx, 1);
    else if (type === 'cabletab') piece.cablesTab.splice(itemIdx, 1);
    saveData();
    renderPieces();
}

function calcPieceTotal(piece) {
    let total = 0;
    (piece.articles || []).forEach(a => total += a.total);
    (piece.cablesInt || []).forEach(c => total += c.total);
    (piece.cablesTab || []).forEach(c => total += c.total);
    return total;
}

// ============================================================================
// TABLEAU
// ============================================================================

function toggleTableau() {
    state.tableau.enabled = document.getElementById('tableauCheck').checked;
    document.getElementById('tableauContent').style.display = state.tableau.enabled ? 'block' : 'none';
    saveData();
}

function addDisjoncteur() {
    const nom = prompt('Nom du composant:', 'Disjoncteur 16A');
    if (!nom) return;
    const prix = parseFloat(prompt('Prix (€):', '25'));
    if (isNaN(prix)) return;
    
    state.tableau.items.push({ nom, prix });
    saveData();
    renderDisjoncteurs();
}

function renderDisjoncteurs() {
    const container = document.getElementById('disjoncteurs');
    if (!state.tableau.items.length) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = state.tableau.items.map((item, idx) => `
        <div class="article-card" style="display:flex;justify-content:space-between;padding:10px;margin:5px 0;">
            <div>${item.nom} - ${item.prix}€</div>
            <button class="btn-delete" onclick="deleteDis(${idx})">🗑️</button>
        </div>
    `).join('');
}

function deleteDis(idx) {
    state.tableau.items.splice(idx, 1);
    saveData();
    renderDisjoncteurs();
}

// ============================================================================
// SERVICES ADMINISTRATIFS
// ============================================================================

function togglePackAllIn() {
    const active = document.getElementById('packAllIn').checked;
    state.admin.packAllIn = active;
    
    if (active) {
        document.querySelectorAll('.service-check').forEach(c => c.checked = false);
    }
    
    document.getElementById('servicesIndiv').style.opacity = active ? '0.5' : '1';
    document.getElementById('servicesIndiv').style.pointerEvents = active ? 'none' : 'auto';
    saveData();
}

// ============================================================================
// CALCUL TOTAL & RÉCAP
// ============================================================================

function calcTotal() {
    let sousTotal = 0;
    let tempsTotal = 0;
    
    // Pièces
    state.pieces.forEach(piece => {
        sousTotal += calcPieceTotal(piece);
        (piece.articles || []).forEach(a => tempsTotal += a.temps || 0);
    });
    
    // Tableau
    if (state.tableau.enabled) {
        const type = parseInt(document.getElementById('tableauType').value);
        sousTotal += type + 50; // coffret + MO
        state.tableau.items.forEach(item => sousTotal += item.prix);
    }
    
    // Services Admin
    if (state.admin.packAllIn) {
        const prix = parseFloat(document.getElementById('packPrice').value);
        sousTotal += prix;
    } else {
        document.querySelectorAll('.service-check:checked').forEach(chk => {
            sousTotal += parseFloat(chk.dataset.price);
        });
    }
    
    // Ristournes
    let rist24 = 0, rist48 = 0;
    if (document.getElementById('rist24').checked) {
        rist24 = sousTotal * (parseInt(document.getElementById('rist24pct').value) / 100);
    }
    if (document.getElementById('rist48').checked) {
        rist48 = sousTotal * (parseInt(document.getElementById('rist48pct').value) / 100);
    }
    
    const totalHT = sousTotal;
    const tva = totalHT * state.settings.tva;
    const totalTTC = totalHT + tva;
    
    // Temps estimé (2 personnes, 8h/jour)
    const jours = Math.ceil(tempsTotal / 16);
    const joursMax = Math.ceil(tempsTotal / 12);
    
    // Afficher récap
    let html = `
        <div class="recap-section">
            <h3>💼 Client</h3>
            <div><strong>${state.client.name || 'Non renseigné'}</strong></div>
            <div>${state.client.email || ''}</div>
            <div>${state.client.address || ''}</div>
        </div>
    `;
    
    if (state.pieces.length > 0) {
        html += '<div class="recap-section"><h3>🏠 Pièces</h3>';
        state.pieces.forEach(piece => {
            html += `<div class="recap-line"><span>${piece.nom}</span><span>${calcPieceTotal(piece).toFixed(2)}€</span></div>`;
        });
        html += '</div>';
    }
    
    html += `
        <div class="info-box" style="margin:20px 0;">
            <strong>⏱️ Temps estimé : Entre ${jours} et ${joursMax} jours de travail (2 personnes)</strong>
        </div>
        
        <div class="recap-total">
            <div class="recap-total-line"><span>SOUS-TOTAL HT:</span><span>${sousTotal.toFixed(2)}€</span></div>
            <div class="recap-total-line"><span>TVA (${(state.settings.tva*100)}%):</span><span>${tva.toFixed(2)}€</span></div>
            <div class="recap-total-line final"><span>TOTAL TTC:</span><span>${totalTTC.toFixed(2)}€</span></div>
        </div>
    `;
    
    if (rist24 > 0) {
        const deadline = new Date(Date.now() + 24*60*60*1000);
        html += `
            <div style="background:#d4edda;padding:15px;border-radius:8px;margin-top:15px;">
                <strong>🎁 Avec ristourne 24h : ${(totalTTC - rist24).toFixed(2)}€</strong><br>
                <small>Valable jusqu'au ${deadline.toLocaleDateString()} ${deadline.toLocaleTimeString()}</small>
            </div>
        `;
    }
    
    if (rist48 > 0) {
        const deadline = new Date(Date.now() + 48*60*60*1000);
        html += `
            <div style="background:#fff3cd;padding:15px;border-radius:8px;margin-top:15px;">
                <strong>🎁 Avec ristourne 48h : ${(totalTTC - rist48).toFixed(2)}€</strong><br>
                <small>Valable jusqu'au ${deadline.toLocaleDateString()} ${deadline.toLocaleTimeString()}</small>
            </div>
        `;
    }
    
    document.getElementById('recapContent').innerHTML = html;
}

// ============================================================================
// GÉNÉRATION PDF
// ============================================================================

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('DEVIS ÉLECTRIQUE', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    let y = 40;
    doc.text(`Client: ${state.client.name}`, 20, y);
    y += 10;
    
    // Ajouter les pièces
    state.pieces.forEach(piece => {
        doc.text(`${piece.nom}: ${calcPieceTotal(piece).toFixed(2)}€`, 20, y);
        y += 7;
    });
    
    y += 10;
    calcTotal();
    
    const filename = `Devis_${state.client.name.replace(/ /g,'_')}_${new Date().toLocaleDateString().replace(/\//g,'-')}.pdf`;
    doc.save(filename);
}

// ============================================================================
// ENVOI EMAIL
// ============================================================================

function sendEmail() {
    const email = state.client.email;
    if (!email) {
        alert('Email client non renseigné');
        return;
    }
    
    const subject = `Devis électrique - ${state.client.name}`;
    const body = `Bonjour,\n\nVeuillez trouver votre devis électrique en pièce jointe.\n\nCordialement`;
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ============================================================================
// ARTICLES PERSONNALISÉS
// ============================================================================

function addCustomArticle() {
    const nom = document.getElementById('newArtName').value.trim();
    const prix = parseFloat(document.getElementById('newArtPrice').value);
    const temps = parseFloat(document.getElementById('newArtTime').value);
    
    if (!nom || isNaN(prix) || isNaN(temps)) {
        alert('Remplissez tous les champs');
        return;
    }
    
    CATALOGUE.push({
        id: CATALOGUE.length + 1,
        name: nom,
        price: prix,
        temps: temps,
        custom: true
    });
    
    document.getElementById('newArtName').value = '';
    document.getElementById('newArtPrice').value = '';
    document.getElementById('newArtTime').value = '';
    
    saveData();
    renderCatalogue();
    alert('Article ajouté !');
}

function renderCatalogue() {
    const container = document.getElementById('catalogueList');
    if (!container) return;
    
    container.innerHTML = CATALOGUE.map(art => `
        <div class="article-card" style="display:flex;justify-content:space-between;padding:10px;margin:5px 0;">
            <div><strong>${art.name}</strong> - ${art.price}€ (${art.temps}h)</div>
            ${art.custom ? `<button class="btn-delete" onclick="deleteArticle(${art.id})">🗑️</button>` : ''}
        </div>
    `).join('');
}

function deleteArticle(id) {
    const idx = CATALOGUE.findIndex(a => a.id === id);
    if (idx > -1) {
        CATALOGUE.splice(idx, 1);
        renderCatalogue();
        saveData();
    }
}

// ============================================================================
// SAUVEGARDE / CHARGEMENT
// ============================================================================

function saveData() {
    state.client.name = document.getElementById('clientName')?.value || '';
    state.client.phone = document.getElementById('clientPhone')?.value || '';
    state.client.email = document.getElementById('clientEmail')?.value || '';
    state.client.address = document.getElementById('clientAddress')?.value || '';
    state.settings.tarif = parseInt(document.getElementById('tarif')?.value || 50);
    state.settings.tva = parseFloat(document.getElementById('tva')?.value || 0.06);
    
    localStorage.setItem('noorelec_v4', JSON.stringify(state));
    localStorage.setItem('noorelec_catalogue', JSON.stringify(CATALOGUE));
}

function loadData() {
    const saved = localStorage.getItem('noorelec_v4');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(state, data);
        
        document.getElementById('clientName').value = state.client.name || '';
        document.getElementById('clientPhone').value = state.client.phone || '';
        document.getElementById('clientEmail').value = state.client.email || '';
        document.getElementById('clientAddress').value = state.client.address || '';
        document.getElementById('tarif').value = state.settings.tarif;
        document.getElementById('tva').value = state.settings.tva;
    }
    
    const savedCat = localStorage.getItem('noorelec_catalogue');
    if (savedCat) {
        const customArts = JSON.parse(savedCat).filter(a => a.custom);
        CATALOGUE.push(...customArts);
    }
    
    renderPieces();
    renderDisjoncteurs();
}
