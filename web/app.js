/* Growing Futures Maths - browser code shared by everyone, plus the student screens.
   The browser never sees an answer before the server has marked it: it only draws what the server sends. */
(function(){
'use strict';
const app=document.getElementById('app');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const GF=window.GF={esc,actions:{},routes:[],state:{}};
let ME=null,META=null;

/* ---------- talking to the server (a Supabase Edge Function; its address is in config.js) ---------- */
const API=(window.GF_API||'').replace(/\/$/,'');
/* the login is kept for this browser tab only, so closing the tab on a shared device logs you out */
const TOK={get(){try{return sessionStorage.getItem('gf.t')||'';}catch(e){return'';}},set(t){try{t?sessionStorage.setItem('gf.t',t):sessionStorage.removeItem('gf.t');}catch(e){}}};
let lastApi=Date.now();
async function raw(method,url,body){
  lastApi=Date.now();let r;try{r=await fetch(API+url,{method,headers:{'Content-Type':'application/json',...(TOK.get()?{'x-gf-session':TOK.get()}:{})},body:body?JSON.stringify(body):undefined});}
  catch(e){const er=new Error('Cannot reach the server. Check your internet connection and try again.');er.offline=true;throw er;}
  return r;}
async function api(method,url,body){
  const r=await raw(method,url,body);
  let data={};try{data=await r.json();}catch(e){}
  if(data&&data.token)TOK.set(data.token);
  if(r.status===401&&!/^\/api\/(login|setup|recover)$/.test(url)){TOK.set('');ME=null;showLogin(data.error||'Please log in again.');const e=new Error(data.error||'Please log in again.');e.status=401;throw e;}
  if(!r.ok){const e=new Error(data.error||'Something went wrong.');e.status=r.status;throw e;}
  return data;}
/* downloads (CSV, backup) need the login token, so they are fetched and then saved */
async function download(url,fallbackName){const r=await raw('GET',url);if(!r.ok){let d={};try{d=await r.json();}catch(e){}throw new Error(d.error||'Download failed.');}
  const m=/filename="([^"]+)"/.exec(r.headers.get('content-disposition')||''),blob=await r.blob(),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=m?m[1]:fallbackName;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);}
GF.api=api;GF.download=download;

/* ---------- small pieces used everywhere ---------- */
const STATUS={secure:'Secure',checked:'Passed check',mid:'Getting there',low:'Needs work',none:'Not started'};
const pill=(s,set)=>`<span class="pill ${s}">${STATUS[s]}</span>${set?' <span class="pill set">Set by staff</span>':''}`;
const dots=r=>`<span class="dots" role="img" aria-label="${[...(r||'')].filter(x=>x==='1').length} right of the last ${(r||'').length}">${[...Array(10)].map((_,i)=>`<i class="${(r||'')[i]==='1'?'y':(r||'')[i]==='0'?'n':''}"></i>`).join('')}</span>`;
const fmtDate=ts=>ts?new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'Never';
const levelOf=id=>META.levels.find(l=>l.id===id);
const blockName=n=>META.blockNames[n-1];
function plain(h){const d=document.createElement('div');d.innerHTML=String(h).replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g,' $1 over $2 ').replace(/<sup>2<\/sup>/g,' squared ').replace(/<sup>3<\/sup>/g,' cubed ').replace(/<sup>([^<]*)<\/sup>/g,' to the power $1 ').replace(/<svg[\s\S]*?<\/svg>/g,' ').replace(/<br\s*\/?>/g,'. ').replace(/<\/(td|th|li|p)>/g,'. ');return d.textContent.replace(/\s+/g,' ').trim();}
const speakable=t=>plain(t).replace(/×/g,' times ').replace(/÷/g,' divided by ').replace(/−/g,' minus ').replace(/=/g,' equals ').replace(/²/g,' squared').replace(/³/g,' cubed').replace(/π/g,'pi').replace(/½/g,'a half').replace(/¼/g,'a quarter').replace(/¾/g,'three quarters').replace(/°C/g,' degrees Celsius').replace(/°F/g,' degrees Fahrenheit').replace(/°/g,' degrees').replace(/☐|__+/g,' blank ').replace(/£(\d[\d,]*)\.(\d\d)\b/g,'$1 pounds $2').replace(/\s+/g,' ').trim();
Object.assign(GF,{pill,dots,fmtDate,STATUS,plain});

/* ---------- reading aloud (the browser's own voice; nothing is sent anywhere) ---------- */
const synth=window.speechSynthesis||null;
let soundOn=true;try{soundOn=localStorage.getItem('gf.sound')!=='off';}catch(e){}
function voice(){if(!synth)return null;const v=synth.getVoices();return v.find(x=>x.lang==='en-GB'&&/female|libby|sonia|kate|serena|google uk/i.test(x.name))||v.find(x=>x.lang==='en-GB')||v.find(x=>x.lang&&x.lang.startsWith('en'))||null;}
/* how long a person needs to read a slide without a voice */
const readTime=text=>1800+String(text).length*60;
/* Some devices have speech switched on but no voice installed: the browser then "finishes" speaking at once and
   lessons flash past. If speaking ends far too quickly, wait for the normal reading time instead. */
let voiceBroken=false;
function say(text,onend){
  if(!synth||voiceBroken){if(onend)setTimeout(onend,readTime(text));return;}
  synth.cancel();const u=new SpeechSynthesisUtterance(text);const v=voice();if(v)u.voice=v;u.lang='en-GB';u.rate=0.92;
  const start=Date.now(),need=Math.min(readTime(text),String(text).length*35);let done=false;
  const fin=()=>{if(done)return;done=true;clearTimeout(guard);const took=Date.now()-start;
    if(String(text).length>20&&took<need*0.25){voiceBroken=true;if(onend)setTimeout(onend,Math.max(0,readTime(text)-took));return;}
    if(onend)onend();};
  const guard=setTimeout(fin,readTime(text)*3+4000); // speech that never ends does not stop the lesson either
  u.onend=fin;u.onerror=fin;synth.speak(u);}
function hush(){if(synth)synth.cancel();}
GF.hush=hush;

