// NOORELEC V4 - APPLICATION JAVASCRIPT

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================

const SUPABASE_URL = 'https://ahaingqdlmsdmaimtuve.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoYWlucWdkbG1zZG1haW10dXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjg5MDQsImV4cCI6MjA4NDYwNDkwNH0.oUMT-XW69F2skvx1xmWB3B6G15OMCqfWywTt55_q-jU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// ============================================================================
// AUTH CHECK
// ============================================================================

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        // Pas connecté, rediriger vers auth
        window.location.href = 'auth.html';
        return false;
    }
    
    currentUser = session.user;
    
    // Récupérer infos utilisateur
    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (userData) {
        // Afficher email
        document.getElementById('user-email').textContent = userData.email;
        
        // Afficher statut
        let statusText = '';
        if (userData.role === 'admin') {
            statusText = '👑 Admin';
        } else if (userData.role === 'vip_free') {
            statusText = '🎁 VIP Gratuit';
        } else if (userData.subscription_status === 'trial') {
            const daysLeft = Math.ceil((new Date(userData.subscription_end) - new Date()) / (1000 * 60 * 60 * 24));
            statusText = `🆓 Essai (${daysLeft}j restants)`;
        } else if (userData.subscription_status === 'active') {
            statusText = '✅ Abonné';
        }
        document.getElementById('user-status').textContent = statusText;
        
        // Vérifier expiration
        if (userData.subscription_status === 'trial' && new Date(userData.subscription_end) < new Date()) {
            alert('⚠️ Votre essai gratuit a expiré ! Contactez-nous pour continuer.');
            handleLogout();
            return false;
        }
    }
    
    return true;
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'auth.html';
}

// ============================================================================
// ÉTAT GLOBAL
// ============================================================================

const devisState = {
    currentDevisNumber: null, // Numéro du devis en cours
    
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
        rooms: [],  // Chaque pièce contient TOUT (articles, installation, circuit, câblage)
        nextRoomId: 1
    },
    
    tableau: {
        enabled: false,
        tableaux: [],  // Liste de tableaux (principal + intermédiaires)
        nextTableauId: 1
    },
    
    administratif: {
        services: []
    },
    
    ristourne: {
        enabled: false,
        pourcent: 10,
        delai: 30
    }
};

// ============================================================================
// SYSTÈME DE NUMÉROTATION ET HISTORIQUE
// ============================================================================

// Compteur global de devis (commence à 1401)
let devisCounter = parseInt(localStorage.getItem('noorelec_devis_counter')) || 1401;

// Historique des devis
let devisHistory = JSON.parse(localStorage.getItem('noorelec_devis_history')) || [];

// Articles personnalisés
let customArticles = JSON.parse(localStorage.getItem('noorelec_custom_articles')) || [];

// Coffrets personnalisés
let customCoffrets = JSON.parse(localStorage.getItem('noorelec_custom_coffrets')) || [];

// Composants personnalisés
let customComposants = JSON.parse(localStorage.getItem('noorelec_custom_composants')) || [];

function generateDevisNumber() {
    const year = new Date().getFullYear().toString().slice(-2); // 26 pour 2026
    const number = devisCounter.toString().padStart(4, '0');
    devisCounter++;
    localStorage.setItem('noorelec_devis_counter', devisCounter);
    return `DEVIS 26-${number}`;
}

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
// CATALOGUE COMPOSANTS TABLEAU
// ============================================================================

const CATALOGUE_TABLEAU = [
    // Disjoncteurs
    { id: 1, name: "Disjoncteur 10A", price: 18.50, temps: 0.15, category: "Disjoncteurs" },
    { id: 2, name: "Disjoncteur 16A", price: 20.00, temps: 0.15, category: "Disjoncteurs" },
    { id: 3, name: "Disjoncteur 20A", price: 22.50, temps: 0.15, category: "Disjoncteurs" },
    { id: 4, name: "Disjoncteur 25A", price: 25.00, temps: 0.15, category: "Disjoncteurs" },
    { id: 5, name: "Disjoncteur 32A", price: 28.50, temps: 0.2, category: "Disjoncteurs" },
    { id: 6, name: "Disjoncteur 40A", price: 32.00, temps: 0.2, category: "Disjoncteurs" },
    
    // Différentiels
    { id: 7, name: "Différentiel 30mA 40A Type A", price: 85.00, temps: 0.3, category: "Différentiels" },
    { id: 8, name: "Différentiel 30mA 63A Type A", price: 95.00, temps: 0.3, category: "Différentiels" },
    { id: 9, name: "Différentiel 300mA 40A Type S", price: 120.00, temps: 0.3, category: "Différentiels" },
    
    // Protections spéciales
    { id: 10, name: "Parafoudre Type 2", price: 95.00, temps: 0.25, category: "Protections" },
    { id: 11, name: "Télérupteur 16A", price: 45.00, temps: 0.2, category: "Protections" },
    { id: 12, name: "Contacteur jour/nuit 20A", price: 55.00, temps: 0.25, category: "Protections" },
    
    // Barrettes et accessoires
    { id: 13, name: "Barrette de pontage", price: 12.00, temps: 0.1, category: "Accessoires" },
    { id: 14, name: "Peigne d'alimentation", price: 15.00, temps: 0.15, category: "Accessoires" },
    { id: 15, name: "Barre de terre 13 trous", price: 25.00, temps: 0.2, category: "Accessoires" },
    { id: 16, name: "Piquet de terre + cable", price: 65.00, temps: 0.8, category: "Terre" },
    { id: 17, name: "Cable de terre 25mm² (par m)", price: 3.50, temps: 0.05, category: "Terre" }
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
    devisState.global.deplacement = parseFloat(document.getElementById('globalDeplacement').value);
    // TVA est maintenant définie dans la page Client (selon âge du bâtiment)
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
        rebouchagePrice: 20,  // Prix rebouchage pour cette pièce (modifiable)
        collapsed: false,  // État accordéon (ouvert par défaut)
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

function toggleRoomCollapse(roomId) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (room) {
        room.collapsed = !room.collapsed;
        renderRooms();
        saveToLocalStorage();
    }
}

