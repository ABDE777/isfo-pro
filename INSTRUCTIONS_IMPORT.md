# Instructions pour importer les étudiants

## Étape 1: Préparer les données

Le fichier Excel `base_isfo_2-2.xls` a été parsé et contient les données suivantes pour chaque étudiant:

- **MatriculeEtudiant**: Numéro d'inscription (utilisé pour l'email et le mot de passe)
- **Nom**: Nom de famille
- **Prenom**: Prénom
- **DateNaissance**: Date de naissance
- **CIN**: Numéro de carte d'identité
- **Code**: Groupe (DEV101, ID102, etc.)
- **LibelleLong**: Formation complète
- **NTelelephone**: Numéro de téléphone (optionnel)

## Étape 2: Format des données dans Supabase

Chaque étudiant sera créé avec:
- **Email**: `{MatriculeEtudiant}@ofppt-edu.ma` (ex: 2007102700175@ofppt-edu.ma)
- **Mot de passe initial**: `{MatriculeEtudiant}` (le numéro d'inscription)
- **password_changed**: `false` (pour forcer le changement au premier login)

## Étape 3: Méthodes d'importation

### Option A: Via l'interface Supabase (Recommandé pour petit nombre)

1. Allez sur: https://supabase.com/dashboard/project/hyzlkqrlodpcmxsnexsg/editor
2. Ouvrez la table `students`
3. Cliquez sur "Insert" → "Insert row"
4. Remplissez les champs pour chaque étudiant

### Option B: Via SQL (Recommandé pour grand nombre)

1. Allez sur: https://supabase.com/dashboard/project/hyzlkqrlodpcmxsnexsg/sql/new
2. Utilisez une requête SQL INSERT comme suit:

```sql
INSERT INTO public.students (
  inscription_number,
  first_name,
  last_name,
  cin,
  birth_date,
  email,
  password_hash,
  password_changed,
  student_group,
  formation_level,
  speciality,
  formation_type,
  formation_mode,
  formation_year
) VALUES
  ('2007102700175', 'ISMAIL', 'JAFA', 'BA65247', '2007-10-27', '2007102700175@ofppt-edu.ma', '2007102700175', false, 'DEV101', 'Technicien Spécialisé', 'Développement Digital', 'Résidentielle', 'Diplômante', '2025'),
  ('2006092300195', 'OTHMANE', 'EL BERRIM', 'BK749225', '2006-09-23', '2006092300195@ofppt-edu.ma', '2006092300195', false, 'ID101', 'Technicien Spécialisé', 'Infrastructure Digitale', 'Résidentielle', 'Diplômante', '2025');
-- Ajoutez plus de lignes...
```

### Option C: Via Script (Pour automatisation complète)

Le fichier `scripts/import-students.ts` contient un script TypeScript pour automatiser l'importation.

**Important**: Ce script nécessite:
- La clé Service Role de Supabase (disponible dans les paramètres du projet)
- Node.js et les dépendances installées

## Étape 4: Vérification

Après l'importation, vérifiez que:
1. Les emails sont au format correct: `matricule@ofppt-edu.ma`
2. Les mots de passe sont égaux aux numéros d'inscription
3. `password_changed` est à `false` pour tous les nouveaux étudiants
4. Les groupes correspondent aux codes dans le fichier Excel

## Étape 5: Test de connexion

1. Essayez de vous connecter avec:
   - Email: `2007102700175@ofppt-edu.ma`
   - Mot de passe: `2007102700175`
2. Le système devrait demander de changer le mot de passe au premier login

## Notes importantes

- **Sécurité**: Les mots de passe initiaux sont les numéros d'inscription, ce qui est acceptable car le système force le changement au premier login
- **Duplicatas**: Assurez-vous qu'il n'y a pas de doublons dans les numéros d'inscription
- **Validation**: Les emails doivent tous se terminer par `@ofppt-edu.ma`
- **Groupes valides**: Assurez-vous que les groupes existent dans l'enum `student_group`

## Extraction des données du fichier Excel

Les données complètes sont disponibles dans le fichier parsé. Voici un exemple de transformation:

```
Excel: 6469549 | 2007102700175 | JAFA | ISMAIL | H | ...
↓
SQL: inscription_number='2007102700175', first_name='ISMAIL', last_name='JAFA', email='2007102700175@ofppt-edu.ma', password_hash='2007102700175'
```

## Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs d'erreur dans Supabase
2. Assurez-vous que les migrations sont appliquées
3. Vérifiez que les politiques RLS permettent l'insertion (pour les admins)
