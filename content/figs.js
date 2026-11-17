"use strict";
/* Topic registry, extra diagrams and small helpers shared by every level.
   A "topic" is one teaching session from the Growing Futures plan: it has a lesson and a list of question generators. */
const LEVELS={},TOPICS=[],TMAP={};
const AREAS={N:'Number',M:'Measures, shape and space',D:'Handling data'};
const BLOCK_NAMES=['Autumn 1','Autumn 2','Spring 1','Spring 2','Summer 1','Summer 2'];
function level(id,o){LEVELS[id]={id,...o};}
/* calc: is a calculator allowed by default? Number topics are practised without one; measures and data topics allow one. A question can override this. */
function topic(id,o){const t={id,level:id.split('-')[0],calc:o.area!=='N',...o};TOPICS.push(t);TMAP[id]=t;}

/* ---------- small helpers ---------- */
const pickN=(a,n)=>shuffle(a).slice(0,n);
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const pl=(n,w)=>n+' '+(n===1?w:w+'s');
/* multiple choice with number options: keeps 3 different wrong answers that are not the right one */
function mcn(right,cands,fmt){fmt=fmt||sg;const seen=new Set([fmt(right)]),w=[];
  for(const c of shuffle(cands)){const f=fmt(c);if(c>=0&&!seen.has(f)){seen.add(f);w.push(f);}if(w.length===3)break;}
  for(let k=1;w.length<3&&k<40;k++){for(const c of[right+k,right-k]){const f=fmt(c);if(c>=0&&!seen.has(f)&&w.length<3){seen.add(f);w.push(f);}}}
  return mc(fmt(right),w);}
