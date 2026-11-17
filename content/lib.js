"use strict";
/* ============ helpers ============ */
/* Seedable random numbers: the same seed always builds the same question, so the server can re-create a question to mark it. */
let _seed=1;
const setSeed=s=>{_seed=(s>>>0)||1;};
const R=()=>{_seed=(_seed+0x6D2B79F5)>>>0;let t=_seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
const rnd=(a,b)=>Math.floor(R()*(b-a+1))+a;
const pick=a=>a[rnd(0,a.length-1)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
const gcd=(a,b)=>{a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){[a,b]=[b,a%b];}return a;};
const lcm=(a,b)=>a/gcd(a,b)*b;
const rd=(n,dp)=>{const f=10**dp;return Math.round(n*f*(1+1e-12))/f;};
const nf=(n,dp)=>Number(n).toLocaleString('en-GB',dp==null?{maximumFractionDigits:4}:{minimumFractionDigits:dp,maximumFractionDigits:dp});
const gbp=n=>(n<0?'−':'')+'£'+(Math.abs(n-Math.round(n))<1e-9?nf(Math.abs(Math.round(n))):nf(Math.abs(n),2));
const sg=n=>(n<0?'−':'')+nf(Math.abs(n));
const simp=(n,d)=>{const g=gcd(n,d)||1;return{n:n/g,d:d/g};};
const F=(n,d)=>`<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const FM=(n,d)=>{const s=simp(n,d);if(s.d===1)return String(s.n);const w=Math.trunc(s.n/s.d),r=Math.abs(s.n)%s.d;return w?`${w}${F(r,s.d)}`:F(s.n,s.d);};
const fracTxt=(n,d)=>{const s=simp(n,d);if(s.d===1)return String(s.n);const w=Math.trunc(s.n/s.d),r=Math.abs(s.n)%s.d;return w?`${w} ${r}/${s.d}`:`${s.n}/${s.d}`;};
const mc=(right,wrongs)=>{const o=shuffle([right,...wrongs]);return{kind:'choice',opts:o,ans:o.indexOf(right)};};
const NAMES=['Asha','Ben','Carla','Dev','Ewa','Femi','Grace','Hamid','Isla','Jo','Kofi','Leah','Mo','Nia','Owen','Priya','Ravi','Sam','Tia','Yusuf'];
const who=()=>pick(NAMES);
/* last year, this year and next year, so dates in questions never go out of date */
const NEAR_YEARS=()=>{const y=new Date().getFullYear();return[y-1,y,y+1];};
const hm=t=>{const h=Math.floor(t+1e-9),m=Math.round((t-h)*60);return(h?h+(h===1?' hour':' hours'):'')+(m?(h?' ':'')+m+' minutes':'');};
const ONES=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const w3=n=>{const s=[],h=Math.floor(n/100),r=n%100;if(h)s.push(ONES[h]+' hundred');if(r){const t=r<20?ONES[r]:TENS[Math.floor(r/10)]+(r%10?'-'+ONES[r%10]:'');s.push((h?'and ':'')+t);}return s.join(' ');};
const words=n=>{const m=Math.floor(n/1e6),t=Math.floor(n%1e6/1000),u=n%1000,p=[];if(m)p.push(w3(m)+' million');if(t)p.push(w3(t)+' thousand');if(u)p.push((u<100&&(m||t)?'and ':'')+w3(u));return p.join(', ').replace(', and',' and');};
const tbl=(head,rows)=>`<div class="tw"><table><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>i?`<td>${c}</td>`:`<th>${c}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;

/* ============ diagrams ============ */
const svg=(w,h,body,label,k)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label||'Diagram'}" class="dg" style="max-width:${Math.round(w*(k||1))}px">${body}</svg>`;
const T=(x,y,s,o={})=>`<text x="${rd(x,1)}" y="${rd(y,1)}" class="dt${o.b?' db':''}" text-anchor="${o.a||'middle'}"${o.rot?` transform="rotate(${o.rot} ${rd(x,1)} ${rd(y,1)})"`:''}>${s}</text>`;
const NDA=(w,h)=>T(w-4,h-4,'Not drawn accurately',{a:'end'}).replace('class="dt','class="dt dn');

function plot(o){const W=330,H=250,L=46,R=12,Tm=12,B=42,pw=W-L-R,ph=H-Tm-B;
  const X=x=>rd(L+x/o.xmax*pw,1),Y=y=>rd(Tm+ph-y/o.ymax*ph,1);let s='';
  for(let i=0,n=Math.round(o.xmax/o.xminor);i<=n;i++){const x=X(i*o.xminor);s+=`<line x1="${x}" y1="${Tm}" x2="${x}" y2="${Tm+ph}" class="g1"/>`;}
  for(let i=0,n=Math.round(o.ymax/o.yminor);i<=n;i++){const y=Y(i*o.yminor);s+=`<line x1="${L}" y1="${y}" x2="${L+pw}" y2="${y}" class="g1"/>`;}
  for(let i=0,n=Math.round(o.xmax/o.xstep);i<=n;i++){const v=i*o.xstep,x=X(v);s+=`<line x1="${x}" y1="${Tm}" x2="${x}" y2="${Tm+ph}" class="g2"/>`+T(x,Tm+ph+15,nf(v));}
  for(let i=0,n=Math.round(o.ymax/o.ystep);i<=n;i++){const v=i*o.ystep,y=Y(v);s+=`<line x1="${L}" y1="${y}" x2="${L+pw}" y2="${y}" class="g2"/>`+T(L-6,y+4,nf(v),{a:'end'});}
  s+=`<path d="M${L} ${Tm}V${Tm+ph}H${L+pw}" class="ax"/>`+T(L+pw/2,H-6,o.xl,{b:1})+T(13,Tm+ph/2,o.yl,{rot:-90,b:1});
  if(o.line){const[m,c]=o.line;let x0=0,y0=c,x1=o.xmax,y1=m*o.xmax+c;if(y1>o.ymax){x1=(o.ymax-c)/m;y1=o.ymax;}if(y1<0){x1=-c/m;y1=0;}if(y0>o.ymax){x0=(o.ymax-c)/m;y0=o.ymax;}
    s+=`<line x1="${X(x0)}" y1="${Y(y0)}" x2="${X(x1)}" y2="${Y(y1)}" class="ln"/>`;}
  (o.pts||[]).forEach(p=>{s+=`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.4" class="pt"/>`;});
  return svg(W,H,s,o.label||'Graph');}

function figGrid(pts){const S=260,c=S/2,u=20;let s='';
  for(let i=-6;i<=6;i++){const p=c+i*u;s+=`<line x1="${p}" y1="10" x2="${p}" y2="${S-10}" class="g1"/><line x1="10" y1="${p}" x2="${S-10}" y2="${p}" class="g1"/>`;}
  s+=`<line x1="10" y1="${c}" x2="${S-10}" y2="${c}" class="ax"/><line x1="${c}" y1="10" x2="${c}" y2="${S-10}" class="ax"/>`;
  for(let i=-6;i<=6;i+=2){if(!i)continue;s+=T(c+i*u,c+13,sg(i)).replace('class="dt','class="dt ds')+T(c-5,c-i*u+4,sg(i),{a:'end'}).replace('class="dt','class="dt ds');}
  s+=T(S-8,c-6,'x',{b:1,a:'end'})+T(c+9,18,'y',{b:1});
  pts.forEach(p=>{const x=c+p.x*u,y=c-p.y*u;s+=`<circle cx="${x}" cy="${y}" r="4" class="pt"/>`+T(p.x>=5?x-9:x+9,p.y>=5?y+17:y-7,p.l,{b:1,a:p.x>=5?'end':'start'});});
  return svg(S,S,s,'Coordinate grid from −6 to 6');}

function figIso(h){const R=h.length,C=h[0].length,Hm=Math.max(...h.flat()),s=24,dx=20.8,dy=12;
  const ox=R*dx+34,oy=Hm*s+14,P=(r,c,z)=>`${rd(ox+(c-r)*dx,1)},${rd(oy+(c+r)*dy-z*s,1)}`;let b='';
  const cells=[];for(let r=0;r<R;r++)for(let c=0;c<C;c++)cells.push([r,c]);cells.sort((a,b2)=>(a[0]+a[1])-(b2[0]+b2[1]));
  cells.forEach(([r,c])=>{for(let z=0;z<h[r][c];z++){
    b+=`<polygon points="${P(r+1,c,z+1)} ${P(r+1,c+1,z+1)} ${P(r+1,c+1,z)} ${P(r+1,c,z)}" class="cb cl"/>`;
    b+=`<polygon points="${P(r,c+1,z+1)} ${P(r+1,c+1,z+1)} ${P(r+1,c+1,z)} ${P(r,c+1,z)}" class="cb cr"/>`;
    b+=`<polygon points="${P(r,c,z+1)} ${P(r,c+1,z+1)} ${P(r+1,c+1,z+1)} ${P(r+1,c,z+1)}" class="cb ct"/>`;}});
  const W=(R+C)*dx+68,Ht=oy+(R+C)*dy+34;
  b+=T(ox+(C/2-R)*dx-22,oy+(C/2+R)*dy+24,'Front ↗',{b:1})+T(ox+(C-R/2)*dx+22,oy+(C+R/2)*dy+24,'↖ Side',{b:1});
  return svg(rd(W,0),rd(Ht,0),b,'3-D shape made from cubes, with the front and side marked',1.5);}
function figProfile(hs){const u=16,mx=3;let b='';hs.forEach((n,i)=>{for(let z=0;z<n;z++)b+=`<rect x="${4+i*u}" y="${4+(mx-1-z)*u}" width="${u}" height="${u}" class="cb ct"/>`;});
  b+=`<line x1="0" y1="${4+mx*u}" x2="${8+hs.length*u}" y2="${4+mx*u}" class="ax"/>`;return svg(8+hs.length*u,8+mx*u,b,'Elevation: column heights '+hs.join(', '),1.7);}

function figTri(bv,hv,u){const b=`<polygon points="40,150 250,150 120,36" class="sh"/><line x1="120" y1="36" x2="120" y2="150" class="dash"/><path d="M120 140h10v10" class="thin"/>`+T(145,170,`${bv} ${u}`,{b:1})+T(126,98,`${hv} ${u}`,{a:'start',b:1});return svg(290,184,b+NDA(290,184),`Triangle, base ${bv} ${u}, height ${hv} ${u}`);}
function figL(W,H,w2,h2,u){const k=Math.min(200/W,120/H),x0=52,y0=30,X=v=>rd(x0+v*k,1),Y=v=>rd(y0+v*k,1);
  const b=`<polygon points="${X(0)},${Y(0)} ${X(W-w2)},${Y(0)} ${X(W-w2)},${Y(h2)} ${X(W)},${Y(h2)} ${X(W)},${Y(H)} ${X(0)},${Y(H)}" class="sh"/>`
   +T(X(W/2),Y(H)+18,`${W} ${u}`,{b:1})+T(X(0)-8,Y(H/2)+4,`${H} ${u}`,{a:'end',b:1})+T(X(W-w2/2),Y(h2)+16,`${w2} ${u}`,{b:1})+T(X(W-w2)+6,Y(h2/2)+4,`${h2} ${u}`,{a:'start',b:1});
  return svg(300,190,b+NDA(300,190),`L-shape. Full width ${W} ${u}, full height ${H} ${u}. A rectangle ${w2} by ${h2} ${u} is missing from the top right corner`);}
function figRectSemi(w,h,u){const k=Math.min(170/w,110/h),x0=50,y0=26,rw=rd(w*k,1),rh=rd(h*k,1),r=rd(rh/2,1);
  const b=`<path d="M${x0} ${y0}h${rw}a${r} ${r} 0 0 1 0 ${rh}h${-rw}z" class="sh"/><line x1="${x0+rw}" y1="${y0}" x2="${x0+rw}" y2="${y0+rh}" class="dash"/>`+T(x0+rw/2,y0+rh+18,`${w} ${u}`,{b:1})+T(x0-8,y0+rh/2+4,`${h} ${u}`,{a:'end',b:1});
  return svg(300,170,b+NDA(300,170),`Rectangle ${w} by ${h} ${u} with a semicircle on one ${h} ${u} end`);}
function figCircle(v,isD,u){const cx=110,cy=84,r=62;const b=`<circle cx="${cx}" cy="${cy}" r="${r}" class="sh"/><circle cx="${cx}" cy="${cy}" r="2.5" class="pt"/>`+(isD?`<line x1="${cx-r}" y1="${cy}" x2="${cx+r}" y2="${cy}" class="ln2"/>`+T(cx,cy-8,`${v} ${u}`,{b:1}):`<line x1="${cx}" y1="${cy}" x2="${cx+r}" y2="${cy}" class="ln2"/>`+T(cx+r/2,cy-8,`${v} ${u}`,{b:1}));
  return svg(220,168,b,`Circle with ${isD?'diameter':'radius'} ${v} ${u}`);}
function figCuboid(l,w,h,u){const b=`<polygon points="40,60 190,60 190,150 40,150" class="sh"/><polygon points="40,60 80,28 230,28 190,60" class="sh"/><polygon points="190,60 230,28 230,118 190,150" class="sh"/>`+T(115,168,`${l} ${u}`,{b:1})+T(32,109,`${h} ${u}`,{a:'end',b:1})+T(216,142,`${w} ${u}`,{a:'start',b:1});
  return svg(290,178,b+NDA(290,178),`Cuboid ${l} by ${w} by ${h} ${u}`);}
function figCyl(r,h,u){const b=`<path d="M60 40v100a55 16 0 0 0 110 0v-100" class="sh"/><ellipse cx="115" cy="40" rx="55" ry="16" class="sh"/><line x1="115" y1="40" x2="170" y2="40" class="ln2"/><circle cx="115" cy="40" r="2.5" class="pt"/>`+T(144,18,`${r} ${u}`,{b:1})+T(178,96,`${h} ${u}`,{a:'start',b:1});
  return svg(250,170,b,`Cylinder with radius ${r} ${u} and height ${h} ${u}`);}
function figPrism(bv,hv,lv,u){const b=`<polygon points="160,150 95,50 225,30 290,130" class="sh"/><polygon points="30,150 160,150 95,50" class="sh"/><line x1="95" y1="50" x2="95" y2="150" class="dash"/>`
   +T(95,168,`${bv} ${u}`,{b:1})+T(89,130,`${hv} ${u}`,{a:'end',b:1})+T(238,158,`${lv} ${u}`,{a:'start',b:1});
  return svg(310,178,b,`Triangular prism. Triangle base ${bv} ${u}, triangle height ${hv} ${u}, length ${lv} ${u}`);}
function figAngleTri(a,b2){const b=`<polygon points="34,150 262,150 176,34" class="sh"/>`+T(72,142,`${a}°`,{b:1})+T(224,142,`${b2}°`,{b:1})+T(174,66,'x',{b:1});return svg(296,172,b+NDA(296,172),`Triangle with angles ${a}°, ${b2}° and x`);}
function figAngleLine(a){const b=`<line x1="24" y1="130" x2="276" y2="130" class="ln2"/><line x1="150" y1="130" x2="218" y2="36" class="ln2"/>`+T(190,122,`${a}°`,{b:1})+T(116,122,'x',{b:1});return svg(300,150,b+NDA(300,150),`Straight line with a second line meeting it. One angle is ${a}°, the other is x`);}
function figPlan(w,h,scale){const k=Math.min(190/w,100/h),x0=60,y0=24,rw=rd(w*k,1),rh=rd(h*k,1);const b=`<rect x="${x0}" y="${y0}" width="${rw}" height="${rh}" class="sh"/>`+T(x0+rw/2,y0+rh+18,`${w} cm`,{b:1})+T(x0-8,y0+rh/2+4,`${h} cm`,{a:'end',b:1})+T(x0+rw/2,y0+rh/2+4,`Scale 1:${scale}`);
  return svg(300,164,b,`Scale drawing of a rectangle, ${w} cm by ${h} cm, scale 1 to ${scale}`);}

/* ============ answer checking ============ */
/* "1,500" is one thousand five hundred; "1,5" or "12,25" uses a comma as the decimal point */
const commas=s=>/^-?\d+,\d{1,2}$/.test(s)?s.replace(',','.'):s.replace(/,/g,'');
const clean=s=>commas(String(s).replace(/[−–—]/g,'-').replace(/[£%°]/g,'').replace(/\s*(pounds?|p|pence)$/i,'').trim());
/* numbers typed as words: "five", "twenty-one", "three hundred and six", "two thousand" */
const WORDNUM={zero:0,nought:0,none:0};ONES.forEach((w,i)=>{if(w)WORDNUM[w]=i;});TENS.forEach((w,i)=>{if(w)WORDNUM[w]=i*10;});
function wordsToNum(s){const w=String(s).toLowerCase().replace(/-/g,' ').replace(/\band\b|,/g,' ').trim().split(/\s+/).filter(Boolean);if(!w.length)return null;
  let neg=false;if(w[0]==='minus'||w[0]==='negative'){neg=true;w.shift();}if(!w.length)return null;
  let total=0,cur=0;for(const x of w){if(x in WORDNUM)cur+=WORDNUM[x];else if(x==='hundred')cur=(cur||1)*100;else if(x==='thousand'){total+=(cur||1)*1000;cur=0;}else if(x==='million'){total+=(cur||1)*1e6;cur=0;}else return null;}
  return(neg?-1:1)*(total+cur);}
function parseVal(s){const wn=/^[a-z\s,-]+$/i.test(String(s).trim())?wordsToNum(s):null;if(wn!=null)return{v:wn,frac:false,words:true};
  s=clean(s);let m;
  if((m=s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)/))){const w=+m[2],n=+m[3],d=+m[4];if(!d)return null;const k=m[1]?-1:1;return{v:k*(w+n/d),n:k*(w*d+n),d,frac:true};}
  if((m=s.match(/^(-?\d+)\s*\/\s*(\d+)/))){if(!+m[2])return null;return{v:m[1]/m[2],n:+m[1],d:+m[2],frac:true};}
  if((m=s.match(/^-?(\d+\.?\d*|\.\d+)/)))return{v:parseFloat(m[0]),frac:false};
  return null;}
