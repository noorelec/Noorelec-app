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
        deplacement: 25,
        rebouchage: 20  // Prix forfait rebouchage modifiable
    },
    
    travaux: {
        rooms: [],  // Chaque pièce contient TOUT (articles, installation, circuit, câblage)
        nextRoomId: 1
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
    loadFromLocalStorage();
    renderRooms();
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
    
    // Mettre à jour le récapitulatif si on y arrive
    if (pageName === 'recapitulatif') {
        updateRecap();
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
    devisState.global.rebouchage = parseFloat(document.getElementById('globalRebouchage').value) || 20;
    saveToLocalStorage();
    updateRecap();
}

// ============================================================================
// PAGE TRAVAUX - GESTION DES PIÈCES COMPLÈTES
// ============================================================================

function createRoom() {
    const roomName = document.getElementById('newRoomName').value.trim();
    
    if (!roomName) {
        alert('❌ Entrez un nom de pièce');
        return;
    }
    
    const newRoom = {
        id: devisState.travaux.nextRoomId++,
        name: roomName,
        articles: [],
        nextArticleId: 1,
        installType: 'apparent',  // Type installation pour cette pièce
        circuitType: 'existant',  // Circuit pour cette pièce
        rebouchage: false,  // Rebouchage activé pour cette pièce
        cabling: {
            internal: { type: '2.45,2.8', length: 0, cost: 0 },  // Entre points
            tableau: { type: '5.25,3.8', length: 0, cost: 0 }    // Jusqu'au tableau
        }
    };
    
    devisState.travaux.rooms.push(newRoom);
    document.getElementById('newRoomName').value = '';
    
    renderRooms();
    saveToLocalStorage();
}

function renderRooms() {
    const container = document.getElementById('roomsContainer');
    
    if (devisState.travaux.rooms.length === 0) {
        container.innerHTML = '<div class="empty-state">Créez une pièce pour commencer</div>';
        return;
    }
    
    container.innerHTML = devisState.travaux.rooms.map(room => {
        const roomTotal = calculateRoomTotal(room);
        
        return `
            <div class="section" style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border: 3px solid #ff9800; margin-bottom: 25px;">
                <!-- En-tête pièce -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #ff9800;">
                    <h3 style="color: #e65100; margin: 0; font-size: 1.5em;">🏠 ${room.name}</h3>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="color: #e65100; font-weight: 700; font-size: 1.3em;">${roomTotal.toFixed(2)}€ HTVA</div>
                        <button class="btn-delete" onclick="deleteRoom(${room.id})" style="padding: 10px 15px; font-size: 1.1em;">🗑️ Supprimer pièce</button>
                    </div>
                </div>
                
                <!-- Formulaire ajout article -->
                <div class="article-form" style="background: white;">
                    <h3>➕ Ajouter un article dans ${room.name}</h3>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Article</label>
                            <select id="articleSelect_${room.id}" onchange="updateRoomPreview(${room.id})">
                                <option value="">-- Sélectionner un article --</option>
                                ${generateArticleOptions()}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Quantité</label>
                            <input type="number" id="articleQty_${room.id}" value="1" min="0.1" step="0.1" onchange="updateRoomPreview(${room.id})">
                        </div>
                    </div>
                    
                    <h4 class="form-section-title">Type d'installation pour ${room.name}</h4>
                    <div class="radio-grid">
                        <label class="radio-card">
                            <input type="radio" name="installType_${room.id}" value="apparent" ${room.installType === 'apparent' ? 'checked' : ''} onchange="updateRoomInstallType(${room.id}, 'apparent')">
                            <div class="radio-content">
                                <div class="radio-icon">📦</div>
                                <div class="radio-title">Apparent</div>
                                <div class="radio-subtitle">Goulotte visible</div>
                            </div>
                        </label>
                        <label class="radio-card">
                            <input type="radio" name="installType_${room.id}" value="encastre" ${room.installType === 'encastre' ? 'checked' : ''} onchange="updateRoomInstallType(${room.id}, 'encastre')">
                            <div class="radio-content">
                                <div class="radio-icon">🔨</div>
                                <div class="radio-title">Encastré</div>
                                <div class="radio-subtitle">Saignées mur</div>
                            </div>
                        </label>
                        <label class="radio-card">
                            <input type="radio" name="installType_${room.id}" value="faux-plafond" ${room.installType === 'faux-plafond' ? 'checked' : ''} onchange="updateRoomInstallType(${room.id}, 'faux-plafond')">
                            <div class="radio-content">
                                <div class="radio-icon">⬆️</div>
                                <div class="radio-title">Faux plafond</div>
                                <div class="radio-subtitle">Par plafond</div>
                            </div>
                        </label>
                        <label class="radio-card">
                            <input type="radio" name="installType_${room.id}" value="sous-plancher" ${room.installType === 'sous-plancher' ? 'checked' : ''} onchange="updateRoomInstallType(${room.id}, 'sous-plancher')">
                            <div class="radio-content">
                                <div class="radio-icon">⬇️</div>
                                <div class="radio-title">Sous plancher</div>
                                <div class="radio-subtitle">Par sol</div>
                            </div>
                        </label>
                    </div>
                    
                    <h4 class="form-section-title">Circuit électrique pour ${room.name}</h4>
                    <div class="radio-grid two-cols">
                        <label class="radio-card">
                            <input type="radio" name="circuitType_${room.id}" value="existant" ${room.circuitType === 'existant' ? 'checked' : ''} onchange="updateRoomCircuitType(${room.id}, 'existant')">
                            <div class="radio-content">
                                <div class="radio-icon">🔄</div>
                                <div class="radio-title">Circuit existant</div>
                                <div class="radio-subtitle">Remplacer/ajouter</div>
                            </div>
                        </label>
                        <label class="radio-card">
                            <input type="radio" name="circuitType_${room.id}" value="nouvelle-ligne" ${room.circuitType === 'nouvelle-ligne' ? 'checked' : ''} onchange="updateRoomCircuitType(${room.id}, 'nouvelle-ligne')">
                            <div class="radio-content">
                                <div class="radio-icon">⚡</div>
                                <div class="radio-title">Nouvelle ligne</div>
                                <div class="radio-subtitle">Depuis tableau</div>
                            </div>
                        </label>
                    </div>
                    
                    <h4 class="form-section-title">Options</h4>
                    <label class="checkbox-option">
                        <input type="checkbox" id="rebouchage_${room.id}" ${room.rebouchage ? 'checked' : ''} onchange="updateRoomRebouchage(${room.id})">
                        <div class="checkbox-content">
                            <div class="checkbox-title">Rebouchage et finition</div>
                            <div class="checkbox-subtitle">+${devisState.global.rebouchage}€ forfait</div>
                        </div>
                    </label>
                    
                    <div id="preview_${room.id}" class="article-preview" style="display: none;">
                        <h4>📊 Aperçu du prix</h4>
                        <div id="previewContent_${room.id}"></div>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn btn-info" onclick="calculateRoomArticle(${room.id})">🧮 Calculer</button>
                        <button class="btn btn-success" onclick="addArticleToRoom(${room.id})">➕ Ajouter</button>
                    </div>
                </div>
                
                <!-- Liste articles -->
                ${renderRoomArticles(room)}
                
                <!-- Câblage -->
                ${renderRoomCabling(room)}
                
            </div>
        `;
    }).join('');
}

function generateArticleOptions() {
    const categories = {};
    CATALOGUE.forEach(article => {
        if (!categories[article.category]) categories[article.category] = [];
        categories[article.category].push(article);
    });
    
    let html = '';
    Object.keys(categories).forEach(category => {
        html += `<optgroup label="${category}">`;
        categories[category].forEach(article => {
            html += `<option value="${article.id}">${article.name} (${article.price}€)</option>`;
        });
        html += `</optgroup>`;
    });
    return html;
}

function updateRoomInstallType(roomId, type) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (room) {
        room.installType = type;
        saveToLocalStorage();
        updateRoomPreview(roomId);
    }
}