const mct=(right,all)=>mc(right,pickN(all.filter(x=>x!==right),3));
const pence=p=>p>=100?'£'+(p%100?(p/100).toFixed(2):p/100):p+'p';
const money=n=>'£'+Number(n).toFixed(2);
const t12=(h,m)=>`${((h+11)%12)+1}:${String(m).padStart(2,'0')}`;
const t24=(h,m)=>`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
const ampm=(h,m)=>`${t12(h,m)} ${h<12?'am':'pm'}`;
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const THINGS=['plant pots','seed trays','tent pegs','helmets','paint brushes','bolts','mugs','spades','bird boxes','life jackets','fence posts','water bottles'];
const SNACKS=[['apple',30],['banana',25],['cereal bar',45],['juice',60],['sandwich',95],['crisps',55],['flapjack',70],['water',40]];
const wordNum=n=>words(n);

/* ---------- diagrams ---------- */
function figItems(n,per,sq){per=per||5;const s=24,rows=Math.max(1,Math.ceil(n/per));let b='';
  for(let i=0;i<n;i++){const c=i%per,r=Math.floor(i/per),x=14+c*s+(per===10&&c>=5?8:0),y=14+r*s;b+=sq?`<rect x="${x-8}" y="${y-8}" width="16" height="16" class="it"/>`:`<circle cx="${x}" cy="${y}" r="8.5" class="it"/>`;}
  return svg(per*s+(per===10?16:6),rows*s+6,b,n===0?'An empty tray':`${n} objects`,1.25);}
function figGroups(groups,size){let b='';const gw=size<=5?size*20+16:5*20+16,gh=size<=5?44:64;
  for(let g=0;g<groups;g++){const x0=6+(g%4)*(gw+10),y0=6+Math.floor(g/4)*(gh+10);b+=`<rect x="${x0}" y="${y0}" width="${gw}" height="${gh}" rx="6" class="tray"/>`;for(let i=0;i<size;i++)b+=`<circle cx="${x0+18+(i%5)*20}" cy="${y0+22+Math.floor(i/5)*20}" r="7" class="it"/>`;}
  return svg(Math.min(groups,4)*(gw+10)+4,Math.ceil(groups/4)*(gh+10)+4,b,`${groups} groups of ${size}`,1.2);}
function figClock(h,m){const c=90,r=78;let b=`<circle cx="${c}" cy="${c}" r="${r}" class="face"/>`;
  for(let i=1;i<=12;i++){const a=i*30*Math.PI/180;b+=T(c+Math.sin(a)*(r-16),c-Math.cos(a)*(r-16)+5,i,{b:1});}
  for(let i=0;i<60;i++){const a=i*6*Math.PI/180,r1=i%5?r-4:r-7;b+=`<line x1="${rd(c+Math.sin(a)*r1,1)}" y1="${rd(c-Math.cos(a)*r1,1)}" x2="${rd(c+Math.sin(a)*r,1)}" y2="${rd(c-Math.cos(a)*r,1)}" class="thin"/>`;}
  const ha=((h%12)+m/60)*30*Math.PI/180,ma=m*6*Math.PI/180;
  b+=`<line x1="${c}" y1="${c}" x2="${rd(c+Math.sin(ha)*38,1)}" y2="${rd(c-Math.cos(ha)*38,1)}" class="hh"/><line x1="${c}" y1="${c}" x2="${rd(c+Math.sin(ma)*58,1)}" y2="${rd(c-Math.cos(ma)*58,1)}" class="mh"/><circle cx="${c}" cy="${c}" r="4" class="pt"/>`;
  return svg(180,180,b,'An analogue clock',1.1);}
function figDigital(t){return svg(170,70,`<rect x="3" y="3" width="164" height="64" rx="10" class="lcd"/><text x="85" y="49" text-anchor="middle" class="dig">${t}</text>`,`Digital clock showing ${t}`,1.1);}
function figMoney(vals){const per=Math.min(vals.length,5);let b='';
  vals.forEach((v,i)=>{const x=38+(i%per)*72,y=36+Math.floor(i/per)*70,lab=pence(v);
    if(v>=500)b+=`<rect x="${x-33}" y="${y-22}" width="66" height="44" rx="5" class="note"/>`+T(x,y+6,lab,{b:1});
    else{const r=v===1?17:v===5?18:v===2||v===10?22:v===20?20:v===50?25:v===100?22:26;b+=`<circle cx="${x}" cy="${y}" r="${r}" class="coin ${v<=2?'cu':v>=100?'au':'ag'}"/>`+T(x,y+5,lab,{b:1});}});
  return svg(per*72+4,Math.ceil(vals.length/per)*70+4,b,'Money: '+vals.map(pence).join(', '),1.15);}
function figNumLine(lo,hi,step,o){o=o||{};const n=Math.round((hi-lo)/step),W=Math.min(340,Math.max(240,n*30+40)),x0=20,pw=W-40,X=v=>rd(x0+(v-lo)/(hi-lo)*pw,1);let b=`<line x1="${x0-8}" y1="34" x2="${W-12}" y2="34" class="ax"/>`;
  for(let i=0;i<=n;i++){const v=rd(lo+i*step,3),hid=(o.hide||[]).some(h=>Math.abs(h-v)<1e-9);b+=`<line x1="${X(v)}" y1="27" x2="${X(v)}" y2="41" class="ax"/>`;if(!o.every||i%o.every===0||hid)b+=T(X(v),58,hid?'?':nf(v),{b:hid});}
  (o.mark||[]).forEach(v=>{b+=`<path d="M${X(v)} 26l-6 -14h12z" class="ptr"/>`;});
  return svg(W,66,b,o.label||`Number line from ${lo} to ${hi}`,1.15);}
function tally(n){let b='',x=4;for(let g=0;g<Math.floor(n/5);g++){for(let i=0;i<4;i++)b+=`<line x1="${x+i*6}" y1="3" x2="${x+i*6}" y2="19" class="tk"/>`;b+=`<line x1="${x-3}" y1="17" x2="${x+21}" y2="5" class="tk"/>`;x+=32;}
  for(let i=0;i<n%5;i++)b+=`<line x1="${x+i*6}" y1="3" x2="${x+i*6}" y2="19" class="tk"/>`;
  const w=Math.max(20,x+(n%5)*6+4);return`<svg viewBox="0 0 ${w} 22" width="${w}" height="22" role="img" aria-label="tally of ${n}" class="dg tal">${b}</svg>`;}
function figBars(cats,vals,o){o=o||{};const step=o.step||1,max=o.max||Math.ceil(Math.max(...vals)/step)*step||step,W=340,H=236,L=44,B=46,Tm=12,pw=W-L-10,ph=H-Tm-B,bw=pw/cats.length,Y=v=>rd(Tm+ph-v/max*ph,1);let b='';
  for(let v=0;v<=max+1e-9;v+=step){const lab=!o.every||Math.round(v/step)%o.every===0;b+=`<line x1="${L}" y1="${Y(v)}" x2="${L+pw}" y2="${Y(v)}" class="${lab?'g2':'g1'}"/>`+(lab?T(L-6,Y(v)+4,nf(rd(v,2)),{a:'end'}):'');}
  cats.forEach((c,i)=>{const x=L+i*bw+bw*0.18,w=bw*0.64;
    if(o.blocks)for(let k=0;k<vals[i];k++)b+=`<rect x="${rd(x,1)}" y="${Y(k+1)+1}" width="${rd(w,1)}" height="${rd(ph/max-2,1)}" class="bar"/>`;
    else b+=`<rect x="${rd(x,1)}" y="${Y(vals[i])}" width="${rd(w,1)}" height="${rd(Tm+ph-Y(vals[i]),1)}" class="bar"/>`;
    b+=T(L+i*bw+bw/2,Tm+ph+15,c).replace('class="dt','class="dt dx');});
  b+=`<path d="M${L} ${Tm}V${Tm+ph}H${L+pw}" class="ax"/>`+(o.xl?T(L+pw/2,H-6,o.xl,{b:1}):'')+(o.yl?T(12,Tm+ph/2,o.yl,{rot:-90,b:1}):'');
  return svg(W,H,b,(o.blocks?'Block graph: ':'Bar chart: ')+cats.map((c,i)=>`${c} ${vals[i]}`).join(', '));}
function figLineG(labs,vals,o){o=o||{};const step=o.step||1,max=o.max||Math.ceil(Math.max(...vals)/step)*step,W=340,H=236,L=44,B=46,Tm=12,pw=W-L-16,ph=H-Tm-B,X=i=>rd(L+10+i*(pw-10)/(labs.length-1),1),Y=v=>rd(Tm+ph-v/max*ph,1);let b='';
  for(let v=0;v<=max+1e-9;v+=step)b+=`<line x1="${L}" y1="${Y(v)}" x2="${L+pw}" y2="${Y(v)}" class="g2"/>`+T(L-6,Y(v)+4,nf(rd(v,2)),{a:'end'});
  labs.forEach((l,i)=>{b+=`<line x1="${X(i)}" y1="${Tm}" x2="${X(i)}" y2="${Tm+ph}" class="g1"/>`+T(X(i),Tm+ph+15,l).replace('class="dt','class="dt dx');});
  b+=`<path d="M${L} ${Tm}V${Tm+ph}H${L+pw}" class="ax"/><polyline points="${vals.map((v,i)=>X(i)+','+Y(v)).join(' ')}" class="ln" fill="none"/>`+vals.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="3.6" class="pt"/>`).join('')+(o.xl?T(L+pw/2,H-6,o.xl,{b:1}):'')+(o.yl?T(12,Tm+ph/2,o.yl,{rot:-90,b:1}):'');
  return svg(W,H,b,'Line graph: '+labs.map((l,i)=>`${l} ${vals[i]}`).join(', '));}