/* Marks one typed answer. Returns {r, why}:
   r is 'ok', 'no', 'empty' (nothing usable typed) or 'nudge' (the right value in the wrong form);
   why says what is wrong with a nudge: 'simplest' (fraction not simplified), 'fraction' (a decimal where a fraction was asked for),
   'money' (pounds and pence need two decimal places, like £6.10) or 'ratio' (ratio not simplified). */
function checkFull(q,raw){
  if(q.kind==='choice')return{r:raw===q.ans?'ok':(raw==null?'empty':'no')};
  const s=String(raw==null?'':raw).trim();if(!s)return{r:'empty'};
  if(q.kind==='coord'){const m=s.replace(/[−–—]/g,'-').match(/-?\d+(\.\d+)?/g);if(!m||m.length<2)return{r:'empty'};return{r:(+m[0]===q.ans[0]&&+m[1]===q.ans[1])?'ok':'no'};}
  if(q.kind==='ratio'){const m=s.match(/\d+(\.\d+)?/g);if(!m)return{r:'empty'};if(m.length!==q.ans.length)return{r:'no'};const v=m.map(Number);if(v.every((x,i)=>x===q.ans[i]))return{r:'ok'};const k=v[0]/q.ans[0];return(k>0&&v.every((x,i)=>Math.abs(x-k*q.ans[i])<1e-9))?{r:'nudge',why:'ratio'}:{r:'no'};}
  const p=parseVal(s);if(!p)return{r:'empty'};
  if(q.kind==='frac'){const t=q.ans.n/q.ans.d;
    if(p.frac){if(Math.abs(p.v-t)>1e-9)return{r:'no'};return(q.simplest&&gcd(p.n,p.d)!==1)?{r:'nudge',why:'simplest'}:{r:'ok'};}
    if(Number.isInteger(t))return{r:Math.abs(p.v-t)<1e-9?'ok':'no'};
    return Math.abs(p.v-t)<0.006?{r:'nudge',why:'fraction'}:{r:'no'};}
  const right=Math.abs(p.v-q.ans)<=(q.tol==null?(q.pre==='£'?0.0051:1e-6):q.tol)+1e-9;
  if(right&&q.pre==='£'&&!p.words&&/\.\d$/.test(clean(s)))return{r:'nudge',why:'money'};
  return{r:right?'ok':'no'};}
