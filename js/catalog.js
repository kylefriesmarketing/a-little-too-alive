export const CATEGORIES = {
  flora: {label:'Flora',kind:'plant',hint:'1 · Grow food and habitat before introducing animals.',color:'#b6d688'},
  fauna: {label:'Fauna',kind:'creature',hint:'2 · Add grazers, pollinators, builders, and predators.',color:'#e6bb83'},
  buildings: {label:'Buildings',kind:'home',hint:'3 · Give your inhabitants places that help them thrive.',color:'#9fcae0'}
};
export const SEEDS = {
  grass:{name:'Meadow grass',category:'flora',mark:'〽',color:'#acc671',desc:'Fast-growing forage. Start the food chain here.',tip:'Plant a meadow, then add three Sun grazers.',genes:{flora:1,love:.1}},
  flower:{name:'Lantern flower',category:'flora',mark:'✿',color:'#eeb7bf',desc:'Feeds pollinators; visited flowers grow faster.',tip:'Plant beside an orchard and release Lantern moths.',genes:{flora:1,love:.3,song:.55}},
  fruit:{name:'Orchard tree',category:'flora',mark:'♧',color:'#e3b979',desc:'Produces fruit that restores extra energy to grazers.',tip:'Combine orchards, Foragers, and a Granary.',genes:{flora:1,love:.8,mind:.1}},
  bark:{name:'Elderwood',category:'flora',mark:'♠',color:'#aebf83',desc:'Tall branching trees supply extra building material.',tip:'Place near a settlement with a Workshop.',genes:{flora:1,build:.15,mind:.15}},
  fungus:{name:'Mooncap colony',category:'flora',mark:'⌂',color:'#cbb2df',desc:'Recycles grief into healing for nearby living things.',tip:'Grow near a nursery or a place that has suffered losses.',genes:{flora:1,water:.45,song:.3}},
  reed:{name:'Rain reeds',category:'flora',mark:'≋',color:'#7fcfc8',desc:'Collect moisture and improve neighboring plant growth.',tip:'Plant beside dry meadows or a Living well.',genes:{flora:1,water:1}},
  hoof:{name:'Sun grazer',category:'fauna',mark:'⋎',color:'#dbc38e',desc:'A swift herd animal that grazes and raises its young.',tip:'Give it grass and fruit before introducing predators.',genes:{motion:.9,flora:.15,love:.6,mind:.25}},
  wing:{name:'Lantern moth',category:'fauna',mark:'⋈',color:'#dfb6e8',desc:'Flies between flowers, pollinating them as it feeds.',tip:'A pair of moths can help a flower patch flourish.',genes:{motion:1,song:.8,mind:.3,love:.2}},
  shell:{name:'Mossback beetle',category:'fauna',mark:'⬡',color:'#8fbcad',desc:'An armored six-legged grazer; survives bites better.',tip:'Try a mixed herd with fragile Sun grazers.',genes:{flora:.15,water:.8,motion:.8,love:.3}},
  claw:{name:'Ridge stalker',category:'fauna',mark:'⌁',color:'#dba087',desc:'A lean predator that hunts grazers when hungry.',tip:'Introduce one only after the herd can reproduce.',genes:{fang:.9,motion:.9,mind:.4,heat:.25}},
  hand:{name:'Forager',category:'fauna',mark:'♙',color:'#b7c6de',desc:'An upright builder that carries food and wood home.',tip:'Three Foragers near a Hearth can found a settlement.',genes:{mind:1,love:.65,motion:.5}},
  horn:{name:'Crown guardian',category:'fauna',mark:'♆',color:'#cfc389',desc:'A horned defender that frightens nearby predators.',tip:'Protect an orchard herd with a guardian.',genes:{love:.6,mind:.4,motion:.65,fang:.25}},
  hearth:{name:'Hearth',category:'buildings',mark:'⌂',color:'#d8b88e',desc:'Shelters aware creatures. A loved home can grow legs.',tip:'Add three Foragers, feed them, and give the Hearth love.',genes:{build:1,love:.8,mind:.2}},
  granary:{name:'Granary',category:'buildings',mark:'▥',color:'#d7c085',desc:'Supplies nearby residents from the settlement food store.',tip:'Foragers must bring food home before it can distribute it.',genes:{build:1,flora:.25}},
  well:{name:'Living well',category:'buildings',mark:'◉',color:'#88cbd1',desc:'Maintains a watering pool that nourishes nearby life.',tip:'Place next to your first meadow.',genes:{build:1,water:1}},
  nursery:{name:'Nursery',category:'buildings',mark:'♡',color:'#e1b3c2',desc:'Helps young creatures grow and recover faster.',tip:'Build near a breeding herd and keep food nearby.',genes:{build:1,love:1,flora:.2}},
  spire:{name:'Observatory',category:'buildings',mark:'⌖',color:'#b4bbdf',desc:'Nearby minds learn faster and may discover their god.',tip:'Surround it with curious Foragers and listen.',genes:{build:1,mind:1,song:.5}},
  workshop:{name:'Workshop',category:'buildings',mark:'⚒',color:'#d3ac89',desc:'Settlements turn gathered resources into extra material.',tip:'Use Elderwood and Foragers to help your settlement expand.',genes:{build:1,mind:.4,heat:.4}}
};
export const MUTATIONS=['moss','eye','heart','brick','tooth','tear','ember','echo'];
export function seedRole(e){return e.seeds.find(key=>SEEDS[key])||null;}
export function seedKind(seeds){const seed=seeds.find(key=>SEEDS[key]);return seed?CATEGORIES[SEEDS[seed].category].kind:null;}
export function guideProgress(world){const all=world.state.entities,flora=all.filter(e=>e.kind==='plant').length,fauna=all.filter(e=>e.kind==='creature').length,builders=all.filter(e=>e.kind==='creature'&&e.genes.mind>.3).length;return [{label:'Grow a habitat',detail:Math.min(flora,6)+'/6 plants',done:flora>=6,category:'flora'},{label:'Bring it to life',detail:Math.min(fauna,3)+'/3 animals',done:fauna>=3,category:'fauna'},{label:'Found a settlement',detail:world.state.societies.length?'A society is growing':Math.min(builders,3)+'/3 aware neighbors + a Hearth',done:world.state.societies.length>0,category:'buildings'}];}
