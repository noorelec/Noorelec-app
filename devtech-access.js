/**
 * Règles alignées sur app.html : accès outils métier si essai actif ou abonnement payant actif.
 * Pas de doc utilisateur → accès autorisé (rétrocompat / comptes non encore provisionnés).
 */
export function checkElectricianAccess(userData) {
    if (!userData || typeof userData !== 'object') {
        return { allowed: true, reason: 'no_profile' };
    }
    const { accountType, hasTrial, trialEndDate, subscriptionStatus } = userData;

    if (accountType === 'registered') {
        return { allowed: true, reason: 'registered_pending_payment' };
    }

    if (accountType === 'trial' && hasTrial === false) {
        return { allowed: false, reason: 'trial_not_activated' };
    }

    if (accountType === 'trial' && hasTrial) {
        if (!trialEndDate) return { allowed: true, reason: 'trial_no_date' };
        if (new Date(trialEndDate) > new Date()) return { allowed: true };
        return { allowed: false, reason: 'trial_expired' };
    }
    if (accountType === 'paid') {
        if (subscriptionStatus === 'active') return { allowed: true };
        return { allowed: false, reason: 'subscription_inactive' };
    }
    return { allowed: true, reason: 'legacy_or_unknown' };
}

export function paywallMessage(reason) {
    switch (reason) {
        case 'trial_expired':
            return {
                title: 'Essai gratuit terminé',
                text: 'Pour créer des devis sur chantier avec DevTech, souscrivez à l’abonnement mensuel depuis votre tableau de bord.',
            };
        case 'subscription_inactive':
            return {
                title: 'Abonnement inactif',
                text: 'Votre abonnement n’est pas actif ou le paiement est en attente. Finalisez depuis le tableau de bord.',
            };
        case 'trial_not_activated':
            return {
                title: 'Essai non activé',
                text: 'Validez votre adresse e-mail et votre numéro de TVA (VIES) sur la page d’inscription pour activer 14 jours d’accès complet.',
            };
        default:
            return {
                title: 'Accès restreint',
                text: 'Si vous pensez qu’il s’agit d’une erreur, contactez le support.',
            };
    }
}