function renderRooms() {
    const container = document.getElementById('roomsContainer');
    
    if (devisState.travaux.rooms.length === 0) {
        container.innerHTML = '<div class="empty-state">Créez une pièce pour commencer</div>';
        return;
    }
    
    container.innerHTML = devisState.travaux.rooms.map(room => {
        const roomTotal = calculateRoomTotal(room);
        const collapseIcon = room.collapsed ? '▶' : '▼';
        
        return `
            <div class="section" style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border: 3px solid #ff9800; margin-bottom: 25px;">
                <!-- En-tête pièce CLIQUABLE -->
                <div onclick="toggleRoomCollapse(${room.id})" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 3px solid #ff9800; cursor: pointer; user-select: none;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: #e65100; font-size: 1.5em; font-weight: 700;">${collapseIcon}</span>
                        <h3 style="color: #e65100; margin: 0; font-size: 1.5em;">🏠 ${room.name}</h3>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="color: #e65100; font-weight: 700; font-size: 1.3em;">${roomTotal.toFixed(2)}€ HTVA</div>
                        <button class="btn-delete" onclick="event.stopPropagation(); deleteRoom(${room.id})" style="padding: 10px 15px; font-size: 1.1em;">🗑️</button>
                    </div>
                </div>
                
                <!-- CONTENU (masqué si collapsed) -->
                <div style="display: ${room.collapsed ? 'none' : 'block'}; margin-top: 20px;">
                
                <!-- Formulaire ajout article -->
                <div class="article-form" style="background: white;">
                    <h3>➕ Ajouter un article dans ${room.name}</h3>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Article</label>
                            <select id="articleSelect_${room.id}">
                                <option value="">-- Sélectionner un article --</option>
                                ${generateArticleOptions()}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Quantité</label>
                            <input type="number" id="articleQty_${room.id}" value="1" min="0.1" step="0.1">
                        </div>
                    </div>
                    
                    <h4 class="form-section-title">Type d'installation pour cet article</h4>
                    <div class="radio-grid">
                        <label class="radio-card">
                            <input type="radio" name="articleInstallType_${room.id}" value="apparent" checked>
                            <div class="radio-content">
                                <div class="radio-icon">📦</div>
                                <div class="radio-title">Apparent</div>
                                <div class="radio-subtitle">Goulotte visible</div>
                            </div>
                        </label>
                        <label class="radio-card">
                            <input type="radio" name="articleInstallType_${room.id}" value="encastre">
                            <div class="radio-content">
                                <div class="radio-icon">🔨</div>
                                <div class="radio-title">Encastré</div>
                                <div class="radio-subtitle">Saignées mur</div>
                            </div>
                        </label>
                        <label class="radio-card">
                            <input type="radio" name="articleInstallType_${room.id}" value="faux-plafond">
                            <div class="radio-content">
                                <div class="radio-icon">⬆️</div>
                                <div class="radio-title">Faux plafond</div>
                                <div class="radio-subtitle">Par plafond</div>
                            </div>
                        </label>
                        <label class="radio-card">
                            <input type="radio" name="articleInstallType_${room.id}" value="sous-plancher">
                            <div class="radio-content">
                                <div class="radio-icon">⬇️</div>
                                <div class="radio-title">Sous plancher</div>
                                <div class="radio-subtitle">Par sol</div>
                            </div>
                        </label>
                    </div>
                    
                    <h4 class="form-section-title">Circuit électrique pour cet article</h4>
                    <div class="radio-grid two-cols">
                        <label class="radio-card">
                            <input type="radio" name="articleCircuitType_${room.id}" value="existant" checked>
                            <div class="radio-content">
                                <div class="radio-icon">🔄</div>
                                <div class="radio-title">Circuit existant</div>
                                <div class="radio-subtitle">Remplacer/ajouter</div>
                            </div>
                        </label>
                        <label class="radio-card">
                            <input type="radio" name="articleCircuitType_${room.id}" value="nouvelle-ligne">
                            <div class="radio-content">
                                <div class="radio-icon">⚡</div>
                                <div class="radio-title">Nouvelle ligne</div>
                                <div class="radio-subtitle">Depuis tableau</div>
                            </div>
                        </label>
                    </div>
                    
                    <h4 class="form-section-title">Options</h4>
                    <label class="checkbox-option">
                        <input type="checkbox" id="rebouchage_${room.id}">
                        <div class="checkbox-content">
                            <div class="checkbox-title">Rebouchage et finition</div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                                <span>Prix:</span>
                                <input type="number" id="rebouchagePrice_${room.id}" value="${room.rebouchagePrice || 20}" min="0" step="1" onchange="updateRoomRebouchagePrice(${room.id})" style="width: 80px; padding: 6px; border: 2px solid #dee2e6; border-radius: 6px; font-weight: 700;">
                                <span>€</span>
                            </div>
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
                <!-- FIN CONTENU COLLAPSIBLE -->
                
            </div>
        `;
    }).join('');
}

function generateArticleOptions() {
    // Combiner catalogue + articles personnalisés
    const allArticles = [...CATALOGUE];
    customArticles.forEach(art => {
        allArticles.push({
            id: `custom_${art.id}`,
            name: art.name,
            price: art.price,
            temps: art.temps,
            category: art.category
        });
    });
    
    const categories = {};
    allArticles.forEach(article => {
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

function getArticleById(articleId) {
    // Si commence par "custom_", chercher dans customArticles
    if (typeof articleId === 'string' && articleId.startsWith('custom_')) {
        const customId = parseInt(articleId.replace('custom_', ''));
        const customArt = customArticles.find(a => a.id === customId);
        if (customArt) {
            return {
                id: articleId,
                name: customArt.name,
                price: customArt.price,
                temps: customArt.temps,
                category: customArt.category
            };
        }
    }
    // Sinon chercher dans CATALOGUE
    return CATALOGUE.find(a => a.id === articleId);
}

function updateRoomInstallType(roomId, type) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (room) {
        room.installType = type;
        saveToLocalStorage();
        // Ne PAS re-render pour éviter de perdre la sélection
    }
}

function updateRoomCircuitType(roomId, type) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (room) {
        room.circuitType = type;
        saveToLocalStorage();
        // Ne PAS re-render pour éviter de perdre la sélection
    }
}

function updateRoomRebouchage(roomId) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (room) {
        room.rebouchage = document.getElementById(`rebouchage_${roomId}`).checked;
        saveToLocalStorage();
        // Ne PAS re-render pour éviter de perdre la sélection
    }
}

function updateRoomRebouchagePrice(roomId) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (room) {
        room.rebouchagePrice = parseFloat(document.getElementById(`rebouchagePrice_${roomId}`).value) || 20;
        saveToLocalStorage();
        // Seulement mettre à jour le recap, pas tout re-render
        updateRecap();
    }
}

function updateRoomPreview(roomId) {
    const preview = document.getElementById(`preview_${roomId}`);
    if (preview) preview.style.display = 'none';
}

