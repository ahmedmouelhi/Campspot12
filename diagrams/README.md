# Diagrammes UML - CampSpot

Ce dossier contient les diagrammes UML complets du projet CampSpot, générant une documentation visuelle de l'architecture et des interactions du système.

## Fichiers générés

### Sources PlantUML (.puml)
- `use_cases.puml` - Diagramme de cas d'utilisation globale
- `class_diagram.puml` - Diagramme de classes complet
- `sequence_auth.puml` - Diagramme de séquence : Authentification
- `sequence_booking.puml` - Diagramme de séquence : Gestion panier et réservation
- `sequence_admin.puml` - Diagramme de séquence : Administration

### Images générées (.png)
- `CampSpot_Use_Cases.png` - Vue d'ensemble des cas d'utilisation
- `CampSpot_Class_Diagram.png` - Modèle de données et relations
- `Sequence_Authentication.png` - Flux d'inscription et connexion
- `Sequence_Booking.png` - Processus de réservation complet
- `Sequence_Admin.png` - Gestion administrative

## Utilisation

### Génération des images
```bash
# Avec PlantUML installé
java -jar plantuml.jar -tpng *.puml

# Ou via serveur en ligne
# https://www.plantuml.com/plantuml/uml/[code_encodé]
```

### Modification des diagrammes
1. Éditer les fichiers .puml avec votre éditeur préféré
2. Utiliser l'extension PlantUML dans VS Code pour prévisualisation
3. Régénérer les images après modification

## Description des diagrammes

### Diagramme de cas d'utilisation
- **Acteurs** : Visiteur, Utilisateur Connecté, Administrateur
- **Cas principaux** : Consultation, Réservation, Gestion administrative
- **Relations** : Héritage entre acteurs, extensions et inclusions

### Diagramme de classes
- **Entités principales** : User, Campsite, Activity, Equipment, Cart, Booking, Order
- **Énumérations** : UserRole, BookingStatus, PaymentStatus, etc.
- **Relations** : Compositions, agrégations, associations avec cardinalités

### Diagrammes de séquences
- **Authentification** : Inscription, connexion, validation JWT
- **Réservation** : Panier, vérification disponibilité, paiement, notifications
- **Administration** : Accès sécurisé, gestion contenus, statistiques

## Intégration dans le rapport

Les diagrammes sont référencés dans le rapport Word (`campspot_rapport_final.docx`) avec descriptions détaillées et analyse de la conception.

## Outils utilisés

- **PlantUML** v1.2024.7 - Génération des diagrammes
- **Java 11** - Exécution PlantUML
- **Architecture** : Frontend React + Backend Express/Node.js + MongoDB

---

*Généré automatiquement pour le projet CampSpot*