function updateRoomCircuitType(roomId, type) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (room) {
        room.circuitType = type;
        saveToLocalStorage();
        updateRoomPreview(roomId);
    }
}

function updateRoomRebouchage(roomId) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (room) {
        room.rebouchage = document.getElementById(`rebouchage_${roomId}`).checked;
        saveToLocalStorage();
        updateRoomPreview(roomId);
    }
}

function updateRoomPreview(roomId) {
    const preview = document.getElementById(`preview_${roomId}`);
    if (preview) preview.style.display = 'none';
}

function calculateRoomArticle(roomId) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const articleId = parseInt(document.getElementById(`articleSelect_${roomId}`).value);
    if (!articleId) {
        alert('❌ Sélectionnez un article');
        return;
    }
    
    const article = CATALOGUE.find(a => a.id === articleId);
    const quantity = parseFloat(document.getElementById(`articleQty_${roomId}`).value) || 1;
    
    const materielTotal = article.price * quantity;
    let tempsTotal = article.temps * quantity;
    tempsTotal *= FACTEURS.installation[room.installType];
    tempsTotal *= FACTEURS.circuit[room.circuitType];
    const moTotal = tempsTotal * devisState.global.tarif;
    const rebouchageTotal = room.rebouchage ? devisState.global.rebouchage : 0;
    
    let prixUnitaireHT = article.price + (moTotal / quantity);
    if (quantity >= 10) prixUnitaireHT *= 0.75;
    else if (quantity >= 5) prixUnitaireHT *= 0.85;
    
    const totalHT = (prixUnitaireHT * quantity) + rebouchageTotal;
    
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
            ${room.rebouchage ? `<div>Rebouchage:</div><div style="text-align: right;">${devisState.global.rebouchage}€</div>` : ''}
            <div style="border-top: 2px solid #17a2b8; padding-top: 8px;"><strong>TOTAL:</strong></div>
            <div style="border-top: 2px solid #17a2b8; padding-top: 8px; text-align: right;"><strong>${totalHT.toFixed(2)}€ HTVA</strong></div>
        </div>
        <div style="margin-top: 10px; padding: 8px; background: rgba(255, 152, 0, 0.1); border-radius: 6px; font-size: 0.85em;">
            ${room.name}: ${getInstallTypeLabel(room.installType)} | ${getCircuitTypeLabel(room.circuitType)} | Tarif: ${devisState.global.tarif}€/h
        </div>
    `;
    
    document.getElementById(`previewContent_${roomId}`).innerHTML = html;
    document.getElementById(`preview_${roomId}`).style.display = 'block';
}

function addArticleToRoom(roomId) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const articleId = parseInt(document.getElementById(`articleSelect_${roomId}`).value);
    if (!articleId) {
        alert('❌ Sélectionnez un article');
        return;
    }
    
    const article = CATALOGUE.find(a => a.id === articleId);
    const quantity = parseFloat(document.getElementById(`articleQty_${roomId}`).value) || 1;
    
    const materielTotal = article.price * quantity;
    let tempsTotal = article.temps * quantity;
    tempsTotal *= FACTEURS.installation[room.installType];
    tempsTotal *= FACTEURS.circuit[room.circuitType];
    const moTotal = tempsTotal * devisState.global.tarif;
    const rebouchageTotal = room.rebouchage ? devisState.global.rebouchage : 0;
    
    let prixUnitaireHT = article.price + (moTotal / quantity);
    if (quantity >= 10) prixUnitaireHT *= 0.75;
    else if (quantity >= 5) prixUnitaireHT *= 0.85;
    
    const totalHT = (prixUnitaireHT * quantity) + rebouchageTotal;
    
    room.articles.push({
        id: room.nextArticleId++,
        articleId: articleId,
        name: article.name,
        quantity: quantity,
        materiel: materielTotal,
        mo: moTotal,
        temps: tempsTotal,
        rebouchageTotal: rebouchageTotal,
        total: totalHT
    });
    
    // Reset
    document.getElementById(`articleSelect_${roomId}`).value = '';
    document.getElementById(`articleQty_${roomId}`).value = '1';
    document.getElementById(`preview_${roomId}`).style.display = 'none';
    
    renderRooms();
    saveToLocalStorage();
    updateRecap();
}

function renderRoomArticles(room) {
    if (room.articles.length === 0) {
        return '<div class="empty-state">Aucun article dans cette pièce</div>';
    }
    
    let html = '<div class="articles-list"><h3>📋 Articles dans ' + room.name + ' (' + room.articles.length + ')</h3>';
    
    room.articles.forEach(art => {
        html += `
            <div class="article-card">
                <div class="article-header">
                    <div>
                        <div class="article-title">${art.quantity}× ${art.name}</div>
                        <div class="article-details">
                            ${getInstallTypeLabel(room.installType)} | ${getCircuitTypeLabel(room.circuitType)}
                            ${room.rebouchage ? ' | Rebouchage inclus' : ''}
                        </div>
                    </div>
                    <button class="btn-delete" onclick="deleteRoomArticle(${room.id}, ${art.id})">🗑️</button>
                </div>
                <div class="article-pricing">
                    <div>Matériel: ${art.materiel.toFixed(2)}€</div>
                    <div>MO: ${art.mo.toFixed(2)}€ (${art.temps.toFixed(2)}h)</div>
                    ${room.rebouchage ? `<div>Rebouchage: ${devisState.global.rebouchage}€</div>` : ''}
                </div>
                <div class="article-total">TOTAL: ${art.total.toFixed(2)}€ HTVA</div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function renderRoomCabling(room) {
    return `
        <div class="cabling-section">
            <h3>🔌 Câblage ${room.name}</h3>
            
            <div class="cable-subsection">
                <h4>Entre prises / points dans ${room.name}</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Type de câble</label>
                        <select id="cableInternal_${room.id}" onchange="updateRoomCabling(${room.id})">
                            <option value="2.45,2.8" ${room.cabling.internal.type === '2.45,2.8' ? 'selected' : ''}>XVB 3G2.5mm² (2.45€/m + 2.8€/m MO)</option>
                            <option value="1.85,2.5" ${room.cabling.internal.type === '1.85,2.5' ? 'selected' : ''}>XVB 3G1.5mm² (1.85€/m + 2.5€/m MO)</option>
                            <option value="3.95,3.5" ${room.cabling.internal.type === '3.95,3.5' ? 'selected' : ''}>XVB 5G2.5mm² (3.95€/m + 3.5€/m MO)</option>
                            <option value="0.45,1.5" ${room.cabling.internal.type === '0.45,1.5' ? 'selected' : ''}>VOB 2.5mm² (0.45€/m + 1.5€/m MO)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Longueur (mètres)</label>
                        <input type="number" id="cableInternalLength_${room.id}" value="${room.cabling.internal.length}" step="0.5" min="0" onchange="updateRoomCabling(${room.id})">
                    </div>
                </div>
            </div>
            
            <div class="cable-subsection highlight">
                <h4>Depuis ${room.name} jusqu'au tableau électrique</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Type de câble</label>
                        <select id="cableTableau_${room.id}" onchange="updateRoomCabling(${room.id})">
                            <option value="5.25,3.8" ${room.cabling.tableau.type === '5.25,3.8' ? 'selected' : ''}>XVB 3G6mm² (5.25€/m + 3.8€/m MO)</option>
                            <option value="8.95,4.5" ${room.cabling.tableau.type === '8.95,4.5' ? 'selected' : ''}>XVB 3G10mm² (8.95€/m + 4.5€/m MO)</option>
                            <option value="8.45,4.2" ${room.cabling.tableau.type === '8.45,4.2' ? 'selected' : ''}>XVB 5G6mm² (8.45€/m + 4.2€/m MO)</option>
                            <option value="2.45,2.8" ${room.cabling.tableau.type === '2.45,2.8' ? 'selected' : ''}>XVB 3G2.5mm² (2.45€/m + 2.8€/m MO)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Longueur (mètres)</label>
                        <input type="number" id="cableTableauLength_${room.id}" value="${room.cabling.tableau.length}" step="0.5" min="0" onchange="updateRoomCabling(${room.id})">
                    </div>
                </div>
            </div>
            
            <div class="cabling-total" style="${room.cabling.internal.cost + room.cabling.tableau.cost > 0 ? '' : 'display: none;'}">
                <strong>Total câblage ${room.name}:</strong> <span>${(room.cabling.internal.cost + room.cabling.tableau.cost).toFixed(2)}€</span> HTVA
            </div>
        </div>
    `;
}