function calculateRoomArticle(roomId) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const articleId = document.getElementById(`articleSelect_${roomId}`).value;
    if (!articleId) {
        alert('❌ Sélectionnez un article');
        return;
    }
    
    const article = getArticleById(typeof articleId === 'string' && articleId.startsWith('custom_') ? articleId : parseInt(articleId));
    if (!article) {
        alert('❌ Article introuvable');
        return;
    }
    
    const quantity = parseFloat(document.getElementById(`articleQty_${roomId}`).value) || 1;
    
    // Lire les paramètres du FORMULAIRE (pas de la pièce)
    const installType = document.querySelector(`[name="articleInstallType_${roomId}"]:checked`).value;
    const circuitType = document.querySelector(`[name="articleCircuitType_${roomId}"]:checked`).value;
    const rebouchage = document.getElementById(`rebouchage_${roomId}`).checked;
    
    const materielTotal = article.price * quantity;
    let tempsTotal = article.temps * quantity;
    tempsTotal *= FACTEURS.installation[installType];
    tempsTotal *= FACTEURS.circuit[circuitType];
    const moTotal = tempsTotal * devisState.global.tarif;
    const rebouchageTotal = rebouchage ? (room.rebouchagePrice || 20) : 0;
    
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
            ${rebouchage ? `<div>Rebouchage:</div><div style="text-align: right;">${(room.rebouchagePrice || 20).toFixed(2)}€</div>` : ''}
            <div style="border-top: 2px solid #17a2b8; padding-top: 8px;"><strong>TOTAL:</strong></div>
            <div style="border-top: 2px solid #17a2b8; padding-top: 8px; text-align: right;"><strong>${totalHT.toFixed(2)}€ HTVA</strong></div>
        </div>
        <div style="margin-top: 10px; padding: 8px; background: rgba(255, 152, 0, 0.1); border-radius: 6px; font-size: 0.85em;">
            ${getInstallTypeLabel(installType)} | ${getCircuitTypeLabel(circuitType)} | Tarif: ${devisState.global.tarif}€/h
        </div>
    `;
    
    document.getElementById(`previewContent_${roomId}`).innerHTML = html;
    document.getElementById(`preview_${roomId}`).style.display = 'block';
}

function addArticleToRoom(roomId) {
    const room = devisState.travaux.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const articleId = document.getElementById(`articleSelect_${roomId}`).value;
    if (!articleId) {
        alert('❌ Sélectionnez un article');
        return;
    }
    
    const article = getArticleById(typeof articleId === 'string' && articleId.startsWith('custom_') ? articleId : parseInt(articleId));
    if (!article) {
        alert('❌ Article introuvable');
        return;
    }
    
    const quantity = parseFloat(document.getElementById(`articleQty_${roomId}`).value) || 1;
    
    // Lire les paramètres du FORMULAIRE (pas de la pièce)
    const installType = document.querySelector(`[name="articleInstallType_${roomId}"]:checked`).value;
    const circuitType = document.querySelector(`[name="articleCircuitType_${roomId}"]:checked`).value;
    const rebouchage = document.getElementById(`rebouchage_${roomId}`).checked;
    
    const materielTotal = article.price * quantity;
    let tempsTotal = article.temps * quantity;
    tempsTotal *= FACTEURS.installation[installType];
    tempsTotal *= FACTEURS.circuit[circuitType];
    const moTotal = tempsTotal * devisState.global.tarif;
    const rebouchageTotal = rebouchage ? (room.rebouchagePrice || 20) : 0;
    
    let prixUnitaireHT = article.price + (moTotal / quantity);
    if (quantity >= 10) prixUnitaireHT *= 0.75;
    else if (quantity >= 5) prixUnitaireHT *= 0.85;
    
    const totalHT = (prixUnitaireHT * quantity) + rebouchageTotal;
    
    // Sauvegarder l'article AVEC ses paramètres install/circuit
    room.articles.push({
        id: room.nextArticleId++,
        articleId: articleId,
        name: article.name,
        quantity: quantity,
        installType: installType,  // Sauvegardé par article
        circuitType: circuitType,  // Sauvegardé par article
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
                            ${getInstallTypeLabel(art.installType || 'apparent')} | ${getCircuitTypeLabel(art.circuitType || 'existant')}
                            ${art.rebouchageTotal > 0 ? ` | Rebouchage (${art.rebouchageTotal.toFixed(2)}€)` : ''}
                        </div>
                    </div>
                    <button class="btn-delete" onclick="deleteRoomArticle(${room.id}, ${art.id})">🗑️</button>
                </div>
                <div class="article-pricing">
                    <div>Matériel: ${art.materiel.toFixed(2)}€</div>
                    <div>MO: ${art.mo.toFixed(2)}€ (${art.temps.toFixed(2)}h)</div>
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
    
    // Si on active pour la première fois, créer un premier tableau
    if (enabled && devisState.tableau.tableaux.length === 0) {
        createTableau();
    }
    
    saveToLocalStorage();
    updateRecap();
}

function createTableau() {
    const newTableau = {
        id: devisState.tableau.nextTableauId++,
        name: `Tableau ${devisState.tableau.tableaux.length + 1}`,
        coffret: null,  // { type, price, labor }
        composants: [],
        nextComposantId: 1,
        collapsed: false  // Pour accordéon
    };
    
    devisState.tableau.tableaux.push(newTableau);
    renderTableaux();
    saveToLocalStorage();
}

function renderTableaux() {
    const container = document.getElementById('tableauxContainer');
    if (!container) return;
    
    if (devisState.tableau.tableaux.length === 0) {
        container.innerHTML = '<div class="empty-state">Cliquez sur "Ajouter un tableau" pour commencer</div>';
        updateTableauGlobalTotal();
        return;
    }
    
    container.innerHTML = devisState.tableau.tableaux.map(tableau => {
        const tableauTotal = calculateTableauTotal(tableau);
        const isCollapsed = tableau.collapsed || false;
        const arrow = isCollapsed ? '▶' : '▼';
        
        return `
            <div class="section" style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border: 3px solid #2196f3; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; cursor: pointer;" onclick="event.target.tagName !== 'INPUT' && event.target.tagName !== 'BUTTON' && toggleTableauCollapse(${tableau.id})">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.2em;">${arrow}</span>
                        <span style="font-size: 1.5em;">⚡</span>
                        <input type="text" id="tableauName_${tableau.id}" value="${tableau.name}" onchange="updateTableauName(${tableau.id})" onclick="event.stopPropagation()" style="color: #1565c0; font-size: 1.2em; font-weight: 700; border: 2px solid #2196f3; border-radius: 6px; padding: 5px 10px; background: white; max-width: 250px;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="color: #1565c0; font-weight: 700; font-size: 1.2em;">${tableauTotal.toFixed(2)}€ HTVA</div>
                        <button class="btn-delete" onclick="event.stopPropagation(); deleteTableau(${tableau.id})">🗑️ Supprimer</button>
                    </div>
                </div>
                
                ${!isCollapsed ? `
                <!-- Type de coffret -->
                <div class="form-group">
                    <label><strong>Type de coffret</strong></label>
                    <select id="coffret_${tableau.id}" onchange="updateTableauCoffret(${tableau.id})" style="width: 100%;">
                        <option value="">-- Sélectionner --</option>
                        <option value="45,0.5" ${tableau.coffret && tableau.coffret.type === '45,0.5' ? 'selected' : ''}>Coffret encastré 1 rangée (45€ + 0.5h MO)</option>
                        <option value="65,0.7" ${tableau.coffret && tableau.coffret.type === '65,0.7' ? 'selected' : ''}>Coffret encastré 2 rangées (65€ + 0.7h MO)</option>
                        <option value="95,1.0" ${tableau.coffret && tableau.coffret.type === '95,1.0' ? 'selected' : ''}>Coffret encastré 4 rangées (95€ + 1h MO)</option>
                        <option value="55,0.6" ${tableau.coffret && tableau.coffret.type === '55,0.6' ? 'selected' : ''}>Coffret saillie 2R IP40 (55€ + 0.6h MO)</option>
                        <option value="85,0.8" ${tableau.coffret && tableau.coffret.type === '85,0.8' ? 'selected' : ''}>Coffret saillie 4R IP65 (85€ + 0.8h MO)</option>
                    </select>
                </div>
                
                <!-- Ajout composant -->
                <div class="article-form" style="background: white; margin-top: 15px;">
                    <h4>➕ Ajouter composants pour ${tableau.name}</h4>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Composant</label>
                            <select id="composant_${tableau.id}">
                                <option value="">-- Sélectionner --</option>
                                ${generateTableauComposantsOptions()}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Quantité</label>
                            <input type="number" id="composantQty_${tableau.id}" value="1" min="1" step="1">
                        </div>
                    </div>
                    
                    <div id="composantPreview_${tableau.id}" class="article-preview" style="display: none;">
                        <h4>📊 Aperçu</h4>
                        <div id="composantPreviewContent_${tableau.id}"></div>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn btn-info" onclick="calculateTableauComposant(${tableau.id})">🧮 Calculer</button>
                        <button class="btn btn-success" onclick="addComposantToTableau(${tableau.id})">➕ Ajouter</button>
                    </div>
                </div>
                
                <!-- Liste composants -->
                ${renderTableauComposants(tableau)}
                ` : ''}
            </div>
        `;
    }).join('');
    
    updateTableauGlobalTotal();
}

function generateTableauComposantsOptions() {
    const categories = {};
    CATALOGUE_TABLEAU.forEach(comp => {
        if (!categories[comp.category]) categories[comp.category] = [];
        categories[comp.category].push(comp);
    });
    
    let html = '';
    Object.keys(categories).forEach(category => {
        html += `<optgroup label="${category}">`;
        categories[category].forEach(comp => {
            html += `<option value="${comp.id}">${comp.name} (${comp.price}€ + ${comp.temps}h)</option>`;
        });
        html += `</optgroup>`;
    });
    return html;
}

function updateTableauCoffret(tableauId) {
    const tableau = devisState.tableau.tableaux.find(t => t.id === tableauId);
    if (!tableau) return;
    
    const select = document.getElementById(`coffret_${tableauId}`);
    const value = select.value;
    
    if (!value) {
        tableau.coffret = null;
    } else {
        const [price, temps] = value.split(',').map(parseFloat);
        tableau.coffret = {
            type: value,
            price: price,
            temps: temps
        };
    }
    
    renderTableaux();
    saveToLocalStorage();
    updateRecap();
}

function calculateTableauComposant(tableauId) {
    const tableau = devisState.tableau.tableaux.find(t => t.id === tableauId);
    if (!tableau) return;
    
    const composantId = parseInt(document.getElementById(`composant_${tableauId}`).value);
    if (!composantId) {
        alert('❌ Sélectionnez un composant');
        return;
    }
    
    const composant = CATALOGUE_TABLEAU.find(c => c.id === composantId);
    const quantity = parseInt(document.getElementById(`composantQty_${tableauId}`).value) || 1;
    
    const materielTotal = composant.price * quantity;
    const tempsTotal = composant.temps * quantity;
    const moTotal = tempsTotal * devisState.global.tarif;
    const totalHT = materielTotal + moTotal;
    
    const html = `
        <div style="margin-bottom: 10px;">
            <strong>${quantity}× ${composant.name}</strong>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.95em;">
            <div>Matériel total:</div><div style="text-align: right;">${materielTotal.toFixed(2)}€</div>
            <div>Main d'œuvre:</div><div style="text-align: right;">${moTotal.toFixed(2)}€ (${tempsTotal.toFixed(2)}h)</div>
            <div style="border-top: 2px solid #17a2b8; padding-top: 8px;"><strong>TOTAL:</strong></div>
            <div style="border-top: 2px solid #17a2b8; padding-top: 8px; text-align: right;"><strong>${totalHT.toFixed(2)}€ HTVA</strong></div>
        </div>
    `;
    
    document.getElementById(`composantPreviewContent_${tableauId}`).innerHTML = html;
    document.getElementById(`composantPreview_${tableauId}`).style.display = 'block';
}

function addComposantToTableau(tableauId) {
    const tableau = devisState.tableau.tableaux.find(t => t.id === tableauId);
    if (!tableau) return;
    
    const composantId = parseInt(document.getElementById(`composant_${tableauId}`).value);
    if (!composantId) {
        alert('❌ Sélectionnez un composant');
        return;
    }
    
    const composant = CATALOGUE_TABLEAU.find(c => c.id === composantId);
    const quantity = parseInt(document.getElementById(`composantQty_${tableauId}`).value) || 1;
    
    const materielTotal = composant.price * quantity;
    const tempsTotal = composant.temps * quantity;
    const moTotal = tempsTotal * devisState.global.tarif;
    const totalHT = materielTotal + moTotal;
    
    tableau.composants.push({
        id: tableau.nextComposantId++,
        composantId: composantId,
        name: composant.name,
        quantity: quantity,
        materiel: materielTotal,
        mo: moTotal,
        temps: tempsTotal,
        total: totalHT
    });
    
    // Reset
    document.getElementById(`composant_${tableauId}`).value = '';
    document.getElementById(`composantQty_${tableauId}`).value = '1';
    document.getElementById(`composantPreview_${tableauId}`).style.display = 'none';
    
    renderTableaux();
    saveToLocalStorage();
    updateRecap();
}

function renderTableauComposants(tableau) {
    if (tableau.composants.length === 0) {
        return '<div class="empty-state">Aucun composant ajouté</div>';
    }
    
    let html = '<div class="articles-list"><h4>📋 Composants (' + tableau.composants.length + ')</h4>';
    
    tableau.composants.forEach(comp => {
        html += `
            <div class="article-card">
                <div class="article-header">
                    <div>
                        <div class="article-title">${comp.quantity}× ${comp.name}</div>
                    </div>
                    <button class="btn-delete" onclick="deleteTableauComposant(${tableau.id}, ${comp.id})">🗑️</button>
                </div>
                <div class="article-pricing">
                    <div>Matériel: ${comp.materiel.toFixed(2)}€</div>
                    <div>MO: ${comp.mo.toFixed(2)}€ (${comp.temps.toFixed(2)}h)</div>
                </div>
                <div class="article-total">TOTAL: ${comp.total.toFixed(2)}€ HTVA</div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function deleteTableauComposant(tableauId, composantId) {
    if (!confirm('Supprimer ce composant ?')) return;
    
    const tableau = devisState.tableau.tableaux.find(t => t.id === tableauId);
    if (tableau) {
        tableau.composants = tableau.composants.filter(c => c.id !== composantId);
        renderTableaux();
        saveToLocalStorage();
        updateRecap();
    }
}

