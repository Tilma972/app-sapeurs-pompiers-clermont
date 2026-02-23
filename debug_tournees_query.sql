-- Requête 1: Toutes les tournées de l'équipe 8be52785-8ca1-4af9-b80d-9a64a75e42b9
SELECT 
    t.id,
    t.user_id,
    t.equipe_id,
    t.statut,
    t.zone,
    t.montant_collecte,
    t.calendriers_distribues,
    t.calendriers_alloues,
    t.date_debut,
    t.date_fin,
    t.created_at,
    p.full_name as pompier_nom,
    p.email as pompier_email
FROM tournees t
LEFT JOIN profiles p ON p.id = t.user_id
WHERE t.equipe_id = '8be52785-8ca1-4af9-b80d-9a64a75e42b9'
ORDER BY t.created_at DESC;

-- Requête 2: Toutes les tournées de l'utilisateur eca38da4-7eda-48b8-90d6-b1c007e81db3
SELECT 
    t.id,
    t.user_id,
    t.equipe_id,
    t.statut,
    t.zone,
    t.montant_collecte,
    t.calendriers_distribues,
    t.calendriers_alloues,
    t.date_debut,
    t.date_fin,
    t.created_at,
    e.nom as equipe_nom,
    e.secteur as equipe_secteur
FROM tournees t
LEFT JOIN equipes e ON e.id = t.equipe_id
WHERE t.user_id = 'eca38da4-7eda-48b8-90d6-b1c007e81db3'
ORDER BY t.created_at DESC;

-- Requête 3: Tournées communes (équipe ET utilisateur)
SELECT 
    t.id,
    t.statut,
    t.zone,
    t.montant_collecte,
    t.calendriers_distribues,
    t.date_debut,
    t.date_fin,
    t.created_at
FROM tournees t
WHERE t.equipe_id = '8be52785-8ca1-4af9-b80d-9a64a75e42b9'
  AND t.user_id = 'eca38da4-7eda-48b8-90d6-b1c007e81db3'
ORDER BY t.created_at DESC;

-- Requête 4: Statistiques par statut pour l'équipe
SELECT 
    t.statut,
    COUNT(*) as nombre_tournees,
    SUM(t.montant_collecte) as total_collecte,
    SUM(t.calendriers_distribues) as total_calendriers
FROM tournees t
WHERE t.equipe_id = '8be52785-8ca1-4af9-b80d-9a64a75e42b9'
GROUP BY t.statut
ORDER BY t.statut;

-- Requête 5: Statistiques par statut pour l'utilisateur
SELECT 
    t.statut,
    COUNT(*) as nombre_tournees,
    SUM(t.montant_collecte) as total_collecte,
    SUM(t.calendriers_distribues) as total_calendriers
FROM tournees t
WHERE t.user_id = 'eca38da4-7eda-48b8-90d6-b1c007e81db3'
GROUP BY t.statut
ORDER BY t.statut;
