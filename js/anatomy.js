// A heritable phenotype, shared by movement rules, rendering and field notes.
export function anatomy(g){return {
  legs:g.water>.65&&g.motion>.65?6:4,
  legLength:.48+g.motion*.62,
  neck:.2+g.mind*.75+g.flora*.25,
  bulk:.65+g.love*.35+g.fang*.2,
  tail:.7+g.water*.85+g.motion*.6,
  crest:g.song*.9+g.flora*.4,
  jaw:g.fang,
  speed:.34+g.motion*.52+g.water*.1-g.love*.06,
  sense:6+g.mind*7,
  diet:g.fang>.68&&g.flora<.3?'predator':'grazer'
};}