function calculateTableauTotal(tableau) {
    let total = 0;
    
    // Coffret
    if (tableau.coffret) {
        total += tableau.coffret.price;
        total += tableau.coffret.temps * devisState.global.tarif;
    }
    
    // Composants
    tableau.composants.forEach(comp => {
        total += comp.total;
    });
    
    return total;
}

function updateTableauGlobalTotal() {
    let total = 0;
    devisState.tableau.tableaux.forEach(tableau => {
        total += calculateTableauTotal(tableau);
    });
    
    const element = document.getElementById('tableauTotalPrice');
    if (element) {
        element.textContent = total.toFixed(2) + '€';
    }
}

function deleteTableau(tableauId) {
    if (!confirm('Supprimer ce tableau et tous ses composants ?')) return;
    
    devisState.tableau.tableaux = devisState.tableau.tableaux.filter(t => t.id !== tableauId);
    renderTableaux();
    saveToLocalStorage();
    updateRecap();
}

function updateTableauName(tableauId) {
    const tableau = devisState.tableau.tableaux.find(t => t.id === tableauId);
    if (tableau) {
        const newName = document.getElementById(`tableauName_${tableauId}`).value.trim();
        if (newName) {
            tableau.name = newName;
            saveToLocalStorage();
            updateRecap();
        } else {
            // Si vide, remettre l'ancien nom
            document.getElementById(`tableauName_${tableauId}`).value = tableau.name;
        }
    }
}

