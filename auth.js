// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = 'https://ahaingqdlmsdmaimtuve.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoYWlucWdkbG1zZG1haW10dXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjg5MDQsImV4cCI6MjA4NDYwNDkwNH0.oUMT-XW69F2skvx1xmWB3B6G15OMCqfWywTt55_q-jU';
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SsCF8InHJZkcFCzH50gYKAlBuDEOgsYmUwO1xuBdd6FMcm8lF2qV5KUp7mZlLMEl3pjAjdmiKWCNiTxqk760hbI00BBXE0EFE';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Stripe
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

let selectedPrice = 'monthly';

// ============================================================================
// UI FUNCTIONS
// ============================================================================

function switchTab(tab) {
    // Update tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('login-tab').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('signup-tab').classList.add('active');
    }
}

function selectPrice(price) {
    selectedPrice = price;
    document.querySelectorAll('.price-option').forEach(opt => opt.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    document.querySelector(`input[value="${price}"]`).checked = true;
}

function showAlert(elementId, message, type = 'error') {
    const alertEl = document.getElementById(elementId);
    alertEl.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => alertEl.innerHTML = '', 5000);
}

function showLoading(buttonId) {
    const btn = document.getElementById(buttonId);
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';
}

function hideLoading(buttonId, text) {
    const btn = document.getElementById(buttonId);
    btn.disabled = false;
    btn.innerHTML = text;
}

// ============================================================================
// VAT VERIFICATION (EU VIES API)
// ============================================================================

