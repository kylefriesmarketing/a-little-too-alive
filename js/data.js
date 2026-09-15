import {SEEDS,seedKind} from './catalog.js';
export const SAVE_KEY = 'a-little-too-alive-save';
export const VERSION = 2;
export const LIMIT = 180;
import {LONGITUDE_LIMIT} from './planet.js';
export {groundAt} from './planet.js';
export const RADIUS = LONGITUDE_LIMIT;
export const INGREDIENTS = {
  ...SEEDS,
  moss:  { name: 'Moss',  mark: '✳', color: '#b4d48a', desc: 'Roots. Sunlight. A tendency to spread.', genes: {flora: 1} },
  eye:   { name: 'Eye',   mark: '◉', color: '#b8c9f0', desc: 'Awareness. Curiosity. Eventually, questions.', genes: {mind: 1, motion: .6} },
  heart: { name: 'Heart', mark: '♡', color: '#ef9caa', desc: 'Affection. A pulse. Something to lose.', genes: {love: 1, motion: .3} },
  brick: { name: 'Brick', mark: '▤', color: '#d9aa87', desc: 'Shelter. Community. Unusual architecture.', genes: {build: 1} },
  tooth: { name: 'Tooth', mark: '⋎', color: '#eee4c4', desc: 'Hunger. Legs. Very poor table manners.', genes: {fang: 1, motion: 1} },
  tear:  { name: 'Tear',  mark: '◊', color: '#83c9d2', desc: 'Water. Grief. Life in unlikely places.', genes: {water: 1, flora: .3} },
  ember: { name: 'Ember', mark: '☼', color: '#ec956d', desc: 'Heat. Metabolism. Consequences.', genes: {heat: 1, motion: .4} },
  echo:  { name: 'Echo',  mark: '≋', color: '#c0a4e6', desc: 'Memory. Songs. Ideas that travel.', genes: {song: 1, mind: .5} }
};
export const GENE_KEYS = ['flora','mind','love','build','fang','water','heat','song','motion'];
export const KNOWN = {
  'eye+moss': 'Watchfern', 'moss+tooth': 'Jawbloom', 'brick+heart': 'Hearthling',
  'eye+heart': 'Daydreamer', 'heart+tooth': 'Dearling', 'brick+eye': 'Watchhouse',
  'brick+moss': 'Seedhouse', 'brick+tooth': 'Mouthhouse', 'heart+moss': 'Heartwood',
  'heart+tear': 'Sorrowbud', 'echo+eye': 'Witness', 'ember+moss': 'Cinderfern',
  'eye+heart+moss': 'Tenderling', 'brick+eye+heart': 'Little Sanctuary',
  'brick+heart+tooth': 'Hearthbeast', 'brick+echo+heart': 'Choirhouse',
  'moss+tear': 'Rainbloom', 'ember+tooth': 'Cindermaw', 'echo+moss': 'Whisperwood'
};
export const MILESTONES = [
  {id:'life', name:'First breath', desc:'Plant your first living seed.'},
  {id:'hybrid', name:'Family resemblance', desc:'A wild hybrid is born from two different creations.'},
  {id:'civilization', name:'We live here now', desc:'Three aware creatures gather around a home.'},
  {id:'walking', name:'The house has legs', desc:'A loved, inhabited home wakes up.'},
  {id:'city', name:'A little too alive', desc:'Three waking homes join into a living city.'},
  {id:'god', name:'They noticed', desc:'An aware creature learns enough to address its creator.'},
  {id:'rules', name:'A new law of nature', desc:'A society changes how nearby life behaves.'}
];
export function genesOf(seeds) {
  const genes = Object.fromEntries(GENE_KEYS.map(k => [k,0]));
  for (const seed of seeds) for (const [k,v] of Object.entries(INGREDIENTS[seed].genes)) genes[k] += v;
  for (const k of GENE_KEYS) genes[k] = Math.min(1,genes[k]);
  return genes;
}
export function kindOf(g,seeds=[]) { return seedKind(seeds)||(g.build >= .3 ? 'home' : g.flora >= .6 ? 'plant' : 'creature'); }
export function nameOf(seeds,genes=genesOf(seeds)) {
  const base=seeds.find(k=>SEEDS[k]);if(base){const mods=seeds.filter(k=>k!==base).map(k=>INGREDIENTS[k].name);return (mods.length?mods.join(' ')+' ':'')+SEEDS[base].name;}
  const signature = [...seeds].sort().join('+');
  if (KNOWN[signature]) return KNOWN[signature];
  if (seeds.length === 1) return {moss:'Mossling',eye:'Peeker',heart:'Pulse',brick:'Sleeping House',tooth:'Nibbler',tear:'Raindrop',ember:'Sparkling',echo:'Murmur'}[seeds[0]];
  const adj = genes.heat>.5 ? 'Cinder' : genes.water>.5 ? 'Weeping' : genes.song>.5 ? 'Singing' : genes.love>.5 ? 'Tender' : genes.fang>.5 ? 'Hungry' : 'Watchful';
  return adj + ' ' + (kindOf(genes)==='home'?'Hearth':kindOf(genes)==='plant'?'Bloom':'Wanderer');
}
