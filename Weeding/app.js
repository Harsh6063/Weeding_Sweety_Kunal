'use strict';
const $=s=>document.querySelector(s);
const opening=$('#invitation'),main=$('#main'),music=$('#music'),motion=$('#motion');
const tracks=Object.fromEntries(['intro','haldi','sangeet','wedding'].map(k=>[k,$('#track-'+k)]));
let opened=false,enabled=false,everChosen=false,currentScene='intro',activeTrack=null,transition=0,fadeFrame=0,toastTimer,celebrationTimer;
const audio=tracks.intro;
const sources=Object.fromEntries(Object.entries(tracks).map(([key,el])=>[key,el.getAttribute('src')]));
let loadedTrack='intro',autoplayPending=false;
if('scrollRestoration' in history)history.scrollRestoration='manual';
window.scrollTo({top:0,left:0,behavior:'instant'});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
if(reduced.matches){document.body.classList.add('motion-paused');}
for(const corner of document.querySelectorAll('.floral-corner'))corner.innerHTML='';
$('.garland').innerHTML='<i></i>'.repeat(50);$('.strings').innerHTML='<i></i>'.repeat(26);
for(const container of document.querySelectorAll('.floating-petals,.sparkles'))for(let i=0;i<18;i++){const p=document.createElement('i');p.className='petal';p.style.setProperty('--left',`${Math.random()*100}%`);p.style.setProperty('--duration',`${6+Math.random()*6}s`);p.style.setProperty('--delay',`${-Math.random()*12}s`);if(container.classList.contains('sparkles')){p.style.setProperty('--sparkle-top',`${Math.random()*100}%`);p.style.setProperty('--duration',`${4+Math.random()*5}s`);}container.append(p);}
const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');if(e.target.classList.contains('scroll-writing')&&!reduced.matches){e.target.classList.add('is-writing');const finish=()=>{e.target.classList.remove('is-writing');e.target.classList.add('writing-done');};e.target.addEventListener('animationend',finish,{once:true});setTimeout(finish,2600);}reveal.unobserve(e.target);}}),{threshold:.15,rootMargin:'0px 0px -8% 0px'});
let doorTimer;
function checkDoor(){
 const section=$('#couple-introduction');if(!opened||document.body.classList.contains('sealed')||section.classList.contains('visible'))return;
 const r=section.getBoundingClientRect(),visible=Math.min(r.bottom,innerHeight)-Math.max(r.top,0);
 const ready=visible>=Math.min(r.height,innerHeight)*.88;
 if(!ready){clearTimeout(doorTimer);doorTimer=null;return;}
 if(!doorTimer)doorTimer=setTimeout(()=>{doorTimer=null;const rect=section.getBoundingClientRect();const amount=Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0);if(amount>=Math.min(rect.height,innerHeight)*.88)section.classList.add('visible');},450);
}
function observe(){
 document.querySelectorAll('main h2:not(.sr-only),main .event-tagline').forEach(el=>{el.classList.remove('write-on','reveal','safe-title');el.classList.add('scroll-writing');reveal.observe(el);});
 document.querySelectorAll('.event-heading').forEach(el=>el.classList.remove('reveal'));

 document.querySelectorAll('main .ceremony-copy,main .story-copy').forEach(el=>{el.classList.add('write-on','reveal');el.style.setProperty('--letters',String(Math.min(el.textContent.length,80)));});
 for(const group of document.querySelectorAll('.event-heading,.event-details,.story-section,footer')){
  [...group.querySelectorAll('.reveal')].forEach((el,i)=>el.style.setProperty('--reveal-delay',`${Math.min(i,3)*120}ms`));
 }
 document.querySelectorAll('.blessing-intro,.hero-copy').forEach(el=>el.classList.add('reveal'));
document.querySelectorAll('.reveal').forEach(el=>{if(!el.classList.contains('couple-introduction'))reveal.observe(el);});checkDoor();}
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function musicState(value){music.setAttribute('aria-pressed',String(value));music.setAttribute('aria-label',value?'Mute music':'Play music');$('.music-label').textContent=value?'Music on':'Music off';}
// Reuse one native media element. This avoids Web Audio/CORS silencing and
// preserves the element unlocked by the envelope tap when its source changes.
function cancelFade(){++transition;cancelAnimationFrame(fadeFrame);}
function fadeVolume(from,to,duration,generation){return new Promise(resolve=>{const start=performance.now();function step(now){if(generation!==transition){resolve(false);return;}const t=Math.min(1,(now-start)/duration);audio.volume=from+(to-from)*(t*t*(3-2*t));if(t<1)fadeFrame=requestAnimationFrame(step);else resolve(true);}fadeFrame=requestAnimationFrame(step);});}
async function switchTrack(key,direct=false){
 if(!enabled||document.hidden)return;
 if(activeTrack===key&&!audio.paused)return;
 cancelFade();const generation=transition;activeTrack=key;
 if(!direct&&!audio.paused&&loadedTrack!==key){const complete=await fadeVolume(audio.volume,0,380,generation);if(!complete||generation!==transition)return;}
 if(generation!==transition||!enabled)return;
 if(loadedTrack!==key){audio.pause();audio.src=sources[key];audio.load();loadedTrack=key;}
 audio.volume=direct ? .6 : 0;
 try{await audio.play();}catch(error){if(generation===transition){stopMusic();notify(error.name==='NotAllowedError'?'Tap Music to start the song.':'Music could not load. Tap Music to try again.');}return;}
 if(generation!==transition)return;
 musicState(true);if(!direct)await fadeVolume(audio.volume,.6,650,generation);
}
function stopMusic(){enabled=false;cancelFade();audio.pause();activeTrack=null;musicState(false);}
function startMusic(){enabled=true;everChosen=true;activeTrack=null;switchTrack(currentScene,true);}
$('#open-envelope').addEventListener('click',()=>{
  if(opened)return;

  opened=true;
  currentScene='intro';

  if(!everChosen){
    startMusic();
  }else if(enabled){
    switchTrack('intro');
  }

  opening.classList.add('open');

  setTimeout(()=>{
    document.body.classList.remove('sealed');
    main.inert=false;
    opening.hidden=true;
    window.scrollTo({top:0,left:0,behavior:'instant'});

    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      observe();
      updateScene();
    }));
  },reduced.matches?30:2600);
});
function fabricMotion(){const a=document.querySelector('#fabric-breeze animate');if(!a)return;const root=a.ownerSVGElement;if(document.body.classList.contains('motion-paused'))root?.pauseAnimations?.();else root?.unpauseAnimations?.();}
fabricMotion();
motion?.addEventListener('click',()=>{const paused=document.body.classList.toggle('motion-paused');motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'Play motion':'Pause motion';fabricMotion();});
const sections=[...document.querySelectorAll('[data-scene]')];
function updateScene(){if(!opened||document.body.classList.contains('sealed'))return;const line=innerHeight*.52;let scene='intro';for(const section of sections)if(section.getBoundingClientRect().top<=line)scene=section.dataset.scene;if(scene!==currentScene){currentScene=scene;if(enabled)switchTrack(scene);}const max=document.documentElement.scrollHeight-innerHeight;$('#scroll-progress').style.width=`${max>0?scrollY/max*100:0}%`;}
let scheduled=false;function onScroll(){checkDoor();if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{updateScene();scheduled=false;});}window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);
function celebrate(){if(document.body.classList.contains('motion-paused'))return;clearTimeout(celebrationTimer);$('.baraat').classList.add('is-celebrating');for(let i=0;i<55;i++){const p=document.createElement('i');p.className='confetti';p.style.setProperty('--left',`${Math.random()*100}%`);p.style.setProperty('--color',['#c69547','#aa5364','#f2c890','#798963'][i%4]);p.style.setProperty('--delay',`${Math.random()*.8}s`);p.addEventListener('animationend',()=>p.remove());document.body.append(p);}celebrationTimer=setTimeout(()=>$('.baraat').classList.remove('is-celebrating'),8000);}
$('#celebrate').addEventListener('click',celebrate);
$('#replay').addEventListener('click',()=>{++transition;cancelAnimationFrame(fadeFrame);audio.pause();audio.currentTime=0;activeTrack=null;opened=false;currentScene='intro';clearTimeout(doorTimer);doorTimer=null;reveal.disconnect();document.querySelectorAll('.scroll-writing').forEach(el=>el.classList.remove('visible','is-writing','writing-done'));document.querySelectorAll('main .reveal').forEach(el=>el.classList.remove('visible'));document.body.classList.add('sealed');main.inert=true;opening.hidden=false;opening.classList.remove('open');window.scrollTo({top:0,left:0,behavior:'instant'});if(enabled)switchTrack('intro');$('#open-envelope').focus({preventScroll:true});});
document.addEventListener('visibilitychange',()=>{if(document.hidden){++transition;cancelAnimationFrame(fadeFrame);audio.pause();activeTrack=null;}else if(enabled)switchTrack(currentScene);});

audio.addEventListener('error',()=>{if(enabled){stopMusic();notify('Music could not load. Tap Music to try again.');}});

// Try audible arrival playback; browser policies may defer it until a gesture.
async function arrivalMusic(){audio.volume=.6;try{await audio.play();enabled=true;activeTrack='intro';musicState(true);}catch(_){autoplayPending=true;}}
function unlockArrival(){if(!autoplayPending||everChosen)return;autoplayPending=false;startMusic();}
document.addEventListener('pointerdown',unlockArrival,{once:true});document.addEventListener('keydown',unlockArrival,{once:true});

// Down arrows always follow document order, so inserted sections cannot be skipped.
for(const cue of document.querySelectorAll('main .scroll-cue')){
 const owner=cue.closest('section');let next=owner?.nextElementSibling;
 while(next&&next.tagName!=='SECTION')next=next.nextElementSibling;
 if(next?.id){cue.setAttribute('href','#'+next.id);cue.setAttribute('aria-label','Continue to the next section');}
}
