# Noorelec — notes du projet site web

Fichier de référence pour reprendre le travail (nouveau chat Cursor, autre PC) sans l'historique des discussions.

**Site :** https://noorelec.be  
**Hébergement :** OVH (multisite : `/www` prod, `/test` possible)  
**Stack :** WordPress · Astra · Elementor · Rank Math · WPForms · UpdraftPlus · UAE (Header & Footer Builder — footer uniquement)

---

## Objectif business

- Visibilité **Google** (local Bruxelles / Belgique) : « électricien Bruxelles », devis, rénovation, conformité RGIE.
- Activité en démarrage : priorité **rénovation + mise en conformité**.
- Obtenir des **clients** puis des **avis Google** (fiche Google Business Profile).

---

## Pages publiées (état juillet 2026)

| Page | URL (slug) | Focus keyword Rank Math | Statut technique |
|------|------------|-------------------------|------------------|
| Accueil | `/` | électricien à Bruxelles | index, canonical OK |
| Services | `/services-electricite-a-bruxelles/` | services électricité à Bruxelles | index, canonical OK |
| Rénovation électrique | `/renovation-electrique-bruxelles/` | rénovation électrique | index, canonical OK |
| Conformité / RGIE | `/conformite-electrique-rgie/` | conformité électrique | index, canonical OK |
| Borne de recharge | `/borne-de-recharge/` | borne de recharge | index, canonical OK |
| Devis / Contact | `/devis-electricien/` | devis électricien | index, canonical OK |
| À propos | `/a-propos-electricien-bruxelles/` | électricien Bruxelles | index, canonical OK (301 depuis `/a-propos/`) |

**Note :** l'ancienne URL Services `services-electricite-a-bruxelles-2-2` → encore **404** (301 à faire, point 3 du backlog).

**Pages supprimées / inutiles :** Sample Page, Customer Cabinet.  
**À faire plus tard :** Privacy Policy (publier + lien footer).

---

## Menu principal (header)

Structure actuelle :

- Accueil
- Contact
- **Nos prestations** → page Services (cliquable)
  - Rénovation électrique
  - borne de recharge
  - Mise en conformité électrique et RGIE
- À propos

**Réglage CSS sous-menu** (texte invisible sur fond blanc) — dans **Apparence → Personnaliser → CSS additionnel** :

```css
.ast-desktop .main-navigation .sub-menu a,
.main-navigation .sub-menu a {
  color: #0f172a !important;
}
.main-navigation .sub-menu {
  background: #fff;
}
```

Le header est géré par **Astra** (pas de template Header dans UAE — seulement Footer).

**Titre de page en double :** masquer via Astra → **Disable Banner Area** ou **Disable Elements** sur la page concernée ; garder **un seul H1** dans Elementor.

---

## Rank Math — rappels

- Le **score dans la liste Pages** peut être **en retard** vs le score **dans l'éditeur** (ex. 78 vs 85) → faire confiance au score après **Mettre à jour**.
- **Alt image** = description honnête ; le focus keyword **seulement si naturel**.
- **Liens internes** = liens cliquables **dans le corps** de la page (footer/menu ne suffit pas toujours).
- **Content AI** = ignorer.
- **Sitemap :** `https://noorelec.be/sitemap_index.xml`

---

## Google Search Console — FAIT (juillet 2026)

### État technique vérifié (juillet 2026)

- Balise de validation Google **déjà présente** sur l'accueil (via Rank Math).
- `robots.txt` : OK, sitemap déclaré.
- `sitemap_index.xml` : OK, 7 pages listées.
- Toutes les pages : `index, follow` + URL canonique correcte.
- `site:noorelec.be` : **0 résultat** → indexation à pousser manuellement.

### Étape A — Vérifier la propriété (5 min)

