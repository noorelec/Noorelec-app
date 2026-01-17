// NOORELEC V4 - APPLICATION JAVASCRIPT

// ============================================================================
// ÉTAT GLOBAL
// ============================================================================

const devisState = {
    client: {
        name: '',
        phone: '',
        email: '',
        tva: '',
        rue: '',
        cp: '',
        commune: '',
        projectType: 'residential',
        buildingAge: 'old'
    },
    
    global: {
        tarif: 50,
        tva: 0.06,
        deplacement: 25
    },
    
    travaux: {
        articles: [],
        nextId: 1,
        cabling: {
            internal: { length: 0, cost: 0 },
            tableau: { length: 0, cost: 0 }
        }
    },

    pieces: {
  list: [],
  nextId: 1
},
    ristournes: {
    h24: { active: false, percent: 15 },
    h48: { active: false, percent: 10 }
},

    tableau: {
        enabled: false,
        items: [],
        total: 0
    },
    
    administratif: {
        services: []
    }
};

// ============================================================================
// CATALOGUE ARTICLES
// ============================================================================

const CATALOGUE = [
    { id: 1, name: "Prise Niko blanc", price: 8, temps: 0.5 }, // 30 min, category: "Prises" },
    { id: 2, name: "Prise Niko anthracite", price: 9.20, temps: 0.5 }, // 30 min, category: "Prises" },
    { id: 3, name: "Prise USB Niko", price: 28.50, temps: 0.4, category: "Prises" },
    { id: 4, name: "Prise étanche IP44", price: 15.80, temps: 0.5, category: "Prises" },
    { id: 5, name: "Interrupteur Niko", price: 6.90, temps: 0.25, category: "Interrupteurs" },
    { id: 6, name: "Va-et-vient Niko", price: 12.50, temps: 0.4, category: "Interrupteurs" },
    { id: 7, name: "Variateur LED Niko", price: 45.80, temps: 0.35, category: "Interrupteurs" },
    { id: 8, name: "Spot LED encastré 5W", price: 12.50, temps: 0.3, category: "Éclairage" },
    { id: 9, name: "Spot LED encastré 10W", price: 18.90, temps: 0.3, category: "Éclairage" },
    { id: 10, name: "Plafonnier LED 18W", price: 35.00, temps: 0.5, category: "Éclairage" },
    { id: 11, name: "Projecteur LED 50W", price: 55.00, temps: 0.6, category: "Éclairage" },
    { id: 12, name: "Prise RJ45 Cat6", price: 12.00, temps: 0.35, category: "Réseau" },
    { id: 13, name: "Coffret multimédia", price: 85.00, temps: 1.0, category: "Réseau" },
    { id: 14, name: "Sonnette WiFi", price: 95.00, temps: 0.8, category: "Domotique" },
    { id: 15, name: "Détecteur de fumée", price: 25.00, temps: 0.3, category: "Sécurité" }
];

// ============================================================================
// FACTEURS D'INSTALLATION
// ============================================================================

const FACTEURS = {
    installation: {
        'apparent': 1.0,
        'encastre': 1.5,
        'faux-plafond': 1.2,
        'sous-plancher': 1.3
    },
    circuit: {
        'existant': 1.0,
        'nouvelle-ligne': 2.0
    }
};

// ============================================================================
// INITIALISATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('NOORELEC V4 - Initialisation');
    initializeArticleSelect();
    loadFromLocalStorage();
    updateRecap();
});

// ============================================================================
// NAVIGATION
// ============================================================================

