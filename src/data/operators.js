// Kayak schools and trip operators checked on their own live sites.
// Copy lives in the language files. No prices and no contact details here.
export const OPERATORS = [
  {
    id: 'pkr',
    url: 'https://puconkayakretreat.com',
    regions: ['araucania', 'maule', 'central', 'los-rios', 'los-lagos'],
    featured: true
  },
  {
    id: 'exchile',
    url: 'https://www.exchile.com',
    regions: ['los-lagos'],
    featured: false
  },
  {
    id: 'kriminal',
    url: 'https://www.kriminalkayak.com',
    regions: ['los-lagos'],
    featured: false
  }
];

export function operatorsIn(regionId) {
  return OPERATORS.filter((operator) => operator.regions.includes(regionId));
}