/* ---------- the step-by-step player: lessons and worked examples play like a short video ---------- */
let player=null;
function makePlayer(el,slides,opts){
  hush();if(player)clearTimeout(player.timer);
  const p=player={el,slides,i:0,playing:false,timer:0,token:0,opts:opts||{}};
  p.draw=()=>{const s=slides[p.i],n=slides.length;if(!document.body.contains(el))return;
    el.innerHTML=`<div class="screen" aria-live="polite"><p class="h">${s.h}</p><div class="b">${s.b}</div></div><div class="prog"><i style="width:${(p.i+1)/n*100}%"></i></div>
     <div class="row"><button class="btn" data-act="pl-prev" ${p.i===0?'disabled':''}>Back</button><button class="btn primary" data-act="pl-play">${p.playing?'❚❚ Pause':p.i===n-1?'↻ Replay':'▶ Play'}</button><button class="btn" data-act="pl-next" ${p.i===n-1?'disabled':''}>Next</button>
     <button class="btn" data-act="pl-sound" aria-pressed="${soundOn}">${soundOn?'🔊 Voice on':'🔇 Voice off'}</button><span class="muted">${p.i+1} of ${n}</span></div>${voiceBroken&&soundOn?'<p class="muted">This device has no voice installed, so the steps move on by themselves at reading speed.</p>':''}`;};
  p.stop=()=>{p.playing=false;p.token++;clearTimeout(p.timer);hush();};
  p.step=()=>{const tok=++p.token,s=slides[p.i],text=speakable(s.say||s.b);
    const next=()=>{if(tok!==p.token||!p.playing)return;if(p.i<slides.length-1){p.i++;p.draw();p.timer=setTimeout(p.step,350);}else{p.playing=false;p.draw();if(p.opts.onEnd)p.opts.onEnd();}};
    if(soundOn&&synth&&!voiceBroken)say(text,()=>{p.timer=setTimeout(next,500);});else p.timer=setTimeout(next,readTime(text));};
  p.play=()=>{if(p.playing){p.stop();p.draw();return;}if(p.i===slides.length-1)p.i=0;p.playing=true;p.draw();p.step();};
  p.go=d=>{p.stop();p.i=Math.max(0,Math.min(slides.length-1,p.i+d));p.draw();if(p.i===slides.length-1&&p.opts.onEnd)p.opts.onEnd();};
  p.draw();return p;}
function lessonSlides(l){const s=[{h:'The idea',b:esc(l.idea)}];
  l.steps.forEach((x,i)=>s.push({h:`How to do it · step ${i+1} of ${l.steps.length}`,b:esc(x)}));
  s.push({h:'Worked example',b:`<b>${esc(l.ex.q)}</b>`,say:'Worked example. '+l.ex.q});
  l.ex.w.forEach((x,i)=>s.push({h:`Worked example · line ${i+1} of ${l.ex.w.length}`,b:`<span class="old">${esc(l.ex.q)}</span><br>${l.ex.w.map((w,k)=>k<i?`<span class="old">${esc(w)}</span>`:k===i?`<span class="cur">${esc(w)}</span>`:'').filter(Boolean).join('<br>')}`,say:x}));
  s.push({h:'Watch out',b:esc(l.trap),say:'Watch out. '+l.trap});return s;}
function solutionSlides(q,sol){const n=sol.steps.length,s=[{h:'The question',b:q.text,say:q.say}];
  sol.steps.forEach((x,i)=>s.push({h:`Step ${i+1} of ${n}`,b:sol.steps.map((w,k)=>k<i?`<span class="old">${w}</span>`:k===i?`<span class="cur">${w}</span>`:'').filter(Boolean).join('<br>'),say:x}));
  s.push({h:'The answer',b:`<b>${sol.answer}</b>`,say:'The answer is '+plain(String(sol.answer))});return s;}
GF.makePlayer=makePlayer;GF.solutionSlides=solutionSlides;GF.lessonSlides=lessonSlides;

/* ---------- drawing a question ---------- */
function answerUI(q,o){
  if(q.kind==='choice'){const figs=/<svg/.test(q.opts[0]),short=q.opts.every(x=>String(x).length<=4);
    return`<div class="opts${figs?(/viewBox="0 0 3\d\d /.test(q.opts[0])?' figs one':' figs'):short?' short':''}">${q.opts.map((x,i)=>`<button class="opt${o.right===i?' right':''}${(o.wrongs||[]).includes(i)?' wrong':''}${o.sel===i?' sel':''}" data-act="${o.act}" data-i="${i}"${figs?` aria-label="Option ${i+1}"`:''} ${o.disabled||(o.wrongs||[]).includes(i)?'disabled':''}>${x}</button>`).join('')}</div>`;}
  const ph={frac:'like 3/4',ratio:'like 3:5',coord:'like (2, -3)'}[q.kind]||'';
  return`<div class="ans"><label for="ans">Your answer</label><div class="ans-row">${q.pre?`<span class="unit">${q.pre}</span>`:''}<input id="ans" type="text" inputmode="${q.kind==='num'?'decimal':'text'}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${ph}" value="${esc(o.value||'')}" ${o.disabled?'disabled':''}>${q.suf?`<span class="unit">${q.suf}</span>`:''}</div></div>`;}
function qHTML(q,o){o=o||{};return`<div class="q-meta">${o.tag||''}<span class="badge ${o.calc?'calc':'nocalc'}">${o.calc?'Calculator allowed':'No calculator'}</span><button class="btn small" data-act="read-q">🔊 Read it to me</button></div>
  <div class="q-text" id="qtext">${q.text}</div>${q.fig?`<div class="fig">${q.fig}</div>`:''}`;}
const shownAnswer=(q,g)=>g==null||g===''?'No answer':q.kind==='choice'?q.opts[g]:esc((q.pre||'')+g+(q.suf?' '+q.suf:''));
Object.assign(GF,{answerUI,qHTML,shownAnswer});

/* ---------- page frame, branding, routing ---------- */
function applyBrand(b){const st=document.documentElement.style,hex=b.primary.replace('#',''),lum=[0,2,4].map(i=>parseInt(hex.substr(i,2),16)/255).map(c=>c<=.03928?c/12.92:((c+.055)/1.055)**2.4);
  st.setProperty('--brand',b.primary);st.setProperty('--accent',b.accent);st.setProperty('--brand-ink',(.2126*lum[0]+.7152*lum[1]+.0722*lum[2])>.45?'#17231f':'#ffffff');document.title=`${b.name} ${b.product}`;}
const logoHTML=()=>{const b=META.brand;return`<a class="logo" href="#home">${b.logo?`<img src="${b.logo}" alt="">`:''}<span>${esc(b.name)}<small><b>${esc(b.product)}</b></small></span></a>`;};
/* text size: three steps, remembered on this device */
let textSize=0;try{textSize=+localStorage.getItem('gf.ts')||0;}catch(e){}
const applyTextSize=()=>{document.documentElement.classList.remove('ts-1','ts-2');if(textSize)document.documentElement.classList.add('ts-'+textSize);};applyTextSize();
function frame(nav,inner,wide){
  return`<header class="top noprint"><div class="wrap ${wide?'wide':''}">${logoHTML()}<span class="sp"></span><span class="who">${esc(ME.name)}</span><button class="btn" data-act="text-size" aria-label="Change text size">${['A','A+','A++'][textSize]}</button><a class="btn" href="#account">Account</a><button class="btn" data-act="logout">Log out</button></div></header>
  <nav class="nav noprint" aria-label="Sections"><div class="wrap ${wide?'wide':''}">${nav.map(([h,l,on])=>`<a href="#${h}" ${on?'aria-current="page"':''}>${l}</a>`).join('')}</div></nav>
  <main class="wrap ${wide?'wide':''}" id="view">${inner}</main><div id="tools"></div>`;}
GF.frame=frame;
const studentNav=cur=>[['home','Home',cur==='home'],['topics','All topics',cur==='topics'],['practice','Practice',cur==='practice'],['notes','My notes',cur==='notes']];
function setView(html,cur){const wide=ME.role==='admin';app.innerHTML=frame(ME.role==='admin'?GF.adminNav(cur):studentNav(cur),html,wide);window.scrollTo(0,0);}
GF.setView=setView;
const busy=()=>'<p class="muted">Loading…</p>';
const fail=e=>`<p class="err">${esc(e.message)}</p>`;
GF.fail=fail;