function switchPage(pageName) {
    // Masquer toutes les pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Afficher la page demandée
    const page = document.getElementById('page-' + pageName);
    if (page) {
        page.classList.add('active');
    }
    
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItem = document.querySelector(`[data-page="${pageName}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Actions spécifiques par page
    if (pageName === 'recapitulatif') {
        updateRecap();
    }
    
    if (pageName === 'administratif') {
        updateAdminPrices();
    }
    
    if (pageName === 'parametres') {
        renderCatalogueEditor();
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// ============================================================================
// PAGE CLIENT
// ============================================================================

function saveClientData() {
    devisState.client.name = document.getElementById('clientName').value;
    devisState.client.phone = document.getElementById('clientPhone').value;
    devisState.client.email = document.getElementById('clientEmail').value;
    devisState.client.tva = document.getElementById('clientTVA').value;
    devisState.client.rue = document.getElementById('clientRue').value;
    devisState.client.cp = document.getElementById('clientCP').value;
    devisState.client.commune = document.getElementById('clientCommune').value;
    saveToLocalStorage();
}

function selectProjectType(type) {
    devisState.client.projectType = type;
    document.querySelectorAll('[name="projectType"]').forEach(radio => {
        const card = radio.closest('.option-card');
        if (radio.value === type) {
            card.classList.add('active');
            radio.checked = true;
        } else {
            card.classList.remove('active');
        }
    });
    saveToLocalStorage();
}

function selectBuildingAge(age) {
    devisState.client.buildingAge = age;
    devisState.global.tva = age === 'old' ? 0.06 : 0.21;
    
    document.querySelectorAll('[name="buildingAge"]').forEach(radio => {
        const card = radio.closest('.option-card');
        if (radio.value === age) {
            card.classList.add('active');
            radio.checked = true;
        } else {
            card.classList.remove('active');
        }
    });
    
    // Mettre à jour le select TVA
    const tvaSelect = document.getElementById('globalTVA');
    if (tvaSelect) {
        tvaSelect.value = devisState.global.tva;
    }
    
    saveToLocalStorage();
}

// ============================================================================
// PAGE TRAVAUX - PARAMÈTRES GLOBAUX
// ============================================================================

function updateGlobalSettings() {
    devisState.global.tarif = parseFloat(document.getElementById('globalTarif').value);
    devisState.global.tva = parseFloat(document.getElementById('globalTVA').value);
    devisState.global.deplacement = parseFloat(document.getElementById('globalDeplacement').value);
    saveToLocalStorage();
    updateRecap();
}

// ============================================================================
// PAGE TRAVAUX - ARTICLES
// ============================================================================

function initializeArticleSelect() {
    const select = document.getElementById('newArticleSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Sélectionner un article --</option>';
    
    const categories = {};
    CATALOGUE.forEach(article => {
        if (!categories[article.category]) {
            categories[article.category] = [];
        }
        categories[article.category].push(article);
    });
    
    Object.keys(categories).forEach(category => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        
        categories[category].forEach(article => {
            const option = document.createElement('option');
            option.value = article.id;
            option.textContent = `${article.name} (${article.price}€)`;
            optgroup.appendChild(option);
        });
        
        select.appendChild(optgroup);
    });
}

function updateArticleOptions() {
    // Fonction appelée quand on change d'article
    const preview = document.getElementById('articlePreview');
    preview.style.display = 'none';
}

function calculateArticlePrice() {
    const articleId = parseInt(document.getElementById('newArticleSelect').value);
    if (!articleId) {
        alert('Sélectionnez un article');
        return;
    }
    
    const article = CATALOGUE.find(a => a.id === articleId);
    const quantity = parseFloat(document.getElementById('newArticleQty').value) || 1;
    const installType = document.querySelector('[name="installType"]:checked').value;
    const circuitType = document.querySelector('[name="circuitType"]:checked').value;
    const rebouchage = document.getElementById('rebouchageCheck').checked;
    
    // Calculs
    const materielTotal = article.price * quantity;
    let tempsTotal = article.temps * quantity;
    
    // Appliquer facteurs
    tempsTotal *= FACTEURS.installation[installType];
    tempsTotal *= FACTEURS.circuit[circuitType];
    
    const moTotal = tempsTotal * devisState.global.tarif;
    const rebouchageTotal = rebouchage ? userSettings.autres.rebouchage : 0;
    
    // Dégressivité
    let prixUnitaireHT = article.price + (moTotal / quantity);
    if (quantity >= 10) {
        prixUnitaireHT *= 0.75; // -25%
    } else if (quantity >= 5) {
        prixUnitaireHT *= 0.85; // -15%
    }
    
    const totalHT = (prixUnitaireHT * quantity) + rebouchageTotal;
    
    // Afficher aperçu
    let degressivite = '';
    if (quantity >= 10) degressivite = '<span style="color: #28a745; font-weight: 700;"> (-25% dégressif!)</span>';
    else if (quantity >= 5) degressivite = '<span style="color: #28a745; font-weight: 700;"> (-15% dégressif!)</span>';
    
    const html = `
        <div style="margin-bottom: 10px;">
            <strong>${quantity}× ${article.name}</strong>${degressivite}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.95em;">
            <div>Matériel total:</div><div style="text-align: right;">${materielTotal.toFixed(2)}€</div>
            <div>Main d'œuvre:</div><div style="text-align: right;">${moTotal.toFixed(2)}€ (${tempsTotal.toFixed(2)}h)</div>
            ${rebouchage ? `<div>Rebouchage:</div><div style="text-align: right;">${rebouchageTotal.toFixed(2)}€</div>` : ''}
            <div style="border-top: 2px solid #17a2b8; padding-top: 8px;"><strong>TOTAL:</strong></div>
            <div style="border-top: 2px solid #17a2b8; padding-top: 8px; text-align: right;"><strong>${totalHT.toFixed(2)}€ HTVA</strong></div>
        </div>
        <div style="margin-top: 10px; padding: 8px; background: rgba(23, 162, 184, 0.1); border-radius: 6px; font-size: 0.85em;">
            Installation: ${installType} | Circuit: ${circuitType} | Tarif: ${devisState.global.tarif}€/h
        </div>
    `;
    
    document.getElementById('articlePreviewContent').innerHTML = html;
    document.getElementById('articlePreview').style.display = 'block';
}

function addArticleToList() {
    const articleId = parseInt(document.getElementById('newArticleSelect').value);
    if (!articleId) {
        alert('Sélectionnez un article et calculez le prix d\'abord');
        return;
    }
    
    const article = CATALOGUE.find(a => a.id === articleId);
    const quantity = parseFloat(document.getElementById('newArticleQty').value) || 1;
    const installType = document.querySelector('[name="installType"]:checked').value;
    const circuitType = document.querySelector('[name="circuitType"]:checked').value;
    const rebouchage = document.getElementById('rebouchageCheck').checked;
    
    // Calculs (même logique que calculateArticlePrice)
    const materielTotal = article.price * quantity;
    let tempsTotal = article.temps * quantity;
    tempsTotal *= FACTEURS.installation[installType];
    tempsTotal *= FACTEURS.circuit[circuitType];
    const moTotal = tempsTotal * devisState.global.tarif;
    const rebouchageTotal = rebouchage ? userSettings.autres.rebouchage : 0;
    
    let prixUnitaireHT = article.price + (moTotal / quantity);
    if (quantity >= 10) prixUnitaireHT *= 0.75;
    else if (quantity >= 5) prixUnitaireHT *= 0.85;
    
    const totalHT = (prixUnitaireHT * quantity) + rebouchageTotal;
    
    // Ajouter à l'état
    devisState.travaux.articles.push({
        id: devisState.travaux.nextId++,
        articleId: articleId,
        name: article.name,
        quantity: quantity,
        installType: installType,
        circuitType: circuitType,
        rebouchage: rebouchage,
        materiel: materielTotal,
        mo: moTotal,
        temps: tempsTotal,
        rebouchageTotal: rebouchageTotal,
        total: totalHT
    });
    
    // Render
    renderArticlesList();
    
    // Reset form
    document.getElementById('newArticleSelect').value = '';
    document.getElementById('newArticleQty').value = '1';
    document.getElementById('rebouchageCheck').checked = false;
    document.getElementById('articlePreview').style.display = 'none';
    
    saveToLocalStorage();
}

function renderArticlesList() {
    const container = document.getElementById('articlesListContainer');
    
    if (devisState.travaux.articles.length === 0) {
        container.innerHTML = '<div class="empty-state">Aucun article ajouté</div>';
        document.getElementById('articleCount').textContent = '0';
        return;
    }
    
    document.getElementById('articleCount').textContent = devisState.travaux.articles.length;
    
    container.innerHTML = devisState.travaux.articles.map(art => `
        <div class="article-card">
            <div class="article-header">
                <div>
                    <div class="article-title">${art.quantity}× ${art.name}</div>
                    <div class="article-details">
                        ${getInstallTypeLabel(art.installType)} | ${getCircuitTypeLabel(art.circuitType)}
                        ${art.rebouchage ? ' | Rebouchage inclus' : ''}
                    </div>
                </div>
                <button class="btn-delete" onclick="deleteArticle(${art.id})">🗑️</button>
            </div>
            <div class="article-pricing">
                <div>Matériel: ${art.materiel.toFixed(2)}€</div>
                <div>MO: ${art.mo.toFixed(2)}€ (${art.temps.toFixed(2)}h)</div>
                ${art.rebouchage ? `<div>Rebouchage: 20€</div>` : ''}
            </div>
            <div class="article-total">
                TOTAL: ${art.total.toFixed(2)}€ HTVA
            </div>
        </div>
    `).join('');
}

function deleteArticle(id) {
    if (!confirm('Supprimer cet article ?')) return;
    devisState.travaux.articles = devisState.travaux.articles.filter(a => a.id !== id);
    renderArticlesList();
    saveToLocalStorage();
    updateRecap();
}

function getInstallTypeLabel(type) {
    const labels = {
        'apparent': '📦 Apparent',
        'encastre': '🔨 Encastré',
        'faux-plafond': '⬆️ Faux plafond',
        'sous-plancher': '⬇️ Sous plancher'
    };
    return labels[type] || type;
}

function getCircuitTypeLabel(type) {
    const labels = {
        'existant': '🔄 Circuit existant',
        'nouvelle-ligne': '⚡ Nouvelle ligne'
    };
    return labels[type] || type;
}

// ============================================================================
// PAGE TRAVAUX - CÂBLAGE
// ============================================================================

function calculateCabling() {
    const internalType = document.getElementById('cableInternalType').value.split(',');
    const internalLength = parseFloat(document.getElementById('cableInternalLength').value) || 0;
    const internalPrice = parseFloat(internalType[0]);
    const internalLabor = parseFloat(internalType[1]);
    
    const tableauType = document.getElementById('cableTableauType').value.split(',');
    const tableauLength = parseFloat(document.getElementById('cableTableauLength').value) || 0;
    const tableauPrice = parseFloat(tableauType[0]);
    const tableauLabor = parseFloat(tableauType[1]);
    
    const internalCost = internalLength * (internalPrice + internalLabor);
    const tableauCost = tableauLength * (tableauPrice + tableauLabor);
    const totalCost = internalCost + tableauCost;
    
    devisState.travaux.cabling.internal.length = internalLength;
    devisState.travaux.cabling.internal.cost = internalCost;
    devisState.travaux.cabling.tableau.length = tableauLength;
    devisState.travaux.cabling.tableau.cost = tableauCost;
    
    if (totalCost > 0) {
        document.getElementById('cablingPrice').textContent = totalCost.toFixed(2) + '€';
        document.getElementById('cablingTotal').style.display = 'block';
    } else {
        document.getElementById('cablingTotal').style.display = 'none';
    }
    
    saveToLocalStorage();
    updateRecap();
}

// ============================================================================
// PAGE TABLEAU
// ============================================================================

function toggleTableau() {
    const enabled = document.getElementById('tableauToggle').checked;
    devisState.tableau.enabled = enabled;
    document.getElementById('tableauContent').style.display = enabled ? 'block' : 'none';
    saveToLocalStorage();
    updateRecap();
}

function calculateTableau() {
    const coffret = document.getElementById('tableauCoffret').value.split(',');
    if (coffret[0] === '0') {
        devisState.tableau.total = 0;
        document.getElementById('tableauPrice').textContent = '0€';
        return;
    }
    
    const price = parseFloat(coffret[0]);
    const labor = parseFloat(coffret[1]);
    
    // Ajouter les disjoncteurs
    let disjoncteurTotal = 0;
    devisState.tableau.items.forEach(item => {
        disjoncteurTotal += item.price * item.quantity;
    });
    
    const total = price + labor + disjoncteurTotal;
    
    devisState.tableau.total = total;
    document.getElementById('tableauPrice').textContent = total.toFixed(2) + '€';
    
    saveToLocalStorage();
    updateRecap();
}

function addDisjoncteur() {
    const name = prompt('Nom du composant (ex: Disjoncteur 16A):', 'Disjoncteur 16A');
    if (!name) return;
    
    const price = parseFloat(prompt('Prix unitaire (€):', '25'));
    if (isNaN(price)) return;
    
    const quantity = parseInt(prompt('Quantité:', '1'));
    if (isNaN(quantity)) return;
    
    devisState.tableau.items.push({
        id: Date.now(),
        name: name,
        price: price,
        quantity: quantity
    });
    
    renderDisjoncteursList();
    calculateTableau();
}

function renderDisjoncteursList() {
    const container = document.getElementById('disjoncteursList');
    if (!container) return;
    
    if (devisState.tableau.items.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = devisState.tableau.items.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px;">
            <div>
                <strong>${item.quantity}× ${item.name}</strong>
                <div style="font-size: 0.9em; color: #6c757d;">${item.price}€ / unité</div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <strong>${(item.price * item.quantity).toFixed(2)}€</strong>
                <button onclick="deleteDisjoncteur(${item.id})" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">🗑️</button>
            </div>
        </div>
    `).join('');
}

