export class GardenAudio {
  constructor(){this.enabled=false;this.ctx=null;this.last=0;}
  async set(enabled){
    if(enabled&&!this.ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;this.ctx=new Audio();this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);
      for(const [i,f] of [98,146.83,196,246.94].entries()){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.value=.012/(i+1);o.connect(g);g.connect(this.master);o.start();}
    }
    this.enabled=enabled;if(this.ctx){await this.ctx.resume();this.master.gain.setTargetAtTime(enabled?.65:0,this.ctx.currentTime,.3);}return this.enabled;
  }
  tone(freq,duration=.3,type='sine',volume=.03){if(!this.enabled)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.65,t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);}
  event(type){const f={plant:340,graft:225,discovery:660,milestone:520,intervention:290,loss:115,transformation:175,law:470};this.tone(f[type]||440,type==='milestone'?.9:.35);}
  update(world,now){if(!this.enabled||now-this.last<3.5)return;this.last=now;const es=world.state.entities;if(!es.length)return;const e=es[Math.floor(now)%es.length];this.tone(e.fear>.5?130:220+e.genes.song*220+e.love*110,.35+e.genes.song*.6,'sine',.013);}
}
