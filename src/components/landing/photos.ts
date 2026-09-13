export type SectionKey = 'chi-siamo' | 'mostre' | 'eventi' | 'concerti';

// ponytail: placeholder SVG — quando arrivano le foto reali basta
// sostituire i path qui sotto (jpg/png in public/punk/).
export const PHOTOS: Record<SectionKey, string[]> = {
  'chi-siamo': ['/punk/chi-siamo-1.svg', '/punk/chi-siamo-2.svg', '/punk/chi-siamo-3.svg'],
  mostre: ['/punk/mostre-1.svg', '/punk/mostre-2.svg', '/punk/mostre-3.svg'],
  eventi: ['/punk/eventi-1.svg', '/punk/eventi-2.svg', '/punk/eventi-3.svg'],
  concerti: ['/punk/concerti-1.svg', '/punk/concerti-2.svg', '/punk/concerti-3.svg'],
};