function deleteDisjoncteur(id) {
    devisState.tableau.items = devisState.tableau.items.filter(item => item.id !== id);
    renderDisjoncteursList();
    calculateTableau();
}

// ============================================================================
// PAGE ADMINISTRATIF
// ============================================================================

function calculateAdmin() {
    let total = 0;
    devisState.administratif.services = [];
    
    document.querySelectorAll('.service-toggle').forEach(toggle => {
        if (toggle.checked) {
            const serviceName = toggle.dataset.service;
            let servicePrice = 0;
            let serviceLabelName = '';
            
            switch(serviceName) {
                case 'conformite':
                    servicePrice = userSettings.services.conformite;
                    serviceLabelName = 'Mise en conformité';
                    break;
                case 'diagnostic':
                    servicePrice = userSettings.services.diagnostic;
                    serviceLabelName = 'Diagnostic électrique';
                    break;
                case 'certificat':
                    servicePrice = userSettings.services.certificat;
                    serviceLabelName = 'Certificat de conformité';
                    break;
                case 'schema':
                    servicePrice = userSettings.services.schema;
                    serviceLabelName = 'Réalisation schéma';
                    break;
                case 'depannage':
                    const hours = parseFloat(document.getElementById('depannageHours').value) || 0;
                    servicePrice = hours * devisState.global.tarif;
                    serviceLabelName = 'Dépannage';
                    document.getElementById('depannagePrice').textContent = servicePrice.toFixed(2) + '€';
                    devisState.administratif.services.push({ name: serviceLabelName, price: servicePrice, hours: hours });
                    total += servicePrice;
                    return;
            }
            
            total += servicePrice;
            devisState.administratif.services.push({ name: serviceLabelName, price: servicePrice });
        }
    });
    
    document.getElementById('adminPrice').textContent = total.toFixed(2) + '€';
    saveToLocalStorage();
    updateRecap();
}