function figPie(items,o){o=o||{};const tot=items.reduce((a,x)=>a+x.v,0),c=110,r=82;let a0=-Math.PI/2,b='';
  items.forEach((it,i)=>{const a1=a0+it.v/tot*2*Math.PI,big=a1-a0>Math.PI?1:0,mid=(a0+a1)/2;
    b+=`<path d="M${c} ${c}L${rd(c+r*Math.cos(a0),1)} ${rd(c+r*Math.sin(a0),1)}A${r} ${r} 0 ${big} 1 ${rd(c+r*Math.cos(a1),1)} ${rd(c+r*Math.sin(a1),1)}z" class="pie p${i%6}"/>`;
    b+=T(c+r*0.6*Math.cos(mid),c+r*0.6*Math.sin(mid)+4,it.l+(o.deg?` ${rd(it.v/tot*360,0)}°`:''),{b:1});a0=a1;});
  return svg(220,220,b,'Pie chart: '+items.map(it=>it.l).join(', '),1.15);}
/* a measuring scale: ruler, weighing scale, jug or thermometer. labelEvery>1 leaves some divisions unlabelled. */
function figScale(o){const{min,max,major,minor,val,unit}=o,le=o.labelEvery||1;
  if(o.vert){const H=230,y0=206,y1=20,Y=v=>rd(y0-(v-min)/(max-min)*(y0-y1),1);let b=`<rect x="34" y="${y1-8}" width="34" height="${y0-y1+16}" rx="${o.jug?4:17}" class="tube"/><rect x="38" y="${Y(val)}" width="26" height="${rd(y0+4-Y(val),1)}" rx="${o.jug?2:12}" class="${o.jug?'liq':'merc'}"/>`;
    for(let v=min,i=0;v<=max+1e-9;v+=minor,i++){const mj=Math.abs(v/major-Math.round(v/major))<1e-9,k=Math.round((v-min)/major);b+=`<line x1="68" y1="${Y(v)}" x2="${mj?82:76}" y2="${Y(v)}" class="ax"/>`;if(mj&&k%le===0)b+=T(88,Y(v)+4,nf(rd(v,2)),{a:'start'});}
    return svg(150,H,b+T(51,H-4,unit,{b:1}),`${o.jug?'Measuring jug':'Thermometer'} scale in ${unit}`,1.1);}
  const W=340,x0=22,x1=W-22,X=v=>rd(x0+(v-min)/(max-min)*(x1-x0),1);let b=`<rect x="${x0-12}" y="34" width="${x1-x0+24}" height="44" rx="4" class="rule"/>`;
  for(let v=min;v<=max+1e-9;v+=minor){const mj=Math.abs(v/major-Math.round(v/major))<1e-9,k=Math.round((v-min)/major);b+=`<line x1="${X(v)}" y1="34" x2="${X(v)}" y2="${mj?52:44}" class="ax"/>`;if(mj&&k%le===0)b+=T(X(v),68,nf(rd(v,2)));}
  b+=`<path d="M${X(val)} 32l-7 -16h14z" class="ptr"/>`+T(W-8,12,unit,{a:'end',b:1});
  return svg(W,84,b,`Scale from ${min} to ${max} ${unit} with an arrow`);}