function updateRoomCabling(roomId) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Internal
    const internalSelect = document.getElementById(`cableInternal_${roomId}`);
    const internalLength = parseFloat(document.getElementById(`cableInternalLength_${roomId}`).value) || 0;
    const [internalPrice, internalMo] = internalSelect.value.split(',').map(parseFloat);
    
    room.cabling.internal.type = internalSelect.value;
    room.cabling.internal.length = internalLength;
    room.cabling.internal.cost = internalLength * (internalPrice + internalMo);
    
    // Tableau
    const tableauSelect = document.getElementById(`cableTableau_${roomId}`);
    const tableauLength = parseFloat(document.getElementById(`cableTableauLength_${roomId}`).value) || 0;
    const [tableauPrice, tableauMo] = tableauSelect.value.split(',').map(parseFloat);
    
    room.cabling.tableau.type = tableauSelect.value;
    room.cabling.tableau.length = tableauLength;
    room.cabling.tableau.cost = tableauLength * (tableauPrice + tableauMo);
    
    renderRooms();
    saveToLocalStorage();
    updateRecap();
}

function calculateRoomTotal(room) {
    let total = 0;
    room.articles.forEach(art => total += art.total);
    total += room.cabling.internal.cost + room.cabling.tableau.cost;
    return total;
}