1. Ouvrir [Google Search Console](https://search.google.com/search-console).
2. Se connecter avec le compte Google de l'entreprise (Gmail pro ou perso utilisé pour Noorelec).
3. **Ajouter une propriété** → type **Préfixe d'URL** → `https://noorelec.be`
4. Méthode de validation : **Balise HTML** (recommandé, déjà en place via Rank Math).
   - Si Google affiche un code différent de celui dans Rank Math :
     - WordPress → **Rank Math SEO** → **Réglages généraux** → **Webmaster Tools** → coller le nouveau code Google → Enregistrer.
     - Attendre 1–2 min, puis cliquer **Vérifier** dans Search Console.
   - Si le code correspond déjà → cliquer directement **Vérifier**.

**Vérification côté WordPress (optionnelle) :**  
Rank Math → Réglages généraux → Webmaster Tools → champ **Google Search Console** doit contenir un code (actuellement détecté sur le site : balise `google-site-verification` active).

### Étape B — Soumettre le sitemap (2 min)

1. Search Console → menu gauche **Sitemaps**.
2. Dans « Ajouter un sitemap », saisir : `sitemap_index.xml`
3. Cliquer **Envoyer**.
4. Statut attendu : **Réussite** (peut prendre quelques heures pour le nombre d'URL découvertes).

Ne pas soumettre les sous-sitemaps individuellement (`page-sitemap.xml`, etc.) — l'index suffit.

### Étape C — Demander l'indexation page par page (15 min)

Search Console → barre du haut **Inspecter une URL** → coller chaque URL → **Demander une indexation**.

**Limite Google :** environ 10–12 demandes par jour par propriété. Faire les 7 URLs en une session si possible.

| # | URL complète à inspecter |
|---|--------------------------|
| 1 | `https://noorelec.be/` |
| 2 | `https://noorelec.be/services-electricite-a-bruxelles/` |
| 3 | `https://noorelec.be/renovation-electrique-bruxelles/` |
| 4 | `https://noorelec.be/conformite-electrique-rgie/` |
| 5 | `https://noorelec.be/borne-de-recharge/` |
| 6 | `https://noorelec.be/devis-electricien/` |
| 7 | `https://noorelec.be/a-propos-electricien-bruxelles/` |

Pour chaque URL :

1. Coller l'URL dans la barre d'inspection.
2. Attendre le rapport (URL sur Google / URL non sur Google).
3. Cliquer **Demander une indexation** → confirmer.
4. Message attendu : « Demande d'indexation envoyée ».

### Étape D — Contrôles après 48 h – 2 semaines

1. Search Console → **Pages** → vérifier que les URL passent en « Indexées ».
2. Google : rechercher `site:noorelec.be` → viser **7 pages**.
3. Search Console → **Performances** → premières impressions (peut prendre 2–4 semaines).

### Dépannage fréquent

| Problème | Solution |
|----------|----------|
| Vérification échoue | Vider le cache OVH / plugin cache, revérifier la balise dans le code source de l'accueil |
| Sitemap « Impossible de récupérer » | Réessayer plus tard ; le sitemap répond bien en direct |
| « URL exclue par la balise noindex » | Vérifier Rank Math sur la page → Robots Meta = Index |
| « Page avec redirection » pour `/a-propos/` | Normal : indexer `/a-propos-electricien-bruxelles/` (canonical) |
| Demande refusée / quota | Reprendre le lendemain pour les URLs restantes |

---

## Google Business Profile — EN COURS (priorité 2)

Indispensable pour « électricien Bruxelles » en recherche locale (carte Google, pack local).

### Étape A — Créer ou récupérer la fiche (15 min)

1. Ouvrir [Google Business Profile](https://business.google.com) (ou l'app « Google Business Profile »).
2. Se connecter avec le **même compte Google** que Search Console si possible.
3. **Ajouter votre établissement** → nom : **Noorelec**
4. Catégorie principale : **Électricien** (pas « Entreprise générale »).
5. Zone : **Bruxelles** + communes couvertes (pas d'adresse fixe si intervention à domicile — choisir « Je livre des biens et services à mes clients » / zone de service).

### Étape B — Infos à remplir (cohérence NAP = site web)

| Champ | Valeur |
|-------|--------|
| Nom | Noorelec |
| Téléphone | +32 485 86 42 24 |
| Site web | https://noorelec.be |
| E-mail | contact@noorelec.be |
| Zone | Bruxelles, Brabant wallon, Brabant flamand |
| Horaires | Selon disponibilité réelle (ex. lun–ven 8h–18h) |
| Description | Électricien à Bruxelles : rénovation, mise en conformité RGIE, dépannage, bornes de recharge. Devis rapide. |

**Important :** nom, téléphone et site doivent être **identiques** partout (site, fiche Google, footer).

### Étape C — Vérification Google

Google envoie souvent une **carte postale**, un **appel** ou un **e-mail** pour valider l'entreprise. Suivre les instructions dans le tableau de bord GBP.

### Étape D — Optimiser la fiche (30 min)

- **Logo** : même que le site WordPress
- **Photo de couverture** : chantier ou véhicule / tableau électrique (éviter stock générique si possible)
- **Photos** : 5–10 minimum (tableau, chantier, outils, avant/après si dispo)
- **Services** : Rénovation électrique, Mise en conformité RGIE, Dépannage, Borne de recharge, Installation
- **Zone desservie** : Bruxelles + communes listées sur le site
- **Lien vers le site** : page Devis `https://noorelec.be/devis-electricien/`

### Étape E — Premiers avis (après premiers clients)

- Demander un avis **après chantier terminé** (SMS ou e-mail avec lien direct)
- Ne pas acheter de faux avis — risque de suspension
- Répondre à chaque avis (positif ou négatif)

### Contrôle

- Recherche Google : **Noorelec Bruxelles** → la fiche apparaît à droite / sur la carte
- Google Maps : même recherche → pin ou zone de service visible

---

## Contact / NAP

- Email : contact@noorelec.be
- Téléphone : +32 485 86 42 24 (à harmoniser footer + fiche Google si pas partout)
- Zone : Belgique (base Bruxelles, déplacements selon chantier)

Formulaire WPForms sur `/devis-electricien/` (Nom, Email, Téléphone, Commune, Délai, Type de demande, Message).

---

## À faire (backlog)

- [x] **Search Console** : propriété validée + sitemap `sitemap_index.xml` soumis + indexation demandée pour les 7 pages
- [ ] Google Business Profile : créer / optimiser + demander avis clients réels ← **EN COURS (priorité 2)**
- [ ] Privacy Policy : rédiger, publier, lien footer
- [ ] Confirmer **301** ancienne URL Services `-2-2` → slug propre
- [ ] Footer : mettre à jour liens (Services, RGIE, Borne) si anciens libellés
- [ ] Schema LocalBusiness Rank Math si pas activé
- [ ] Remplacer images IA par photos chantier
- [ ] Harmoniser mot-clé Accueil vs À propos (électricien à Bruxelles / électricien Bruxelles)
- [ ] Corriger double H1 page Devis, H1 minuscule Borne, stats placeholder À propos

---

## Accès admin (sans mots de passe ici)

- WordPress : `https://noorelec.be/wp-admin/`
- Rank Math, Elementor, Apparence → Menus, Personnaliser
- Backups : UpdraftPlus

---

*Dernière mise à jour : juillet 2026 — Search Console fait, priorité Google Business Profile*