async function boot(){
  try{META=await api('GET','/api/me');}catch(e){if(e.status!==401)app.innerHTML=`<div class="login"><div class="card">${fail(e)}<p class="muted">If this keeps happening, the platform may not be set up yet. See the README.</p></div></div>`;return;}
  GF.meta=META;applyBrand(META.brand);ME=META.user;GF.me=ME;if(!ME)return showLogin();startIdle();route();}
let loginMode='login';
function showLogin(msg){hush();closeTools();stopIdle();clearInterval(GF.state.tick);const setup=META&&META.setup,b=META?META.brand:{name:'',product:''},mode=setup?'setup':loginMode;
  const code=(setup&&META.setupNeedsCode)||mode==='recover';
  app.innerHTML=`<div class="login"><div class="card"><div>${b.logo?`<img src="${b.logo}" alt="" style="max-height:70px">`:''}<h1>${esc(b.name)}</h1><p class="eyebrow">${esc(b.product)}</p></div>
   ${mode==='setup'?'<p><b>First-time setup.</b> Create the first staff account. Staff accounts can add students and see their progress.</p>':''}
   ${mode==='recover'?'<p><b>Staff password recovery.</b> Enter the setup code (whoever set up Supabase has it), your username and a new password.</p>':''}
   <form id="loginform" class="stack">${mode==='setup'?'<label>Your name<input id="lf-name" autocomplete="name" required></label>':''}
   ${code?'<label>Setup code<input id="lf-code" autocomplete="off" autocapitalize="off" spellcheck="false" required></label>':''}
   <label>Username<input id="lf-user" autocomplete="username" autocapitalize="off" spellcheck="false" required></label>
   <label>${mode==='recover'?'New password':'Password'}<input id="lf-pass" type="password" autocomplete="${mode==='login'?'current-password':'new-password'}" required></label>
   <div id="lf-msg">${msg?`<p class="err">${esc(msg)}</p>`:''}</div>
   <button class="btn primary" type="submit">${{setup:'Create staff account',recover:'Set new password',login:'Log in'}[mode]}</button></form>
   ${mode==='login'?`<p class="muted">Forgotten your password? Ask a member of staff to reset it.${META&&META.canRecover?' <button class="link" data-act="login-mode" data-m="recover">Staff: forgotten password</button>':''}</p>`:''}
   ${mode==='recover'?'<button class="link" data-act="login-mode" data-m="login">Back to log in</button>':''}
   ${mode==='setup'?'<p class="muted">Use at least 8 characters for the password.</p>':''}
   <button class="link" data-act="privacy">How we use your information</button><div id="privacy"></div></div></div>`;
  const f=document.getElementById('lf-'+(mode==='setup'?'name':code?'code':'user'));if(f)f.focus();}
document.addEventListener('submit',async e=>{
  if(e.target.id==='loginform'){e.preventDefault();const mode=META.setup?'setup':loginMode,msg=document.getElementById('lf-msg'),v=id=>{const el=document.getElementById(id);return el?el.value:'';},btn=e.target.querySelector('button[type=submit]');
    if(btn.disabled)return;btn.disabled=true;
    try{if(mode==='setup')await api('POST','/api/setup',{name:v('lf-name'),username:v('lf-user'),password:v('lf-pass'),code:v('lf-code')});
      else if(mode==='recover'){await api('POST','/api/recover',{code:v('lf-code'),username:v('lf-user'),password:v('lf-pass')});loginMode='login';showLogin();document.getElementById('lf-msg').innerHTML='<p class="okmsg">Password changed. Log in with your new password.</p>';return;}
      else await api('POST','/api/login',{username:v('lf-user'),password:v('lf-pass')});
      /* after logging in again, go back to where you were (for example the middle of a quiz) */
      if(!location.hash)location.hash='#home';await boot();}catch(err){msg.innerHTML=fail(err);btn.disabled=false;}}
  else if(GF.onSubmit&&GF.onSubmit(e)){}
});
/* 1.11: log out after a set time with nothing happening (staff choose the time in Settings) */
let idleTimer=0,idleAt=0;
function stopIdle(){clearTimeout(idleTimer);idleTimer=0;}
function startIdle(){stopIdle();const mins=META&&META.options&&META.options.idleMinutes;if(!mins||!ME)return;idleAt=Date.now()+mins*60e3;idleTimer=setTimeout(idleOut,mins*60e3);}
function poke(){if(!idleTimer||Date.now()<idleAt-(META.options.idleMinutes*60e3-15e3))return;startIdle();
  if(Date.now()-lastApi>4*60e3)api('GET','/api/me').catch(()=>{});} // tells the server the student is still here (reading a lesson, say)