// ============================================================================
// RISTOURNE
// ============================================================================

function updateRistourne() {
    const enabled = document.getElementById('ristourneEnabled').checked;
    devisState.ristourne.enabled = enabled;
    
    document.getElementById('ristourneOptions').style.display = enabled ? 'block' : 'none';
    
    if (enabled) {
        devisState.ristourne.pourcent = parseFloat(document.getElementById('ristournePourcent').value) || 0;
        devisState.ristourne.delai = parseInt(document.getElementById('ristourneDelai').value) || 30;
    }
    
    saveToLocalStorage();
    updateRecap();
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
    
    // Calcul tableaux
    let tableauTotal = 0;
    if (devisState.tableau.enabled) {
        devisState.tableau.tableaux.forEach(tableau => {
            tableauTotal += calculateTableauTotal(tableau);
        });
    }
    
    const adminTotal = devisState.administratif.services.reduce((sum, s) => sum + s.price, 0);
    
    const sousTotal = travauxTotal + tableauTotal + adminTotal;
    const deplacement = devisState.global.deplacement;
    let totalHT = sousTotal + deplacement;
    
    // Ristourne
    let ristourneMontant = 0;
    if (devisState.ristourne.enabled) {
        ristourneMontant = totalHT * (devisState.ristourne.pourcent / 100);
        totalHT -= ristourneMontant;
    }
    
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
                    ${room.rebouchage ? ` | Rebouchage (${(room.rebouchagePrice || 20).toFixed(2)}€)` : ''}
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
    
    // Tableau(x)
    if (tableauTotal > 0) {
        html += `<div class="recap-section">
            <h3>⚡ TABLEAU ÉLECTRIQUE (${devisState.tableau.tableaux.length} tableau${devisState.tableau.tableaux.length > 1 ? 'x' : ''})</h3>`;
        
        devisState.tableau.tableaux.forEach(tableau => {
            const tTotal = calculateTableauTotal(tableau);
            
            html += `<div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2196f3;">
                <div style="font-weight: 700; color: #1565c0; margin-bottom: 10px; font-size: 1.15em; display: flex; justify-content: space-between;">
                    <span>⚡ ${tableau.name}</span>
                    <span>${tTotal.toFixed(2)}€</span>
                </div>`;
            
            if (tableau.coffret) {
                const coffretMO = tableau.coffret.temps * devisState.global.tarif;
                html += `<div class="recap-line" style="padding-left: 15px;">
                    <span>Coffret</span>
                    <span>${(tableau.coffret.price + coffretMO).toFixed(2)}€</span>
                </div>`;
            }
            
            tableau.composants.forEach(comp => {
                html += `<div class="recap-line" style="padding-left: 15px;">
                    <span>${comp.quantity}× ${comp.name}</span>
                    <span>${comp.total.toFixed(2)}€</span>
                </div>`;
            });
            
            html += `</div>`;
        });
        
        html += `<div class="recap-line" style="font-weight: 700; border-top: 2px solid #1e3c72; padding-top: 10px; margin-top: 10px;">
            <span>Sous-total tableaux:</span>
            <span>${tableauTotal.toFixed(2)}€</span>
        </div></div>`;
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
        ${devisState.ristourne.enabled ? `<div class="recap-total-line" style="color: #28a745;">
            <span>Ristourne (${devisState.ristourne.pourcent}% - valable ${devisState.ristourne.delai} jours):</span>
            <span>-${ristourneMontant.toFixed(2)}€</span>
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
    
    // Update ristourne preview
    if (devisState.ristourne.enabled) {
        const previewElement = document.getElementById('ristournePreview');
        if (previewElement) {
            previewElement.innerHTML = `
                💰 Ristourne de ${devisState.ristourne.pourcent}% = -${ristourneMontant.toFixed(2)}€<br>
                ⏱️ Valable ${devisState.ristourne.delai} jours à partir de la date du devis
            `;
        }
    }
    
    container.innerHTML = html;
}

// ============================================================================
// PDF GENERATION
// ============================================================================

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Logo NOORELEC
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 200, 114);
    doc.text('NOORELEC', 15, 20);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('L\'ART DU SAVOIR-FAIRE', 15, 26);
    
    // Date en haut à droite
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fait le ${dateStr}`, 195, 20, { align: 'right' });
    doc.text(`a ${devisState.client.commune || '____'}`, 195, 26, { align: 'right' });
    
    // Informations client
    let yPos = 45;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('CLIENT:', 15, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(devisState.client.name || 'Non renseigne', 15, yPos);
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
        doc.text(`Tel: ${devisState.client.phone}`, 15, yPos);
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
    doc.text('DEVIS - TRAVAUX ELECTRIQUES', 105, yPos, { align: 'center' });
    
    yPos += 7;
    
    // Numéro de devis
    if (!devisState.currentDevisNumber) {
        devisState.currentDevisNumber = generateDevisNumber();
    }
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`N° ${devisState.currentDevisNumber}`, 105, yPos, { align: 'center' });
    
    yPos += 10;
    
    // ============================================================================
    // CALCUL DES TOTAUX
    // ============================================================================
    
    let travauxTotal = 0;
    devisState.travaux.rooms.forEach(room => {
        room.articles.forEach(art => travauxTotal += art.total);
        travauxTotal += room.cabling.internal.cost + room.cabling.tableau.cost;
    });
    
    let tableauTotal = 0;
    if (devisState.tableau.enabled) {
        devisState.tableau.tableaux.forEach(tableau => {
            tableauTotal += calculateTableauTotal(tableau);
        });
    }
    
    const adminTotal = devisState.administratif.services.reduce((sum, s) => sum + s.price, 0);
    const sousTotal = travauxTotal + tableauTotal + adminTotal;
    const deplacement = devisState.global.deplacement;
    
    let ristourneMontant = 0;
    if (devisState.ristourne.enabled) {
        ristourneMontant = (sousTotal + deplacement) * (devisState.ristourne.pourcent / 100);
    }
    
    const totalHT = sousTotal + deplacement - ristourneMontant;
    const tva = totalHT * devisState.global.tva;
    const totalTTC = totalHT + tva;
    
    // ============================================================================
    // SECTION TRAVAUX
    // ============================================================================
    
    if (devisState.travaux.rooms.length > 0) {
        const travauxData = [];
        
        devisState.travaux.rooms.forEach(room => {
            if (room.articles.length > 0 || room.cabling.internal.length > 0 || room.cabling.tableau.length > 0) {
                // Sous-titre pièce
                travauxData.push([
                    { content: room.name, styles: { fontStyle: 'bold', textColor: [230, 81, 0] } },
                    ''
                ]);
                
                // Articles
                room.articles.forEach(art => {
                    travauxData.push([
                        `  ${art.quantity}× ${art.name}`,
                        `${art.total.toFixed(2)}€`
                    ]);
                });
                
                // Câblage
                if (room.cabling.internal.length > 0) {
                    travauxData.push([
                        `  Câblage entre points (${room.cabling.internal.length}m)`,
                        `${room.cabling.internal.cost.toFixed(2)}€`
                    ]);
                }
                if (room.cabling.tableau.length > 0) {
                    travauxData.push([
                        `  Câblage au tableau (${room.cabling.tableau.length}m)`,
                        `${room.cabling.tableau.cost.toFixed(2)}€`
                    ]);
                }
            }
        });
        
        if (travauxData.length > 0) {
            doc.autoTable({
                startY: yPos,
                head: [['TRAVAUX', 'Montant HTVA']],
                body: travauxData,
                theme: 'striped',
                headStyles: { fillColor: [30, 60, 114], fontSize: 12, fontStyle: 'bold' },
                styles: { fontSize: 10 },
                columnStyles: {
                    0: { cellWidth: 130 },
                    1: { cellWidth: 50, halign: 'right' }
                },
                margin: { left: 15, right: 15 }
            });
            
            yPos = doc.lastAutoTable.finalY + 8;
        }
    }
    
    // ============================================================================
    // SECTION TABLEAU ÉLECTRIQUE
    // ============================================================================
    
    if (devisState.tableau.enabled && devisState.tableau.tableaux.length > 0) {
        const tableauData = [];
        
        devisState.tableau.tableaux.forEach(tableau => {
            // Sous-titre tableau
            tableauData.push([
                { content: tableau.name, styles: { fontStyle: 'bold', textColor: [21, 101, 192] } },
                ''
            ]);
            
            // Coffret
            if (tableau.coffret) {
                const coffretMO = tableau.coffret.temps * devisState.global.tarif;
                const coffretTotal = tableau.coffret.price + coffretMO;
                tableauData.push([
                    '  Coffret',
                    `${coffretTotal.toFixed(2)}€`
                ]);
            }
            
            // Composants
            tableau.composants.forEach(comp => {
                tableauData.push([
                    `  ${comp.quantity}× ${comp.name}`,
                    `${comp.total.toFixed(2)}€`
                ]);
            });
        });
        
        if (tableauData.length > 0) {
            doc.autoTable({
                startY: yPos,
                head: [['TABLEAU ELECTRIQUE', 'Montant HTVA']],
                body: tableauData,
                theme: 'striped',
                headStyles: { fillColor: [30, 60, 114], fontSize: 12, fontStyle: 'bold' },
                styles: { fontSize: 10 },
                columnStyles: {
                    0: { cellWidth: 130 },
                    1: { cellWidth: 50, halign: 'right' }
                },
                margin: { left: 15, right: 15 }
            });
            
            yPos = doc.lastAutoTable.finalY + 8;
        }
    }
    
    // ============================================================================
    // SECTION SERVICES ADMINISTRATIFS
    // ============================================================================
    
    if (devisState.administratif.services.length > 0) {
        const adminData = devisState.administratif.services.map(s => [
            s.name + (s.hours ? ` (${s.hours}h)` : ''),
            `${s.price.toFixed(2)}€`
        ]);
        
        doc.autoTable({
            startY: yPos,
            head: [['SERVICES ADMINISTRATIFS', 'Montant HTVA']],
            body: adminData,
            theme: 'striped',
            headStyles: { fillColor: [30, 60, 114], fontSize: 12, fontStyle: 'bold' },
            styles: { fontSize: 10 },
            columnStyles: {
                0: { cellWidth: 130 },
                1: { cellWidth: 50, halign: 'right' }
            },
            margin: { left: 15, right: 15 }
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
    }
    
    // ============================================================================
    // TOTAUX (SANS RISTOURNE)
    // ============================================================================
    
    // Calculer SANS ristourne pour l'affichage principal
    const totalHTsansRistourne = sousTotal + deplacement;
    const tvaSansRistourne = totalHTsansRistourne * devisState.global.tva;
    const totalTTCsansRistourne = totalHTsansRistourne + tvaSansRistourne;
    
    // Vérifier si on a besoin d'une nouvelle page (totaux = 40mm minimum)
    if (yPos > 237) {
        doc.addPage();
        yPos = 20;
    }
    
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
        doc.text('Deplacement:', 20, yPos);
        doc.text(`${deplacement.toFixed(2)}€`, 190, yPos, { align: 'right' });
        yPos += 6;
    }
    
    doc.text('TOTAL HT:', 20, yPos);
    doc.text(`${totalHTsansRistourne.toFixed(2)}€`, 190, yPos, { align: 'right' });
    yPos += 6;
    
    doc.text(`TVA (${(devisState.global.tva * 100).toFixed(0)}%):`, 20, yPos);
    doc.text(`${tvaSansRistourne.toFixed(2)}€`, 190, yPos, { align: 'right' });
    yPos += 8;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL TTC:', 20, yPos);
    doc.text(`${totalTTCsansRistourne.toFixed(2)}€`, 190, yPos, { align: 'right' });
    
    yPos += 8; // Position après totaux
    
    // ============================================================================
    // OFFRE SPÉCIALE (SI RISTOURNE ACTIVÉE)
    // ============================================================================
    
    if (devisState.ristourne.enabled && ristourneMontant > 0) {
        // Vérifier si on a besoin d'une nouvelle page (ristourne = 42mm)
        if (yPos > 235) {
            doc.addPage();
            yPos = 20;
        }
        
        yPos += 10;
        
        // Calculer prix avec ristourne
        const totalHTavecRistourne = totalHTsansRistourne - ristourneMontant;
        const tvaAvecRistourne = totalHTavecRistourne * devisState.global.tva;
        const totalTTCavecRistourne = totalHTavecRistourne + tvaAvecRistourne;
        
        // Format délai
        const delaiText = devisState.ristourne.delai < 2 ? `${devisState.ristourne.delai * 24}h` : 
                         devisState.ristourne.delai < 7 ? `${devisState.ristourne.delai}j` : 
                         `${Math.floor(devisState.ristourne.delai / 7)} semaine${devisState.ristourne.delai / 7 > 1 ? 's' : ''}`;
        
        // Cadre jaune pour l'offre
        doc.setFillColor(255, 243, 205);
        doc.setDrawColor(255, 193, 7);
        doc.setLineWidth(2);
        doc.rect(15, yPos, 180, 42, 'FD');
        
        yPos += 8;
        doc.setTextColor(133, 100, 4);
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('OFFRE SPECIALE', 20, yPos);
        
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Ristourne: ${devisState.ristourne.pourcent}%`, 20, yPos);
        doc.text(`Validite: ${delaiText}`, 105, yPos);
        
        yPos += 6;
        doc.text(`Montant deduit: -${ristourneMontant.toFixed(2)}€`, 20, yPos);
        
        yPos += 6;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text(`Prix final: ${totalTTCavecRistourne.toFixed(2)}€ TTC`, 20, yPos);
        
        yPos += 10; // Espace après ristourne
    }
    
    // ============================================================================
    // CONDITIONS DE PAIEMENT
    // ============================================================================
    
    // Vérifier si on a besoin d'une nouvelle page (conditions = 60mm)
    if (yPos > 220) {
        doc.addPage();
        yPos = 20;
    }
    
    yPos += 10;
    
    // Cadre bleu clair (agrandi à 58mm)
    doc.setFillColor(240, 248, 255);
    doc.setDrawColor(30, 60, 114);
    doc.setLineWidth(2);
    doc.rect(15, yPos, 180, 58, 'FD');
    
    yPos += 10;
    doc.setTextColor(30, 60, 114);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('CONDITIONS DE PAIEMENT', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('30% a la signature du devis', 25, yPos);
    
    yPos += 6;
    doc.text('40% au debut des travaux', 25, yPos);
    
    yPos += 6;
    doc.text('30% a la fin du chantier', 25, yPos);
    
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Paiement sur le compte: BE00 1233 4456 738', 20, yPos);
    
    yPos += 6;
    doc.setFont(undefined, 'normal');
    doc.text('Au nom de: Noorelec SRL', 20, yPos);
    
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.text(`Communication: ${devisState.currentDevisNumber}`, 20, yPos);
    
    // Sauvegarder
    const filename = `Devis_${(devisState.client.name || 'Client').replace(/ /g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`;
    doc.save(filename);
    
    // SAUVEGARDER DANS L'HISTORIQUE
    saveDevisToHistory('attente');
    alert(`✅ PDF généré et sauvegardé dans l'historique !
${devisState.currentDevisNumber}`);
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
// ARTICLES/COFFRETS/COMPOSANTS PERSONNALISÉS
// ============================================================================

function addCustomArticle() {
    const name = document.getElementById('customArticleName').value.trim();
    const price = parseFloat(document.getElementById('customArticlePrice').value);
    const temps = parseFloat(document.getElementById('customArticleTemps').value);
    const category = document.getElementById('customArticleCategory').value;
    
    if (!name || isNaN(price) || isNaN(temps)) {
        alert('❌ Remplissez tous les champs');
        return;
    }
    
    const newArticle = {
        id: Date.now(),
        name: name,
        price: price,
        temps: temps,
        category: category
    };
    
    customArticles.push(newArticle);
    localStorage.setItem('noorelec_custom_articles', JSON.stringify(customArticles));
    
    document.getElementById('customArticleName').value = '';
    document.getElementById('customArticlePrice').value = '';
    document.getElementById('customArticleTemps').value = '';
    
    renderCustomItems();
    alert('✅ Article ajouté !');
}

function addCustomCoffret() {
    const name = document.getElementById('customCoffretName').value.trim();
    const price = parseFloat(document.getElementById('customCoffretPrice').value);
    const temps = parseFloat(document.getElementById('customCoffretTemps').value);
    
    if (!name || isNaN(price) || isNaN(temps)) {
        alert('❌ Remplissez tous les champs');
        return;
    }
    
    const newCoffret = {
        id: Date.now(),
        name: name,
        price: price,
        temps: temps
    };
    
    customCoffrets.push(newCoffret);
    localStorage.setItem('noorelec_custom_coffrets', JSON.stringify(customCoffrets));
    
    document.getElementById('customCoffretName').value = '';
    document.getElementById('customCoffretPrice').value = '';
    document.getElementById('customCoffretTemps').value = '';
    
    renderCustomItems();
    alert('✅ Coffret ajouté !');
}

function addCustomComposant() {
    const name = document.getElementById('customComposantName').value.trim();
    const price = parseFloat(document.getElementById('customComposantPrice').value);
    const temps = parseFloat(document.getElementById('customComposantTemps').value);
    const category = document.getElementById('customComposantCategory').value;
    
    if (!name || isNaN(price) || isNaN(temps)) {
        alert('❌ Remplissez tous les champs');
        return;
    }
    
    const newComposant = {
        id: Date.now(),
        name: name,
        price: price,
        temps: temps,
        category: category
    };
    
    customComposants.push(newComposant);
    localStorage.setItem('noorelec_custom_composants', JSON.stringify(customComposants));
    
    document.getElementById('customComposantName').value = '';
    document.getElementById('customComposantPrice').value = '';
    document.getElementById('customComposantTemps').value = '';
    
    renderCustomItems();
    alert('✅ Composant ajouté !');
}

function renderCustomItems() {
    // Articles
    const articlesContainer = document.getElementById('customArticlesList');
    if (articlesContainer) {
        if (customArticles.length === 0) {
            articlesContainer.innerHTML = '<p style="color: #6c757d;">Aucun article personnalisé</p>';
        } else {
            articlesContainer.innerHTML = '<h5>Vos articles:</h5>' + customArticles.map(art => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px;">
                    <div>
                        <strong>${art.name}</strong>
                        <div style="font-size: 0.9em; color: #6c757d;">${art.price}€ | ${art.temps}h | ${art.category}</div>
                    </div>
                    <button onclick="deleteCustomArticle(${art.id})" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">🗑️</button>
                </div>
            `).join('');
        }
    }
    
    // Coffrets
    const coffretsContainer = document.getElementById('customCoffretsList');
    if (coffretsContainer) {
        if (customCoffrets.length === 0) {
            coffretsContainer.innerHTML = '<p style="color: #6c757d;">Aucun coffret personnalisé</p>';
        } else {
            coffretsContainer.innerHTML = '<h5>Vos coffrets:</h5>' + customCoffrets.map(cof => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px;">
                    <div>
                        <strong>${cof.name}</strong>
                        <div style="font-size: 0.9em; color: #6c757d;">${cof.price}€ | ${cof.temps}h</div>
                    </div>
                    <button onclick="deleteCustomCoffret(${cof.id})" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">🗑️</button>
                </div>
            `).join('');
        }
    }
    
    // Composants
    const composantsContainer = document.getElementById('customComposantsList');
    if (composantsContainer) {
        if (customComposants.length === 0) {
            composantsContainer.innerHTML = '<p style="color: #6c757d;">Aucun composant personnalisé</p>';
        } else {
            composantsContainer.innerHTML = '<h5>Vos composants:</h5>' + customComposants.map(comp => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px;">
                    <div>
                        <strong>${comp.name}</strong>
                        <div style="font-size: 0.9em; color: #6c757d;">${comp.price}€ | ${comp.temps}h | ${comp.category}</div>
                    </div>
                    <button onclick="deleteCustomComposant(${comp.id})" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">🗑️</button>
                </div>
            `).join('');
        }
    }
}

function deleteCustomArticle(id) {
    if (!confirm('Supprimer cet article ?')) return;
    customArticles = customArticles.filter(a => a.id !== id);
    localStorage.setItem('noorelec_custom_articles', JSON.stringify(customArticles));
    renderCustomItems();
}

function deleteCustomCoffret(id) {
    if (!confirm('Supprimer ce coffret ?')) return;
    customCoffrets = customCoffrets.filter(c => c.id !== id);
    localStorage.setItem('noorelec_custom_coffrets', JSON.stringify(customCoffrets));
    renderCustomItems();
}

function deleteCustomComposant(id) {
    if (!confirm('Supprimer ce composant ?')) return;
    customComposants = customComposants.filter(c => c.id !== id);
    localStorage.setItem('noorelec_custom_composants', JSON.stringify(customComposants));
    renderCustomItems();
}

// ============================================================================
// HISTORIQUE DEVIS
// ============================================================================

function saveDevisToHistory(status = 'attente') {
    // Calculer totaux
    let travauxTotal = 0;
    devisState.travaux.rooms.forEach(room => {
        room.articles.forEach(art => travauxTotal += art.total);
        travauxTotal += room.cabling.internal.cost + room.cabling.tableau.cost;
    });
    
    let tableauTotal = 0;
    if (devisState.tableau.enabled) {
        devisState.tableau.tableaux.forEach(tableau => {
            tableauTotal += calculateTableauTotal(tableau);
        });
    }
    
    const adminTotal = devisState.administratif.services.reduce((sum, s) => sum + s.price, 0);
    const sousTotal = travauxTotal + tableauTotal + adminTotal;
    const deplacement = devisState.global.deplacement;
    
    let ristourneMontant = 0;
    if (devisState.ristourne.enabled) {
        ristourneMontant = (sousTotal + deplacement) * (devisState.ristourne.pourcent / 100);
    }
    
    const totalHT = sousTotal + deplacement - ristourneMontant;
    const tva = totalHT * devisState.global.tva;
    const totalTTC = totalHT + tva;
    
    const devisEntry = {
        numero: devisState.currentDevisNumber,
        client: devisState.client.name,
        montantTTC: totalTTC,
        date: new Date().toISOString(),
        status: status,
        data: JSON.parse(JSON.stringify(devisState)) // Deep copy
    };
    
    // Vérifier si le devis existe déjà (update)
    const existingIndex = devisHistory.findIndex(d => d.numero === devisState.currentDevisNumber);
    if (existingIndex >= 0) {
        devisHistory[existingIndex] = devisEntry;
    } else {
        devisHistory.push(devisEntry);
    }
    
    localStorage.setItem('noorelec_devis_history', JSON.stringify(devisHistory));
}

function renderDevisHistory(filter = 'all') {
    const container = document.getElementById('devisHistoryList');
    if (!container) return;
    
    let filteredDevis = devisHistory;
    if (filter !== 'all') {
        filteredDevis = devisHistory.filter(d => d.status === filter);
    }
    
    if (filteredDevis.length === 0) {
        container.innerHTML = '<div class="empty-state">Aucun devis</div>';
        return;
    }
    
    container.innerHTML = filteredDevis.reverse().map(devis => {
        const statusColors = {
            'valide': { bg: '#d4edda', border: '#28a745', icon: '🟢' },
            'attente': { bg: '#fff3cd', border: '#ffc107', icon: '🟠' },
            'refuse': { bg: '#f8d7da', border: '#dc3545', icon: '🔴' }
        };
        
        const color = statusColors[devis.status] || statusColors['attente'];
        const date = new Date(devis.date).toLocaleDateString('fr-BE');
        
        return `
            <div style="background: ${color.bg}; border-left: 5px solid ${color.border}; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0 0 5px 0;">${color.icon} ${devis.numero} - ${devis.client}</h4>
                        <div style="color: #6c757d; font-size: 0.9em;">${devis.montantTTC.toFixed(2)}€ TTC | ${date}</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <select onchange="changeDevisStatus('${devis.numero}', this.value)" style="padding: 8px; border-radius: 6px; border: 2px solid ${color.border};">
                            <option value="attente" ${devis.status === 'attente' ? 'selected' : ''}>🟠 En attente</option>
                            <option value="valide" ${devis.status === 'valide' ? 'selected' : ''}>🟢 Validé</option>
                            <option value="refuse" ${devis.status === 'refuse' ? 'selected' : ''}>🔴 Refusé</option>
                        </select>
                        <button onclick="loadDevis('${devis.numero}')" class="btn btn-primary">Voir</button>
                        <button onclick="deleteDevis('${devis.numero}')" class="btn btn-delete">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterDevis(filter) {
    renderDevisHistory(filter);
}

function changeDevisStatus(numero, newStatus) {
    const devis = devisHistory.find(d => d.numero === numero);
    if (devis) {
        devis.status = newStatus;
        localStorage.setItem('noorelec_devis_history', JSON.stringify(devisHistory));
        renderDevisHistory();
    }
}

function loadDevis(numero) {
    const devis = devisHistory.find(d => d.numero === numero);
    if (devis) {
        Object.assign(devisState, devis.data);
        saveToLocalStorage();
        location.reload(); // Recharger pour appliquer
    }
}

function deleteDevis(numero) {
    if (!confirm('Supprimer ce devis définitivement ?')) return;
    devisHistory = devisHistory.filter(d => d.numero !== numero);
    localStorage.setItem('noorelec_devis_history', JSON.stringify(devisHistory));
    renderDevisHistory();
}

// ============================================================================
// TABLEAU COLLAPSE (comme pièces)
// ============================================================================

function toggleTableauCollapse(tableauId) {
    const tableau = devisState.tableau.tableaux.find(t => t.id === tableauId);
    if (tableau) {
        tableau.collapsed = !tableau.collapsed;
        renderTableaux();
        saveToLocalStorage();
    }
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


// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    // Vérifier auth en premier
    const isAuth = await checkAuth();
    if (!isAuth) return;
    
    // Charger données
    loadFromLocalStorage();
    renderCustomItems();
    renderDevisHistory();
});