function deleteRoom(roomId) {
    if (!confirm('Supprimer cette pièce et tous ses articles ?')) return;
    devisState.travaux.rooms = devisState.travaux.rooms.filter(r => r.id !== roomId);
    renderRooms();
    saveToLocalStorage();
    updateRecap();
}

function deleteRoomArticle(roomId, articleId) {
    if (!confirm('Supprimer cet article ?')) return;
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (room) {
        room.articles = room.articles.filter(a => a.id !== articleId);
        renderRooms();
        saveToLocalStorage();
        updateRecap();
    }
}

// ============================================================================
// PAGE TRAVAUX - HELPERS
// ============================================================================

// OLD FUNCTIONS REMOVED - Now integrated per room
// initializeArticleSelect, calculateArticlePrice, addArticleToList, etc.
// are all replaced by room-specific functions above

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
            const price = toggle.dataset.price;
            if (price === 'hourly') {
                const hours = parseFloat(document.getElementById('depannageHours').value) || 0;
                const hourlyPrice = hours * devisState.global.tarif;
                total += hourlyPrice;
                devisState.administratif.services.push({ name: 'Dépannage', price: hourlyPrice, hours: hours });
                document.getElementById('depannagePrice').textContent = hourlyPrice.toFixed(2) + '€';
            } else {
                const servicePrice = parseFloat(price);
                total += servicePrice;
                const serviceName = toggle.closest('.service-item').querySelector('.service-name').textContent.trim();
                devisState.administratif.services.push({ name: serviceName, price: servicePrice });
            }
        }
    });
    
    document.getElementById('adminPrice').textContent = total.toFixed(2) + '€';
    saveToLocalStorage();
    updateRecap();
}