async function verifyVAT(vatNumber) {
    // Nettoyer le numéro TVA
    const cleanVAT = vatNumber.replace(/[.\s-]/g, '').toUpperCase();
    
    // Vérifier format belge
    if (!cleanVAT.match(/^BE[0-9]{10}$/)) {
        return { valid: false, error: 'Format TVA belge invalide (ex: BE 0123.456.789)' };
    }
    
    try {
        // API VIES européenne (gratuite)
        const countryCode = cleanVAT.substring(0, 2);
        const vatNum = cleanVAT.substring(2);
        
        const response = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${vatNum}`);
        
        if (!response.ok) {
            return { valid: false, error: 'Erreur de vérification TVA' };
        }
        
        const data = await response.json();
        
        if (data.valid) {
            return { 
                valid: true, 
                companyName: data.name || '',
                vatNumber: cleanVAT
            };
        } else {
            return { valid: false, error: 'Numéro TVA invalide ou inactif' };
        }
    } catch (error) {
        console.error('VAT verification error:', error);
        // En cas d'erreur API, on accepte quand même si le format est bon
        return { 
            valid: true, 
            companyName: '',
            vatNumber: cleanVAT,
            warning: 'Impossible de vérifier en ligne, format accepté'
        };
    }
}

async function checkVATAlreadyUsed(vatNumber) {
    const { data, error } = await supabase
        .from('vat_trials')
        .select('*')
        .eq('vat_number', vatNumber)
        .single();
    
    return data !== null;
}

// ============================================================================
// LOGIN
// ============================================================================

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    showLoading('login-btn');
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Vérifier le statut d'abonnement
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (userError) throw userError;
        
        // Vérifier si l'abonnement est actif
        if (userData.subscription_status === 'expired' || userData.subscription_status === 'cancelled') {
            showAlert('login-alert', '⚠️ Votre abonnement a expiré. Veuillez renouveler.', 'error');
            hideLoading('login-btn', 'Se connecter');
            return;
        }
        
        // Si essai et expiré
        if (userData.subscription_status === 'trial' && new Date(userData.subscription_end) < new Date()) {
            showAlert('login-alert', '⚠️ Votre essai gratuit a expiré. Veuillez souscrire.', 'error');
            hideLoading('login-btn', 'Se connecter');
            return;
        }
        
        // Connexion réussie
        showAlert('login-alert', '✅ Connexion réussie !', 'success');
        setTimeout(() => {
            window.location.href = 'app.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert('login-alert', '❌ Email ou mot de passe incorrect', 'error');
        hideLoading('login-btn', 'Se connecter');
    }
}

// ============================================================================
// SIGNUP
// ============================================================================

async function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    const vatNumber = document.getElementById('signup-vat').value.trim();
    
    // Vérifier mots de passe
    if (password !== passwordConfirm) {
        showAlert('signup-alert', '❌ Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('signup-alert', '❌ Le mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }
    
    showLoading('signup-btn');
    
    try {
        let hasVATTrial = false;
        let vatData = null;
        
        // Si TVA fournie, vérifier
        if (vatNumber) {
            showAlert('signup-alert', '🔍 Vérification du numéro TVA...', 'info');
            
            vatData = await verifyVAT(vatNumber);
            
            if (!vatData.valid) {
                showAlert('signup-alert', `❌ ${vatData.error}`, 'error');
                hideLoading('signup-btn', 'Créer mon compte');
                return;
            }
            
            // Vérifier si TVA déjà utilisée
            const alreadyUsed = await checkVATAlreadyUsed(vatData.vatNumber);
            if (alreadyUsed) {
                showAlert('signup-alert', '❌ Ce numéro TVA a déjà été utilisé pour un essai gratuit', 'error');
                hideLoading('signup-btn', 'Créer mon compte');
                return;
            }
            
            hasVATTrial = true;
            if (vatData.warning) {
                showAlert('signup-alert', `⚠️ ${vatData.warning}`, 'info');
            }
        }
        
        // Créer compte Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (authError) throw authError;
        
        const userId = authData.user.id;
        
        // Si TVA valide → Créer essai 14 jours
        if (hasVATTrial) {
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 14);
            
            // Créer user avec essai
            await supabase.from('users').insert({
                id: userId,
                email: email,
                role: 'trial',
                subscription_status: 'trial',
                subscription_end: trialEnd.toISOString(),
                vat_number: vatData.vatNumber,
                company_name: vatData.companyName
            });
            
            // Enregistrer TVA comme utilisée
            await supabase.from('vat_trials').insert({
                vat_number: vatData.vatNumber,
                used_by_user_id: userId,
                used_by_email: email,
                trial_end: trialEnd.toISOString()
            });
            
            // Créer settings par défaut
            await supabase.from('user_settings').insert({
                user_id: userId
            });
            
            showAlert('signup-alert', '✅ Compte créé ! Essai gratuit 14 jours activé !', 'success');
            setTimeout(() => {
                window.location.href = 'app.html';
            }, 2000);
            
        } else {
            // Pas de TVA → Rediriger vers Stripe
            showAlert('signup-alert', '🔄 Redirection vers le paiement...', 'info');
            
            // Créer user en attente
            await supabase.from('users').insert({
                id: userId,
                email: email,
                role: 'subscriber',
                subscription_status: 'inactive',
                subscription_type: selectedPrice
            });
            
            // Créer settings par défaut
            await supabase.from('user_settings').insert({
                user_id: userId
            });
            
            // Rediriger vers Stripe Checkout
            await createStripeCheckout(userId, email, selectedPrice);
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('signup-alert', `❌ Erreur: ${error.message}`, 'error');
        hideLoading('signup-btn', 'Créer mon compte');
    }
}

// ============================================================================
// STRIPE CHECKOUT
// ============================================================================

async function createStripeCheckout(userId, email, priceType) {
    try {
        // Appeler votre backend pour créer une session Checkout
        // IMPORTANT: Vous devrez créer un petit serveur backend pour ça
        // Pour l'instant, je vais vous montrer comment faire côté client
        
        const response = await fetch('https://your-backend.com/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                email: email,
                priceType: priceType
            })
        });
        
        const session = await response.json();
        
        // Rediriger vers Stripe
        const result = await stripe.redirectToCheckout({
            sessionId: session.id
        });
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
    } catch (error) {
        console.error('Stripe checkout error:', error);
        showAlert('signup-alert', '❌ Erreur lors de la création du paiement', 'error');
        hideLoading('signup-btn', 'Créer mon compte');
    }
}

// ============================================================================
// CHECK IF ALREADY LOGGED IN
// ============================================================================

window.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // Déjà connecté, rediriger
        window.location.href = 'app.html';
    }
});