/* forget the page address quietly (a quiz is kept, so the same student can carry on after logging back in) */
const clearHash=keepQuiz=>{if(keepQuiz&&/^#quiz-\d+$/.test(location.hash))return;history.replaceState(null,'',location.pathname+location.search);};
async function idleOut(){if(!ME)return;try{await api('POST','/api/logout');}catch(e){}TOK.set('');ME=null;HOME=null;Q=null;clearHash(true);showLogin('You were logged out because nothing happened for a while.');}
['pointerdown','keydown','scroll','touchstart'].forEach(ev=>document.addEventListener(ev,poke,{passive:true}));

const routes=[];const R=(re,role,fn)=>routes.push({re,role,fn});GF.route=R;
async function route(){if(!ME)return showLogin();hush();if(player)player.stop();closeTools();
  let h=(location.hash||'').replace(/^#/,'')||'home';
  for(const r of routes){const m=r.re.exec(h);if(m&&(r.role==='any'||r.role===ME.role)){try{await r.fn(m);}catch(e){if(ME)setView(fail(e),'');}return;}}
  if(h!=='home'){location.hash='#home';return;}
  setView('<p class="err">Page not found.</p>','');}
window.addEventListener('hashchange',route);

/* ================= student screens ================= */
let HOME=null;
R(/^home$/,'student',async()=>{
  setView(busy(),'home');HOME=await api('GET','/api/home');const d=HOME,lv=levelOf(ME.level),blk=d.user.block;ME.block=blk;
  const byId=Object.fromEntries(d.topics.map(t=>[t.id,t])),cu=d.catchup.map(id=>byId[id]);
  const row=t=>`<a class="trow" href="#t-${t.id}"><span class="sess">${t.s}</span><span class="tname">${esc(t.title)}</span>${pill(t.status,t.assigned)}</a>`;
  const cur=blk===6?d.topics.filter(t=>t.status!=='secure'&&t.status!=='checked').sort((a,b)=>(a.mastery||0)-(b.mastery||0)).slice(0,8):d.topics.filter(t=>t.b===blk);
  const todo=d.quizzes.filter(q=>q.state!=='done'),done=d.quizzes.filter(q=>q.state==='done');
  setView(`<h1>Hello, ${esc(ME.name.split(' ')[0])}</h1>
   <section class="ready"><p class="ready-num">${d.readiness}<span>%</span></p><div class="ready-side"><p class="eyebrow">${esc(lv.name)} · how ready you are</p><div class="meter"><i style="width:${d.readiness}%"></i></div>
     <p class="muted">${d.topics.filter(t=>t.status==='secure'||t.status==='checked').length} of ${d.topics.length} topics secure · ${d.answered} questions answered · ${d.days} day${d.days===1?'':'s'} of practice</p></div></section>
   ${todo.length?`<section><h2>Quizzes to do</h2><div class="tlist">${todo.map(q=>`<a class="trow" href="#quiz-${q.id}"><span class="tname">${esc(q.title)}<br><span class="muted">${q.n} questions${q.minutes?` · ${q.minutes} minutes`:''}</span></span><span class="pill set">${q.state==='started'?'Carry on':'Start'}</span></a>`).join('')}</div></section>`:''}
   <section><div class="blockhead"><h2>${blk===6?'Getting ready for the exam':`This half term: ${esc(lv.blocks[blk-1].title)}`}</h2><span class="now">${blockName(blk)}</span></div>
     <p class="muted">${blk===6?'These are the topics that will help you most right now.':esc(lv.blocks[blk-1].aim)}</p>
     <div class="tlist">${cur.map(row).join('')||'<p class="trow">Everything is secure. Try a mixed practice.</p>'}</div>
     <div class="row"><a class="btn primary" href="#practice">Mixed practice</a><a class="btn" href="#topics">See all topics</a></div></section>
   ${cu.length?`<section><h2>Catch up</h2><p class="muted">${cu.length} topic${cu.length===1?'':'s'} from earlier in the year ${cu.length===1?'is':'are'} not secure yet. You only need to do these ones, not everything.</p>
     <div class="tlist">${cu.slice(0,8).map(row).join('')}</div>${cu.length>8?`<p class="muted">and ${cu.length-8} more.</p>`:''}<div class="row"><a class="btn primary" href="#catchup">Practise my catch-up topics</a></div></section>`:''}
   ${done.length?`<section><h2>Finished quizzes</h2><ul class="mlist card">${done.map(q=>`<li><a href="#quiz-${q.id}">${esc(q.title)}</a><b>${q.score}/${q.total}</b></li>`).join('')}</ul></section>`:''}`,'home');});

R(/^topics$/,'student',async()=>{
  setView(busy(),'topics');const d=HOME=await api('GET','/api/home'),lv=levelOf(ME.level);
  setView(`<h1>${esc(lv.name)}: all topics</h1><p class="muted">A topic turns "Secure" when you get 8 of your last 10 questions right first time.</p>`+
   lv.blocks.slice(0,5).map(b=>`<section><div class="blockhead"><h2>${esc(b.title)}</h2>${b.n===d.user.block?'<span class="now">Now</span>':`<span class="muted">${blockName(b.n)}</span>`}</div>
    <div class="tlist">${d.topics.filter(t=>t.b===b.n).map(t=>`<a class="trow" href="#t-${t.id}"><span class="sess">${t.s}</span><span class="tname">${esc(t.title)}</span>${pill(t.status,t.assigned)}</a>`).join('')}</div></section>`).join(''),'topics');});

/* ----- practice state ----- */
let P=null,TOPIC=null;
const practiceCard=()=>`<section class="card" id="qbox"></section><section class="card" id="exbox" hidden></section>`;
async function newQ(){hush();const d=await api('POST','/api/q/new',P.topic?{topic:P.topic}:{mode:P.mode});
  /* a question left unanswered comes back (so reloading cannot skip it), with its hint if one go has been used */
  Object.assign(P,{qid:d.qid,q:d.q,tries:d.tries||0,state:'ask',raw:'',wrongs:[],hint:d.hint||'',msg:d.resumed?(d.tries?'You have one more go at this question.':'Here is the question you had not finished.'):'',kind:d.resumed?'note':'',solution:null});
  if(!d.resumed||P.lastQid!==d.qid)clearBoard();P.lastQid=d.qid;setCalc(d.q.calc);drawQ(true);}
const NUDGE={money:'Right amount. Write money with two numbers after the point, like £6.10.',fraction:'That is the right value. Now write it as a fraction, like 3/4.',simplest:'That has the right value, but it is not in its simplest form yet.',ratio:'Right idea, but it can be made simpler. Divide both sides again.'};
function drawQ(focus){const el=document.getElementById('qbox');if(!el||!P||!P.q)return;const q=P.q,done=P.state==='done',sol=P.solution;
  let h=`<div class="row between"><h2>${P.topic?'Practise it':'Question'}</h2><span class="muted">This session: ${P.session.c} of ${P.session.n} right first time</span></div>`
   +qHTML(q,{calc:q.calc,tag:P.topic?'':`<a class="pill none" href="#t-${q.t}">${esc(q.title)}</a>`})
   +answerUI(q,{disabled:done,value:P.raw,right:done&&sol?sol.right:undefined,wrongs:P.wrongs,act:'opt'});
  if(P.msg)h+=`<p class="fb ${P.kind}" role="status">${P.msg}</p>`;
  if(P.hint&&!done)h+=`<p class="hint"><b>Hint.</b> ${P.hint}</p>`;
  if(!done)h+=`<div class="row">${q.kind==='choice'?'':'<button class="btn primary" data-act="check">Check</button>'}<button class="btn" data-act="hint" ${P.hint?'disabled':''}>Hint</button><button class="btn" data-act="show">Show me how</button></div>`;
  else h+=`<div class="sol"><p>Answer: <b>${sol.answer}</b></p><ol class="steps">${sol.steps.map(s=>`<li>${s}</li>`).join('')}</ol>
     <div class="help"><p class="muted">${P.result==='ok'?'Want to see it again?':'Still stuck? Watch it, then try one like it.'}</p><div class="row"><button class="btn" data-act="watch">▶ Watch how to do it</button><button class="btn" data-act="example">▶ Watch another example</button>${P.topic?'<button class="btn" data-act="relearn">Back to the lesson</button>':`<a class="btn" href="#t-${q.t}">Open the lesson</a>`}</div></div></div>
     <div class="row"><button class="btn primary" data-act="next">Next question</button></div>`;
  el.innerHTML=h;if(focus){const i=el.querySelector('#ans');if(i)i.focus({preventScroll:true});}}
async function submit(answer){if(!P||P.state!=='ask'||P.busy)return;P.busy=true;
  try{const r=await api('POST','/api/q/answer',{qid:P.qid,answer});
    if(r.result==='empty'){P.msg=String(answer==null?'':answer).trim()?({coord:'Type both numbers, like (2, -3).',ratio:'Type a ratio, like 3:5.',frac:'Type a number or a fraction, like 3/4.'}[P.q.kind]||'Type a number, like 12.5.'):'Type your answer first.';P.kind='note';}
    else if(r.result==='nudge'){P.msg=NUDGE[r.why]||NUDGE.simplest;P.kind='note';}
    else{P.tries++;if(r.done){P.state='done';P.result=r.result;P.solution=r.solution;P.session.n++;if(r.first)P.session.c++;
        if(r.result==='ok'){P.msg=r.first?'Correct.':'Correct on the second go. It counts towards "Secure" when you get it right first time.';P.kind='good';}
        else{P.msg='Not this time. Here is how to do it.';P.kind='bad';if(P.q.kind==='choice')P.wrongs.push(answer);}}
      else{P.msg='Not quite. Read the hint and have another go.';P.kind='bad';P.hint=r.hint;if(P.q.kind==='choice')P.wrongs.push(answer);}}
  }catch(e){P.msg=esc(e.message);P.kind='bad';}
  P.busy=false;drawQ(P.state==='ask'&&P.q.kind!=='choice');}
function showExample(q,sol,title){const el=document.getElementById('exbox');if(!el)return;el.hidden=false;
  el.innerHTML=`<div class="row between"><h2>${title}</h2><button class="link" data-act="ex-close">Close</button></div>${q.fig?`<div class="fig">${q.fig}</div>`:''}<div class="player" id="explayer"></div>`;
  makePlayer(document.getElementById('explayer'),solutionSlides(q,sol)).play();el.scrollIntoView({block:'start',behavior:'smooth'});}

R(/^t-([a-z0-9-]+)$/,'student',async m=>{
  setView(busy(),'topics');const t=TOPIC=await api('GET','/api/topic/'+m[1]),lv=levelOf(ME.level);
  setView(`<a class="back" href="#topics">← All topics</a>
   <header class="stack"><div class="row"><span class="pill none">${esc(lv.short)} · ${blockName(t.b)} · session ${t.s}</span>${pill(t.status,t.assigned)} ${dots(t.recent)}</div><h1>${esc(t.title)}</h1><button class="link skip" data-act="skip-practice">Skip to the questions ↓</button></header>
   <section class="card" id="lesson"><div class="row between"><h2>Learn it</h2><button class="link" data-act="lesson-all">Show the whole lesson</button></div><div class="player" id="lplayer"></div><div class="full" id="lfull" hidden></div>
     ${t.video?`<h3>Video</h3><div class="video"><iframe src="${esc(t.video)}" title="Video for ${esc(t.title)}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`:''}
     ${META.options&&META.options.youtubeSearch?`<a class="link" href="https://www.youtube.com/results?search_query=${encodeURIComponent('functional skills maths '+lv.name+' '+t.vq)}" target="_blank" rel="noopener">Find more videos on YouTube ↗</a>`:''}</section>
   ${practiceCard()}`,'topics');
  const l=t.lesson;document.getElementById('lfull').innerHTML=`<p>${esc(l.idea)}</p><h3>How to do it</h3><ol>${l.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><h3>Worked example</h3><p><b>${esc(l.ex.q)}</b></p><ul>${l.ex.w.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="trap"><b>Watch out.</b> ${esc(l.trap)}</p>`;
  makePlayer(document.getElementById('lplayer'),lessonSlides(l),{onEnd:()=>api('POST','/api/lesson-done',{topic:t.id}).catch(()=>{})});
  P={topic:t.id,session:{n:0,c:0}};openTools(t.id);await newQ();});
async function mixed(mode,title,blurb,cur){setView(`<h1>${title}</h1><p class="muted">${blurb}</p>${practiceCard()}`,cur);TOPIC=null;P={mode,session:{n:0,c:0}};openTools('');await newQ();}
R(/^practice$/,'student',()=>mixed('mixed','Mixed practice','Questions from everything you have covered so far, with more from the topics you find hard.','practice'));
R(/^catchup$/,'student',()=>mixed('catchup','Catch-up practice','Questions from your catch-up topics only.','practice'));

/* ----- quizzes ----- */
let Q=null;
R(/^quiz-(\d+)$/,'student',async m=>{
  setView(busy(),'home');const id=+m[1];if(!HOME)HOME=await api('GET','/api/home');
  const info=HOME.quizzes.find(q=>q.id===id);if(!info)throw new Error('That quiz is not set for you.');
  if(info.state==='new'){setView(`<a class="back" href="#home">← Home</a><h1>${esc(info.title)}</h1><section class="card"><ul class="full"><li>${info.n} questions${info.minutes?` in ${info.minutes} minutes. The clock starts when you press Start.`:', with no time limit.'}</li>
     ${info.sections?'<li>Section A is without a calculator. Section B allows one.</li>':''}<li>There are no hints. You see your score and every method at the end.</li><li>You can use the whiteboard for working out.</li></ul><div class="row"><button class="btn primary" data-act="quiz-start" data-id="${id}">Start</button></div></section>`,'home');return;}
  await startQuiz(id);});
async function startQuiz(id){const d=await api('POST','/api/quiz/'+id+'/start');HOME=null;
  if(d.done)return showReview(d.review,'#home');
  /* the clock follows the server's time, so a wrong clock on the device does not change the time limit */
  Q={id,title:d.title,qs:d.questions,ans:d.questions.map((_,i)=>d.answers[i]==null?null:d.answers[i]),i:0,endsAt:d.endsAt?d.endsAt-((d.serverNow||Date.now())-Date.now()):null,sections:d.sections,confirm:false,dirty:0,saveFail:false};
  setView(`<h1>${esc(Q.title)}</h1><div id="savebanner"></div><section class="card" id="quizbox"></section>`,'home');openTools('');clearBoard();drawQuiz(true);
  clearInterval(GF.state.tick);GF.state.tick=setInterval(()=>{if(!Q||!Q.endsAt){return;}const el=document.getElementById('timer'),left=Q.endsAt-Date.now();if(el)el.textContent=mmss(left);if(left<=0)finishQuiz();},1000);}
function saveBanner(){const el=document.getElementById('savebanner');if(el)el.innerHTML=Q&&Q.saveFail?'<p class="banner" role="alert">Your answers are not being saved: the connection has dropped. Keep going. They will be saved as soon as the connection is back. Do not close this page.</p>':'';}
const mmss=ms=>{const s=Math.max(0,Math.round(ms/1000));return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
const qCalc=q=>Q.sections?q.sec==='B':q.calc;
function drawQuiz(focus){const el=document.getElementById('quizbox');if(!el||!Q)return;const q=Q.qs[Q.i],n=Q.qs.length,un=Q.ans.filter(a=>a==null||a==='').length;setCalc(qCalc(q));
  el.innerHTML=`<div class="row between"><span class="muted">Question ${Q.i+1} of ${n}${Q.sections?` · Section ${q.sec}`:''}</span>${Q.endsAt?`<span class="timer" id="timer" aria-label="Time left">${mmss(Q.endsAt-Date.now())}</span>`:''}</div>`
   +qHTML(q,{calc:qCalc(q)})+answerUI(q,{value:Q.ans[Q.i]==null?'':Q.ans[Q.i],sel:Q.ans[Q.i],act:'qz-opt'})
   +`<div class="row"><button class="btn" data-act="qz-prev" ${Q.i===0?'disabled':''}>Back</button>${Q.i<n-1?'<button class="btn primary" data-act="qz-next">Next</button>':'<button class="btn primary" data-act="qz-finish">Finish and mark</button>'}</div>
   <div class="qnav" aria-label="Jump to a question">${Q.qs.map((_,i)=>`<button class="${Q.ans[i]==null||Q.ans[i]===''?'':'done'}${i===Q.i?' cur':''}" data-act="qz-jump" data-i="${i}" aria-label="Question ${i+1}">${i+1}</button>`).join('')}</div>`
   +(Q.confirm?`<p class="fb note">${un?`You have ${un} question${un>1?'s':''} with no answer. `:''}Finish and mark now?</p><div class="row"><button class="btn primary" data-act="qz-yes">Yes, mark it</button><button class="btn" data-act="qz-no">Keep going</button></div>`:(Q.i<n-1?'<button class="link" data-act="qz-finish">Finish and mark now</button>':''));
  if(focus){const i=el.querySelector('#ans');if(i)i.focus({preventScroll:true});}}
/* 2.12: autosave tells the student when it fails, and keeps trying */
function saveQuiz(delay){if(!Q)return;clearTimeout(Q.dirty);const myQ=Q;Q.dirty=setTimeout(async()=>{if(Q!==myQ)return;
  try{await api('POST','/api/quiz/'+myQ.id+'/save',{answers:myQ.ans});if(myQ.saveFail){myQ.saveFail=false;saveBanner();}}
  catch(e){if(Q!==myQ)return;if(e.status===409){finishQuiz(true);return;}if(e.status===401)return;myQ.saveFail=true;saveBanner();saveQuiz(5000);}},delay==null?1500:delay);}
async function finishQuiz(timeUp){if(!Q||Q.sending)return;Q.sending=true;clearInterval(GF.state.tick);clearTimeout(Q.dirty);const id=Q.id,answers=Q.ans;
  try{const d=await api('POST','/api/quiz/'+id+'/finish',{answers});Q=null;showReview(d.review,'#home',timeUp===true||d.late);}
  catch(e){if(Q){Q.sending=false;if(Q.endsAt)GF.state.tick=setInterval(()=>{if(Q&&Q.endsAt-Date.now()<=0)finishQuiz();},5000);}const el=document.getElementById('quizbox');
    if(el)el.insertAdjacentHTML('afterbegin',fail(e.offline?new Error('Your quiz could not be sent because the connection has dropped. Your answers are still on this page. Press "Finish and mark" again when the connection is back.'):e));}}
function reviewHTML(rv){const pc=Math.round(rv.score/rv.total*100);
  return`<section class="ready"><p class="ready-num">${rv.score}<span>/${rv.total}</span></p><div class="ready-side"><p class="eyebrow">Score</p><div class="meter"><i style="width:${pc}%"></i></div><p><b>${pc}%</b>${rv.kind==='check'?' · This check decides which earlier topics go on the catch-up list.':''}</p></div></section>
   <section><h2>Every question</h2>${rv.items.map((it,i)=>`<details class="rev${it.ok?' ok':''}"><summary>Q${i+1} · ${esc(it.q.title)} · ${it.ok?'Right':'Wrong'}</summary><div class="stack"><div class="q-text">${it.q.text}</div>${it.q.fig?`<div class="fig">${it.q.fig}</div>`:''}<p>Answer given: <b>${shownAnswer(it.q,it.given)}</b></p><p>Correct answer: <b>${it.solution.answer}</b></p><ol class="steps">${it.solution.steps.map(s=>`<li>${s}</li>`).join('')}</ol><div class="row noprint"><button class="btn small" data-act="rv-watch" data-i="${i}">▶ Watch how to do it</button></div><div class="player" id="rvp-${i}"></div></div></details>`).join('')}</section>`;}
GF.reviewHTML=reviewHTML;
function showReview(rv,back,timeUp){closeTools();GF.state.review=rv;setView(`<a class="back noprint" href="${back}">← Back</a><h1>${esc(rv.title)}</h1>${timeUp?'<p class="fb note">Time is up. Your quiz was marked with the answers you had given.</p>':''}${reviewHTML(rv)}`,'home');}

/* ----- notes ----- */
R(/^notes$/,'student',async()=>{setView(busy(),'notes');const d=await api('GET','/api/notes');
  setView(`<h1>My notes</h1><p class="muted">Notes and whiteboard drawings you save are kept here. Staff can see them too.</p>
   <section class="card"><label>Add a note<textarea id="newnote" maxlength="4000" placeholder="Write something you want to remember"></textarea></label><div class="row"><button class="btn primary" data-act="note-add">Save note</button><span id="notemsg" class="muted"></span></div></section>
   <section class="notes-grid">${d.notes.map(n=>`<div class="noteitem"><p class="eyebrow">${esc(n.title)} · ${fmtDate(n.ts)}</p>${n.context?`<p class="muted">${esc(n.context)}</p>`:''}${n.image?`<img src="${n.image}" alt="Whiteboard drawing">`:''}${n.text?`<p>${esc(n.text)}</p>`:''}<button class="link" data-act="note-del" data-id="${n.id}">Delete</button></div>`).join('')||'<p class="muted">Nothing saved yet. Use the Whiteboard or Notes buttons while you work.</p>'}</section>`,'notes');});
R(/^account$/,'any',()=>{setView(`<h1>Account</h1><section class="card"><h2>Change my password</h2><form id="pwform" class="form"><label>Current password<input id="pw-cur" type="password" autocomplete="current-password" required></label><label>New password<input id="pw-new" type="password" autocomplete="new-password" required></label><button class="btn primary" type="submit">Change password</button></form><div id="pwmsg"></div><p class="muted">Logged in as <b>${esc(ME.username)}</b>.</p></section>`,'');});
GF.onSubmit=e=>{if(e.target.id==='pwform'){e.preventDefault();const m=document.getElementById('pwmsg');api('POST','/api/password',{current:document.getElementById('pw-cur').value,next:document.getElementById('pw-new').value}).then(()=>{m.innerHTML='<p class="okmsg">Password changed.</p>';e.target.reset();}).catch(er=>{m.innerHTML=fail(er);});return true;}
  return GF.adminSubmit?GF.adminSubmit(e):false;};

/* ================= tools: calculator, whiteboard, notes ================= */
const T={open:null,min:false,calc:false,topic:'',expr:'',res:'0',ans:0,strokes:[],color:'#17231f',size:3,note:'',on:false};
function openTools(topic){T.on=true;T.topic=topic||'';drawTools();}
function closeTools(){T.on=false;T.open=null;document.body.classList.remove('tools-open');const el=document.getElementById('tools');if(el)el.innerHTML='';}
/* 2.14: a new question gets a clean whiteboard (save it to your notes first if you want to keep it) */
function clearBoard(){T.strokes=[];if(T.paint)T.paint();const m=document.getElementById('wbmsg');if(m)m.textContent='';}
/* what a saved note was for, so staff can see the question it belongs to */
function noteContext(){if(Q&&document.getElementById('quizbox'))return`Quiz: ${Q.title} · question ${Q.i+1}`;if(P&&P.q)return`${P.topic?'Practice':'Mixed practice'}: ${GF.plain(P.q.text).slice(0,140)}`;return'';}
function setCalc(ok){T.calc=!!ok;if(!ok&&T.open==='calc')T.open=null;drawTools();}
function drawTools(){const el=document.getElementById('tools');if(!el||!T.on)return;
  let panel='';document.body.classList.toggle('tools-open',!!T.open&&!T.min);
  const head=(name,t)=>`<h3>${name} <span class="row"><button class="link" data-act="tool-min">${T.min?'Show':'Hide'}</button><button class="link" data-act="tool" data-t="${t}">Close</button></span></h3>`;
  if(T.open==='calc')panel=`<div class="panel${T.min?' min':''}" role="dialog" aria-label="Calculator">${head('Calculator','calc')}<div class="calc-d"><div class="calc-e" id="calc-e">${esc(T.expr)||'&nbsp;'}</div><div class="calc-r" id="calc-r">${esc(T.res)}</div></div>
    <div class="keys">${['7','8','9','÷','⌫','4','5','6','×','(','1','2','3','−',')','0','.','π','+','√','x²','C','Ans','='].map(k=>`<button data-act="key" data-k="${k}" class="${/[÷×−+()√π]|x²|Ans|⌫|C/.test(k)?'op':''}${k==='='?' eq':''}">${k}</button>`).join('')}</div></div>`;
  if(T.open==='wb')panel=`<div class="panel big${T.min?' min':''}" role="dialog" aria-label="Whiteboard">${head('Whiteboard','wb')}<canvas class="wb" id="wb" aria-label="Drawing area"></canvas>
    <div class="row">${['#17231f','#234d45','#b1261b','#1f5f8a'].map(c=>`<button class="swatch" style="background:${c}" data-act="wb-col" data-c="${c}" aria-label="Pen colour" aria-pressed="${T.color===c}"></button>`).join('')}<button class="btn small" data-act="wb-col" data-c="erase" aria-pressed="${T.color==='erase'}">Rubber</button><button class="btn small" data-act="wb-undo">Undo</button><button class="btn small" data-act="wb-clear">Clear</button><button class="btn small primary" data-act="wb-save">Save to my notes</button><span id="wbmsg" class="muted"></span></div></div>`;
  if(T.open==='notes')panel=`<div class="panel${T.min?' min':''}" role="dialog" aria-label="Notes">${head('Notes','notes')}<textarea id="tnote" maxlength="4000" placeholder="Write a note about this topic">${esc(T.note)}</textarea><div class="row"><button class="btn small primary" data-act="tnote-save">Save note</button><a class="link" href="#notes">See all my notes</a><span id="tnotemsg" class="muted"></span></div></div>`;
  el.innerHTML=panel+`<div class="dock noprint"><button class="btn" data-act="tool" data-t="calc" aria-pressed="${T.open==='calc'}" ${T.calc?'':'disabled title="No calculator for this question"'}>${T.calc?'Calculator':'No calculator'}</button><button class="btn" data-act="tool" data-t="wb" aria-pressed="${T.open==='wb'}">Whiteboard</button><button class="btn" data-act="tool" data-t="notes" aria-pressed="${T.open==='notes'}">Notes</button></div>`;
  if(T.open==='wb')initWB();}
/* calculator: a small, safe expression reader (no eval) */
function calcEval(src){const s=src.replace(/Ans/g,'('+T.ans+')');let i=0;const peek=()=>s[i],eat=c=>{if(s[i]===c){i++;return true;}return false;};
  const num=()=>{const m=/^\d*\.?\d+|^\d+\.?/.exec(s.slice(i));if(!m)throw 0;i+=m[0].length;return parseFloat(m[0]);};
  const prim=()=>{if(eat('(')){const v=expr();eat(')');return v;}if(eat('√'))return Math.sqrt(post());if(eat('π'))return Math.PI;if(eat('−'))return-post();return num();};
  function post(){let v=prim();while(eat('²'))v=v*v;return v;}
  const impl=()=>{let v=post();while(i<s.length&&(peek()==='('||peek()==='π'||peek()==='√'))v*=post();return v;};
  const term=()=>{let v=impl();for(;;){if(eat('×'))v*=impl();else if(eat('÷'))v/=impl();else return v;}};
  function expr(){let v=term();for(;;){if(eat('+'))v+=term();else if(eat('−'))v-=term();else return v;}}
  const v=expr();if(i<s.length||!Number.isFinite(v))throw 0;return v;}
function calcKey(k){if(k==='C'){T.expr='';T.res='0';T.fresh=false;}else if(k==='⌫'){T.expr=T.fresh?'':T.expr.replace(/(Ans|.)$/,'');T.fresh=false;}
  else if(k==='='){if(!T.expr)return;try{const v=calcEval(T.expr);T.ans=v;T.res=String(+v.toPrecision(10));T.fresh=true;}catch(e){T.res='Error';T.fresh=false;}}
  else{if(T.fresh){T.expr=/^[+−×÷]$|^x²$/.test(k)?'Ans':'';T.fresh=false;}T.expr+=(k==='x²'?'²':k);if(T.expr.length>60)T.expr=T.expr.slice(0,60);}
  const e=document.getElementById('calc-e'),r=document.getElementById('calc-r');if(e){e.textContent=T.expr||' ';r.textContent=T.res;}}
/* whiteboard */
function initWB(){const c=document.getElementById('wb');if(!c)return;const dpr=window.devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;c.width=w*dpr;c.height=h*dpr;const g=c.getContext('2d');g.scale(dpr,dpr);g.lineCap='round';g.lineJoin='round';
  const paint=()=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);for(const s of T.strokes){g.strokeStyle=s.c==='erase'?'#fff':s.c;g.lineWidth=s.c==='erase'?22:s.w;g.beginPath();s.p.forEach(([x,y],k)=>k?g.lineTo(x,y):g.moveTo(x,y));if(s.p.length===1)g.lineTo(s.p[0][0]+.1,s.p[0][1]);g.stroke();}};
  T.paint=paint;paint();let cur=null;const pos=e=>{const r=c.getBoundingClientRect();return[Math.round(e.clientX-r.left),Math.round(e.clientY-r.top)];};
  c.onpointerdown=e=>{e.preventDefault();c.setPointerCapture(e.pointerId);cur={c:T.color,w:T.size,p:[pos(e)]};T.strokes.push(cur);paint();};
  c.onpointermove=e=>{if(!cur)return;cur.p.push(pos(e));paint();};
  c.onpointerup=c.onpointercancel=()=>{cur=null;};}
function wbImage(){const c=document.getElementById('wb');if(!c||!T.strokes.length)return'';const k=Math.min(1,900/c.width),o=document.createElement('canvas');o.width=Math.round(c.width*k);o.height=Math.round(c.height*k);o.getContext('2d').drawImage(c,0,0,o.width,o.height);return o.toDataURL('image/png');}
async function saveNote(text,image,msgId){const m=document.getElementById(msgId);try{await api('POST','/api/notes',{topic:T.topic||(P&&P.q?P.q.t:''),text,image,context:noteContext()});if(m)m.textContent='Saved.';return true;}catch(e){if(m)m.textContent=e.message;return false;}}

/* ================= clicks and keys ================= */
const A=GF.actions;
Object.assign(A,{
  logout:async()=>{try{await api('POST','/api/logout');}catch(e){}TOK.set('');ME=null;HOME=null;Q=null;stopIdle();clearHash(false);META=await api('GET','/api/me');showLogin();},
  'login-mode':b=>{loginMode=b.dataset.m;showLogin();},
  privacy:async()=>{const el=document.getElementById('privacy');if(el.innerHTML){el.innerHTML='';return;}try{const d=await api('GET','/api/privacy');el.innerHTML=`<div class="privacy card">${esc(d.text)}</div>`;}catch(e){el.innerHTML=fail(e);}},
  'text-size':b=>{textSize=(textSize+1)%3;try{localStorage.setItem('gf.ts',String(textSize));}catch(e){}applyTextSize();b.textContent=['A','A+','A++'][textSize];},
  'skip-practice':()=>{const q=document.getElementById('qbox');if(q){q.scrollIntoView({block:'start'});const i=q.querySelector('#ans,.opt');if(i)i.focus({preventScroll:true});}},
  'tool-min':()=>{T.min=!T.min;drawTools();},
  'pl-prev':()=>player&&player.go(-1),'pl-next':()=>player&&player.go(1),'pl-play':()=>player&&player.play(),
  'pl-sound':()=>{soundOn=!soundOn;try{localStorage.setItem('gf.sound',soundOn?'on':'off');}catch(e){}if(player){const was=player.playing;player.stop();player.draw();if(was)player.play();}},
  'read-q':()=>{const el=document.getElementById('qtext');if(!el)return;const q=P&&P.q?P.q:Q?Q.qs[Q.i]:null;let t=speakable(el.innerHTML);if(q&&q.kind==='choice'&&!/<svg/.test(q.opts[0]))t+='. The choices are: '+q.opts.map(o=>speakable(o)).join(', ');say(t);},
  'lesson-all':b=>{const f=document.getElementById('lfull'),p=document.getElementById('lplayer');if(player)player.stop();f.hidden=!f.hidden;p.hidden=!f.hidden;b.textContent=f.hidden?'Show the whole lesson':'Show one step at a time';if(!f.hidden&&TOPIC)api('POST','/api/lesson-done',{topic:TOPIC.id}).catch(()=>{});},
  check:()=>submit(P.raw),opt:b=>submit(+b.dataset.i),
  hint:async()=>{try{P.hint=(await api('POST','/api/q/hint',{qid:P.qid})).hint;drawQ();}catch(e){}},
  show:async()=>{try{const r=await api('POST','/api/q/reveal',{qid:P.qid});P.state='done';P.result='no';P.solution=r.solution;P.session.n++;P.msg='Here is the method. Have a go at the next one yourself.';P.kind='note';drawQ();}catch(e){P.msg=esc(e.message);P.kind='bad';drawQ();}},
  next:async()=>{const ex=document.getElementById('exbox');if(ex){ex.hidden=true;ex.innerHTML='';}if(player)player.stop();try{await newQ();document.getElementById('qbox').scrollIntoView({block:'start'});}catch(e){document.getElementById('qbox').innerHTML=fail(e);}},
  watch:()=>showExample(P.q,P.solution,'Watch how to do it'),
  example:async()=>{try{const r=await api('POST','/api/q/example',{topic:P.q.t});showExample(r.q,r.solution,'Another example: '+esc(r.q.title));}catch(e){}},
  'ex-close':()=>{if(player)player.stop();const ex=document.getElementById('exbox');ex.hidden=true;ex.innerHTML='';},
  relearn:()=>{const l=document.getElementById('lesson');if(!l||!TOPIC)return;document.getElementById('lfull').hidden=true;const p=document.getElementById('lplayer');p.hidden=false;makePlayer(p,lessonSlides(TOPIC.lesson)).play();l.scrollIntoView({block:'start'});},
  'quiz-start':b=>startQuiz(+b.dataset.id).catch(e=>setView(fail(e),'home')),
  'qz-opt':b=>{Q.ans[Q.i]=+b.dataset.i;saveQuiz();drawQuiz();},
  'qz-prev':()=>{Q.i=Math.max(0,Q.i-1);Q.confirm=false;drawQuiz(true);},'qz-next':()=>{Q.i=Math.min(Q.qs.length-1,Q.i+1);Q.confirm=false;drawQuiz(true);},
  'qz-jump':b=>{Q.i=+b.dataset.i;Q.confirm=false;drawQuiz();},'qz-finish':()=>{Q.confirm=true;drawQuiz();},'qz-no':()=>{Q.confirm=false;drawQuiz();},'qz-yes':()=>finishQuiz(),
  'rv-watch':b=>{const rv=GF.state.review,it=rv.items[+b.dataset.i];makePlayer(document.getElementById('rvp-'+b.dataset.i),solutionSlides(it.q,it.solution)).play();},
  'note-add':async()=>{const t=document.getElementById('newnote');T.topic='';if(await saveNote(t.value,'','notemsg'))route();},
  'note-del':async b=>{await api('DELETE','/api/notes/'+b.dataset.id);route();},
  tool:b=>{const t=b.dataset.t;if(T.open==='notes'){const n=document.getElementById('tnote');if(n)T.note=n.value;}T.open=T.open===t?null:t;T.min=false;drawTools();},
  key:b=>calcKey(b.dataset.k),
  'wb-col':b=>{T.color=b.dataset.c;drawTools();},'wb-undo':()=>{T.strokes.pop();if(T.paint)T.paint();},'wb-clear':()=>{T.strokes=[];if(T.paint)T.paint();},
  'wb-save':async()=>{const img=wbImage();if(!img){document.getElementById('wbmsg').textContent='Draw something first.';return;}await saveNote('',img,'wbmsg');},
  'tnote-save':async()=>{const n=document.getElementById('tnote');T.note=n.value;if(await saveNote(n.value,'','tnotemsg')){T.note='';n.value='';}},
});
/* 2.13: a button that is waiting for the server cannot be pressed again (no double quizzes or double accounts) */
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled||b.dataset.busy)return;const fn=A[b.dataset.act];if(!fn)return;
  const r=fn(b,e);if(r&&r.then){b.dataset.busy='1';b.setAttribute('aria-busy','true');r.catch(err=>console.error(err)).finally(()=>{delete b.dataset.busy;b.removeAttribute('aria-busy');});}});
document.addEventListener('input',e=>{if(e.target.id==='ans'){if(Q&&document.getElementById('quizbox')){Q.ans[Q.i]=e.target.value;saveQuiz();}else if(P)P.raw=e.target.value;}if(GF.onInput)GF.onInput(e);});
document.addEventListener('change',e=>{if(GF.onChange)GF.onChange(e);});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.id==='ans'){e.preventDefault();if(Q&&document.getElementById('quizbox')){if(Q.i<Q.qs.length-1){Q.i++;drawQuiz(true);}else{Q.confirm=true;drawQuiz();}}else if(P&&P.state==='ask')submit(P.raw);}
  else if(e.key==='Escape'&&T.open){T.open=null;drawTools();}
  else if(T.open==='calc'&&!/INPUT|TEXTAREA/.test(e.target.tagName)){const map={'*':'×','/':'÷','-':'−','Enter':'=','Backspace':'⌫'};const k=map[e.key]||e.key;if(/^[0-9.+()=]$/.test(k)||'×÷−⌫'.includes(k)){e.preventDefault();calcKey(k);}}});
if(synth)synth.onvoiceschanged=()=>{};
GF.boot=boot;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