// ============================================================================
// PAGE RÉCAPITULATIF
// ============================================================================

function updateRecap() {
    const container = document.getElementById('recapContent');
    if (!container) return;
    
    // Calculer totaux PAR PIÈCE
    let travauxTotal = 0;
    let totalArticlesCount = 0;
    
    devisState.travaux.rooms.forEach(room => {
        totalArticlesCount += room.articles.length;
        room.articles.forEach(art => {
            travauxTotal += art.total;
        });
        travauxTotal += room.cabling.internal.cost + room.cabling.tableau.cost;
    });
    
    const tableauTotal = devisState.tableau.enabled ? devisState.tableau.total : 0;
    const adminTotal = devisState.administratif.services.reduce((sum, s) => sum + s.price, 0);
    
    const sousTotal = travauxTotal + tableauTotal + adminTotal;
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
    
    // Travaux PAR PIÈCE
    if (totalArticlesCount > 0 || devisState.travaux.rooms.length > 0) {
        html += `<div class="recap-section">
            <h3>🔨 TRAVAUX (${totalArticlesCount} articles, ${devisState.travaux.rooms.length} pièces)</h3>`;
        
        devisState.travaux.rooms.forEach(room => {
            const roomTotal = calculateRoomTotal(room);
            
            html += `<div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ff9800;">
                <div style="font-weight: 700; color: #e65100; margin-bottom: 10px; font-size: 1.15em; display: flex; justify-content: space-between;">
                    <span>🏠 ${room.name}</span>
                    <span>${roomTotal.toFixed(2)}€</span>
                </div>
                <div style="font-size: 0.9em; color: #e65100; margin-bottom: 8px;">
                    ${getInstallTypeLabel(room.installType)} | ${getCircuitTypeLabel(room.circuitType)}
                    ${room.rebouchage ? ` | Rebouchage (${devisState.global.rebouchage}€)` : ''}
                </div>`;
            
            room.articles.forEach(art => {
                html += `<div class="recap-line" style="padding-left: 15px;">
                    <span>${art.quantity}× ${art.name}</span>
                    <span>${art.total.toFixed(2)}€</span>
                </div>`;
            });
            
            if (room.cabling.internal.length > 0) {
                html += `<div class="recap-line" style="padding-left: 15px;">
                    <span>Câblage entre points (${room.cabling.internal.length}m)</span>
                    <span>${room.cabling.internal.cost.toFixed(2)}€</span>
                </div>`;
            }
            
            if (room.cabling.tableau.length > 0) {
                html += `<div class="recap-line" style="padding-left: 15px;">
                    <span>Câblage au tableau (${room.cabling.tableau.length}m)</span>
                    <span>${room.cabling.tableau.cost.toFixed(2)}€</span>
                </div>`;
            }
            
            html += `</div>`;
        });
        
        html += `<div class="recap-line" style="font-weight: 700; border-top: 2px solid #1e3c72; padding-top: 10px; margin-top: 10px;">
            <span>Sous-total travaux:</span>
            <span>${travauxTotal.toFixed(2)}€</span>
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
    
    // Travaux PAR PIÈCE
    let travauxTotal = 0;
    let totalArticlesCount = 0;
    
    devisState.travaux.rooms.forEach(room => {
        totalArticlesCount += room.articles.length;
        room.articles.forEach(art => travauxTotal += art.total);
        travauxTotal += room.cabling.internal.cost + room.cabling.tableau.cost;
    });
    
    if (devisState.travaux.rooms.length > 0 && totalArticlesCount > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('TRAVAUX', 15, yPos);
        yPos += 8;
        
        // Pour chaque pièce
        devisState.travaux.rooms.forEach(room => {
            if (room.articles.length > 0 || room.cabling.internal.length > 0 || room.cabling.tableau.length > 0) {
                // Nom de la pièce
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(230, 81, 0);
                doc.text(`  ${room.name}`, 15, yPos);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);
                yPos += 6;
                
                const roomData = [];
                
                // Articles
                room.articles.forEach(art => {
                    roomData.push([
                        `    ${art.quantity}× ${art.name}`,
                        `${art.total.toFixed(2)}€`
                    ]);
                });
                
                // Câblage
                if (room.cabling.internal.length > 0) {
                    roomData.push([
                        `    Câblage entre points (${room.cabling.internal.length}m)`,
                        `${room.cabling.internal.cost.toFixed(2)}€`
                    ]);
                }
                if (room.cabling.tableau.length > 0) {
                    roomData.push([
                        `    Câblage au tableau (${room.cabling.tableau.length}m)`,
                        `${room.cabling.tableau.cost.toFixed(2)}€`
                    ]);
                }
                
                doc.autoTable({
                    startY: yPos,
                    head: [],
                    body: roomData,
                    theme: 'plain',
                    styles: { fontSize: 10, cellPadding: 2 },
                    columnStyles: {
                        0: { cellWidth: 130 },
                        1: { cellWidth: 50, halign: 'right' }
                    },
                    margin: { left: 15, right: 15 }
                });
                
                yPos = doc.lastAutoTable.finalY + 2;
            }
        });
        
        yPos += 2;
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
    const tableauTotal = devisState.tableau.enabled ? devisState.tableau.total : 0;
    const adminTotal = devisState.administratif.services.reduce((sum, s) => sum + s.price, 0);
    
    const sousTotal = travauxTotal + tableauTotal + adminTotal;
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
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px;">
                    <div><strong>${article.name}</strong></div>
                    <div>
                        <label style="font-size: 0.85em; color: #6c757d;">Prix (€)</label>
                        <input type="number" id="cat-price-${article.id}" value="${article.price}" step="0.1" min="0" style="width: 100%; padding: 6px; border: 2px solid #dee2e6; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="font-size: 0.85em; color: #6c757d;">Temps (h)</label>
                        <input type="number" id="cat-temps-${article.id}" value="${article.temps}" step="0.05" min="0" style="width: 100%; padding: 6px; border: 2px solid #dee2e6; border-radius: 6px;">
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}