const SHAPES2=['circle','square','rectangle','triangle','pentagon','hexagon'],SHAPES3=['cube','cuboid','cylinder','sphere','pyramid','cone'];
function figShape(n,rot){const poly=(k,r,a0)=>[...Array(k)].map((_,i)=>{const a=a0+i*2*Math.PI/k;return rd(60+r*Math.cos(a),1)+','+rd(55+r*Math.sin(a),1);}).join(' ');
  const S={circle:'<circle cx="60" cy="55" r="42" class="sh"/>',square:'<rect x="22" y="17" width="76" height="76" class="sh"/>',rectangle:'<rect x="8" y="28" width="104" height="54" class="sh"/>',triangle:'<polygon points="60,12 108,96 12,96" class="sh"/>',rtriangle:'<polygon points="18,14 18,96 106,96" class="sh"/><path d="M18 84h12v12" class="thin"/>',
    pentagon:`<polygon points="${poly(5,46,-Math.PI/2)}" class="sh"/>`,hexagon:`<polygon points="${poly(6,46,0)}" class="sh"/>`,octagon:`<polygon points="${poly(8,46,Math.PI/8)}" class="sh"/>`,
    cube:'<polygon points="18,38 78,38 78,98 18,98" class="sh"/><polygon points="18,38 42,14 102,14 78,38" class="sh"/><polygon points="78,38 102,14 102,74 78,98" class="sh"/>',
    cuboid:'<polygon points="6,48 84,48 84,96 6,96" class="sh"/><polygon points="6,48 30,26 108,26 84,48" class="sh"/><polygon points="84,48 108,26 108,74 84,96" class="sh"/>',
    cylinder:'<path d="M28 26v60a32 11 0 0 0 64 0v-60" class="sh"/><ellipse cx="60" cy="26" rx="32" ry="11" class="sh"/>',
    sphere:'<circle cx="60" cy="55" r="42" class="sh"/><ellipse cx="60" cy="55" rx="42" ry="13" class="thin"/>',
    pyramid:'<polygon points="60,10 14,82 70,100" class="sh"/><polygon points="60,10 70,100 108,74" class="sh"/>',
    cone:'<path d="M60 10L24 86a36 11 0 0 0 72 0z" class="sh"/><path d="M24 86a36 11 0 0 1 72 0" class="thin"/>',
    prism:'<polygon points="52,96 30,40 86,24 108,80" class="sh"/><polygon points="8,96 52,96 30,40" class="sh"/>'};
  return svg(120,110,rot?`<g transform="rotate(${rot} 60 55)">${S[n]}</g>`:S[n],'A shape',1);}