function updateAdminPrices() {
    // Mettre à jour l'affichage des prix
    document.getElementById('price-conformite').textContent = userSettings.services.conformite.toFixed(2) + '€';
    document.getElementById('price-diagnostic').textContent = userSettings.services.diagnostic.toFixed(2) + '€';
    document.getElementById('price-certificat').textContent = userSettings.services.certificat.toFixed(2) + '€';
    document.getElementById('price-schema').textContent = userSettings.services.schema.toFixed(2) + '€';
}

// ============================================================================
// PAGE RÉCAPITULATIF
// ============================================================================

function updateRecap() {
    const container = document.getElementById('recapContent');
    if (!container) return;
    
    // Calculer totaux
    const travauxTotal = devisState.travaux.articles.reduce((sum, art) => sum + art.total, 0);
    const cablingTotal = devisState.travaux.cabling.internal.cost + devisState.travaux.cabling.tableau.cost;
    const tableauTotal = devisState.tableau.enabled ? devisState.tableau.total : 0;
    const adminTotal = devisState.administratif.services.reduce((sum, s) => sum + s.price, 0);
    
    const sousTotal = travauxTotal + cablingTotal + tableauTotal + adminTotal;
    const deplacement = devisState.global.deplacement;
    const totalHT = sousTotal + deplacement;
    const tva = totalHT * devisState.global.tva;
    const totalTTC = totalHT + tva;
    
    let html = '';
    
    // Client
    html += `
        <div class="recap-section">
            <h3>👤 CLIENT</h3>
            <div><strong>${devisState.client.name || 'Non renseigné'}</strong></div>
            ${devisState.client.tva ? `<div>TVA: ${devisState.client.tva}</div>` : ''}
            <div>${devisState.client.rue || 'Rue non renseignée'}</div>
            <div>${devisState.client.cp ? devisState.client.cp + ' ' : ''}${devisState.client.commune || 'Commune non renseignée'}</div>
            ${devisState.client.phone ? `<div>📞 ${devisState.client.phone}</div>` : ''}
            ${devisState.client.email ? `<div>📧 ${devisState.client.email}</div>` : ''}
        </div>
    `;
    
    // Travaux
    if (devisState.travaux.articles.length > 0) {
        html += `<div class="recap-section">
            <h3>🔨 TRAVAUX (${devisState.travaux.articles.length} articles)</h3>`;
        devisState.travaux.articles.forEach(art => {
            html += `<div class="recap-line">
                <span>${art.quantity}× ${art.name}</span>
                <span>${art.total.toFixed(2)}€</span>
            </div>`;
        });
        if (cablingTotal > 0) {
            html += `<div class="recap-line">
                <span>Câblage</span>
                <span>${cablingTotal.toFixed(2)}€</span>
            </div>`;
        }
        html += `<div class="recap-line" style="font-weight: 700; border-top: 2px solid #1e3c72; padding-top: 10px; margin-top: 10px;">
            <span>Sous-total travaux:</span>
            <span>${(travauxTotal + cablingTotal).toFixed(2)}€</span>
        </div></div>`;
    }
    
    // Tableau
    if (tableauTotal > 0) {
        html += `<div class="recap-section">
            <h3>⚡ TABLEAU ÉLECTRIQUE</h3>
            <div class="recap-line">
                <span>Configuration tableau</span>
                <span>${tableauTotal.toFixed(2)}€</span>
            </div>
        </div>`;
    }
    
    // Admin
    if (adminTotal > 0) {
        html += `<div class="recap-section">
            <h3>📋 SERVICES ADMINISTRATIFS</h3>`;
        devisState.administratif.services.forEach(s => {
            html += `<div class="recap-line">
                <span>${s.name}${s.hours ? ` (${s.hours}h)` : ''}</span>
                <span>${s.price.toFixed(2)}€</span>
            </div>`;
        });
        html += `<div class="recap-line" style="font-weight: 700; border-top: 2px solid #1e3c72; padding-top: 10px; margin-top: 10px;">
            <span>Sous-total services:</span>
            <span>${adminTotal.toFixed(2)}€</span>
        </div></div>`;
    }
    
    // TOTAUX
    html += `<div class="recap-total">
        <div class="recap-total-line">
            <span>SOUS-TOTAL HT:</span>
            <span>${sousTotal.toFixed(2)}€</span>
        </div>
        ${deplacement > 0 ? `<div class="recap-total-line">
            <span>Déplacement:</span>
            <span>${deplacement.toFixed(2)}€</span>
        </div>` : ''}
        <div class="recap-total-line">
            <span>TOTAL HT:</span>
            <span>${totalHT.toFixed(2)}€</span>
        </div>
        <div class="recap-total-line">
            <span>TVA (${(devisState.global.tva * 100).toFixed(0)}%):</span>
            <span>${tva.toFixed(2)}€</span>
        </div>
        <div class="recap-total-line final">
            <span>TOTAL TTC:</span>
            <span>${totalTTC.toFixed(2)}€</span>
        </div>
    </div>`;
    
    container.innerHTML = html;
}

