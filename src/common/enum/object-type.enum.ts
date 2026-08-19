export enum ObjectType {
  Planet = 'planet',
  DwarfPlanet = 'dwarf_planet',
  Moon = 'moon',
  Comet = 'comet',
  Asteroid = 'asteroid',

  Star = 'star',

  Nebula = 'nebula',
  PlanetaryNebula = 'planetary_nebula',
  SupernovaRemnant = 'supernova_remnant',
  Galaxy = 'galaxy',
  OpenCluster = 'open_cluster',
  GlobularCluster = 'globular_cluster',

  Quasar = 'quasar',
  Other = 'other',
}

export const ObjectTypeMetadata: Record<ObjectType, { label: string; description: string }> = {
  [ObjectType.Planet]: {
    label: 'Planète',
    description: "Un corps céleste en orbite autour d'une étoile, suffisamment massif pour avoir une forme sphérique.",
  },
  [ObjectType.DwarfPlanet]: {
    label: 'Planète naine',
    description: "Un corps céleste en orbite autour du Soleil, sphérique mais n'ayant pas dégagé son voisinage orbital.",
  },
  [ObjectType.Moon]: {
    label: 'Lune',
    description: "Un satellite naturel en orbite autour d'une planète ou d'un autre corps céleste.",
  },
  [ObjectType.Comet]: {
    label: 'Comète',
    description: "Un petit corps glacé qui, en s'approchant du Soleil, dégage une chevelure et parfois une queue lumineuse.",
  },
  [ObjectType.Asteroid]: {
    label: 'Astéroïde',
    description: "Un petit corps rocheux du système solaire, trop petit pour être classé comme planète.",
  },
  [ObjectType.Star]: {
    label: 'Étoile',
    description: "Une sphère de plasma maintenue par sa propre gravité, générant de la lumière par fusion nucléaire.",
  },
  [ObjectType.Nebula]: {
    label: 'Nébuleuse',
    description: "Un nuage interstellaire de gaz et de poussière, souvent une région de formation d'étoiles.",
  },
  [ObjectType.PlanetaryNebula]: {
    label: 'Nébuleuse planétaire',
    description: "L'enveloppe de gaz ionisé éjectée par une étoile en fin de vie.",
  },
  [ObjectType.SupernovaRemnant]: {
    label: 'Rémanent de supernova',
    description: "La structure résultant de l'explosion d'une étoile en supernova.",
  },
  [ObjectType.Galaxy]: {
    label: 'Galaxie',
    description: "Un vaste ensemble d'étoiles, de gaz et de poussière lié par la gravité.",
  },
  [ObjectType.OpenCluster]: {
    label: 'Amas ouvert',
    description: "Un groupe d'étoiles nées ensemble, faiblement liées par la gravité, généralement jeunes.",
  },
  [ObjectType.GlobularCluster]: {
    label: 'Amas globulaire',
    description: "Une concentration sphérique dense de milliers à millions d'étoiles très anciennes.",
  },
  [ObjectType.Quasar]: {
    label: 'Quasar',
    description: "Le noyau extrêmement lumineux d'une galaxie lointaine, alimenté par un trou noir supermassif.",
  },
  [ObjectType.Other]: {
    label: 'Autre',
    description: "Un objet céleste ne correspondant à aucune des catégories précédentes.",
  },
};