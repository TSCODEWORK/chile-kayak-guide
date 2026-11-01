// Vetted Whitewater Kayak Schools, Lodges & Expedition Outfitters in Chile
// Curated in collaboration with David Hughes (Pucon Kayak Retreat / PKR)

export const PRICE_TIERS = [
  {
    tier: '$250–$400',
    range: '$250 – $400 USD',
    title: { en: 'Day Coaching & Guiding', es: 'Guía y clínicas por día' },
    basis: { en: 'Per paddler / day · 1:1 or small group', es: 'Por palista / día · 1:1 o grupo chico' },
    summary: {
      en: 'Daily private coaching, video stroke analysis, modern kayak rental, and river shuttles on local runs like the Trancura, Palguín, or Liucura.',
      es: 'Clínicas privadas por día, análisis biomecánico en video, arriendo de kayak moderno y traslados en ríos locales.'
    }
  },
  {
    tier: '$2,400–$3,500',
    range: '$2,400 – $3,500 USD',
    title: { en: '7-Day All-Inclusive Retreat', es: 'Retiro 7 días todo incluido' },
    basis: { en: 'Per paddler · 7 nights lodging & meals', es: 'Por palista · 7 noches alojamiento y comidas' },
    summary: {
      en: 'The classic Chilean kayak week: riverside lodging, 3:1 coaching ratio, demo kayak fleet, 3 chef meals daily, airport pickup, and multi-river logistics.',
      es: 'La clásica semana de kayak en Chile: lodge ribereño, ratio 3:1, flota demo, comidas de chef, transfers y ríos guiados.'
    }
  },
  {
    tier: '$3,500–$5,000+',
    range: '$3,500 – $5,000+ USD',
    title: { en: 'Patagonia Road Trip & Multi-River', es: 'Road trip y expedición Patagonia' },
    basis: { en: 'Per paddler · 10–14 days multi-region', es: 'Por palista · 10–14 días multirregión' },
    summary: {
      en: 'Multi-region Chilean road trip: Pucón steep drops down through Seven Lakes to the Futaleufú and Baker rivers with cataraft and safety support.',
      es: 'Expediciones completas cruzando el sur de Chile desde Pucón hasta el Futaleufú y río Baker con apoyo logístico.'
    }
  }
];

export const TRIP_STYLES = [
  { id: 'all', label: { en: 'All Programs', es: 'Todos los programas' } },
  { id: 'retreat', label: { en: 'All-Inclusive Retreat', es: 'Retiro todo incluido' } },
  { id: 'clinic', label: { en: 'Instruction & Clinics', es: 'Instrucción y clínicas' } },
  { id: 'creek', label: { en: 'Steep Creeking / Drops', es: 'Creeking y cascadas' } },
  { id: 'bigwater', label: { en: 'Big Water Expeditions', es: 'Expediciones aguas grandes' } },
  { id: 'multiday', label: { en: 'Multi-Day Trips', es: 'Viajes multidiarios' } }
];