// ============================================================================
// PDF GENERATION
// ============================================================================

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Logo NOORELEC en SVG base64 - VERT PLUS FONCÉ
    const logoBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDBjYzcyO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMGE4NWE7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8dGV4dCB4PSIyMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCBCbGFjaywgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI0OCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9InVybCgjZ3JhZCkiPk5PT1JFTEVDPC90ZXh0PgogIDx0ZXh0IHg9IjI1IiB5PSI4NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjMDBhODVhIj5MJ0FSVCBEVSBTQVZPSVITIEZBSVJFPC90ZXh0Pgo8L3N2Zz4=';
    
    try {
        // En-tête avec logo à gauche
        doc.addImage(logoBase64, 'PNG', 15, 10, 60, 18);
    } catch(e) {
        // Si logo ne charge pas, afficher le texte
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 200, 114);
        doc.text('NOORELEC', 15, 20);
        doc.setFontSize(10);
        doc.text('L\'ART DU SAVOIR-FAIRE', 15, 26);
    }
    
    // Date en haut à droite
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.text(`Fait le ${dateStr}`, 195, 20, { align: 'right' });
    doc.text(`à ${devisState.client.commune || '____'}`, 195, 26, { align: 'right' });
    
    // Informations client en haut à gauche (sous le logo)
    let yPos = 45;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('CLIENT:', 15, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(devisState.client.name || 'Non renseigné', 15, yPos);
    yPos += 5;
    if (devisState.client.tva) {
        doc.text(`TVA: ${devisState.client.tva}`, 15, yPos);
        yPos += 5;
    }
    doc.text(devisState.client.rue || '', 15, yPos);
    yPos += 5;
    doc.text(`${devisState.client.cp || ''} ${devisState.client.commune || ''}`, 15, yPos);
    yPos += 5;
    if (devisState.client.phone) {
        doc.text(`Tél: ${devisState.client.phone}`, 15, yPos);
        yPos += 5;
    }
    if (devisState.client.email) {
        doc.text(`Email: ${devisState.client.email}`, 15, yPos);
        yPos += 5;
    }
    
    yPos += 10;
    
    // Titre du devis
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 60, 114);
    doc.text('DEVIS - TRAVAUX ÉLECTRIQUES', 105, yPos, { align: 'center' });
    
    yPos += 12;
    
    // Travaux
    if (devisState.travaux.articles.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('TRAVAUX', 15, yPos);
        yPos += 8;
        
        // Tableau des articles
        const tableData = devisState.travaux.articles.map(art => [
            `${art.quantity}× ${art.name}`,
            `${art.total.toFixed(2)}€`
        ]);
        
        if (devisState.travaux.cabling.internal.cost + devisState.travaux.cabling.tableau.cost > 0) {
            tableData.push([
                'Câblage',
                `${(devisState.travaux.cabling.internal.cost + devisState.travaux.cabling.tableau.cost).toFixed(2)}€`
            ]);
        }
        
        doc.autoTable({
            startY: yPos,
            head: [['Description', 'Montant HTVA']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [30, 60, 114] },
            margin: { left: 15, right: 15 }
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
    }
    
    // Tableau électrique
    if (devisState.tableau.enabled && devisState.tableau.total > 0) {
        doc.setFontSize(12);
        doc.text('TABLEAU ELECTRIQUE', 15, yPos);
        yPos += 8;
        
        const tableauData = [['Configuration tableau', `${devisState.tableau.total.toFixed(2)}€`]];
        
        doc.autoTable({
            startY: yPos,
            head: [['Description', 'Montant HTVA']],
            body: tableauData,
            theme: 'striped',
            headStyles: { fillColor: [30, 60, 114] },
            margin: { left: 15, right: 15 }
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
    }
    
    // Services administratifs
    if (devisState.administratif.services.length > 0) {
        doc.setFontSize(12);
        doc.text('SERVICES ADMINISTRATIFS', 15, yPos);
        yPos += 8;
        
        const adminData = devisState.administratif.services.map(s => [
            s.name + (s.hours ? ` (${s.hours}h)` : ''),
            `${s.price.toFixed(2)}€`
        ]);
        
        doc.autoTable({
            startY: yPos,
            head: [['Description', 'Montant HTVA']],
            body: adminData,
            theme: 'striped',
            headStyles: { fillColor: [30, 60, 114] },
            margin: { left: 15, right: 15 }
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
    }
    
    // Totaux
    const travauxTotal = devisState.travaux.articles.reduce((sum, art) => sum + art.total, 0);
    const cablingTotal = devisState.travaux.cabling.internal.cost + devisState.travaux.cabling.tableau.cost;
    const tableauTotal = devisState.tableau.enabled ? devisState.tableau.total : 0;
    const adminTotal = devisState.administratif.services.reduce((sum, s) => sum + s.price, 0);
    
    const sousTotal = travauxTotal + cablingTotal + tableauTotal + adminTotal;
    const deplacement = devisState.global.deplacement;
    const totalHT = sousTotal + deplacement;
    const tva = totalHT * devisState.global.tva;
    const totalTTC = totalHT + tva;
    
    // Cadre totaux
    yPos += 5;
    doc.setFillColor(30, 60, 114);
    doc.rect(15, yPos, 180, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    yPos += 8;
    
    doc.text('SOUS-TOTAL HT:', 20, yPos);
    doc.text(`${sousTotal.toFixed(2)}€`, 190, yPos, { align: 'right' });
    yPos += 6;
    
    if (deplacement > 0) {
        doc.text('Déplacement:', 20, yPos);
        doc.text(`${deplacement.toFixed(2)}€`, 190, yPos, { align: 'right' });
        yPos += 6;
    }
    
    doc.text('TOTAL HT:', 20, yPos);
    doc.text(`${totalHT.toFixed(2)}€`, 190, yPos, { align: 'right' });
    yPos += 6;
    
    doc.text(`TVA (${(devisState.global.tva * 100).toFixed(0)}%):`, 20, yPos);
    doc.text(`${tva.toFixed(2)}€`, 190, yPos, { align: 'right' });
    yPos += 8;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL TTC:', 20, yPos);
    doc.text(`${totalTTC.toFixed(2)}€`, 190, yPos, { align: 'right' });
    
    // Sauvegarder
    const filename = `Devis_${devisState.client.name.replace(/ /g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`;
    doc.save(filename);
}

function resetDevis() {
    if (!confirm('Effacer tout le devis et recommencer ?')) return;
    
    // Reset complet
    devisState.travaux.articles = [];
    devisState.travaux.nextId = 1;
    devisState.travaux.cabling = { internal: { length: 0, cost: 0 }, tableau: { length: 0, cost: 0 } };
    devisState.tableau = { enabled: false, items: [], total: 0 };
    devisState.administratif.services = [];
    
    renderArticlesList();
    saveToLocalStorage();
    updateRecap();
    switchPage('client');
}

// ============================================================================
// LOCALSTORAGE
// ============================================================================

function saveToLocalStorage() {
    try {
        localStorage.setItem('noorelec_v4_state', JSON.stringify(devisState));
    } catch(e) {
        console.error('Erreur sauvegarde:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('noorelec_v4_state');
        if (saved) {
            const loaded = JSON.parse(saved);
            Object.assign(devisState, loaded);
            
            // Restore UI
            document.getElementById('clientName').value = devisState.client.name || '';
            document.getElementById('clientPhone').value = devisState.client.phone || '';
            document.getElementById('clientEmail').value = devisState.client.email || '';
            document.getElementById('clientTVA').value = devisState.client.tva || '';
            document.getElementById('clientRue').value = devisState.client.rue || '';
            document.getElementById('clientCP').value = devisState.client.cp || '';
            document.getElementById('clientCommune').value = devisState.client.commune || '';
            document.getElementById('globalTarif').value = devisState.global.tarif;
            document.getElementById('globalTVA').value = devisState.global.tva;
            document.getElementById('globalDeplacement').value = devisState.global.deplacement;
            
            renderArticlesList();
            renderDisjoncteursList();
        }
        
        // Charger les paramètres
        loadSettings();
    } catch(e) {
        console.error('Erreur chargement:', e);
    }
}

// ============================================================================
// PARAMÈTRES
// ============================================================================

const SETTINGS_KEY = 'noorelec_v4_settings';

let userSettings = {
    tarifs: {
        moderate: 50,
        eleve: 65,
        urgent: 75,
        weekend: 90
    },
    catalogue: [...CATALOGUE],
    services: {
        conformite: 450,
        diagnostic: 180,
        certificat: 80,
        schema: 120
    },
    autres: {
        rebouchage: 20,
        deplacement: 25
    }
};

function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            userSettings = JSON.parse(saved);
            
            // Appliquer aux champs
            document.getElementById('param-tarif-50').value = userSettings.tarifs.moderate;
            document.getElementById('param-tarif-65').value = userSettings.tarifs.eleve;
            document.getElementById('param-tarif-75').value = userSettings.tarifs.urgent;
            document.getElementById('param-tarif-90').value = userSettings.tarifs.weekend;
            
            document.getElementById('param-conformite').value = userSettings.services.conformite;
            document.getElementById('param-diagnostic').value = userSettings.services.diagnostic;
            document.getElementById('param-certificat').value = userSettings.services.certificat;
            document.getElementById('param-schema').value = userSettings.services.schema;
            
            document.getElementById('param-rebouchage').value = userSettings.autres.rebouchage;
            document.getElementById('param-deplacement').value = userSettings.autres.deplacement;
            
            // Mettre à jour le catalogue
            CATALOGUE.splice(0, CATALOGUE.length, ...userSettings.catalogue);
            initializeArticleSelect();
            renderCatalogueEditor();
        } else {
            renderCatalogueEditor();
        }
    } catch(e) {
        console.error('Erreur chargement paramètres:', e);
        renderCatalogueEditor();
    }
}

function saveSettings() {
    // Récupérer les valeurs
    userSettings.tarifs.moderate = parseFloat(document.getElementById('param-tarif-50').value);
    userSettings.tarifs.eleve = parseFloat(document.getElementById('param-tarif-65').value);
    userSettings.tarifs.urgent = parseFloat(document.getElementById('param-tarif-75').value);
    userSettings.tarifs.weekend = parseFloat(document.getElementById('param-tarif-90').value);
    
    userSettings.services.conformite = parseFloat(document.getElementById('param-conformite').value);
    userSettings.services.diagnostic = parseFloat(document.getElementById('param-diagnostic').value);
    userSettings.services.certificat = parseFloat(document.getElementById('param-certificat').value);
    userSettings.services.schema = parseFloat(document.getElementById('param-schema').value);
    
    userSettings.autres.rebouchage = parseFloat(document.getElementById('param-rebouchage').value);
    userSettings.autres.deplacement = parseFloat(document.getElementById('param-deplacement').value);
    
    // Récupérer les prix du catalogue
    userSettings.catalogue.forEach((article, index) => {
        const priceInput = document.getElementById(`cat-price-${article.id}`);
        const tempsInput = document.getElementById(`cat-temps-${article.id}`);
        if (priceInput) article.price = parseFloat(priceInput.value);
        if (tempsInput) article.temps = parseFloat(tempsInput.value);
    });
    
    // Sauvegarder
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(userSettings));
        
        // Mettre à jour le catalogue actif
        CATALOGUE.splice(0, CATALOGUE.length, ...userSettings.catalogue);
        initializeArticleSelect();
        
        alert('✅ Paramètres sauvegardés !');
    } catch(e) {
        console.error('Erreur sauvegarde:', e);
        alert('❌ Erreur lors de la sauvegarde');
    }
}

function resetSettings() {
    if (!confirm('Réinitialiser tous les prix par défaut ?')) return;
    
    // Reset aux valeurs par défaut
    userSettings = {
        tarifs: { moderate: 50, eleve: 65, urgent: 75, weekend: 90 },
        catalogue: [
            { id: 1, name: "Prise Niko blanc", price: 8.50, temps: 0.3, category: "Prises" },
            { id: 2, name: "Prise Niko anthracite", price: 9.20, temps: 0.3, category: "Prises" },
            { id: 3, name: "Prise USB Niko", price: 28.50, temps: 0.4, category: "Prises" },
            { id: 4, name: "Prise étanche IP44", price: 15.80, temps: 0.5, category: "Prises" },
            { id: 5, name: "Interrupteur Niko", price: 6.90, temps: 0.25, category: "Interrupteurs" },
            { id: 6, name: "Va-et-vient Niko", price: 12.50, temps: 0.4, category: "Interrupteurs" },
            { id: 7, name: "Variateur LED Niko", price: 45.80, temps: 0.35, category: "Interrupteurs" },
            { id: 8, name: "Spot LED encastré 5W", price: 12.50, temps: 0.3, category: "Éclairage" },
            { id: 9, name: "Spot LED encastré 10W", price: 18.90, temps: 0.3, category: "Éclairage" },
            { id: 10, name: "Plafonnier LED 18W", price: 35.00, temps: 0.5, category: "Éclairage" },
            { id: 11, name: "Projecteur LED 50W", price: 55.00, temps: 0.6, category: "Éclairage" },
            { id: 12, name: "Prise RJ45 Cat6", price: 12.00, temps: 0.35, category: "Réseau" },
            { id: 13, name: "Coffret multimédia", price: 85.00, temps: 1.0, category: "Réseau" },
            { id: 14, name: "Sonnette WiFi", price: 95.00, temps: 0.8, category: "Domotique" },
            { id: 15, name: "Détecteur de fumée", price: 25.00, temps: 0.3, category: "Sécurité" }
        ],
        services: { conformite: 450, diagnostic: 180, certificat: 80, schema: 120 },
        autres: { rebouchage: 20, deplacement: 25 }
    };
    
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(userSettings));
    location.reload();
}

function renderCatalogueEditor() {
    const container = document.getElementById('catalogueEditor');
    if (!container) return;
    
    const categories = {};
    CATALOGUE.forEach(article => {
        if (!categories[article.category]) {
            categories[article.category] = [];
        }
        categories[article.category].push(article);
    });
    
    let html = '';
    Object.keys(categories).forEach(category => {
        html += `<div style="margin-bottom: 20px;">
            <h4 style="color: #1e3c72; margin-bottom: 10px;">${category}</h4>`;
        
        categories[category].forEach(article => {
            html += `
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px;">
                    <div><strong>${article.name}</strong></div>
                    <div>
                        <label style="font-size: 0.85em; color: #6c757d;">Prix (€)</label>
                        <input type="number" id="cat-price-${article.id}" value="${article.price}" step="0.1" min="0" style="width: 100%; padding: 6px; border: 2px solid #dee2e6; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="font-size: 0.85em; color: #6c757d;">Temps (h)</label>
                        <input type="number" id="cat-temps-${article.id}" value="${article.temps}" step="0.05" min="0" style="width: 100%; padding: 6px; border: 2px solid #dee2e6; border-radius: 6px;">
                    </div>
                    ${article.custom ? `<button onclick="deleteCustomArticle(${article.id})" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">🗑️</button>` : '<div></div>'}
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function addCustomArticle() {
    const name = document.getElementById('new-article-name').value.trim();
    const category = document.getElementById('new-article-category').value;
    const price = parseFloat(document.getElementById('new-article-price').value);
    const temps = parseFloat(document.getElementById('new-article-temps').value);
    
    if (!name) {
        alert('❌ Nom de l\'article requis');
        return;
    }
    
    if (isNaN(price) || price < 0) {
        alert('❌ Prix invalide');
        return;
    }
    
    if (isNaN(temps) || temps < 0) {
        alert('❌ Temps invalide');
        return;
    }
    
    // Trouver le plus grand ID
    const maxId = Math.max(...CATALOGUE.map(a => a.id), 0);
    
    const newArticle = {
        id: maxId + 1,
        name: name,
        price: price,
        temps: temps,
        category: category,
        custom: true  // Marquer comme article personnalisé
    };
    
    CATALOGUE.push(newArticle);
    userSettings.catalogue.push(newArticle);
    
    // Réinitialiser le formulaire
    document.getElementById('new-article-name').value = '';
    document.getElementById('new-article-price').value = '';
    document.getElementById('new-article-temps').value = '';
    
    // Sauvegarder et rafraîchir
    saveSettings();
    renderCatalogueEditor();
    initializeArticleSelect();
    
    alert('✅ Article ajouté au catalogue !');
}

function deleteCustomArticle(id) {
    if (!confirm('Supprimer cet article du catalogue ?')) return;
    
    const index = CATALOGUE.findIndex(a => a.id === id);
    if (index > -1) {
        CATALOGUE.splice(index, 1);
    }
    
    const indexSettings = userSettings.catalogue.findIndex(a => a.id === id);
    if (indexSettings > -1) {
        userSettings.catalogue.splice(indexSettings, 1);
    }
    
    saveSettings();
    renderCatalogueEditor();
    initializeArticleSelect();
}
// ============================================================================
// GESTION DES PIÈCES
// ============================================================================

function addPiece() {
    const nom = document.getElementById('newPieceName').value.trim();
    if (!nom) {
        alert('Veuillez entrer un nom de pièce');
        return;
    }
    
    devisState.pieces.list.push({
        id: devisState.pieces.nextId++,
        nom: nom,
        articles: [],
        cablesInternes: [],
        cablesTableau: []
    });
    
    document.getElementById('newPieceName').value = '';
    saveToLocalStorage();
    renderPieces();
}

function renderPieces() {
    const container = document.getElementById('piecesListContainer');
    if (!container) return;
    
    if (devisState.pieces.list.length === 0) {
        container.innerHTML = '<div class="empty-state">Aucune pièce créée. Ajoutez votre première pièce ci-dessus.</div>';
        return;
    }
    
    let html = '';
    devisState.pieces.list.forEach((piece, index) => {
        const totalPiece = calculatePieceTotal(piece);
        
        html += `
            <div class="section" style="border-left: 5px solid var(--primary);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: var(--primary); margin: 0;">🏠 ${piece.nom}</h3>
                    <div style="display: flex; gap: 10px;">
                        <span style="font-size: 1.2em; font-weight: 700; color: var(--secondary);">${totalPiece.toFixed(2)}€</span>
                        <button class="btn-delete" onclick="deletePiece(${index})">🗑️</button>
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label>Article</label>
                        <select id="pieceArticle${piece.id}">
                            ${CATALOGUE.map(art => `<option value="${art.id}">${art.name} (${art.price}€)</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Quantité</label>
                        <input type="number" id="pieceQty${piece.id}" value="1" min="1">
                    </div>
                    <div class="form-group" style="display: flex; align-items: end;">
                        <button class="btn btn-success" onclick="addArticleToPiece(${index})" style="width: 100%;">➕ Ajouter</button>
                    </div>
                </div>
                
                <div id="pieceArticles${piece.id}" style="margin-top: 15px;">
                    ${renderPieceArticles(piece)}
                </div>
                
                <h4 style="margin-top: 20px;">🔌 Câblage interne</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Type câble</label>
                        <select id="pieceCableInt${piece.id}">
                            <option value="2.45,2.8">XVB 3G2.5mm²</option>
                            <option value="1.85,2.5">XVB 3G1.5mm²</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Longueur (m)</label>
                        <input type="number" id="pieceCableIntLen${piece.id}" value="5" step="0.5" min="0">
                    </div>
                    <div class="form-group" style="display: flex; align-items: end;">
                        <button class="btn btn-info" onclick="addCableInterneToPiece(${index})" style="width: 100%;">➕ Ajouter câble</button>
                    </div>
                </div>
                
                <h4 style="margin-top: 20px;">⚡ Câbles vers tableau</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Type câble</label>
                        <select id="pieceCableTab${piece.id}">
                            <option value="5.25,3.8">XVB 3G6mm²</option>
                            <option value="2.45,2.8">XVB 3G2.5mm²</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Longueur (m)</label>
                        <input type="number" id="pieceCableTabLen${piece.id}" value="10" step="0.5" min="0">
                    </div>
                    <div class="form-group" style="display: flex; align-items: end;">
                        <button class="btn btn-warning" onclick="addCableTableauToPiece(${index})" style="width: 100%;">➕ Ajouter câble</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderPieceArticles(piece) {
    if (piece.articles.length === 0 && piece.cablesInternes.length === 0 && piece.cablesTableau.length === 0) {
        return '<div class="empty-state" style="padding: 20px;">Aucun article ou câble ajouté</div>';
    }
    
    let html = '';
    piece.articles.forEach((art, index) => {
        const article = CATALOGUE.find(a => a.id === art.articleId);
        html += `<div class="article-card" style="display: flex; justify-content: space-between; padding: 10px; margin-bottom: 8px; background: #f8f9fa; border-radius: 6px;">
            <div><strong>${art.qty}× ${article.name}</strong> - ${art.total.toFixed(2)}€</div>
            <button class="btn-delete" onclick="deleteArticleFromPiece(${piece.id}, ${index})">🗑️</button>
        </div>`;
    });
    
    piece.cablesInternes.forEach((cable, index) => {
        html += `<div class="article-card" style="display: flex; justify-content: space-between; padding: 10px; margin-bottom: 8px; background: #e7f3ff; border-radius: 6px;">
            <div>🔌 Câble interne ${cable.length}m - ${cable.total.toFixed(2)}€</div>
            <button class="btn-delete" onclick="deleteCableInterneFromPiece(${piece.id}, ${index})">🗑️</button>
        </div>`;
    });
    
    piece.cablesTableau.forEach((cable, index) => {
        html += `<div class="article-card" style="display: flex; justify-content: space-between; padding: 10px; margin-bottom: 8px; background: #fff3cd; border-radius: 6px;">
            <div>⚡ Câble tableau ${cable.length}m - ${cable.total.toFixed(2)}€</div>
            <button class="btn-delete" onclick="deleteCableTableauFromPiece(${piece.id}, ${index})">🗑️</button>
        </div>`;
    });
    
    return html;
}

function addArticleToPiece(pieceIndex) {
    const piece = devisState.pieces.list[pieceIndex];
    const articleId = parseInt(document.getElementById(`pieceArticle${piece.id}`).value);
    const qty = parseFloat(document.getElementById(`pieceQty${piece.id}`).value);
    
    const article = CATALOGUE.find(a => a.id === articleId);
    const materiel = article.price * qty;
    const mo = article.temps * qty * devisState.global.tarif;
    const total = materiel + mo;
    
    piece.articles.push({
        articleId: articleId,
        qty: qty,
        materiel: materiel,
        mo: mo,
        total: total
    });
    
    saveToLocalStorage();
    renderPieces();
    updateRecap();
}

function addCableInterneToPiece(pieceIndex) {
    const piece = devisState.pieces.list[pieceIndex];
    const cableData = document.getElementById(`pieceCableInt${piece.id}`).value.split(',');
    const length = parseFloat(document.getElementById(`pieceCableIntLen${piece.id}`).value);
    
    const prixMetre = parseFloat(cableData[0]);
    const moMetre = parseFloat(cableData[1]);
    const total = (prixMetre + moMetre) * length;
    
    piece.cablesInternes.push({ length: length, total: total });
    saveToLocalStorage();
    renderPieces();
    updateRecap();
}

function addCableTableauToPiece(pieceIndex) {
    const piece = devisState.pieces.list[pieceIndex];
    const cableData = document.getElementById(`pieceCableTab${piece.id}`).value.split(',');
    const length = parseFloat(document.getElementById(`pieceCableTabLen${piece.id}`).value);
    
    const prixMetre = parseFloat(cableData[0]);
    const moMetre = parseFloat(cableData[1]);
    const total = (prixMetre + moMetre) * length;
    
    piece.cablesTableau.push({ length: length, total: total });
    saveToLocalStorage();
    renderPieces();
    updateRecap();
}

function calculatePieceTotal(piece) {
    let total = 0;
    piece.articles.forEach(art => total += art.total);
    piece.cablesInternes.forEach(cable => total += cable.total);
    piece.cablesTableau.forEach(cable => total += cable.total);
    return total;
}

function deletePiece(index) {
    if (confirm(`Supprimer la pièce "${devisState.pieces.list[index].nom}" ?`)) {
        devisState.pieces.list.splice(index, 1);
        saveToLocalStorage();
        renderPieces();
        updateRecap();
    }
}

// Ajouter les delete functions pour articles et câbles...

// ================================
// CALCUL DU TEMPS ESTIMÉ DU DEVIS
// ================================

function calculateEstimatedDays() {
    let totalHeures = 0;

    // Heures des travaux principaux
    devisState.travaux.articles.forEach(article => {
        totalHeures += article.time * article.qty;
    });

    // Heures des pièces
    devisState.pieces.list.forEach(piece => {
        piece.articles.forEach(article => {
            totalHeures += article.time * article.qty;
        });
    });

    // Conversion en jours de travail
    // 2 personnes × 8h / jour = 16h par jour
    const joursMin = Math.ceil(totalHeures / 16);
    const joursMax = Math.ceil((totalHeures * 1.3) / 16); // marge +30%

    return `⏱️ Temps estimé : entre ${joursMin} et ${joursMax} jours`;
}