const check=(q,raw)=>checkFull(q,raw).r;
function answerText(q){
  if(q.kind==='choice')return q.opts[q.ans];
  if(q.kind==='coord')return`(${sg(q.ans[0])}, ${sg(q.ans[1])})`;
  if(q.kind==='ratio')return q.ans.join(':');
  if(q.kind==='frac')return FM(q.ans.n,q.ans.d);
  if(q.pre==='£')return gbp(q.ans);
  return sg(q.ans)+(q.suf?(/^[%°]|^p$/.test(q.suf)?'':' ')+q.suf:'');}
function typedAnswer(q){ // canonical thing a learner would type (used by tests)
  if(q.kind==='choice')return q.ans;
  if(q.kind==='coord')return`(${q.ans[0]}, ${q.ans[1]})`;
  if(q.kind==='ratio')return q.ans.join(':');
  if(q.kind==='frac')return fracTxt(q.ans.n,q.ans.d);
  if(q.pre==='£'&&!Number.isInteger(q.ans))return q.ans.toFixed(2);
  return String(q.ans);}
const plain=h=>String(h).replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g,' $1/$2').replace(/<sup>(.*?)<\/sup>/g,'^$1').replace(/<br\s*\/?>/g,'\n').replace(/<\/t[dh]>/g,' | ').replace(/<\/tr>/g,'\n').replace(/<svg[\s\S]*?<\/svg>/g,' [diagram] ').replace(/<[^>]+>/g,'').replace(/[ \t]+/g,' ').trim();