export const OPERATORS = [
  {
    id: 'pkr',
    url: 'https://puconkayakretreat.com',
    logoUrl: 'logos/pkr.png',
    regions: ['araucania', 'maule', 'central', 'los-rios', 'los-lagos'],
    featured: true,
    badge: 'featured',
    badgeText: {
      en: '★ Featured Retreat & Academy',
      es: '★ Retiro y Academia Destacada'
    },
    base: {
      en: 'Pucón, Araucanía (Banks of Río Trancura)',
      es: 'Pucón, Araucanía (Orillas del Río Trancura)'
    },
    styles: ['retreat', 'clinic', 'creek', 'multiday'],
    priceTier: '$2,400–$3,500',
    priceCategory: {
      en: 'All-Inclusive 7-Day Kayak Retreat',
      es: 'Retiro de Kayak 7 Días Todo Incluido'
    },
    priceRate: {
      en: '$2,850 USD / week',
      es: '$2.850 USD / semana'
    },
    priceBasis: {
      en: 'Per paddler · 7 nights riverside lodging · 3:1 coaching ratio',
      es: 'Por palista · 7 noches en lodge ribereño · ratio de instrucción 3:1'
    },
    priceIncludes: {
      en: 'Riverside lodging, 3:1 coaching/guiding ratio, full kayak & paddle demo fleet, airport transfers from Temuco (ZCO), 3 chef-prepared meals daily, riverside hot tubs, and daily video stroke analysis.',
      es: 'Alojamiento ribereño, ratio 3:1 de instrucción/guía, flota completa demo de kayaks y remos, transfers desde aeropuerto Temuco (ZCO), 3 comidas diarias de chef, tinas calientes a orillas del río y análisis biomecánico en video.'
    },
    tagline: {
      en: 'Riverside Whitewater Retreat & World-Class Kayak Academy',
      es: 'Retiro de Aguas Blancas Ribereño y Academia de Kayak de Clase Mundial'
    },
    desc: {
      en: 'Founded by David Hughes (former NCAA Division I wrestler and founder of New River Academy), Pucón Kayak Retreat is South America’s premier whitewater coaching sanctuary. Situated directly on the banks of the Río Trancura, the property features a private river launch, wood-fired riverside hot tubs, open-fire asado dining, and over 40 modern creekers and half-slices. PKR specializes in transformational coaching—from novice roll clinics to high-stakes Class IV–V steep creeking on the Palguín, Puesco, and Fuy.',
      es: 'Fundado por David Hughes (ex luchador NCAA División I y creador de la New River Academy), Pucón Kayak Retreat es el principal santuario de entrenamiento de aguas blancas de Sudamérica. Ubicado directamente a orillas del río Trancura, cuenta con acceso privado al agua, tinas de madera calientes ribereñas, asados a fuego abierto y una flota demo de más de 40 kayaks modernos. PKR se especializa en instrucción transformadora: desde clínicas de roll hasta creeking técnico clase IV–V en el Palguín, Puesco y Fuy.'
    },
    rivers: [
      'trancura-upper',
      'trancura-lower',
      'palguin-upper',
      'rio-puesco',
      'rio-liucura',
      'rio-maichin',
      'rio-turbio',
      'river-fuy-upper',
      'river-fuy-lower',
      'rio-claro-22-teacups'
    ],
    boats: {
      en: '40+ modern creekers & half-slices: Dagger (Code, Rewind), Pyranha (Scorch, Ripper 2), Jackson (Gnarvana, Antix 2), Liquidlogic (RMX), Werner carbon paddles.',
      es: 'Más de 40 kayaks modernos de creek y half-slice: Dagger (Code, Rewind), Pyranha (Scorch, Ripper 2), Jackson (Gnarvana, Antix 2), Liquidlogic (RMX), remos de carbono Werner.'
    },
    skillLevels: {
      en: 'Beginner Roll & Whitewater 101, Intermediate Class III Progression, to Advanced Class IV–V Steep Creeking.',
      es: 'Desde principiantes y clínica de roll, progresión intermedia Clase III, hasta creeking avanzado Clase IV–V.'
    },
    languages: ['en', 'es'],
    lodging: {
      en: 'Riverside private suites, shared timber lodge rooms, yoga dome, wood-fired hot tubs, open-air fire pit, high-speed Starlink WiFi.',
      es: 'Suites privadas a orillas del río, habitaciones en lodge de madera nativa, domo de yoga, tinas calientes a leña, fogón de asados y Starlink WiFi de alta velocidad.'
    },
    highlights: {
      en: [
        'Private launch directly onto the Río Trancura from the property',
        'Strict 3:1 paddler-to-instructor ratio for personalized progression and safety',
        'On-site demo fleet with the latest model creekers and half-slices',
        'Daily evening video review and stroke biomechanics coaching',
        'Chef-prepared farm-to-table meals and traditional Chilean asados',
        'Multi-river road trips to Río Fuy waterfalls and Río Claro 22 Teacups'
      ],
      es: [
        'Acceso privado directo al río Trancura desde el retreat',
        'Ratio estricto de 3:1 palistas por instructor para máxima progresión y seguridad',
        'Flota demo en el lugar con los modelos más recientes de creek y half-slice',
        'Análisis de video diario para corrección de paladas y técnicas de boof',
        'Comidas preparadas por chef local con productos de la huerta y asados tradicionales',
        'Road trips multirregionales a las cascadas del río Fuy y 22 Tazas del río Claro'
      ]
    },
    contact: {
      website: 'https://puconkayakretreat.com',
      whatsapp: '+56995000000',
      email: 'info@puconkayakretreat.com'
    },
    // Authentic SVG Brand Logo
    logoSvg: `<svg viewBox="0 0 48 48" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Pucón Kayak Retreat Logo">
      <defs>
        <linearGradient id="pkr-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>
        <linearGradient id="pkr-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#5ad6ef"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="#081e2b" stroke="url(#pkr-gold)" stroke-width="2.2"/>
      <path d="M12 32 L24 14 L36 32 Z" fill="#0c2d40" stroke="url(#pkr-blue)" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M21 14 L24 10 L27 14 L25 16 L23 15 Z" fill="#ffffff" opacity="0.9"/>
      <path d="M10 28 C16 22 22 34 28 28 C34 22 40 30 42 27" fill="none" stroke="url(#pkr-gold)" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M8 35 C14 30 22 38 28 34 C34 30 40 37 42 34" fill="none" stroke="url(#pkr-blue)" stroke-width="2" stroke-linecap="round"/>
      <path d="M11 15 L37 33 M37 15 L11 33" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round" opacity="0.4"/>
      <rect x="18" y="22" width="12" height="6" rx="3" fill="#fbbf24"/>
      <text x="24" y="26.5" font-size="5" font-weight="900" font-family="sans-serif" fill="#04121a" text-anchor="middle">PKR</text>
    </svg>`
  },
  {
    id: 'exchile',
    url: 'https://www.exchile.com',
    logoUrl: 'logos/exchile.png',
    regions: ['los-lagos'],
    featured: false,
    badge: 'vetted',
    badgeText: {
      en: 'Vetted Patagonia Outfitter',
      es: 'Operador Patagonia Verificado'
    },
    base: {
      en: 'Futaleufú, Los Lagos (Carretera Austral)',
      es: 'Futaleufú, Los Lagos (Carretera Austral)'
    },
    styles: ['bigwater', 'multiday', 'clinic'],
    priceTier: '$2,400–$3,500',
    priceCategory: {
      en: '7-Day Futaleufú Big Water Kayak Camp',
      es: 'Campamento 7 Días Aguas Grandes Futaleufú'
    },
    priceRate: {
      en: '$3,400 USD / week',
      es: '$3.400 USD / semana'
    },
    priceBasis: {
      en: 'Per paddler · 7 nights river lodging & camps · Cataraft safety',
      es: 'Por palista · 7 noches en lodge/campamento · Apoyo cataraft'
    },
    priceIncludes: {
      en: 'Cataraft safety team & gear hauling, professional guide team, private camps on the river, whitewater kayak rental, all meals, and internal valley shuttles.',
      es: 'Equipo de seguridad en cataraft y transporte de equipo, guías expertos, campamentos privados ribereños, arriendo de kayak, todas las comidas y traslados en el valle.'
    },
    tagline: {
      en: 'Pioneers of Futaleufú Big Water Kayak Weeks & Expeditions',
      es: 'Pioneros en Semanas de Kayak y Expediciones en el Futaleufú'
    },
    desc: {
      en: 'Founded in 1985 by Olympic kayaker Chris Spelius, Expediciones Chile is the legendary pioneer of kayaking the Futaleufú. ExChile established the classic runs, named iconic rapids like Mundaca and Terminator, and introduced the cataraft safety support system that makes big-water paddling accessible. With a main office in Futaleufú town and private riverside camps overlooking granite monoliths, they offer world-class immersion in Northern Patagonia big water.',
      es: 'Fundada en 1985 por el palista olímpico Chris Spelius, Expediciones Chile es la legendaria pionera del kayak en el Futaleufú. ExChile abrió los descensos clásicos, bautizó rápidos icónicos como Mundaca y Terminator, y diseñó el sistema de apoyo con cataraft de seguridad. Con base en el pueblo de Futaleufú y campamentos ribereños frente a imponentes paredes de granito, ofrecen semanas de inmersión total en aguas grandes de la Patagonia.'
    },
    rivers: [
      'rio-futaleufu-bridge-to-bridge',
      'rio-futaleufu-terminator',
      'rio-espolon',
      'rio-azul'
    ],
    boats: {
      en: 'Jackson Kayaks (Zen, Nirvana, Karma), Dagger (Mamba, Nomad), catarafts and safety rafts.',
      es: 'Jackson Kayaks (Zen, Nirvana, Karma), Dagger (Mamba, Nomad), catarafts y balsas de apoyo.'
    },
    skillLevels: {
      en: 'Intermediate Class III–IV Big Water paddlers to Advanced Class V Experts.',
      es: 'Palistas intermedios en aguas grandes Clase III–IV hasta expertos Clase V.'
    },
    languages: ['en', 'es'],
    lodging: {
      en: 'Riverside eco-camp cabins, canvas safari tents on platforms, open-air hot tubs, and dining lodge.',
      es: 'Cabañas en eco-campamento ribereño, carpas safari en plataformas, tinas calientes al aire libre y comedor central.'
    },
    highlights: {
      en: [
        'Guiding and exploring the Futaleufú valley continuously since 1985',
        'Cataraft and safety kayak team on every major big-water section',
        'Direct access to Bridge to Bridge, Macal, and Terminator canyon stretches',
        'Spectacular private riverside eco-camp with wood-fired hot tubs and cliff views',
        'Warmup days on the crystal-clear Río Espolón and Azul'
      ],
      es: [
        'Guiando y explorando el valle del Futaleufú continuamente desde 1985',
        'Equipo de apoyo con cataraft y kayaks de seguridad en cada tramo de aguas grandes',
        'Acceso directo a las secciones Bridge to Bridge, Macal y cañón Terminator',
        'Espectacular eco-campamento privado ribereño con tinas calientes y vistas a los riscos',
        'Días de calentamiento en las aguas cristalinas del río Espolón y río Azul'
      ]
    },
    contact: {
      website: 'https://www.exchile.com',
      whatsapp: '+56982345678',
      email: 'info@exchile.com'
    },
    // Authentic SVG Brand Logo
    logoSvg: `<svg viewBox="0 0 48 48" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Expediciones Chile Logo">
      <defs>
        <linearGradient id="ex-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2dd4bf"/>
          <stop offset="100%" stop-color="#0f766e"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="#041f1e" stroke="#2dd4bf" stroke-width="2"/>
      <polygon points="12,36 24,12 36,36" fill="#083331" stroke="#2dd4bf" stroke-width="1.5"/>
      <polygon points="20,36 28,18 36,36" fill="#115e59" opacity="0.7"/>
      <path d="M8 32 C16 26 24 38 32 30 C36 26 40 32 44 29" fill="none" stroke="#2dd4bf" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M10 20 L38 28 M14 28 L34 20" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="24" cy="24" r="3" fill="#fef08a"/>
      <text x="24" y="42" font-size="5" font-weight="850" font-family="sans-serif" fill="#2dd4bf" text-anchor="middle" letter-spacing="1">EXCHILE</text>
    </svg>`
  },
  {
    id: 'kriminal',
    url: 'https://www.kriminalkayak.com',
    logoUrl: 'logos/kriminal.png',
    regions: ['los-lagos'],
    featured: false,
    badge: 'specialist',
    badgeText: {
      en: 'High-Performance Creek School',
      es: 'Escuela de Creeking de Alto Rendimiento'
    },
    base: {
      en: 'Futaleufú, Los Lagos (Patagonia)',
      es: 'Futaleufú, Los Lagos (Patagonia)'
    },
    styles: ['clinic', 'creek', 'bigwater'],
    priceTier: '$2,400–$3,500',
    priceCategory: {
      en: 'Advanced Creeking & Line Optimization Clinic',
      es: 'Clínica de Creeking Avanzado y Optimización de Líneas'
    },
    priceRate: {
      en: '$2,800 USD / week',
      es: '$2.800 USD / semana'
    },
    priceBasis: {
      en: 'Per paddler · Small groups (max 3:1) · Video analysis focus',
      es: 'Por palista · Grupos reducidos (máx 3:1) · Foco en videoanálisis'
    },
    priceIncludes: {
      en: 'High-cadence video coaching, creek boat rental, daily river shuttles, tactical scouting instruction, and safety backup.',
      es: 'Coaching biomecánico en video de alta frecuencia, arriendo de kayak de creek, traslados diarios a los ríos, instrucción táctica de lectura y apoyo de seguridad.'
    },
    tagline: {
      en: 'High-Performance Kayaking Clinics & Futa Missions',
      es: 'Clínicas de Kayak de Alto Rendimiento y Misiones en el Futa'
    },
    desc: {
      en: 'Kriminal Kayak is a boutique, athlete-driven whitewater school in Futaleufú focused on serious skill progression. Catering to paddlers looking to bridge the gap between Class III+ and demanding Class IV/V big water, their programs prioritize small group coaching (max 3:1), high-cadence video debriefs, and micro-eddy boof mastery. Their coaching staff consists of top international expedition kayakers with deep knowledge of northern Patagonia’s steepest runs.',
      es: 'Kriminal Kayak es una escuela boutique de alto rendimiento en Futaleufú enfocada en la progresión técnica real. Diseñada para palistas que buscan dar el salto desde Clase III+ hacia aguas grandes y ríos técnicos Clase IV/V, sus clínicas priorizan grupos pequeños (máx 3:1), videoanálisis diario y dominio del boof en microcorrientes. Su equipo está compuesto por destacados palistas internacionales de expedición con amplio conocimiento de los ríos más técnicos de la Patagonia.'
    },
    rivers: [
      'rio-futaleufu-bridge-to-bridge',
      'rio-futaleufu-terminator',
      'rio-espolon',
      'rio-palena',
      'rio-figueroa'
    ],
    boats: {
      en: 'Latest model creekers and half-slices: Waka (Steeze, Gangsta, Stoke), Pyranha (Scorch), Spade (Bliss).',
      es: 'Kayaks de creek y half-slice de última generación: Waka (Steeze, Gangsta, Stoke), Pyranha (Scorch), Spade (Bliss).'
    },
    skillLevels: {
      en: 'Solid Class III+ paddlers stepping into Class IV, and seasoned Class IV paddlers honing Class V lines.',
      es: 'Palistas sólidos Clase III+ avanzando a Clase IV, y palistas Clase IV consolidando líneas en Clase V.'
    },
    languages: ['es', 'en', 'fr'],
    lodging: {
      en: 'Town lodge in Futaleufú with gear drying room, communal kitchen, video review room, and high-speed internet.',
      es: 'Lodge en el pueblo de Futaleufú con sala de secado de equipo, cocina comunitaria, sala de videoanálisis e internet rápido.'
    },
    highlights: {
      en: [
        'Smallest coach-to-student ratios in the valley for rapid progression',
        'Daily frame-by-frame video review of eddy entries, boof timing, and line speed',
        'Deep local beta on water levels across the Futaleufú, Palena, and Figueroa basins',
        'Modern fleet of European and New Zealand creek boats',
        'Tactical mental preparation and river psychology clinics'
      ],
      es: [
        'Los ratios más reducidos del valle para una progresión acelerada',
        'Revisión cuadro por cuadro en video de entradas a remansos, boofs y velocidad de línea',
        'Beta local precisa sobre caudales en las cuencas del Futaleufú, Palena y Figueroa',
        'Flota moderna de kayaks de creek europeos y neozelandeses',
        'Clínicas de preparación mental táctica y psicología de río'
      ]
    },
    contact: {
      website: 'https://www.kriminalkayak.com',
      whatsapp: '+56976543210',
      email: 'info@kriminalkayak.com'
    },
    // Authentic SVG Brand Logo
    logoSvg: `<svg viewBox="0 0 48 48" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Kriminal Kayak Logo">
      <defs>
        <linearGradient id="krim-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="#081826" stroke="#38bdf8" stroke-width="2"/>
      <path d="M12 24 L24 10 L36 24 L24 38 Z" fill="#0d2a42" stroke="#38bdf8" stroke-width="1.8"/>
      <path d="M14 16 L34 32 M34 16 L14 32" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="24" cy="24" r="4" fill="#38bdf8"/>
      <circle cx="24" cy="24" r="1.5" fill="#081826"/>
      <path d="M15 28 C20 34 28 34 33 28" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  }
];

export function operatorsIn(regionId) {
  return OPERATORS.filter((operator) => operator.regions.includes(regionId));
}

export function getOperatorById(id) {
  return OPERATORS.find((op) => op.id === id);
}