function figFrac(n,d,w){w=w||240;const pw=w/d;let b='';for(let i=0;i<d;i++)b+=`<rect x="${rd(4+i*pw,1)}" y="4" width="${rd(pw,1)}" height="46" class="${i<n?'fon':'foff'}"/>`;return svg(w+8,54,b,`A bar split into ${d} equal parts with ${n} shaded`,1);}
function figCompass(dir){const c=90,pts=['N','NE','E','SE','S','SW','W','NW'];let b=`<circle cx="${c}" cy="${c}" r="52" class="face"/>`;
  pts.forEach((p,i)=>{const a=i*45*Math.PI/180,r=i%2?64:70;b+=`<line x1="${c}" y1="${c}" x2="${rd(c+Math.sin(a)*48,1)}" y2="${rd(c-Math.cos(a)*48,1)}" class="thin"/>`+T(c+Math.sin(a)*r,c-Math.cos(a)*r+5,p,{b:i%2===0});});
  if(dir!=null){const a=dir*45*Math.PI/180;b+=`<line x1="${c}" y1="${c}" x2="${rd(c+Math.sin(a)*40,1)}" y2="${rd(c-Math.cos(a)*40,1)}" class="hh"/>`;}
  return svg(180,180,b+`<circle cx="${c}" cy="${c}" r="4" class="pt"/>`,'Compass with eight points');}
function figAngle(deg){const c=[70,120],r=110,a=deg*Math.PI/180,x=rd(c[0]+r*Math.cos(a),1),y=rd(c[1]-r*Math.sin(a),1);
  const arc=deg===90?`<path d="M${c[0]+18} ${c[1]}v-18h-18" class="thin"/>`:`<path d="M${c[0]+30} ${c[1]}A30 30 0 ${deg>180?1:0} 0 ${rd(c[0]+30*Math.cos(a),1)} ${rd(c[1]-30*Math.sin(a),1)}" class="thin"/>`;
  return svg(250,deg>180?240:140,`<line x1="${c[0]}" y1="${c[1]}" x2="${c[0]+r+40}" y2="${c[1]}" class="ln2"/><line x1="${c[0]}" y1="${c[1]}" x2="${x}" y2="${y}" class="ln2"/>${arc}`,'An angle between two lines');}
function figRect(w,h,u,hideH){const k=Math.min(190/w,100/h),x0=60,y0=20,rw=rd(w*k,1),rh=rd(h*k,1);return svg(300,rh+52,`<rect x="${x0}" y="${y0}" width="${rw}" height="${rh}" class="sh"/>`+T(x0+rw/2,y0+rh+18,`${w} ${u}`,{b:1})+(hideH?'':T(x0-8,y0+rh/2+4,`${h} ${u}`,{a:'end',b:1})),`Rectangle ${w} ${u} by ${h} ${u}`);}
/* labelled cards in a row or a stack, for position words */
function figCards(names,vert,arrow){const w=86,h=40;let b='';names.forEach((n,i)=>{const x=vert?40:6+i*(w+8),y=vert?6+i*(h+6):arrow?26:6;b+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="card"/>`+T(x+w/2,y+25,n,{b:1});});
  if(arrow)b+=T(6,16,arrow,{a:'start'});
  return svg(vert?166:names.length*(w+8)+4,vert?names.length*(h+6)+6:(arrow?72:52),b,(vert?'Top to bottom: ':'Left to right: ')+names.join(', '),1.1);}

/* ---------- building questions ---------- */
function makeQ(id,seed,gen){setSeed(seed);const t=TMAP[id];if(!t)throw new Error('Unknown topic '+id);
  const gi=(gen!=null&&gen<t.gens.length)?gen:rnd(0,t.gens.length-1),q=t.gens[gi]();
  q.t=id;q.g=gi;q.kind=q.kind||'num';q.pre=q.pre||'';q.suf=q.suf||'';if(q.calc==null)q.calc=!!t.calc;if(!q.hint)q.hint=t.hint||t.lesson.steps[0];return q;}
/* what the learner is allowed to see before answering (no answer, no method) */
function publicQ(q){return{t:q.t,title:TMAP[q.t].title,text:q.text,fig:q.fig||'',kind:q.kind,opts:q.kind==='choice'?q.opts:undefined,pre:q.pre,suf:q.suf,calc:q.calc,say:plain(q.text)};}
function solutionOf(q){return{answer:answerText(q),steps:q.steps,hint:q.hint,right:q.kind==='choice'?q.ans:undefined};}
