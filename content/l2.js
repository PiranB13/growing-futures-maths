"use strict";
/* Level 2 question generators (G), then topic registration at the bottom of the file. */
/* ============ question generators ============ */
const PI=Math.PI,piTol=v=>v*0.001+0.06;
const G={};

G.n1=[
()=>{const lo=-rnd(2,9),hi=rnd(3,12),t=pick(['Leeds','Truro','Cardiff','Derby','Hull','Perth','Bath','York']);return{calc:false,text:`The temperature in ${t} was ${sg(lo)}°C at 6 am and ${hi}°C at 2 pm. By how many degrees did it rise?`,ans:hi-lo,suf:'°C',
  hint:'Count from the negative number up to zero, then from zero up to the positive number.',steps:[`From ${sg(lo)} up to 0 is ${-lo} degrees.`,`From 0 up to ${hi} is ${hi} degrees.`,`${-lo} + ${hi} = <b>${hi-lo}°C</b>`]};},
()=>{const pool=shuffle([-rnd(10,30),-rnd(2,9),-(rnd(1,9)/10),rnd(1,9)/10,rnd(1,20),-(rnd(1,9)+0.5),0]).slice(0,5),lo=Math.min(...pool);
  return{calc:false,text:'Which of these numbers is the smallest?',...mc(sg(lo),pool.filter(x=>x!==lo).map(sg)),hint:'On a number line, numbers get smaller as you move left. A bigger negative is a smaller number.',
  steps:[`Put them in order: ${pool.slice().sort((a,b)=>a-b).map(sg).join(', ')}.`,`The furthest left on the number line is <b>${sg(lo)}</b>.`]};},
()=>{let n;do{n=rnd(1,9)*1e6+pick([0,rnd(1,9),rnd(10,99),rnd(100,999)])*1000+pick([0,rnd(1,9),rnd(10,99),rnd(100,999)]);}while(n%1e6===0);
  return{calc:false,text:`Write this number in figures: <b>${words(n)}</b>.`,ans:n,hint:'Fill a place-value grid: millions, then three digits for thousands, then three digits for hundreds, tens and ones. Use zeros for empty places.',
  steps:[`Millions: ${Math.floor(n/1e6)}`,`Thousands (3 digits): ${String(Math.floor(n%1e6/1000)).padStart(3,'0')}`,`Hundreds, tens, ones (3 digits): ${String(n%1000).padStart(3,'0')}`,`Answer: <b>${nf(n)}</b>`]};},
()=>{const d=shuffle([1,2,3,4,5,6,7,8,9]).slice(0,7),n=+d.join(''),i=rnd(0,5),val=d[i]*10**(6-i);
  return{calc:false,text:`What is the value of the digit ${d[i]} in ${nf(n)}?`,ans:val,hint:'Work out which column the digit sits in: millions, hundred thousands, ten thousands, thousands, hundreds, tens or ones.',
  steps:[`In ${nf(n)}, the ${d[i]} is in the ${['millions','hundred thousands','ten thousands','thousands','hundreds','tens'][i]} column.`,`Its value is <b>${nf(val)}</b>.`]};},
()=>{const od=rnd(20,150)+pick([0,0.5]),pay=rnd(160,400),n=who();return{calc:false,text:`${n}'s bank balance is −£${od.toFixed(2)} (overdrawn). ${n} pays in £${pay}. What is the new balance?`,ans:rd(pay-od,2),pre:'£',
  hint:'Paying money in moves the balance up. Start at the negative number and add.',steps:[`−${od.toFixed(2)} + ${pay} is the same as ${pay} − ${od.toFixed(2)}.`,`New balance = <b>${gbp(pay-od)}</b>`]};},
];

G.n2=[
()=>{let a,b;do{a=rnd(1,9)*100+pick([0,1,2,3,4,6,7,8,9])*10+rnd(0,9);b=rnd(2,9)*10+pick([1,2,3,4,6,7,8,9]);}while(0);const ra=Math.round(a/100)*100,rb=Math.round(b/10)*10;
  return{calc:false,text:`Estimate ${a} × ${b} by rounding each number to 1 significant figure first.`,ans:ra*rb,hint:'1 significant figure means keep the first digit and turn the rest into zeros, rounding up if the next digit is 5 or more.',
  steps:[`${a} rounds to ${nf(ra)}.`,`${b} rounds to ${rb}.`,`${nf(ra)} × ${rb} = <b>${nf(ra*rb)}</b>`]};},
()=>{const capK=rnd(40,90),cap=capK*1000+pick([0,500]),ad=rnd(18,capK-15)*1000+rnd(100,999),ch=rnd(2,9)*1000+rnd(100,999);
  return{calc:true,text:`A stadium holds ${nf(cap)} people. For one match, ${nf(ad)} adult tickets and ${nf(ch)} child tickets are sold. How many seats are unsold?`,ans:cap-ad-ch,hint:'Add the two ticket numbers, then subtract the total from the capacity.',
  steps:[`Tickets sold: ${nf(ad)} + ${nf(ch)} = ${nf(ad+ch)}`,`Unsold: ${nf(cap)} − ${nf(ad+ch)} = <b>${nf(cap-ad-ch)}</b>`,`Check by adding back: ${nf(cap-ad-ch)} + ${nf(ad+ch)} = ${nf(cap)}.`]};},
()=>{const res=rnd(120,950),div=rnd(12,48),prod=res*div;return{calc:false,text:`${who()} works out ${nf(prod)} ÷ ${div} = ${res}. Which calculation is the best check?`,...mc(`${res} × ${div}`,[`${res} ÷ ${div}`,`${nf(prod)} × ${div}`,`${nf(prod)} − ${div}`]),
  hint:'Check a calculation with the opposite (inverse) operation.',steps:['Multiplying is the inverse of dividing.',`So check with <b>${res} × ${div}</b>, which should give ${nf(prod)}.`]};},
()=>{const n=rnd(12,145),p=rnd(105,695);return{calc:true,text:`A company buys ${n} laptops at £${p} each. What is the total cost?`,ans:n*p,pre:'£',hint:'Multiply the number of laptops by the price of one.',
  steps:[`${n} × £${p} = <b>${gbp(n*p)}</b>`,`Estimate to check: about ${nf(Math.round(n/10)*10)} × ${nf(Math.round(p/100)*100)} = ${nf(Math.round(n/10)*10*Math.round(p/100)*100)}, which is close.`]};},
()=>{const n=rnd(100000,999999),[u,nm]=pick([[10,'ten'],[100,'hundred'],[1000,'thousand'],[10000,'ten thousand']]),a=Math.round(n/u)*u;
  return{calc:false,text:`Round ${nf(n)} to the nearest ${nm}.`,ans:a,hint:`Look at the digit just to the right of the ${nm}s digit. 5 or more rounds up; 4 or less rounds down.`,
  steps:[`${nf(n)} lies between ${nf(Math.floor(n/u)*u)} and ${nf(Math.floor(n/u)*u+u)}.`,`It is closer to <b>${nf(a)}</b>.`]};},
];

G.n3=[
()=>{const w=pick([1.5,1.8,2,2.2,2.4,2.5,3,3.2]),per=pick([40,45,50]),add=pick([15,20,25,30]),a=rd(per*w+add,2);
  return{calc:true,text:`Cooking time in minutes = ${per} × weight in kg + ${add}.<br>Work out the cooking time for a ${w} kg chicken.`,ans:a,suf:'minutes',hint:'Swap the words "weight in kg" for the number, then multiply before you add.',
  steps:[`${per} × ${w} = ${rd(per*w,2)}`,`${rd(per*w,2)} + ${add} = <b>${a} minutes</b>`]};},
()=>{let k;do{k=rnd(-2,9);}while(k===0);const f=32+9*k;return{calc:false,text:`Use the formula <span class="fm">C = 5(F − 32) ÷ 9</span> to convert ${f}°F to degrees Celsius.`,ans:5*k,suf:'°C',hint:'Do the bracket first, then multiply by 5, then divide by 9.',
  steps:[`Bracket: ${f} − 32 = ${sg(f-32)}`,`5 × ${sg(f-32)} = ${sg(5*(f-32))}`,`${sg(5*(f-32))} ÷ 9 = <b>${sg(5*k)}°C</b>`]};},
()=>{const u=rnd(0,20),a=rnd(2,9),t=rnd(3,12);return{calc:false,text:`Use the formula <span class="fm">v = u + at</span> to find v when u = ${u}, a = ${a} and t = ${t}.`,ans:u+a*t,hint:'"at" means a multiplied by t. Multiply before adding.',
  steps:[`at = ${a} × ${t} = ${a*t}`,`v = ${u} + ${a*t} = <b>${u+a*t}</b>`]};},
()=>{const r=pick([38,42,45,48,52,55]),c=pick([25,30,35,40]),h=pick([1.5,2,2.5,3,3.5,4.5]);return{calc:true,text:`A plumber uses the formula <span class="fm">C = ${r}h + ${c}</span>, where C is the charge in pounds and h is the number of hours. Find the charge for a ${h}-hour job.`,ans:rd(r*h+c,2),pre:'£',
  hint:`${r}h means ${r} multiplied by the number of hours.`,steps:[`${r} × ${h} = ${rd(r*h,2)}`,`${rd(r*h,2)} + ${c} = <b>${gbp(r*h+c)}</b>`]};},
()=>{let a,b;do{a=rnd(4,14);b=rnd(4,14);}while((a+b)%2||a===b);const h=rnd(3,10);return{calc:false,text:`The area of a trapezium is <span class="fm">A = ½(a + b)h</span>. Find A when a = ${a} cm, b = ${b} cm and h = ${h} cm.`,ans:(a+b)/2*h,suf:'cm²',hint:'Add a and b, halve the result, then multiply by h.',
  steps:[`a + b = ${a+b}`,`Half of ${a+b} = ${(a+b)/2}`,`${(a+b)/2} × ${h} = <b>${(a+b)/2*h} cm²</b>`]};},
()=>{const fx=pick([20,25,30]),per=pick([0.4,0.5,0.25]),m=rnd(4,30)*10,c=rd(fx+per*m,2);return{calc:true,text:`Van hire costs <span class="fm">C = ${fx} + ${per}m</span>, where C is the cost in pounds and m is the number of miles. A customer pays £${nf(c,2)}. How many miles did they drive?`,ans:m,suf:'miles',
  hint:'Work backwards: take off the fixed charge first, then divide by the cost per mile.',steps:[`${nf(c,2)} − ${fx} = ${rd(c-fx,2)}`,`${rd(c-fx,2)} ÷ ${per} = <b>${m} miles</b>`]};},
];

const FDP=[[1,5],[1,4],[3,10],[7,20],[2,5],[9,20],[1,2],[11,20],[3,5],[5,8],[7,10],[3,4],[4,5],[7,8]];
G.n4=[
()=>{const v=pick([0.35,0.07,0.6,0.125,1.2,0.045,0.9,0.02,0.375,0.8]);return{calc:false,text:`Write ${v} as a percentage.`,ans:rd(v*100,3),suf:'%',hint:'Multiply the decimal by 100.',steps:[`${v} × 100 = <b>${rd(v*100,3)}%</b>`]};},
()=>{const d=pick([4,5,8,10,20,25,40,50]);let n;do{n=rnd(1,d-1);}while(gcd(n,d)!==1);return{calc:false,text:`Write ${F(n,d)} as a decimal.`,ans:rd(n/d,4),hint:'Divide the top by the bottom, or scale the fraction so the bottom is 10, 100 or 1000.',steps:[`${n} ÷ ${d} = <b>${rd(n/d,4)}</b>`]};},
()=>{const p=pick([4,5,8,12,15,24,35,36,45,48,60,65,72,75,85]),s=simp(p,100);return{calc:false,text:`Write ${p}% as a fraction in its simplest form.`,kind:'frac',simplest:true,ans:s,hint:'Per cent means "out of 100". Write it over 100, then divide top and bottom by the same number.',
  steps:[`${p}% = ${F(p,100)}`,`Divide top and bottom by ${gcd(p,100)}: <b>${F(s.n,s.d)}</b>`]};},
()=>{const d=pick([4,5,8,20,25,40]);let n;do{n=rnd(1,d-1);}while(gcd(n,d)!==1);return{calc:false,text:`Write ${F(n,d)} as a percentage.`,ans:rd(n/d*100,3),suf:'%',hint:'Turn it into a decimal (top ÷ bottom), then multiply by 100.',steps:[`${n} ÷ ${d} = ${rd(n/d,4)}`,`${rd(n/d,4)} × 100 = <b>${rd(n/d*100,3)}%</b>`]};},
()=>{const four=shuffle(FDP).slice(0,4),big=pick([true,false]),form=([n,d])=>pick([()=>String(rd(n/d,3)),()=>rd(n/d*100,1)+'%',()=>F(n,d)])(),vals=four.map(f=>f[0]/f[1]),t=big?Math.max(...vals):Math.min(...vals),shown=four.map(form),i=vals.indexOf(t);
  return{calc:false,text:`Which of these is the ${big?'largest':'smallest'}?`,...mc(shown[i],shown.filter((_,k)=>k!==i)),hint:'Change them all into the same form. Decimals are usually easiest to compare.',
  steps:[`As decimals: ${four.map((f,k)=>`${shown[k]} = ${rd(f[0]/f[1],3)}`).join(', ')}.`,`The ${big?'largest':'smallest'} is <b>${shown[i]}</b>.`]};},
];

G.n5=[
()=>{const p=pick([5,10,15,20,25,30,40,60,75]),a=pick([40,60,80,120,160,200,240,360,480,640]);return{calc:false,text:`Work out ${p}% of £${a}.`,ans:p*a/100,pre:'£',hint:'Find 10% by dividing by 10. Build other percentages from it: 5% is half of 10%, 20% is double.',
  steps:[`10% of £${a} = £${a/10}`,`1% of £${a} = £${nf(a/100,2)}`,`${p}% = ${p} × £${nf(a/100,2)} = <b>${gbp(p*a/100)}</b>`]};},
()=>{const p=pick([17.5,12.5,2.5,37.5,8,23,64,3.5]),a=rnd(12,95)*10;return{calc:true,text:`Work out ${p}% of £${a}.`,ans:rd(p*a/100,2),pre:'£',hint:'Turn the percentage into a decimal by dividing by 100, then multiply.',steps:[`${p}% = ${rd(p/100,4)}`,`${rd(p/100,4)} × ${a} = <b>${gbp(rd(p*a/100,2))}</b>`]};},
()=>{const t=pick([20,25,40,50,80,200]),part=rnd(1,t===80?39:t-1)*(t===80?2:1),a=rd(part*100/t,2);return{calc:t>50||t===40,text:`Write ${part} out of ${t} as a percentage.`,ans:a,suf:'%',hint:'Divide the part by the whole, then multiply by 100.',
  steps:[`${part} ÷ ${t} = ${rd(part/t,4)}`,`${rd(part/t,4)} × 100 = <b>${a}%</b>`]};},
()=>{const t=pick([150,250,400,500,750]),pc=pick([12,16,24,28,34,36,42,58,64,72]),part=t*pc/100,[x,y]=pick([['people','cycle to work'],['customers','paid by card'],['students','passed first time'],['parcels','arrived a day early']]);
  return{calc:true,text:`In a survey of ${t} ${x}, ${part} ${y}. What percentage is this?`,ans:pc,suf:'%',hint:'Part ÷ whole × 100.',steps:[`${part} ÷ ${t} = ${rd(part/t,4)}`,`× 100 = <b>${pc}%</b>`]};},
];

G.n6=[
()=>{const o=pick([240,320,400,480,560,640,800,1200]),k=pick([5,7.5,10,12.5,15,20,25,35]),nw=o*(1+k/100);return{calc:true,text:`Monthly rent goes up from £${nf(o)} to £${nf(nw)}. Work out the percentage increase.`,ans:k,suf:'%',hint:'Percentage change = change ÷ original × 100. Always divide by the original amount.',
  steps:[`Change: ${nf(nw)} − ${nf(o)} = ${nf(nw-o)}`,`${nf(nw-o)} ÷ ${nf(o)} = ${rd((nw-o)/o,4)}`,`× 100 = <b>${k}%</b>`]};},
()=>{const o=pick([240,320,400,480,560,640,800,1200]),k=pick([5,7.5,10,12.5,15,20,25,35]),nw=o*(1-k/100);return{calc:true,text:`A laptop was £${nf(o)}. It is now £${nf(nw)}. Work out the percentage decrease.`,ans:k,suf:'%',hint:'Change ÷ original × 100. The original is the price before the drop.',
  steps:[`Change: ${nf(o)} − ${nf(nw)} = ${nf(o-nw)}`,`${nf(o-nw)} ÷ ${nf(o)} = ${rd((o-nw)/o,4)}`,`× 100 = <b>${k}%</b>`]};},
()=>{const o=pick([40,60,80,85,120,150,240,360]),p=pick([10,15,20,25,30,40]),s=rd(o*(1-p/100),2);return{calc:true,text:`In a sale, a coat costs £${nf(s,2)} after a ${p}% discount. What was the original price?`,ans:o,pre:'£',hint:`After ${p}% off you pay ${100-p}% of the original. Divide the sale price by ${rd(1-p/100,2)}.`,
  steps:[`Sale price = ${100-p}% of the original.`,`Original = ${nf(s,2)} ÷ ${rd(1-p/100,2)} = <b>${gbp(o)}</b>`,`Do not just add ${p}% to the sale price. That gives the wrong answer.`]};},
()=>{const o=rnd(180,320)*100,p=pick([2,3,4,5,6]),nw=o*(1+p/100);return{calc:true,text:`After a ${p}% pay rise, ${who()} earns £${nf(nw)} a year. What was the salary before the rise?`,ans:o,pre:'£',hint:`The new salary is ${100+p}% of the old one. Divide by ${rd(1+p/100,2)}.`,
  steps:[`New salary = ${100+p}% of the old salary.`,`Old salary = ${nf(nw)} ÷ ${rd(1+p/100,2)} = <b>${gbp(o)}</b>`]};},
()=>{const a=pick([240,360,480,560,720,960]),k=pick([12.5,17.5,7.5,22.5,35]),up=pick([true,false]),r=rd(a*(1+(up?k:-k)/100),2);return{calc:true,text:`${up?'Increase':'Decrease'} £${a} by ${k}%.`,ans:r,pre:'£',hint:`Find ${k}% of ${a}, then ${up?'add it on':'take it off'}. Or multiply by ${rd(1+(up?k:-k)/100,4)}.`,
  steps:[`${k}% of ${a} = ${rd(a*k/100,2)}`,`${a} ${up?'+':'−'} ${rd(a*k/100,2)} = <b>${gbp(r)}</b>`]};},
];

const cop=(max)=>{let d,n;do{d=pick([2,3,4,5,6,8,10,12].filter(x=>x<=max));n=rnd(1,d-1);}while(gcd(n,d)!==1);return[n,d];};
G.n7=[
()=>{let a,b,c,d;do{[a,b]=cop(12);[c,d]=cop(12);}while(b===d);const L=lcm(b,d),n=a*L/b+c*L/d,s=simp(n,L);
  return{calc:false,text:`Work out ${F(a,b)} + ${F(c,d)}. Give your answer in its simplest form.`,kind:'frac',simplest:true,ans:s,hint:`Change both fractions so they have the same bottom number. ${L} works for both.`,
  steps:[`Common denominator: ${L}.`,`${F(a,b)} = ${F(a*L/b,L)} and ${F(c,d)} = ${F(c*L/d,L)}`,`${F(a*L/b,L)} + ${F(c*L/d,L)} = ${F(n,L)}`,`Simplest form: <b>${FM(n,L)}</b>`]};},
()=>{const w1=rnd(2,5),w2=rnd(1,w1-1);let a,b,c,d;do{[a,b]=cop(8);[c,d]=cop(8);}while(b===d);const L=lcm(b,d),n1=(w1*b+a)*L/b,n2=(w2*d+c)*L/d,s=simp(n1-n2,L);
  return{calc:false,text:`Work out ${w1}${F(a,b)} − ${w2}${F(c,d)}. Give your answer in its simplest form.`,kind:'frac',simplest:true,ans:s,hint:'Turn each mixed number into a top-heavy fraction first, then use a common denominator.',
  steps:[`${w1}${F(a,b)} = ${F(w1*b+a,b)} and ${w2}${F(c,d)} = ${F(w2*d+c,d)}`,`Over ${L}: ${F(n1,L)} − ${F(n2,L)} = ${F(n1-n2,L)}`,`Simplest form: <b>${FM(n1-n2,L)}</b>`]};},
()=>{const pool=[[1,2],[2,3],[3,4],[3,5],[5,8],[7,12],[5,6],[7,10],[11,20],[5,9],[4,7],[9,16]],four=shuffle(pool).slice(0,4),vals=four.map(f=>f[0]/f[1]),i=vals.indexOf(Math.max(...vals));
  return{calc:false,text:'Which of these fractions is the largest?',...mc(F(...four[i]),four.filter((_,k)=>k!==i).map(f=>F(...f))),hint:'Change each fraction to a decimal (top ÷ bottom) or give them all the same denominator.',
  steps:[`As decimals: ${four.map(f=>`${F(...f)} ≈ ${rd(f[0]/f[1],3)}`).join(', ')}.`,`The largest is <b>${F(...four[i])}</b>.`]};},
()=>{let a,b,c,d;do{b=pick([3,4,5,6,8,10]);d=pick([3,4,5,6,8,10]);a=rnd(1,2);c=rnd(1,2);}while(b===d||gcd(a,b)!==1||gcd(c,d)!==1||a/b+c/d>=0.95);const L=lcm(b,d),used=a*L/b+c*L/d,s=simp(L-used,L),n=who();
  return{calc:false,text:`${n} uses ${F(a,b)} of a bag of flour for bread and ${F(c,d)} of the bag for a cake. What fraction of the bag is left? Give your answer in its simplest form.`,kind:'frac',simplest:true,ans:s,hint:'Add the two fractions, then subtract the total from 1 whole.',
  steps:[`Used: ${F(a*L/b,L)} + ${F(c*L/d,L)} = ${F(used,L)}`,`Left: ${F(L,L)} − ${F(used,L)} = ${F(L-used,L)}`,`Simplest form: <b>${F(s.n,s.d)}</b>`]};},
];

G.n8=[
()=>{let p,q;do{q=rnd(3,12);p=rnd(1,q-1);}while(gcd(p,q)!==1);const g=rnd(2,9);return{calc:false,text:`Write ${p*g} as a fraction of ${q*g}. Give your answer in its simplest form.`,kind:'frac',simplest:true,ans:{n:p,d:q},hint:'Put the first number on top and the second on the bottom, then simplify.',
  steps:[`${F(p*g,q*g)}`,`Divide top and bottom by ${g}: <b>${F(p,q)}</b>`]};},
()=>{let p,q;do{q=rnd(3,10);p=rnd(1,q-1);}while(gcd(p,q)!==1);const g=rnd(3,8),[x,y]=pick([['students in a class','walk to college'],['staff in an office','work part time'],['cars in a car park','are electric'],['players in a squad','are injured']]);
  return{calc:false,text:`There are ${q*g} ${x}. ${p*g} of them ${y}. What fraction ${y}? Give your answer in its simplest form.`,kind:'frac',simplest:true,ans:{n:p,d:q},hint:'Part over whole, then simplify.',steps:[`${F(p*g,q*g)}`,`Divide top and bottom by ${g}: <b>${F(p,q)}</b>`]};},
()=>{const[pt,pv,wt,wv,how]=pick([['45 minutes',45,'2 hours',120,'2 hours = 120 minutes'],['350 g',350,'1 kg',1000,'1 kg = 1000 g'],['80p',80,'£5',500,'£5 = 500p'],['25 cm',25,'2 m',200,'2 m = 200 cm'],['400 ml',400,'2 litres',2000,'2 litres = 2000 ml'],['40 minutes',40,'1 hour',60,'1 hour = 60 minutes'],['750 m',750,'3 km',3000,'3 km = 3000 m'],['15 seconds',15,'1 minute',60,'1 minute = 60 seconds']]),s=simp(pv,wv);
  return{calc:false,text:`What fraction of ${wt} is ${pt}? Give your answer in its simplest form.`,kind:'frac',simplest:true,ans:s,hint:'Change both amounts into the same unit before you write the fraction.',steps:[`Same units: ${how}.`,`${F(pv,wv)}`,`Simplest form: <b>${F(s.n,s.d)}</b>`]};},
];

const decSet=()=>{let v;do{const a=rnd(1,8);let b;do{b=rnd(1,9);}while(b===a);v=[...new Set(shuffle([`0.${a}`,`0.${a}${b}`,`0.${a}0${b}`,`0.0${a}${b}`,`0.${b}${a}`,`0.${b}`]).slice(0,4))];}while(new Set(v.map(Number)).size<4);return v;};
G.n9=[
()=>{const N=rnd(10000,99999),dp=pick([1,2,3]),a=Math.round(N/10**(4-dp))/10**dp,str=(N/10000).toFixed(4);return{calc:false,text:`Round ${str} to ${dp} decimal place${dp>1?'s':''}.`,ans:a,tol:1e-9,hint:`Keep ${dp} digit${dp>1?'s':''} after the point. Look at the next digit: 5 or more rounds up.`,
  steps:[`The digit after decimal place ${dp} is ${str[2+dp]}.`,`${+str[2+dp]>=5?'5 or more, so round up':'4 or less, so round down'}: <b>${a.toFixed(dp)}</b>`]};},
()=>{const v=decSet(),big=pick([true,false]),nums=v.map(Number),t=big?Math.max(...nums):Math.min(...nums),i=nums.indexOf(t);return{calc:false,text:`Which of these decimals is the ${big?'largest':'smallest'}?`,...mc(v[i],v.filter((_,k)=>k!==i)),hint:'Write them all with 3 decimal places by adding zeros, then compare like whole numbers.',
  steps:[`With 3 decimal places: ${nums.map(n=>n.toFixed(3)).join(', ')}.`,`The ${big?'largest':'smallest'} is <b>${v[i]}</b>.`]};},
()=>{const v=decSet(),asc=v.slice().sort((a,b)=>a-b),right=asc.join(', '),wr=new Set();wr.add(asc.slice().reverse().join(', '));while(wr.size<3){const s=shuffle(v).join(', ');if(s!==right)wr.add(s);}
  return{calc:false,text:'Which list shows the decimals in order, smallest first?',...mc(right,[...wr]),hint:'Line up the decimal points and add zeros so each number has 3 decimal places.',steps:[`With 3 decimal places: ${asc.map(n=>(+n).toFixed(3)).join(', ')}.`,`Order: <b>${right}</b>`]};},
()=>{const a=rnd(3,19)+pick([0.1,0.2,0.3,-0.1,-0.2,-0.3]),b=rnd(2,9)+pick([0.07,0.12,-0.09,0.21,-0.15]),ra=Math.round(a),rb=Math.round(b);return{calc:false,text:`Estimate ${a.toFixed(1)} × ${b.toFixed(2)} by rounding each number to the nearest whole number.`,ans:ra*rb,hint:'Round each number first, then multiply the rounded numbers.',
  steps:[`${a.toFixed(1)} rounds to ${ra}.`,`${b.toFixed(2)} rounds to ${rb}.`,`${ra} × ${rb} = <b>${ra*rb}</b>`]};},
];

const d3=n=>String(rd(n,3));
G.n10=[
()=>{let A=rnd(1000,29999),B=rnd(1000,19999);const add=pick([true,false]);if(!add&&A<B)[A,B]=[B,A];if(A===B)A+=125;const a=(add?A+B:A-B)/1000;return{calc:false,text:`Work out ${d3(A/1000)} ${add?'+':'−'} ${d3(B/1000)}`,ans:rd(a,3),tol:1e-9,hint:'Line up the decimal points. Fill gaps with zeros so both numbers have the same number of decimal places.',
  steps:[`Write as ${(A/1000).toFixed(3)} ${add?'+':'−'} ${(B/1000).toFixed(3)}.`,`Answer: <b>${d3(a)}</b>`]};},
()=>{const A=rnd(2,9),B=pick([rnd(2,9),rnd(11,25)]);return{calc:false,text:`Work out 0.${A} × ${d3(B/10)}`,ans:rd(A*B/100,3),tol:1e-9,hint:'Ignore the decimal points and multiply the whole numbers. Then put back the total number of decimal places.',
  steps:[`${A} × ${B} = ${A*B}`,`There are 2 decimal places in the question altogether, so the answer has 2: <b>${d3(A*B/100)}</b>`]};},
()=>{const A=rnd(12,99),B=rnd(12,95);return{calc:true,text:`Work out ${d3(A/10)} × ${d3(B/100)}`,ans:rd(A*B/1000,3),tol:1e-9,hint:'On a calculator, type it exactly as written. Estimate first so you can spot a slip.',steps:[`${d3(A/10)} × ${d3(B/100)} = <b>${d3(A*B/1000)}</b>`,`Estimate: ${Math.round(A/10)} × ${rd(B/100,1)} ≈ ${rd(Math.round(A/10)*rd(B/100,1),1)}.`]};},
()=>{const dv=pick([0.2,0.3,0.4,0.5,0.6,0.8,1.2,1.5,2.5]),res=rnd(12,480)/10,tot=rd(dv*res,3);return{calc:true,text:`Work out ${d3(tot)} ÷ ${dv}`,ans:res,tol:1e-9,hint:'Multiply both numbers by 10 so you divide by a whole number. The answer stays the same.',steps:[`${d3(tot)} ÷ ${dv} = ${d3(tot*10)} ÷ ${d3(dv*10)}`,`= <b>${d3(res)}</b>`]};},
()=>{const p=pick([0.35,0.45,0.6,0.75,1.2,0.25]),n=rnd(4,16),tot=rd(p*n,3);return{calc:true,text:`A length of timber is ${d3(tot)} m long. It is cut into pieces that are each ${p} m long. How many pieces are there?`,ans:n,hint:'Divide the total length by the length of one piece.',steps:[`${d3(tot)} ÷ ${p} = <b>${n} pieces</b>`]};},
()=>{const n1=rnd(2,5),p1=pick([135,235,85,199,345]),n2=rnd(2,4),p2=pick([180,65,220,415]),c=n1*p1+n2*p2,note=c<1000?10:c<2000?20:50;return{calc:true,text:`${who()} buys ${n1} sandwiches at £${(p1/100).toFixed(2)} each and ${n2} drinks at £${(p2/100).toFixed(2)} each. How much change is there from a £${note} note?`,ans:(note*100-c)/100,pre:'£',
  hint:'Work out each cost, add them, then subtract from the note.',steps:[`${n1} × £${(p1/100).toFixed(2)} = £${(n1*p1/100).toFixed(2)}`,`${n2} × £${(p2/100).toFixed(2)} = £${(n2*p2/100).toFixed(2)}`,`Total: £${(c/100).toFixed(2)}`,`Change: £${note} − £${(c/100).toFixed(2)} = <b>${gbp((note*100-c)/100)}</b>`]};},
];

G.n11=[
()=>{const parts=pick([[2,3],[3,5],[1,4],[2,7],[3,4],[2,3,4],[1,2,5],[3,4,5]]),u=pick([5,8,12,15,20,24,30,45]),sum=parts.reduce((a,b)=>a+b),big=pick([true,false]),t=big?Math.max(...parts):Math.min(...parts);
  return{calc:false,text:`£${u*sum} is shared in the ratio ${parts.join(':')}. How much is the ${big?'largest':'smallest'} share?`,ans:t*u,pre:'£',hint:'Add the parts of the ratio, divide the total by that number to find one part, then multiply.',
  steps:[`Total parts: ${parts.join(' + ')} = ${sum}`,`One part: £${u*sum} ÷ ${sum} = £${u}`,`${big?'Largest':'Smallest'} share: ${t} × £${u} = <b>${gbp(t*u)}</b>`]};},
()=>{let a,b;do{a=rnd(1,9);b=rnd(1,9);}while(a===b||gcd(a,b)!==1);const g=rnd(2,12);return{calc:false,text:`Write the ratio ${a*g}:${b*g} in its simplest form.`,kind:'ratio',ans:[a,b],hint:'Divide both sides by the largest number that goes into both.',steps:[`Both numbers divide by ${g}.`,`${a*g} ÷ ${g} = ${a} and ${b*g} ÷ ${g} = ${b}`,`Simplest form: <b>${a}:${b}</b>`]};},
()=>{const base=pick([4,6,8]),per=pick([25,40,50,75,125]);let tg;do{tg=pick([3,9,10,12,14,15,18,20]);}while(tg===base);const item=pick(['flour','rice','pasta','sugar']);
  return{calc:true,text:`A recipe for ${base} people uses ${per*base} g of ${item}. How much ${item} is needed for ${tg} people?`,ans:per*tg,suf:'g',hint:'Find the amount for 1 person first, then multiply.',steps:[`For 1 person: ${per*base} ÷ ${base} = ${per} g`,`For ${tg} people: ${per} × ${tg} = <b>${nf(per*tg)} g</b>`]};},
()=>{const tot=pick([24,36,48,60,72,120]),ds=[2,3,4,5,6,8,10,12].filter(x=>tot%x===0),w1=pick(ds);let w2;do{w2=pick(ds);}while(w2===w1);const[x,y]=pick([['painters','paint a school'],['workers','build a wall'],['machines','fill an order'],['people','pack a delivery']]);
  return{calc:false,text:`${w1} ${x} take ${tot/w1} days to ${y}. How many days would ${w2} ${x} take, working at the same rate?`,ans:tot/w2,suf:'days',hint:'Find the total amount of work first: workers × days. That total stays the same.',
  steps:[`Total work: ${w1} × ${tot/w1} = ${tot} worker-days`,`${tot} ÷ ${w2} = <b>${tot/w2} days</b>`,`${w2>w1?'More':'Fewer'} workers means ${w2>w1?'fewer':'more'} days. This is inverse proportion.`]};},
()=>{const[a,b]=pick([[1,3],[1,4],[2,5],[3,7],[2,3]]),k=pick([5,6,8,12,15,20]);return{calc:false,text:`Concrete is made from cement and sand in the ratio ${a}:${b}. How much sand is needed with ${a*k} kg of cement?`,ans:b*k,suf:'kg',hint:'Work out what one part is worth using the cement, then multiply by the sand part.',
  steps:[`${a} part${a>1?'s':''} = ${a*k} kg, so 1 part = ${k} kg`,`Sand: ${b} × ${k} = <b>${b*k} kg</b>`]};},
()=>{let s1,s2,p1,p2,u1,u2;do{s1=pick([250,400,500]);s2=pick([750,1000,1200]);const a=rnd(40,70)/100;p1=rd(s1/100*a,2);p2=rd(s2/100*(a+pick([-0.06,-0.04,0.03,0.05])),2);u1=p1/s1;u2=p2/s2;}while(Math.abs(u1-u2)<0.0002);
  const o=[`The ${s1} g pack`,`The ${nf(s2)} g pack`,'They are the same value'];return{calc:true,text:`Coffee is sold in two sizes: ${s1} g for £${p1.toFixed(2)} and ${nf(s2)} g for £${p2.toFixed(2)}. Which is better value?`,kind:'choice',opts:o,ans:u1<u2?0:1,
  hint:'Work out the price for the same amount of each, for example the cost of 100 g.',steps:[`${s1} g pack: £${p1.toFixed(2)} ÷ ${s1/100} = ${rd(u1*10000,1)}p per 100 g`,`${nf(s2)} g pack: £${p2.toFixed(2)} ÷ ${s2/100} = ${rd(u2*10000,1)}p per 100 g`,`Cheaper per 100 g: <b>${o[u1<u2?0:1]}</b>`]};},
];

G.n12=[
()=>{const t=pick([
  ()=>{const a=rnd(2,9),b=rnd(2,5),c=rnd(2,5);return[`${a} + ${b} × ${c}<sup>2</sup>`,a+b*c*c,[`Index first: ${c}<sup>2</sup> = ${c*c}`,`Multiply: ${b} × ${c*c} = ${b*c*c}`,`Add: ${a} + ${b*c*c} = <b>${a+b*c*c}</b>`]];},
  ()=>{const a=rnd(2,6),b=rnd(2,6),c=rnd(2,4),d=rnd(2,5);return[`(${a} + ${b})<sup>2</sup> − ${c} × ${d}`,(a+b)**2-c*d,[`Bracket: ${a} + ${b} = ${a+b}`,`Index: ${a+b}<sup>2</sup> = ${(a+b)**2}`,`Multiply: ${c} × ${d} = ${c*d}`,`Subtract: ${(a+b)**2} − ${c*d} = <b>${(a+b)**2-c*d}</b>`]];},
  ()=>{const c=rnd(2,6),b=c+rnd(2,7),a=rnd(2,6),d=rnd(2,6);return[`${a} × (${b} − ${c}) + ${d}<sup>2</sup>`,a*(b-c)+d*d,[`Bracket: ${b} − ${c} = ${b-c}`,`Index: ${d}<sup>2</sup> = ${d*d}`,`Multiply: ${a} × ${b-c} = ${a*(b-c)}`,`Add: ${a*(b-c)} + ${d*d} = <b>${a*(b-c)+d*d}</b>`]];},
  ()=>{let a,c,q,b;do{a=rnd(4,9);c=rnd(2,6);q=rnd(2,9);b=a*a-c*q;}while(b<=0);return[`(${a}<sup>2</sup> − ${b}) ÷ ${c}`,q,[`Inside the bracket, index first: ${a}<sup>2</sup> = ${a*a}`,`${a*a} − ${b} = ${a*a-b}`,`Divide: ${a*a-b} ÷ ${c} = <b>${q}</b>`]];},
  ()=>{const n=rnd(3,5),a=rnd(2,6),b=rnd(3,15);return[`2<sup>${n}</sup> × ${a} − ${b}`,2**n*a-b,[`Index: 2<sup>${n}</sup> = ${2**n}`,`Multiply: ${2**n} × ${a} = ${2**n*a}`,`Subtract: ${2**n*a} − ${b} = <b>${2**n*a-b}</b>`]];},
  ()=>{const r=rnd(3,12),a=rnd(2,7);return[`√${r*r} + ${a}<sup>2</sup>`,r+a*a,[`Square root: √${r*r} = ${r}`,`Index: ${a}<sup>2</sup> = ${a*a}`,`Add: ${r} + ${a*a} = <b>${r+a*a}</b>`]];},
  ])();return{calc:false,text:`Work out <span class="fm">${t[0]}</span>`,ans:t[1],hint:'Use BIDMAS: Brackets, Indices, Division and Multiplication, then Addition and Subtraction.',steps:t[2]};},
()=>{let b,e;do{b=rnd(2,6);e=rnd(2,5);}while(b**e>1300);return{calc:false,text:`Work out <span class="fm">${b}<sup>${e}</sup></span>`,ans:b**e,hint:`The small number tells you how many ${b}s to multiply together. It does not mean ${b} × ${e}.`,steps:[`${b}<sup>${e}</sup> = ${Array(e).fill(b).join(' × ')}`,`= <b>${nf(b**e)}</b>`]};},
];

G.m13=[
()=>{const P=pick([500,800,1000,1500,2000,2500,4000]),r=pick([2,3,4,5,2.5]),n=pick([2,3]),a=rd(P*(1+r/100)**n,2);const st=[];let v=P;for(let y=1;y<=n;y++){const nv=v*(1+r/100);st.push(`Year ${y}: £${nf(v,2)} × ${rd(1+r/100,3)} = £${nf(nv,2)}`);v=nv;}
  return{calc:true,text:`£${nf(P)} is invested at ${r}% compound interest per year. How much is the investment worth after ${n} years?`,ans:a,pre:'£',tol:0.021,hint:`Multiply by ${rd(1+r/100,3)} once for each year. The interest is added before the next year is worked out.`,steps:[...st,`After ${n} years: <b>${gbp(a)}</b>`]};},
()=>{const net=pick([45,80,125,240,450,699,1250]),a=rd(net*1.2,2);return{calc:true,text:`A builder quotes £${nf(net)} plus VAT at 20%. What is the total price including VAT?`,ans:a,pre:'£',hint:'Find 20% of the price and add it on, or multiply by 1.2.',steps:[`VAT: 20% of ${nf(net)} = ${nf(net*0.2,2)}`,`Total: ${nf(net)} + ${nf(net*0.2,2)} = <b>${gbp(a)}</b>`]};},
()=>{const p=pick([35,48,64,85,120,199,250]),d=pick([10,15,20,25,30,35,40]),a=rd(p*(1-d/100),2);return{calc:true,text:`A jacket costs £${p}. There is ${d}% off in a sale. What is the sale price?`,ans:a,pre:'£',hint:`Find ${d}% of the price and take it off, or multiply by ${rd(1-d/100,2)}.`,steps:[`Discount: ${d}% of ${p} = ${nf(p*d/100,2)}`,`Sale price: ${p} − ${nf(p*d/100,2)} = <b>${gbp(a)}</b>`]};},
()=>{const pay=rnd(150,220)*10,rent=rnd(50,75)*10,bills=rnd(120,220),food=rnd(200,320);let tr=rnd(60,140);if((pay-rent-bills-food-tr)%2)tr++;const left=pay-rent-bills-food-tr,n=who();
  return{calc:true,text:`${n} takes home £${nf(pay)} a month. The monthly costs are: rent £${rent}, bills £${bills}, food £${food} and travel £${tr}. ${n} saves half of what is left. How much is saved each month?`,ans:left/2,pre:'£',hint:'Add up all the costs, subtract from the pay, then halve what is left.',
  steps:[`Costs: ${rent} + ${bills} + ${food} + ${tr} = ${nf(rent+bills+food+tr)}`,`Left over: ${nf(pay)} − ${nf(rent+bills+food+tr)} = ${left}`,`Half of ${left} = <b>${gbp(left/2)}</b>`]};},
()=>{const sal=rnd(180,480)*100,a=rd((sal-12570)*0.2,2);return{calc:true,text:`${who()} earns £${nf(sal)} a year. The first £12,570 is tax free. The rest is taxed at 20%. How much income tax is due for the year?`,ans:a,pre:'£',hint:'Take off the tax-free amount first. Only the rest is taxed.',steps:[`Taxable income: ${nf(sal)} − 12,570 = ${nf(sal-12570)}`,`20% of ${nf(sal-12570)} = <b>${gbp(a)}</b>`]};},
()=>{const cash=pick([360,480,540,650,800,1200]),dp=pick([10,20,25]),mo=pick([12,24]),monthly=Math.round(cash*(1-dp/100)*(1+pick([0.08,0.12,0.15]))/mo),tot=cash*dp/100+mo*monthly;
  return{calc:true,text:`A sofa costs £${nf(cash)} if you pay in full. On credit you pay a ${dp}% deposit, then ${mo} monthly payments of £${monthly}. How much more does the sofa cost on credit?`,ans:rd(tot-cash,2),pre:'£',hint:'Work out the deposit, add all the monthly payments, then compare with the cash price.',
  steps:[`Deposit: ${dp}% of ${nf(cash)} = ${nf(cash*dp/100)}`,`Payments: ${mo} × ${monthly} = ${nf(mo*monthly)}`,`Credit total: ${nf(tot)}`,`Extra: ${nf(tot)} − ${nf(cash)} = <b>${gbp(tot-cash)}</b>`]};},
];

const CONV=[['mile','miles','km',1.6],['kg','kg','pounds (lb)',2.2],['gallon','gallons','litres',4.5],['inch','inches','cm',2.54],['foot','feet','metres',0.3],['ounce','ounces','grams',28]];
const GRAPHS=[{x:'Inches',y:'Centimetres',xu:'inches',yu:'cm',xmax:20,xstep:4,xminor:2,ymax:50,ystep:10,yminor:5,m:2.5},{x:'Miles',y:'Kilometres',xu:'miles',yu:'km',xmax:50,xstep:10,xminor:5,ymax:80,ystep:16,yminor:8,m:1.6},{x:'Gallons',y:'Litres',xu:'gallons',yu:'litres',xmax:10,xstep:2,xminor:1,ymax:45,ystep:9,yminor:4.5,m:4.5},{x:'Feet',y:'Metres',xu:'feet',yu:'metres',xmax:50,xstep:10,xminor:5,ymax:15,ystep:3,yminor:1.5,m:0.3}];
G.m14=[
()=>{const[s,p,b,f]=pick(CONV),x=rnd(3,60),a=rd(x*f,2);return{calc:true,text:`Use 1 ${s} = ${f} ${b}.<br>Convert ${x} ${p} to ${b}.`,ans:a,suf:b.replace(/ \(lb\)/,''),tol:0.006,hint:`Each ${s} is worth ${f} ${b}, so multiply.`,steps:[`${x} × ${f} = <b>${nf(a)} ${b}</b>`]};},
()=>{const[s,p,b,f]=pick(CONV),k=rnd(3,60),y=rd(k*f,2);return{calc:true,text:`Use 1 ${s} = ${f} ${b}.<br>Convert ${nf(y)} ${b} to ${p}.`,ans:k,suf:p,tol:0.006,hint:`You are going back the other way, so divide by ${f}.`,steps:[`${nf(y)} ÷ ${f} = <b>${k} ${p}</b>`]};},
()=>{const[v,from,to,f,op]=pick([[rnd(12,95)/20,'km','metres',1000,'×'],[rnd(15,60)*50,'g','kg',0.001,'÷'],[rnd(3,39)*50,'ml','litres',0.001,'÷'],[rnd(12,48)*5,'cm','metres',0.01,'÷'],[rnd(15,98),'mm','cm',0.1,'÷'],[rnd(12,95)/20,'kg','g',1000,'×'],[rnd(12,60)/8,'litres','ml',1000,'×'],[rnd(12,60)/8,'metres','cm',100,'×']]),a=rd(v*f,4),k=f>=1?f:Math.round(1/f);
  return{calc:false,text:`Convert ${nf(v)} ${from} to ${to}.`,ans:a,suf:to,hint:`There are ${nf(k)} ${f>=1?to:from} in 1 ${f>=1?from:to}. Going to a smaller unit, multiply. Going to a bigger unit, divide.`,steps:[`${nf(v)} ${op} ${nf(k)} = <b>${nf(a)} ${to}</b>`]};},
()=>{const g=pick(GRAPHS),i=rnd(g.xminor===1?2:1,Math.round(g.xmax/g.xminor)-1),xv=i*g.xminor,yv=rd(xv*g.m,2),mode=pick(['f','r','s']),fig=plot({...g,xl:g.x,yl:g.y,line:[g.m,0],label:`Conversion graph. Straight line from 0 ${g.xu} = 0 ${g.yu} to ${g.xmax} ${g.xu} = ${rd(g.xmax*g.m,2)} ${g.yu}`});
  if(mode==='f')return{calc:false,fig,text:`Use the conversion graph to change ${xv} ${g.xu} into ${g.yu}.`,ans:yv,suf:g.yu,tol:g.yminor*0.3,hint:`Find ${xv} on the ${g.x} axis, go straight up to the line, then across to the ${g.y} axis.`,steps:[`Go up from ${xv} ${g.xu} to the line.`,`Read across: <b>${nf(yv)} ${g.yu}</b>`]};
  if(mode==='r')return{calc:false,fig,text:`Use the conversion graph to change ${nf(yv)} ${g.yu} into ${g.xu}.`,ans:xv,suf:g.xu,tol:g.xminor*0.3,hint:`Find ${nf(yv)} on the ${g.y} axis, go across to the line, then straight down.`,steps:[`Go across from ${nf(yv)} ${g.yu} to the line.`,`Read down: <b>${xv} ${g.xu}</b>`]};
  return{calc:true,fig,text:`Use the conversion graph to change ${nf(xv*10)} ${g.xu} into ${g.yu}.`,ans:yv*10,suf:g.yu,tol:g.yminor*1.5,hint:`${nf(xv*10)} is off the graph. Read the value for ${xv} ${g.xu}, then multiply by 10.`,steps:[`From the graph, ${xv} ${g.xu} = ${nf(yv)} ${g.yu}.`,`${nf(xv*10)} is 10 times bigger: ${nf(yv)} × 10 = <b>${nf(yv*10)} ${g.yu}</b>`]};},
()=>{let lb,kg;do{lb=rnd(2,9);kg=lb/2.2;}while(Math.abs(kg/0.5-Math.round(kg/0.5))<0.03);const bags=Math.ceil(kg/0.5);return{calc:true,text:`A recipe needs ${lb} lb of flour. Flour is sold in 500 g bags. Use 1 kg = 2.2 lb. How many bags are needed?`,ans:bags,suf:'bags',hint:'Change pounds to kg by dividing by 2.2, then see how many 0.5 kg bags cover it. You cannot buy part of a bag.',
  steps:[`${lb} ÷ 2.2 = ${rd(kg,3)} kg`,`${rd(kg,3)} ÷ 0.5 = ${rd(kg/0.5,2)} bags`,`Round up to whole bags: <b>${bags}</b>`]};},
];

G.m15=[
()=>{const t=pick([1.5,2,2.5,3,3.5,4,4.5]),v=pick([36,42,48,54,56,60,64,68]),u=pick(['miles','km']);return{calc:true,text:`A coach travels ${v*t} ${u} in ${hm(t)}. What is its average speed?`,ans:v,suf:u==='miles'?'mph':'km/h',hint:'Speed = distance ÷ time. Write the time in hours as a decimal first: 30 minutes is 0.5 hours.',steps:[`${hm(t)} = ${t} hours`,`${v*t} ÷ ${t} = <b>${v} ${u==='miles'?'mph':'km/h'}</b>`]};},
()=>{const t=pick([1.5,2.5,3.5,1.25,2.25,0.75,1.75]),v=pick([40,48,56,60,64,72,80]);return{calc:true,text:`A van travels ${v*t} miles at an average speed of ${v} mph. How long does the journey take? Give your answer in minutes.`,ans:t*60,suf:'minutes',hint:'Time = distance ÷ speed. That gives hours. Multiply by 60 to get minutes.',steps:[`${v*t} ÷ ${v} = ${t} hours`,`${t} × 60 = <b>${t*60} minutes</b>`]};},
()=>{const t=pick([1.5,2.5,0.75,1.25,3.5,2.75]),v=pick([44,48,52,56,60,64,68]);return{calc:true,text:`A train travels at an average speed of ${v} mph for ${hm(t)}. How far does it travel?`,ans:v*t,suf:'miles',hint:'Distance = speed × time, with the time in hours as a decimal.',steps:[`${hm(t)} = ${t} hours`,`${v} × ${t} = <b>${v*t} miles</b>`]};},
()=>{const d=pick([0.8,1.2,2.5,2.7,7.8,8.9,11.3,19.3]),vol=pick([20,50,80,120,200,250,500]),m=rd(d*vol,2),ask=pick(['d','m']);
  return ask==='d'?{calc:true,text:`A metal block has a mass of ${nf(m)} g and a volume of ${vol} cm³. What is its density?`,ans:d,suf:'g/cm³',hint:'Density = mass ÷ volume.',steps:[`${nf(m)} ÷ ${vol} = <b>${d} g/cm³</b>`]}
   :{calc:true,text:`A material has a density of ${d} g/cm³. What is the mass of ${vol} cm³ of it?`,ans:m,suf:'g',hint:'Mass = density × volume.',steps:[`${d} × ${vol} = <b>${nf(m)} g</b>`]};},
()=>{const r=pick([11.44,12.21,12.60,13.50,14.25,15.80]),h=pick([35,37.5,38,40]),ot=rnd(2,8),a=rd(r*h+r*1.5*ot,2);return{calc:true,text:`${who()} is paid £${r.toFixed(2)} an hour for a ${h}-hour week. Overtime is paid at time and a half. One week includes ${ot} hours of overtime. What is the total pay for that week?`,ans:a,pre:'£',tol:0.011,
  hint:'Time and a half means 1.5 × the normal hourly rate. Work out basic pay and overtime pay separately.',steps:[`Basic: ${h} × ${r.toFixed(2)} = ${nf(r*h,2)}`,`Overtime rate: ${r.toFixed(2)} × 1.5 = ${nf(r*1.5,3)}`,`Overtime: ${ot} × ${nf(r*1.5,3)} = ${nf(r*1.5*ot,2)}`,`Total: <b>${gbp(a)}</b>`]};},
()=>{const r=pick([11.44,12.21,12.60,13.50,14.25,15.80]),h=pick([24,30,35,37.5,40]),p=rd(r*h,2);return{calc:true,text:`${who()} earns £${nf(p,2)} for ${h} hours of work. What is the hourly rate of pay?`,ans:r,pre:'£',hint:'Rate of pay = total pay ÷ hours worked.',steps:[`${nf(p,2)} ÷ ${h} = <b>${gbp(r)} per hour</b>`]};},
()=>{const per=pick([4.5,5.2,6.5,7.4,8]),km=rnd(12,60)*10,a=rd(per*km/100,2);return{calc:true,text:`A car uses ${per} litres of fuel for every 100 km. How much fuel does it use on a ${km} km journey?`,ans:a,suf:'litres',hint:'Find how many lots of 100 km are in the journey, then multiply by the fuel for each 100 km.',steps:[`${km} ÷ 100 = ${km/100}`,`${km/100} × ${per} = <b>${a} litres</b>`]};},
];

G.m16=[
()=>{let b,h;do{b=rnd(6,18);h=rnd(4,14);}while((b*h)%2);return{calc:false,fig:figTri(b,h,'cm'),text:'Work out the area of the triangle.',ans:b*h/2,suf:'cm²',hint:'Area of a triangle = ½ × base × height. Use the height that meets the base at a right angle.',steps:[`½ × ${b} × ${h}`,`= ½ × ${b*h} = <b>${b*h/2} cm²</b>`]};},
()=>{const isD=pick([true,false]),r=rnd(2,15),ask=pick(['a','c']),v=ask==='a'?PI*r*r:2*PI*r,a=rd(v,1);
  return{calc:true,fig:figCircle(isD?2*r:r,isD,'cm'),text:`Work out the ${ask==='a'?'area':'circumference'} of the circle. Give your answer to 1 decimal place.`,ans:a,suf:ask==='a'?'cm²':'cm',tol:piTol(v),hint:ask==='a'?'Area = π × radius². If you are given the diameter, halve it first.':'Circumference = π × diameter. The diameter is twice the radius.',
  steps:ask==='a'?[isD?`Radius = ${2*r} ÷ 2 = ${r} cm`:`Radius = ${r} cm`,`π × ${r}² = π × ${r*r}`,`= <b>${a} cm²</b>`]:[isD?`Diameter = ${2*r} cm`:`Diameter = 2 × ${r} = ${2*r} cm`,`π × ${2*r} = <b>${a} cm</b>`]};},
()=>{const W=rnd(8,15),H=rnd(6,12),w2=rnd(2,W-3),h2=rnd(2,H-3),per=pick([true,false]);
  return per?{calc:false,fig:figL(W,H,w2,h2,'m'),text:'Work out the perimeter of this L-shaped room.',ans:2*(W+H),suf:'m',hint:'Find the two missing side lengths first by subtracting, then add up all six sides.',steps:[`Missing top side: ${W} − ${w2} = ${W-w2} m`,`Missing right side: ${H} − ${h2} = ${H-h2} m`,`${W} + ${H} + ${W-w2} + ${h2} + ${w2} + ${H-h2} = <b>${2*(W+H)} m</b>`]}
   :{calc:false,fig:figL(W,H,w2,h2,'m'),text:'Work out the area of this L-shaped room.',ans:W*H-w2*h2,suf:'m²',hint:'Work out the area of the full rectangle, then take away the missing corner. Or split the shape into two rectangles.',steps:[`Full rectangle: ${W} × ${H} = ${W*H} m²`,`Missing corner: ${w2} × ${h2} = ${w2*h2} m²`,`${W*H} − ${w2*h2} = <b>${W*H-w2*h2} m²</b>`]};},
()=>{const w=rnd(6,14),h=pick([4,6,8,10]),v=w*h+PI*(h/2)**2/2,a=rd(v,1);return{calc:true,fig:figRectSemi(w,h,'m'),text:'A patio is a rectangle with a semicircle on one end. Work out its area. Give your answer to 1 decimal place.',ans:a,suf:'m²',tol:piTol(v),
  hint:`Split it into a rectangle and half a circle. The semicircle's diameter is ${h} m, so its radius is ${h/2} m.`,steps:[`Rectangle: ${w} × ${h} = ${w*h} m²`,`Semicircle: ½ × π × ${h/2}² = ${rd(PI*(h/2)**2/2,2)} m²`,`Total: <b>${a} m²</b>`]};},
()=>{const L=rnd(8,16),W=rnd(5,10),r=pick([1,1.5,2,2.5]),v=L*W-PI*r*r,a=rd(v,1);return{calc:true,text:`A rectangular lawn is ${L} m by ${W} m. It has a circular pond of radius ${r} m in the middle. Work out the area of grass. Give your answer to 1 decimal place.`,ans:a,suf:'m²',tol:piTol(v),hint:'Area of the rectangle minus the area of the circle.',
  steps:[`Lawn: ${L} × ${W} = ${L*W} m²`,`Pond: π × ${r}² = ${rd(PI*r*r,2)} m²`,`Grass: ${L*W} − ${rd(PI*r*r,2)} = <b>${a} m²</b>`]};},
()=>{const l=pick([3.5,4,4.2,4.5,5,5.4]),w=pick([2.5,3,3.2,3.5,4]),p=pick([14.99,18.5,22,27.5]),a=rd(l*w*p,2);return{calc:true,text:`A room is ${l} m by ${w} m. Carpet costs £${p.toFixed(2)} per square metre. How much does it cost to carpet the room?`,ans:a,pre:'£',tol:0.011,hint:'Find the area of the floor, then multiply by the price for one square metre.',
  steps:[`Area: ${l} × ${w} = ${rd(l*w,2)} m²`,`Cost: ${rd(l*w,2)} × ${p.toFixed(2)} = <b>${gbp(a)}</b>`]};},
];

G.m17=[
()=>{const l=rnd(4,12),w=rnd(2,8),h=rnd(2,9);return{calc:false,fig:figCuboid(l,w,h,'cm'),text:'Work out the volume of the cuboid.',ans:l*w*h,suf:'cm³',hint:'Volume of a cuboid = length × width × height.',steps:[`${l} × ${w} × ${h}`,`= <b>${nf(l*w*h)} cm³</b>`]};},
()=>{const r=rnd(2,9),h=rnd(5,20),v=PI*r*r*h,a=rd(v,1);return{calc:true,fig:figCyl(r,h,'cm'),text:'Work out the volume of the cylinder. Give your answer to 1 decimal place.',ans:a,suf:'cm³',tol:piTol(v),hint:'Volume of a cylinder = π × radius² × height. You need to know this formula.',steps:[`π × ${r}² × ${h}`,`= π × ${r*r} × ${h}`,`= <b>${nf(a)} cm³</b>`]};},
()=>{const l=rnd(4,12),w=rnd(2,8),h=rnd(2,9),a=2*(l*w+l*h+w*h);return{calc:true,fig:figCuboid(l,w,h,'cm'),text:'Work out the total surface area of the cuboid.',ans:a,suf:'cm²',hint:'A cuboid has 3 pairs of matching faces. Find the area of each different face, add them, then double.',steps:[`Faces: ${l}×${w} = ${l*w}, ${l}×${h} = ${l*h}, ${w}×${h} = ${w*h}`,`${l*w} + ${l*h} + ${w*h} = ${l*w+l*h+w*h}`,`× 2 = <b>${a} cm²</b>`]};},
()=>{const l=pick([40,50,60,80,120]),w=pick([30,40,50]),h=pick([20,25,30,40,50]);return{calc:true,text:`A fish tank is ${l} cm long, ${w} cm wide and ${h} cm high. How many litres of water does it hold when full? Use 1 litre = 1000 cm³.`,ans:l*w*h/1000,suf:'litres',hint:'Find the volume in cm³, then divide by 1000.',steps:[`${l} × ${w} × ${h} = ${nf(l*w*h)} cm³`,`${nf(l*w*h)} ÷ 1000 = <b>${l*w*h/1000} litres</b>`]};},
()=>{const r=rnd(2,8),h=rnd(5,16),v=2*PI*r*r+2*PI*r*h,a=rd(v,1);return{calc:true,fig:figCyl(r,h,'cm'),text:'Work out the total surface area of the closed cylinder. Give your answer to 1 decimal place.',ans:a,suf:'cm²',tol:piTol(v),hint:'Two circles plus the curved side: 2πr² + 2πrh.',
  steps:[`Two ends: 2 × π × ${r}² = ${rd(2*PI*r*r,2)}`,`Curved side: 2 × π × ${r} × ${h} = ${rd(2*PI*r*h,2)}`,`Total: <b>${nf(a)} cm²</b>`]};},
()=>{let b,h;do{b=rnd(4,12);h=rnd(3,10);}while((b*h)%2);const L=rnd(8,25);return{calc:true,fig:figPrism(b,h,L,'cm'),text:'Volume of a prism = area of cross-section × length.<br>Work out the volume of this triangular prism.',ans:b*h/2*L,suf:'cm³',hint:'The cross-section is the triangle. Find its area with ½ × base × height, then multiply by the length.',
  steps:[`Triangle: ½ × ${b} × ${h} = ${b*h/2} cm²`,`${b*h/2} × ${L} = <b>${nf(b*h/2*L)} cm³</b>`]};},
];

G.m18=[
()=>{const s=pick([20,25,50,100,200]),cm=pick([3,4.5,6,7.2,8,9,12.5,15]),a=rd(cm*s/100,3);return{calc:true,text:`A plan is drawn to a scale of 1:${s}. A wall is ${cm} cm long on the plan. How long is the real wall, in metres?`,ans:a,suf:'m',hint:`Every 1 cm on the plan is ${s} cm in real life. Multiply, then change cm to metres.`,steps:[`${cm} × ${s} = ${nf(cm*s)} cm`,`${nf(cm*s)} ÷ 100 = <b>${a} m</b>`]};},
()=>{const s=pick([20,25,50,100,200]),m=pick([2,3.5,4,6,7.5,9,12]),a=rd(m*100/s,3);return{calc:true,text:`A room is ${m} m long. It is drawn on a plan with a scale of 1:${s}. How long is the room on the plan, in centimetres?`,ans:a,suf:'cm',hint:`Change the real length to cm, then divide by ${s}.`,steps:[`${m} m = ${nf(m*100)} cm`,`${nf(m*100)} ÷ ${s} = <b>${a} cm</b>`]};},
()=>{const s=pick([25000,50000]),cm=pick([3,4,5,6,7,8,9,11,12,14,3.5,6.5]),a=rd(cm*s/100000,3);return{calc:true,text:`A map has a scale of 1:${nf(s)}. Two villages are ${cm} cm apart on the map. What is the real distance between them, in kilometres?`,ans:a,suf:'km',hint:'Multiply by the scale to get cm in real life. There are 100,000 cm in 1 km.',steps:[`${cm} × ${nf(s)} = ${nf(cm*s)} cm`,`${nf(cm*s)} ÷ 100,000 = <b>${a} km</b>`]};},
()=>{const k=pick([2,2.5,4,5]),real=k*pick([3,4,6,7,9,12]);return{calc:false,text:`${who()} is drawing a garden plan. 1 cm on the plan represents ${k} m. The garden is ${real} m long. How long should it be on the plan?`,ans:real/k,suf:'cm',hint:`How many lots of ${k} m fit into ${real} m? Each one is 1 cm on the plan.`,steps:[`${real} ÷ ${k} = <b>${real/k} cm</b>`]};},
()=>{const w=rnd(5,12),h=rnd(3,8),s=pick([100,200]),a=(w*s/100)*(h*s/100);return{calc:true,fig:figPlan(w,h,s),text:'This scale drawing shows a rectangular car park. Work out the real area of the car park in square metres.',ans:a,suf:'m²',hint:'Change each length to its real size in metres first, then multiply. Do not scale the area directly.',
  steps:[`Real length: ${w} × ${s} = ${w*s} cm = ${w*s/100} m`,`Real width: ${h} × ${s} = ${h*s} cm = ${h*s/100} m`,`Area: ${w*s/100} × ${h*s/100} = <b>${nf(a)} m²</b>`]};},
];

const nz=m=>pick([-1,1])*rnd(1,m);
G.m19=[
()=>{const x=nz(6),y=nz(6);return{calc:false,fig:figGrid([{x,y,l:'P'}]),text:'Write down the coordinates of point P.',kind:'coord',ans:[x,y],hint:'Go along the x axis first (left or right), then up or down. Left and down are negative.',steps:[`P is ${Math.abs(x)} ${x<0?'left':'right'} of the origin, so x = ${sg(x)}.`,`P is ${Math.abs(y)} ${y<0?'down':'up'}, so y = ${sg(y)}.`,`<b>(${sg(x)}, ${sg(y)})</b>`]};},
()=>{let x1,y1,x2,y2;do{x1=rnd(-6,6);y1=rnd(-6,6);x2=rnd(-6,6);y2=rnd(-6,6);}while((x1+x2)%2||(y1+y2)%2||(Math.abs(x1-x2)<2&&Math.abs(y1-y2)<2));
  return{calc:false,fig:figGrid([{x:x1,y:y1,l:'A'},{x:x2,y:y2,l:'B'}]),text:`A is at (${sg(x1)}, ${sg(y1)}) and B is at (${sg(x2)}, ${sg(y2)}). Find the coordinates of the midpoint of AB.`,kind:'coord',ans:[(x1+x2)/2,(y1+y2)/2],hint:'The midpoint is halfway: add the two x values and halve, then do the same with the y values.',
  steps:[`x: (${sg(x1)} + ${sg(x2)}) ÷ 2 = ${sg((x1+x2)/2)}`,`y: (${sg(y1)} + ${sg(y2)}) ÷ 2 = ${sg((y1+y2)/2)}`,`<b>(${sg((x1+x2)/2)}, ${sg((y1+y2)/2)})</b>`]};},
()=>{const x=rnd(-5,3),y=rnd(-3,5),dx=rnd(2,6),dy=rnd(2,7),r=pick([true,false]),u=pick([true,false]),nx=x+(r?dx:-dx),ny=y+(u?dy:-dy);return{calc:false,text:`Point A is at (${sg(x)}, ${sg(y)}). It moves ${dx} squares ${r?'right':'left'} and ${dy} squares ${u?'up':'down'}. What are its new coordinates?`,kind:'coord',ans:[nx,ny],
  hint:'Right adds to x, left subtracts from x. Up adds to y, down subtracts from y.',steps:[`x: ${sg(x)} ${r?'+':'−'} ${dx} = ${sg(nx)}`,`y: ${sg(y)} ${u?'+':'−'} ${dy} = ${sg(ny)}`,`<b>(${sg(nx)}, ${sg(ny)})</b>`]};},
()=>{let x,y;do{x=nz(6);y=nz(6);}while(Math.abs(x)===Math.abs(y));const P=shuffle([[x,y],[y,x],[-x,y],[x,-y]]),L=['A','B','C','D'],i=P.findIndex(p=>p[0]===x&&p[1]===y);
  return{calc:false,fig:figGrid(P.map((p,k)=>({x:p[0],y:p[1],l:L[k]}))),text:`Which point is at (${sg(x)}, ${sg(y)})?`,kind:'choice',opts:L,ans:i,hint:'The first number is how far along (x). The second is how far up or down (y).',steps:[`x = ${sg(x)}: go ${Math.abs(x)} ${x<0?'left':'right'}.`,`y = ${sg(y)}: go ${Math.abs(y)} ${y<0?'down':'up'}.`,`That is point <b>${L[i]}</b>.`]};},
];

const NETS=[['2 circles and 1 rectangle','Cylinder'],['6 identical squares','Cube'],['2 triangles and 3 rectangles','Triangular prism'],['1 square and 4 triangles','Square-based pyramid'],['6 rectangles in 3 matching pairs','Cuboid'],['4 identical triangles','Triangular-based pyramid (tetrahedron)']];
const isoShape=()=>{let h,R,C;do{R=pick([2,3]);C=3;h=[...Array(R)].map(()=>[...Array(C)].map(()=>pick([0,1,1,2,2,3])));}while(h.some(r=>Math.max(...r)===0)||[0,1,2].some(c=>Math.max(...h.map(r=>r[c]))===0));return h;};
const frontOf=h=>h[0].map((_,c)=>Math.max(...h.map(r=>r[c]))),sideOf=h=>h.map(r=>Math.max(...r)).reverse();
G.m20=[
()=>{let h,fr,sd,opts;do{h=isoShape();fr=frontOf(h);sd=sideOf(h);const cand=[sd,fr.slice().reverse(),fr.map((v,i)=>i===1?(v%3)+1:v),fr.map((v,i)=>i===0?(v%3)+1:v),fr.map((v,i)=>i===2?(v%3)+1:v)].filter(a=>a.join()!==fr.join());const seen=new Set();opts=cand.filter(a=>{const k=a.join();if(seen.has(k))return false;seen.add(k);return true;}).slice(0,3);}while(opts.length<3);
  return{calc:false,fig:figIso(h),text:'This shape is made from cubes. Which drawing shows the <b>front elevation</b>? (The view from the arrow marked Front.)',...mc(figProfile(fr),opts.map(figProfile)),hint:'Stand at the Front arrow and look straight at the shape. For each column from left to right, how tall is the tallest stack you can see?',
  steps:[`Looking from the front, the tallest stacks from left to right are ${fr.join(', ')} cubes high.`,`So the front elevation is: ${figProfile(fr)}`]};},
()=>{let h,fr,sd,opts;do{h=isoShape();fr=frontOf(h);sd=sideOf(h);const pad=a=>a;const cand=[fr,sd.slice().reverse(),sd.map((v,i)=>i===0?(v%3)+1:v),sd.map((v,i)=>i===sd.length-1?(v%3)+1:v)].filter(a=>a.join()!==sd.join());const seen=new Set();opts=cand.filter(a=>{const k=a.join();if(seen.has(k))return false;seen.add(k);return true;}).slice(0,3);}while(opts.length<3);
  return{calc:false,fig:figIso(h),text:'This shape is made from cubes. Which drawing shows the <b>side elevation</b>? (The view from the arrow marked Side.)',...mc(figProfile(sd),opts.map(figProfile)),hint:'Stand at the Side arrow and look straight at the shape. Work across from left to right as you would see it from there.',
  steps:[`Looking from the side, the tallest stacks from left to right are ${sd.join(', ')} cubes high.`,`So the side elevation is: ${figProfile(sd)}`]};},
()=>{const h=isoShape(),n=h.flat().reduce((a,b)=>a+b);return{calc:false,fig:figIso(h),text:'This shape is made from cubes. Every cube sits on the ground or on top of another cube, and there are no hidden gaps. How many cubes are there?',ans:n,suf:'cubes',hint:'Count each stack separately, including the cubes underneath that you cannot see, then add the stacks.',
  steps:[`Stack heights, back row to front row: ${h.map(r=>r.join(', ')).join(' | ')}`,`Add them all: <b>${n} cubes</b>`]};},
()=>{const[d,a]=pick(NETS);return{calc:false,text:`A net is made of ${d}. Which 3-D shape does it fold up to make?`,...mc(a,shuffle(NETS.filter(n=>n[1]!==a)).slice(0,3).map(n=>n[1])),hint:'A net is the flat shape you get when you unfold a solid. Think about the faces each solid has.',steps:[`A ${a.toLowerCase()} has faces that are ${d}.`,`Answer: <b>${a}</b>`]};},
];

G.m22=[
()=>{const a=rnd(30,80),b=rnd(30,80);return{calc:false,fig:figAngleTri(a,b),text:'Work out the size of angle x.',ans:180-a-b,suf:'°',hint:'The three angles in a triangle add up to 180°.',steps:[`${a} + ${b} = ${a+b}`,`180 − ${a+b} = <b>${180-a-b}°</b>`]};},
()=>{const apex=rnd(10,60)*2,base=(180-apex)/2,giveApex=pick([true,false]);return giveApex?{calc:false,text:`An isosceles triangle has one angle of ${apex}° between its two equal sides. Work out the size of each of the other two angles.`,ans:base,suf:'°',hint:'An isosceles triangle has two equal angles. Take the known angle from 180°, then share what is left equally.',steps:[`180 − ${apex} = ${180-apex}`,`${180-apex} ÷ 2 = <b>${base}°</b>`]}
  :{calc:false,text:`An isosceles triangle has two equal angles of ${base}°. Work out the size of the third angle.`,ans:apex,suf:'°',hint:'Add the two equal angles, then subtract from 180°.',steps:[`${base} + ${base} = ${2*base}`,`180 − ${2*base} = <b>${apex}°</b>`]};},
()=>{const a=rnd(25,155);return{calc:false,fig:figAngleLine(a),text:'Work out the size of angle x.',ans:180-a,suf:'°',hint:'Angles on a straight line add up to 180°.',steps:[`180 − ${a} = <b>${180-a}°</b>`]};},
()=>{const a=rnd(60,130),b=rnd(50,110),c=rnd(40,100);return{calc:false,text:`Four angles meet at a point. Three of them are ${a}°, ${b}° and ${c}°. Work out the fourth angle.`,ans:360-a-b-c,suf:'°',hint:'Angles around a point add up to 360°.',steps:[`${a} + ${b} + ${c} = ${a+b+c}`,`360 − ${a+b+c} = <b>${360-a-b-c}°</b>`]};},
()=>{let a,b,c,x;do{a=rnd(60,120);b=rnd(60,120);c=rnd(60,120);x=360-a-b-c;}while(x<30||x>170);return{calc:false,text:`Three angles of a quadrilateral are ${a}°, ${b}° and ${c}°. Work out the fourth angle.`,ans:x,suf:'°',hint:'The four angles in any quadrilateral add up to 360°.',steps:[`${a} + ${b} + ${c} = ${a+b+c}`,`360 − ${a+b+c} = <b>${x}°</b>`]};},
()=>{const t=pick([24,30,36,40,60,72,90,120]);let p;do{p=rnd(2,t-2);}while((p*360)%t);return{calc:true,text:`${t} people are asked how they travel to work. ${p} of them say "by bus". In a pie chart of the results, what angle should the "bus" sector have?`,ans:p*360/t,suf:'°',hint:'A full pie chart is 360°. Find the angle for one person, then multiply.',steps:[`One person: 360 ÷ ${t} = ${rd(360/t,2)}°`,`${p} people: ${p} × ${rd(360/t,2)} = <b>${p*360/t}°</b>`]};},
()=>{const x1=rnd(-6,1),y1=rnd(-6,1),x2=x1+rnd(2,5),y2=y1+rnd(2,5);return{calc:false,fig:figGrid([{x:x1,y:y1,l:'A'},{x:x2,y:y1,l:'B'},{x:x2,y:y2,l:'C'}]),text:`A, B and C are three corners of a rectangle. A is (${sg(x1)}, ${sg(y1)}), B is (${sg(x2)}, ${sg(y1)}) and C is (${sg(x2)}, ${sg(y2)}). Find the coordinates of the fourth corner, D.`,kind:'coord',ans:[x1,y2],
  hint:'D is directly above A, so it has the same x value as A. It is level with C, so it has the same y value as C.',steps:[`Same x as A: ${sg(x1)}`,`Same y as C: ${sg(y2)}`,`D is at <b>(${sg(x1)}, ${sg(y2)})</b>`]};},
];

const list=(n,lo,hi)=>[...Array(n)].map(()=>rnd(lo,hi));
G.d23=[
()=>{const v=list(pick([7,9]),1,30),s=v.slice().sort((a,b)=>a-b),m=s[(s.length-1)/2];return{calc:false,text:`Find the median of these numbers:<br><b>${v.join(', ')}</b>`,ans:m,hint:'Put the numbers in order first. The median is the middle one.',steps:[`In order: ${s.join(', ')}`,`There are ${s.length} numbers, so the middle one is number ${(s.length+1)/2}.`,`Median = <b>${m}</b>`]};},
()=>{const v=list(pick([6,8]),1,30),s=v.slice().sort((a,b)=>a-b),a=s[s.length/2-1],b=s[s.length/2];return{calc:false,text:`Find the median of these numbers:<br><b>${v.join(', ')}</b>`,ans:(a+b)/2,hint:'Put them in order. With an even number of values there are two middle numbers. The median is halfway between them.',steps:[`In order: ${s.join(', ')}`,`The two middle numbers are ${a} and ${b}.`,`(${a} + ${b}) ÷ 2 = <b>${(a+b)/2}</b>`]};},
()=>{const d=shuffle([...Array(20)].map((_,i)=>i+1)).slice(0,5),v=shuffle([...d,d[0],d[0],d[1]]);return{calc:false,text:`Find the mode of these numbers:<br><b>${v.join(', ')}</b>`,ans:d[0],hint:'The mode is the value that appears most often.',steps:[`In order: ${v.slice().sort((a,b)=>a-b).join(', ')}`,`${d[0]} appears 3 times, more than any other.`,`Mode = <b>${d[0]}</b>`]};},
()=>{const sizes=[4,5,6,7,8,9];let f;do{f=sizes.map(()=>rnd(2,14));}while(f.filter(x=>x===Math.max(...f)).length>1);const i=f.indexOf(Math.max(...f));return{calc:false,text:`The table shows the shoe sizes sold in a shop one morning. What is the modal shoe size?${tbl(['Shoe size','Pairs sold'],sizes.map((s,k)=>[s,f[k]]))}`,ans:sizes[i],hint:'The modal size is the one with the highest frequency. The answer is a shoe size, not the number sold.',steps:[`The highest frequency is ${f[i]}.`,`That belongs to size <b>${sizes[i]}</b>.`]};},
];

const GROUPS=[{lab:['0–4','5–9','10–14','15–19','20–24'],mid:[2,7,12,17,22]},{lab:['1–10','11–20','21–30','31–40','41–50'],mid:[5.5,15.5,25.5,35.5,45.5]},{lab:['0–9','10–19','20–29','30–39','40–49'],mid:[4.5,14.5,24.5,34.5,44.5]}];
const GCTX=[['emails sent in a day','Emails','staff'],['text messages sent in a day','Messages','students'],['customers served in an hour','Customers','checkout staff'],['points scored in a quiz','Points','players']];
G.d24=[
()=>{const g=pick(GROUPS),n=pick([4,5]),f=list(n,2,14),[ctx,col,pp]=pick(GCTX),sf=f.reduce((a,b)=>a+b),sfx=f.reduce((a,b,i)=>a+b*g.mid[i],0),a=rd(sfx/sf,1);
  return{calc:true,text:`The table shows the number of ${ctx} by ${sf} ${pp}. Work out an estimate of the mean. Give your answer to 1 decimal place.${tbl([col,'Frequency'],f.map((x,i)=>[g.lab[i],x]))}`,ans:a,tol:0.06,hint:'Use the midpoint of each group. Multiply each midpoint by its frequency, add those up, then divide by the total frequency.',
  steps:[`Midpoints: ${g.mid.slice(0,n).join(', ')}`,`Midpoint × frequency: ${f.map((x,i)=>`${g.mid[i]}×${x} = ${rd(g.mid[i]*x,1)}`).join(', ')}`,`Total: ${rd(sfx,1)}. Total frequency: ${sf}.`,`${rd(sfx,1)} ÷ ${sf} = <b>${a}</b>`]};},
()=>{const g=pick(GROUPS),n=5;let f;do{f=list(n,2,14);}while(f.filter(x=>x===Math.max(...f)).length>1);const i=f.indexOf(Math.max(...f)),[ctx,col]=pick(GCTX);
  return{calc:false,text:`The table shows the number of ${ctx}. Which is the modal class?${tbl([col,'Frequency'],f.map((x,k)=>[g.lab[k],x]))}`,...mc(g.lab[i],g.lab.filter((_,k)=>k!==i).slice(0,3)),hint:'The modal class is the group with the highest frequency.',steps:[`The highest frequency is ${f[i]}.`,`That is the <b>${g.lab[i]}</b> group.`]};},
];

const setMean=(m,n)=>{let v;do{v=list(n-1,m-8,m+8);v.push(n*m-v.reduce((a,b)=>a+b));}while(v[n-1]<1||v[n-1]>m+12||v[n-1]<m-12);return shuffle(v);};
G.d25=[
()=>{const mA=rnd(12,30);let mB;do{mB=rnd(12,30);}while(mB===mA);const A=setMean(mA,5),B=setMean(mB,5),[n1,n2]=shuffle(NAMES).slice(0,2),hi=mA>mB?n1:n2,lo=mA>mB?n2:n1;
  return{calc:true,text:`${n1} and ${n2} each record how many minutes they wait for a bus on 5 days.<br>${n1}: <b>${A.join(', ')}</b><br>${n2}: <b>${B.join(', ')}</b><br>How many minutes longer is ${hi}'s mean wait than ${lo}'s?`,ans:Math.abs(mA-mB),suf:'minutes',hint:'Mean = total ÷ how many. Work out both means, then find the difference.',
  steps:[`${n1}: ${A.join(' + ')} = ${5*mA}, and ${5*mA} ÷ 5 = ${mA}`,`${n2}: ${B.join(' + ')} = ${5*mB}, and ${5*mB} ÷ 5 = ${mB}`,`Difference: <b>${Math.abs(mA-mB)} minutes</b>`]};},
()=>{let A,B,rA,rB;do{A=list(6,20,60);B=list(6,20,60);rA=Math.max(...A)-Math.min(...A);rB=Math.max(...B)-Math.min(...B);}while(Math.abs(rA-rB)<4);const[n1,n2]=shuffle(NAMES).slice(0,2),w=rA<rB?n1:n2,l=rA<rB?n2:n1;
  return{calc:false,text:`Two darts players record their scores for 6 throws.<br>${n1}: <b>${A.join(', ')}</b><br>${n2}: <b>${B.join(', ')}</b><br>Who is more consistent, and why?`,...mc(`${w}, because the range is smaller`,[`${w}, because the range is larger`,`${l}, because the range is smaller`,`${l}, because the range is larger`]),hint:'Range = highest − lowest. A smaller range means the scores are closer together, which means more consistent.',
  steps:[`${n1}: ${Math.max(...A)} − ${Math.min(...A)} = ${rA}`,`${n2}: ${Math.max(...B)} − ${Math.min(...B)} = ${rB}`,`<b>${w}</b> has the smaller range, so is more consistent.`]};},
()=>{const m=rnd(10,25),v=setMean(m,5),miss=v[4],four=v.slice(0,4);return{calc:true,text:`The mean of 5 numbers is ${m}. Four of the numbers are ${four.join(', ')}. What is the fifth number?`,ans:miss,hint:'Work out what the 5 numbers must add up to (mean × 5). Then subtract the four you know.',steps:[`Total needed: ${m} × 5 = ${5*m}`,`Known four: ${four.join(' + ')} = ${5*m-miss}`,`${5*m} − ${5*m-miss} = <b>${miss}</b>`]};},
()=>{let A,B,mA,mB;do{A=list(5,10,40);B=list(5,10,40);mA=A.slice().sort((a,b)=>a-b)[2];mB=B.slice().sort((a,b)=>a-b)[2];}while(mA===mB);
  return{calc:false,text:`Two classes take the same test. Here are the scores for 5 students from each.<br>Class A: <b>${A.join(', ')}</b><br>Class B: <b>${B.join(', ')}</b><br>What is the difference between the two median scores?`,ans:Math.abs(mA-mB),hint:'Put each list in order and find its middle number. Then subtract.',
  steps:[`Class A in order: ${A.slice().sort((a,b)=>a-b).join(', ')}. Median ${mA}.`,`Class B in order: ${B.slice().sort((a,b)=>a-b).join(', ')}. Median ${mB}.`,`Difference: <b>${Math.abs(mA-mB)}</b>`]};},
];

const TW=[[['Adults','Children'],['Swimming','Gym','Climbing'],'chose'],[['Full time','Part time'],['Car','Bus','Cycle'],'travel by'],[['Year 12','Year 13'],['French','Spanish','German'],'study']];
const twTable=(rows,cols,c,hide)=>{const rt=c.map(r=>r.reduce((a,b)=>a+b)),ct=cols.map((_,j)=>c[0][j]+c[1][j]),tot=rt[0]+rt[1],cell=(i,j)=>hide&&hide[0]===i&&hide[1]===j?'?':c[i][j];
  return{rt,ct,tot,html:tbl(['',...cols,'Total'],[[rows[0],...cols.map((_,j)=>cell(0,j)),rt[0]],[rows[1],...cols.map((_,j)=>cell(1,j)),rt[1]],['Total',...ct,tot]])};};
G.d26=[
()=>{const[rows,cols,verb]=pick(TW),c=[list(3,4,25),list(3,4,25)],t=twTable(rows,cols,c),i=rnd(0,1),j=rnd(0,2),mode=pick(['and','col','given']);
  const pers=`One person is chosen at random.`;
  if(mode==='and')return{calc:true,text:`${t.html}${pers} What is the probability that they are in the "${rows[i]}" group <b>and</b> ${verb} ${cols[j].toLowerCase()}? Give your answer as a fraction.`,kind:'frac',ans:simp(c[i][j],t.tot),hint:'Find the one cell that matches both conditions. Put it over the overall total.',steps:[`Cell for ${rows[i]} and ${cols[j]}: ${c[i][j]}`,`Overall total: ${t.tot}`,`Probability = ${F(c[i][j],t.tot)} = <b>${FM(c[i][j],t.tot)}</b>`]};
  if(mode==='col')return{calc:true,text:`${t.html}${pers} What is the probability that they ${verb} ${cols[j].toLowerCase()}? Give your answer as a fraction.`,kind:'frac',ans:simp(t.ct[j],t.tot),hint:'Use the column total for that choice, over the overall total.',steps:[`Total for ${cols[j]}: ${t.ct[j]}`,`Overall total: ${t.tot}`,`Probability = ${F(t.ct[j],t.tot)} = <b>${FM(t.ct[j],t.tot)}</b>`]};
  return{calc:true,text:`${t.html}One person from the "${rows[i]}" group is chosen at random. What is the probability that they ${verb} ${cols[j].toLowerCase()}? Give your answer as a fraction.`,kind:'frac',ans:simp(c[i][j],t.rt[i]),hint:`Only the "${rows[i]}" row matters now, so the bottom of the fraction is that row's total.`,steps:[`${rows[i]} who ${verb} ${cols[j].toLowerCase()}: ${c[i][j]}`,`Total in the ${rows[i]} row: ${t.rt[i]}`,`Probability = ${F(c[i][j],t.rt[i])} = <b>${FM(c[i][j],t.rt[i])}</b>`]};},
()=>{const dbl=R()<0.25,tt=rnd(3,11),ways=dbl?6:6-Math.abs(7-tt),grid=tbl(['+',1,2,3,4,5,6],[1,2,3,4,5,6].map(a=>[a,...[1,2,3,4,5,6].map(b=>a+b)]));
  return{calc:false,text:`Two fair six-sided dice are rolled. What is the probability that ${dbl?'both dice show the same number':`the two numbers add up to ${tt}`}? Give your answer as a fraction.`,kind:'frac',ans:simp(ways,36),hint:'Draw a 6 by 6 grid of every possible pair. There are 36 outcomes. Count the ones you want.',
  steps:[`All 36 totals:${grid}`,dbl?'Doubles: (1,1), (2,2), (3,3), (4,4), (5,5), (6,6). That is 6 outcomes.':`A total of ${tt} appears ${ways} time${ways>1?'s':''}.`,`Probability = ${F(ways,36)} = <b>${FM(ways,36)}</b>`]};},
()=>{const p1=pick([0.2,0.3,0.4,0.6,0.7]),p2=pick([0.1,0.25,0.5,0.8]),nei=pick([true,false]),a=nei?rd((1-p1)*(1-p2),4):rd(p1*p2,4);return{calc:true,text:`The probability that a bus is late on Monday is ${p1}. The probability that it is late on Tuesday is ${p2}. The two days are independent. What is the probability that the bus is late on ${nei?'<b>neither</b> day':'<b>both</b> days'}?`,ans:a,tol:1e-6,
  hint:nei?'First find the probability of "not late" for each day (1 − the probability). Then multiply.':'For two independent events both happening, multiply the probabilities.',steps:nei?[`Not late Monday: 1 − ${p1} = ${rd(1-p1,2)}`,`Not late Tuesday: 1 − ${p2} = ${rd(1-p2,2)}`,`${rd(1-p1,2)} × ${rd(1-p2,2)} = <b>${a}</b>`]:[`${p1} × ${p2} = <b>${a}</b>`]};},
()=>{const k=pick([4,5,6,8]),m=rnd(1,k-2),w=k-m;return{calc:false,text:`A fair spinner has ${k} equal sections numbered 1 to ${k}. The spinner is spun and a fair coin is flipped. What is the probability of getting a number greater than ${m} <b>and</b> a head? Give your answer as a fraction.`,kind:'frac',ans:simp(w,2*k),hint:`List the outcomes in a table: ${k} spinner numbers × 2 coin sides.`,
  steps:[`Total outcomes: ${k} × 2 = ${2*k}`,`Numbers greater than ${m}: ${w}. Each can pair with a head, so ${w} outcomes work.`,`Probability = ${F(w,2*k)} = <b>${FM(w,2*k)}</b>`]};},
()=>{const[rows,cols]=pick(TW),c=[list(3,4,25),list(3,4,25)],i=rnd(0,1),j=rnd(0,2),t=twTable(rows,cols,c,[i,j]);return{calc:true,text:`${t.html}One number is missing from the two-way table. Work out the missing number.`,ans:c[i][j],hint:'Each row adds up to its total. Subtract the numbers you know from the row total.',
  steps:[`${rows[i]} row total: ${t.rt[i]}`,`Known values: ${c[i].filter((_,k)=>k!==j).join(' + ')} = ${t.rt[i]-c[i][j]}`,`${t.rt[i]} − ${t.rt[i]-c[i][j]} = <b>${c[i][j]}</b>`]};},
];

const COL=['red','blue','green','yellow'];
G.d27=[
()=>{const tot=pick([10,12,15,20,24]);let a,b;do{a=rnd(2,tot-4);b=rnd(1,tot-a-1);}while(tot-a-b<1);const cs=shuffle(COL).slice(0,3),s=simp(a,tot);return{calc:false,text:`A bag contains ${a} ${cs[0]}, ${b} ${cs[1]} and ${tot-a-b} ${cs[2]} counters. One counter is taken at random. What is the probability that it is ${cs[0]}? Give your answer as a fraction in its simplest form.`,kind:'frac',simplest:true,ans:s,
  hint:'Probability = number you want ÷ total number. Find the total first.',steps:[`Total counters: ${a} + ${b} + ${tot-a-b} = ${tot}`,`P(${cs[0]}) = ${F(a,tot)}`,`Simplest form: <b>${F(s.n,s.d)}</b>`]};},
()=>{const tot=pick([10,20,25,50]),a=rnd(1,tot-1);return{calc:false,text:`${a} out of ${tot} raffle tickets win a prize. One ticket is picked at random. What is the probability that it wins? Give your answer as a percentage.`,ans:rd(a*100/tot,2),suf:'%',hint:'Write the probability as a fraction, then change it to a percentage.',steps:[`${F(a,tot)} = ${rd(a/tot,3)}`,`${rd(a/tot,3)} × 100 = <b>${rd(a*100/tot,2)}%</b>`]};},
()=>{const pc=pick([true,false]),p=pick([0.15,0.35,0.08,0.62,0.275,0.4]);return pc?{calc:false,text:`The probability that a train is late is ${rd(p*100,1)}%. What is the probability that it is <b>not</b> late? Give your answer as a percentage.`,ans:rd(100-p*100,1),suf:'%',hint:'The probabilities of "late" and "not late" add up to 100%.',steps:[`100 − ${rd(p*100,1)} = <b>${rd(100-p*100,1)}%</b>`]}
  :{calc:false,text:`The probability that a train is late is ${p}. What is the probability that it is <b>not</b> late?`,ans:rd(1-p,3),tol:1e-9,hint:'The probabilities of "late" and "not late" add up to 1.',steps:[`1 − ${p} = <b>${rd(1-p,3)}</b>`]};},
()=>{let n,d;do{d=pick([4,5,6,8,10]);n=rnd(1,d-1);}while(gcd(n,d)!==1);const tr=d*rnd(5,20);return{calc:false,text:`The probability of winning a game is ${F(n,d)}. ${who()} plays ${tr} times. How many wins would you expect?`,ans:n*tr/d,suf:'wins',hint:'Expected number = probability × number of tries.',steps:[`${F(n,d)} × ${tr}`,`${tr} ÷ ${d} = ${tr/d}, then × ${n} = <b>${n*tr/d}</b>`]};},
()=>{const d=pick([4,5,8,20]);let n;do{n=rnd(1,d-1);}while(gcd(n,d)!==1);const dec=pick([true,false]);return{calc:false,text:`The probability of an event is ${F(n,d)}. Write this probability as a ${dec?'decimal':'percentage'}.`,ans:dec?rd(n/d,4):rd(n/d*100,3),suf:dec?'':'%',tol:1e-9,hint:'Divide the top by the bottom to get a decimal. Multiply by 100 for a percentage.',steps:dec?[`${n} ÷ ${d} = <b>${rd(n/d,4)}</b>`]:[`${n} ÷ ${d} = ${rd(n/d,4)}`,`× 100 = <b>${rd(n/d*100,3)}%</b>`]};},
];

const corr=p=>{const n=p.length,mx=p.reduce((a,b)=>a+b[0],0)/n,my=p.reduce((a,b)=>a+b[1],0)/n;let sxy=0,sxx=0,syy=0;p.forEach(([x,y])=>{sxy+=(x-mx)*(y-my);sxx+=(x-mx)**2;syy+=(y-my)**2;});return sxy/Math.sqrt(sxx*syy||1);};
const scat=type=>{let p,r;do{p=[...Array(13)].map(()=>{const x=rd(0.6+R()*8.8,1),e=(R()-0.5)*2.6;const y=type==='pos'?1+x*0.85+e:type==='neg'?9.2-x*0.85+e:0.8+R()*8.4;return[x,Math.min(9.6,Math.max(0.4,rd(y,1)))];});r=corr(p);}while(type==='pos'?r<0.8:type==='neg'?r>-0.8:Math.abs(r)>0.22);return p;};
const SCTX={pos:[['Hours of revision','Test score'],['Outside temperature','Ice creams sold'],['Height','Shoe size']],neg:[['Age of car','Value of car'],['Outside temperature','Hot drinks sold'],['Days absent','Test score']],none:[['Shoe size','Test score'],['House number','Height'],['Day of month born','Hours of sleep']]};
const CNAME={pos:'Positive correlation',neg:'Negative correlation',none:'No correlation'};
G.d28=[
()=>{const t=pick(['pos','neg','none']),[xl,yl]=pick(SCTX[t]),pts=scat(t);return{calc:false,fig:plot({xmax:10,xstep:2,xminor:1,ymax:10,ystep:2,yminor:1,xl,yl,pts,label:`Scatter diagram of ${yl} against ${xl}`}),text:'What type of correlation does this scatter diagram show?',kind:'choice',opts:['Positive correlation','Negative correlation','No correlation'],ans:['pos','neg','none'].indexOf(t),
  hint:'Look at the overall direction of the points. Uphill from left to right is positive. Downhill is negative. No pattern is no correlation.',steps:[t==='pos'?'The points go uphill from left to right. As one value goes up, so does the other.':t==='neg'?'The points go downhill from left to right. As one value goes up, the other goes down.':'The points are scattered with no clear direction.',`<b>${CNAME[t]}</b>`]};},
()=>{const up=pick([true,false]),[m,c]=up?pick([[5,20],[5,30],[10,0],[5,10]]):pick([[-5,90],[-10,100],[-5,80]]),xv=pick([2,4,6,8]),yv=m*xv+c,xl=up?'Hours of revision':'Days absent',pts=[...Array(11)].map(()=>{const x=rd(0.5+R()*9,1);return[x,Math.min(98,Math.max(2,rd(m*x+c+(R()-0.5)*18,0)))];});
  return{calc:false,fig:plot({xmax:10,xstep:2,xminor:1,ymax:100,ystep:20,yminor:10,xl,yl:'Test score (%)',pts,line:[m,c],label:`Scatter diagram of test score against ${xl.toLowerCase()} with a line of best fit`}),text:`The scatter diagram shows test scores and ${xl.toLowerCase()} for a group of students. A line of best fit has been drawn. Use it to estimate the test score for a student with ${xv} ${xl.toLowerCase()}.`,ans:yv,suf:'%',tol:4,
  hint:`Find ${xv} on the bottom axis. Go straight up to the line (not to a point), then read across to the score.`,steps:[`Go up from ${xv} to the line of best fit.`,`Read across to the vertical axis: about <b>${yv}%</b>.`,'Any answer within a few marks of this is fine, because you are reading from a graph.']};},
()=>{const[s,t]=pick([['As the price of a concert ticket goes up, the number of tickets sold goes down.','neg'],['The more hours a shop is open, the more it takes in sales.','pos'],['The older a phone is, the less it is worth.','neg'],['Taller people in a survey do not earn more or less than shorter people.','none'],['The more staff on shift, the shorter the customer waiting time.','neg'],['The more miles a driver covers, the more fuel is used.','pos'],['There is no link between the month a person was born and their reaction time.','none']]);
  return{calc:false,text:`${s}<br>What type of correlation does this describe?`,kind:'choice',opts:['Positive correlation','Negative correlation','No correlation'],ans:['pos','neg','none'].indexOf(t),hint:'Both go up together: positive. One goes up while the other goes down: negative. No link: no correlation.',steps:[t==='pos'?'Both values increase together.':t==='neg'?'One value increases as the other decreases.':'The two values are not linked.',`<b>${CNAME[t]}</b>`]};},
];

/* ============ topics and lessons ============ */
const AREAS_OLD={N:'Number',M:'Measures, shape and space',D:'Handling data'};
const L2T=[
{id:'n1',area:'N',scs:'1',title:'Positive and negative numbers',vq:'negative numbers ordering place value'},
{id:'n2',area:'N',scs:'2',title:'Big-number calculations and estimating',vq:'estimation rounding checking calculations'},
{id:'n3',area:'N',scs:'3',title:'Formulae and substitution',vq:'substitution into formulae'},
{id:'n4',area:'N',scs:'4',title:'Fractions, decimals and percentages',vq:'converting fractions decimals percentages'},
{id:'n5',area:'N',scs:'5',title:'Percentages of amounts',vq:'percentage of an amount'},
{id:'n6',area:'N',scs:'6',title:'Percentage change and reverse percentages',vq:'percentage change reverse percentages'},
{id:'n7',area:'N',scs:'7',title:'Adding and comparing fractions',vq:'adding subtracting fractions mixed numbers'},
{id:'n8',area:'N',scs:'8',title:'One number as a fraction of another',vq:'express one number as a fraction of another'},
{id:'n9',area:'N',scs:'9',title:'Ordering and rounding decimals',vq:'ordering rounding decimals'},
{id:'n10',area:'N',scs:'10',title:'Calculating with decimals',vq:'multiplying dividing decimals'},
{id:'n11',area:'N',scs:'11',title:'Ratio and proportion',vq:'ratio direct inverse proportion'},
{id:'n12',area:'N',scs:'12',title:'Order of operations and indices',vq:'BIDMAS order of operations indices'},
{id:'m13',area:'M',scs:'13',title:'Money, interest, tax and budgets',vq:'compound interest VAT discounts'},
{id:'m14',area:'M',scs:'14',title:'Converting units',vq:'metric imperial conversion graphs'},
{id:'m15',area:'M',scs:'15',title:'Speed, density and rates of pay',vq:'speed distance time density compound measures'},
{id:'m16',area:'M',scs:'16',title:'Perimeter and area',vq:'area perimeter circles triangles composite shapes'},
{id:'m17',area:'M',scs:'17',title:'Volume and surface area',vq:'volume surface area cylinder cuboid'},
{id:'m18',area:'M',scs:'18',title:'Scale drawings',vq:'scale drawings maps'},
{id:'m19',area:'M',scs:'19',title:'Coordinates',vq:'coordinates four quadrants'},
{id:'m20',area:'M',scs:'20–21',title:'Plans, elevations and nets',vq:'plans and elevations nets'},
{id:'m22',area:'M',scs:'22',title:'Angles and shape problems',vq:'angles in triangles quadrilaterals'},
{id:'d23',area:'D',scs:'23',title:'Median and mode',vq:'median and mode'},
{id:'d24',area:'D',scs:'24',title:'Mean from a grouped table',vq:'estimated mean grouped frequency table'},
{id:'d25',area:'D',scs:'25',title:'Comparing data sets',vq:'comparing data sets mean range'},
{id:'d26',area:'D',scs:'26',title:'Combined probability',vq:'probability two way tables combined events'},
{id:'d27',area:'D',scs:'27',title:'Writing probabilities',vq:'probability fractions decimals percentages'},
{id:'d28',area:'D',scs:'28',title:'Scatter diagrams',vq:'scatter diagrams correlation line of best fit'},
];


const L2LESSONS={
n1:{idea:'Numbers below zero are negative. On a number line, numbers get smaller as you move left, so −8 is smaller than −3. Every digit has a value that depends on its column.',
 steps:['Picture a number line with zero in the middle. Negatives go left, positives go right.','To find the gap between a negative and a positive, count up to zero, then on from zero.','For big numbers, group the digits in threes from the right: millions, thousands, then hundreds, tens and ones.'],
 ex:{q:'The temperature is −6°C at night and 9°C in the day. What is the difference?',w:['From −6 up to 0 is 6 degrees.','From 0 up to 9 is 9 degrees.','6 + 9 = 15°C']},trap:'−12 looks bigger than −5, but it is the smaller number. It is further left on the number line.'},
n2:{idea:'In the exam you work with numbers up to a million and you are expected to check your answers. Estimating means rounding the numbers first so the sum is easy.',
 steps:['Round each number to 1 significant figure: keep the first digit, turn the rest into zeros.','Do the easy calculation with the rounded numbers.','Compare your estimate with your exact answer. If they are far apart, something has gone wrong.','You can also check with the inverse: check a division by multiplying, and a subtraction by adding.'],
 ex:{q:'Estimate 487 × 31.',w:['487 rounds to 500.','31 rounds to 30.','500 × 30 = 15,000']},trap:'Round before you calculate, not after. And show the check in your working. It can earn a mark.'},
n3:{idea:'A formula is a rule written in words or letters. Substituting means swapping each letter or word for its number, then working out the answer.',
 steps:['Write the formula down.','Replace each letter with its number. Two things next to each other, like 5h, means multiply.','Work it out in BIDMAS order: brackets, indices, divide and multiply, add and subtract.','To go backwards, undo each step in reverse order.'],
 ex:{q:'C = 48h + 35. Find C when h = 3.',w:['48h means 48 × 3 = 144.','144 + 35 = 179','C = £179']},trap:'5h with h = 3 is 15, not 53. A number next to a letter means multiply.'},
n4:{idea:'Fractions, decimals and percentages are three ways of writing the same amount. A half is 0.5 and is 50%.',
 steps:['Fraction to decimal: divide the top by the bottom.','Decimal to percentage: multiply by 100.','Percentage to fraction: write it over 100, then simplify.','To compare a mixture, change them all to decimals.'],
 ex:{q:'Write 3/8 as a percentage.',w:['3 ÷ 8 = 0.375','0.375 × 100 = 37.5','37.5%']},trap:'0.07 is 7%, not 70%. Check the place value when you multiply by 100.'},
n5:{idea:'Per cent means "out of 100". To find a percentage of an amount, find 1% or 10% first and build from there, or multiply by the decimal.',
 steps:['10% is the amount divided by 10. 1% is the amount divided by 100.','Build what you need: 5% is half of 10%, 20% is double 10%, 15% is 10% plus 5%.','With a calculator: change the percentage to a decimal and multiply. 17.5% of 460 is 0.175 × 460.','To write one amount as a percentage of another: part ÷ whole × 100.'],
 ex:{q:'Find 15% of £240.',w:['10% of 240 = 24','5% of 240 = 12','24 + 12 = £36']},trap:'For "18 out of 40 as a percentage", divide by the whole (40), not the other way round.'},
n6:{idea:'Percentage change tells you how big a rise or fall is compared with where you started. Reverse percentages take you back to the original amount.',
 steps:['Percentage change = change ÷ original × 100.','To increase by 12%, multiply by 1.12. To decrease by 12%, multiply by 0.88.','To find the original after a change, divide by that same multiplier.'],
 ex:{q:'A coat costs £68 after a 20% discount. What was the original price?',w:['You paid 80% of the original, so the multiplier is 0.8.','68 ÷ 0.8 = 85','Original price £85']},trap:'Do not add 20% back on to £68. That gives £81.60, which is wrong, because 20% of the sale price is not 20% of the original.'},
n7:{idea:'You can only add or subtract fractions when the bottom numbers (denominators) match. Change them first so they do.',
 steps:['Find a number both denominators go into.','Change each fraction: multiply top and bottom by the same number.','Add or subtract the tops. Keep the bottom the same.','Simplify. If the top is bigger than the bottom, write it as a mixed number.'],
 ex:{q:'Work out 2/3 + 3/4.',w:['Both 3 and 4 go into 12.','2/3 = 8/12 and 3/4 = 9/12','8/12 + 9/12 = 17/12','17/12 = 1 5/12']},trap:'Never add the bottoms. 2/3 + 3/4 is not 5/7.'},
n8:{idea:'To write one number as a fraction of another, put the part on top and the whole on the bottom, then simplify.',
 steps:['Make sure both amounts are in the same units.','Write part over whole.','Divide top and bottom by the biggest number that goes into both.'],
 ex:{q:'What fraction of 2 hours is 45 minutes?',w:['2 hours = 120 minutes','45/120','Divide both by 15: 3/8']},trap:'Minutes over hours does not work. Convert first so the units match.'},
n9:{idea:'To compare decimals, line up the decimal points and compare digit by digit from the left. To round, look at the next digit along.',
 steps:['Give every number the same number of decimal places by adding zeros: 0.3 becomes 0.300.','Now compare them like whole numbers.','To round, find the last digit you are keeping. If the next digit is 5 or more, round up.'],
 ex:{q:'Round 4.6871 to 2 decimal places.',w:['Keep 4.68. The next digit is 7.','7 is 5 or more, so round up.','4.69']},trap:'0.35 is bigger than 0.305. More digits does not mean a bigger number.'},
n10:{idea:'Adding and subtracting decimals is about lining up the points. Multiplying and dividing is about getting the decimal point back in the right place.',
 steps:['Add or subtract: line up the decimal points and fill gaps with zeros.','Multiply: ignore the points, multiply the whole numbers, then count the decimal places in the question and put that many in the answer.','Divide by a decimal: multiply both numbers by 10 (or 100) until you are dividing by a whole number.'],
 ex:{q:'Work out 0.6 × 0.45.',w:['6 × 45 = 270','There are 3 decimal places in the question (one in 0.6, two in 0.45).','0.270 = 0.27']},trap:'Always estimate: 0.6 × 0.45 is roughly half of a half, so about 0.25. An answer of 2.7 or 27 must be wrong.'},
n11:{idea:'A ratio compares parts. Proportion is about scaling: in direct proportion both amounts go up together; in inverse proportion one goes up as the other goes down.',
 steps:['Sharing in a ratio: add the parts, divide the total by that to find one part, then multiply.','Direct proportion (recipes, costs): find the amount for one, then scale up.','Inverse proportion (workers and days): multiply to find the total work, then divide by the new number.'],
 ex:{q:'Share £360 in the ratio 2:3:4.',w:['2 + 3 + 4 = 9 parts','360 ÷ 9 = £40 for one part','Shares: £80, £120 and £160']},trap:'More workers means fewer days. If your answer has more workers taking longer, you scaled the wrong way.'},
n12:{idea:'When a calculation has several operations, there is a fixed order: BIDMAS. An index (power) tells you how many times to multiply a number by itself.',
 steps:['Brackets first.','Then indices: 5² means 5 × 5.','Then division and multiplication, working left to right.','Then addition and subtraction, working left to right.'],
 ex:{q:'Work out 3 + 4 × 5².',w:['Index: 5² = 25','Multiply: 4 × 25 = 100','Add: 3 + 100 = 103']},trap:'4³ is 4 × 4 × 4 = 64, not 4 × 3 = 12.'},
m13:{idea:'Money questions mix percentages with real life: interest, VAT, discounts, tax and budgets. Most are two or three steps.',
 steps:['Compound interest: multiply by the multiplier once for every year. At 3%, multiply by 1.03 each year.','VAT at 20%: multiply by 1.2. A 15% discount: multiply by 0.85.','Income tax: take off the tax-free allowance first, then find the percentage of what is left.','Budgets: add up everything going out and subtract it from what comes in.'],
 ex:{q:'£2,000 is invested at 3% compound interest for 2 years.',w:['Year 1: 2000 × 1.03 = 2060','Year 2: 2060 × 1.03 = 2121.80','£2,121.80']},trap:'Compound interest is not the same as doing 3% twice on the original. In year 2 you earn interest on the interest as well.'},
m14:{idea:'Converting means changing a measurement into a different unit. Metric conversions use 10, 100 or 1000. For imperial units, the question gives you a conversion factor or a graph.',
 steps:['Learn the metric facts: 1 km = 1000 m, 1 m = 100 cm, 1 cm = 10 mm, 1 kg = 1000 g, 1 litre = 1000 ml.','With a factor like 1 mile = 1.6 km: multiply to go from miles to km, divide to go back.','With a graph: go from your value to the line, then across or down to the other axis.','If the value is off the graph, read a smaller value and scale up.'],
 ex:{q:'Use 1 mile = 1.6 km to convert 45 miles to km.',w:['Each mile is 1.6 km.','45 × 1.6 = 72','72 km']},trap:'Ask yourself: should the answer be bigger or smaller? There are more km than miles for the same distance, so the km number must be bigger.'},
m15:{idea:'A compound measure links two units, like miles per hour or pounds per hour. "Per" means divide.',
 steps:['Speed = distance ÷ time. Distance = speed × time. Time = distance ÷ speed.','Density = mass ÷ volume. Mass = density × volume.','Pay = hourly rate × hours. Time and a half means 1.5 × the normal rate.','Write minutes as a decimal of an hour: 30 minutes is 0.5, 15 minutes is 0.25, 45 minutes is 0.75.'],
 ex:{q:'A car travels 135 miles in 2 hours 30 minutes. Find its average speed.',w:['2 hours 30 minutes = 2.5 hours','135 ÷ 2.5 = 54','54 mph']},trap:'2 hours 30 minutes is 2.5 hours, not 2.3. Divide the minutes by 60.'},
m16:{idea:'Perimeter is the distance around the outside. Area is the space inside, measured in square units. You must remember the triangle and circle formulas.',
 steps:['Rectangle: area = length × width.','Triangle: area = ½ × base × height.','Circle: area = π × radius². Circumference = π × diameter.','Composite shapes: split into simple shapes, find each area, then add or subtract.'],
 ex:{q:'Find the area of a circle with radius 5 cm.',w:['π × 5²','= π × 25','= 78.5 cm² (1 decimal place)']},trap:'If you are given the diameter, halve it before using the area formula. Square the radius first, then multiply by π.'},
m17:{idea:'Volume is the space inside a 3-D shape, in cubic units. Surface area is the total area of all the outside faces.',
 steps:['Cuboid: volume = length × width × height.','Cylinder: volume = π × radius² × height. You need to remember this one.','Any prism: volume = area of the end face × length.','Surface area: work out the area of each face and add them. A cylinder is 2 circles plus the curved side: 2πr² + 2πrh.'],
 ex:{q:'Find the volume of a cylinder with radius 3 cm and height 10 cm.',w:['π × 3² × 10','= π × 9 × 10','= 282.7 cm³ (1 decimal place)']},trap:'1 litre is 1000 cm³. Tank questions often ask for litres, so divide the cm³ by 1000 at the end.'},
m18:{idea:'A scale tells you how much smaller a drawing is than real life. 1:50 means 1 cm on the drawing is 50 cm in real life.',
 steps:['Drawing to real life: multiply by the scale.','Real life to drawing: divide by the scale.','Then convert the units: 100 cm = 1 m and 100,000 cm = 1 km.'],
 ex:{q:'On a 1:50 plan, a room is 9 cm long. How long is the real room?',w:['9 × 50 = 450 cm','450 ÷ 100 = 4.5','4.5 m']},trap:'For area, scale each length first and then multiply. Do not multiply the drawing area by the scale.'},
m19:{idea:'Coordinates give a position on a grid as (x, y). The first number is across, the second is up or down.',
 steps:['Start at the origin (0, 0).','x: go right for positive, left for negative.','y: go up for positive, down for negative.','Midpoint of two points: average the x values and average the y values.'],
 ex:{q:'Find the midpoint of (−2, 5) and (4, 1).',w:['x: (−2 + 4) ÷ 2 = 1','y: (5 + 1) ÷ 2 = 3','(1, 3)']},trap:'Along the corridor, then up the stairs. (3, −2) and (−2, 3) are different points.'},
m20:{idea:'A 3-D object can be shown with flat drawings. The plan is the view from above. Elevations are the views from the front and the side. A net is the solid unfolded flat.',
 steps:['Front elevation: stand in front and draw only what you see, as a flat shape.','Side elevation: do the same from the side.','Plan: look straight down from above.','For shapes made of cubes, work column by column: how tall is the tallest stack in each column from that view?'],
 ex:{q:'A shape has stacks 2, 1 and 3 cubes high from left to right when seen from the front.',w:['The front elevation is three columns side by side.','Draw them 2, 1 and 3 squares tall.','Depth does not show in an elevation.']},trap:'An elevation is flat. Do not try to draw the 3-D look. A stack hidden behind a taller one does not show.'},
m22:{idea:'A few angle facts solve most problems: a triangle adds up to 180°, a straight line is 180°, a full turn is 360°, and a quadrilateral adds up to 360°.',
 steps:['Decide which fact fits the diagram.','Add up the angles you know.','Subtract from 180° or 360°.','Isosceles triangles have two equal angles, so share what is left equally.'],
 ex:{q:'Two angles in a triangle are 65° and 48°. Find the third.',w:['65 + 48 = 113','180 − 113 = 67','67°']},trap:'Diagrams are not drawn to scale. Calculate the angle; do not measure or guess from the picture.'},
d23:{idea:'The median is the middle value when the data is in order. The mode is the value that appears most often.',
 steps:['Put the numbers in order, smallest first.','Median: cross off from both ends until you reach the middle.','If two numbers are left in the middle, the median is halfway between them.','Mode: look for the value that appears most.'],
 ex:{q:'Find the median of 7, 3, 9, 4, 12, 6.',w:['In order: 3, 4, 6, 7, 9, 12','Middle two: 6 and 7','(6 + 7) ÷ 2 = 6.5']},trap:'The most common mistake is forgetting to put the numbers in order first.'},
d24:{idea:'When data is in groups you cannot know the exact values, so you estimate the mean using the middle of each group.',
 steps:['Find the midpoint of each group: add the two ends and halve.','Multiply each midpoint by its frequency.','Add up those answers.','Divide by the total frequency.'],
 ex:{q:'Groups 0–4 (frequency 3), 5–9 (frequency 5), 10–14 (frequency 2).',w:['Midpoints: 2, 7, 12','2×3 = 6, 7×5 = 35, 12×2 = 24. Total 65.','Total frequency: 10','65 ÷ 10 = 6.5']},trap:'Divide by the total frequency (how many people), not by the number of groups.'},
d25:{idea:'To compare two sets of data, use an average (mean, median or mode) to say which is higher, and the range to say which is more consistent.',
 steps:['Mean = total ÷ how many values.','Range = highest − lowest.','A higher average means higher values overall.','A smaller range means the values are closer together: more consistent.'],
 ex:{q:'Ali scores 20, 24, 22. Ben scores 10, 30, 26. Compare them.',w:['Both have a mean of 22.','Ali: range 4. Ben: range 20.','Same average, but Ali is more consistent.']},trap:'In the exam, write a sentence that uses the numbers. "Ali is better" on its own does not score.'},
d26:{idea:'A combined event is two things happening together, like rolling two dice. Tables and diagrams let you list every outcome so you can count.',
 steps:['Two-way table: find the cell you need and put it over the correct total.','If the question says "one of the adults is chosen", the total is the adults only.','Two dice or a spinner and a coin: draw a grid of all outcomes and count.','Independent events both happening: multiply the probabilities.'],
 ex:{q:'Two dice are rolled. Find the probability of a total of 7.',w:['There are 6 × 6 = 36 outcomes.','Totals of 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). That is 6.','6/36 = 1/6']},trap:'Read which group the person is chosen from. That decides the bottom number of your fraction.'},
d27:{idea:'Probability is a number from 0 (impossible) to 1 (certain). You can write it as a fraction, a decimal or a percentage.',
 steps:['Probability = number of ways it can happen ÷ total number of outcomes.','Change between forms the same way as any fraction, decimal or percentage.','The probability of something not happening is 1 minus the probability that it does.','Expected number = probability × number of tries.'],
 ex:{q:'A bag has 3 red and 7 blue counters. Find P(red) as a percentage.',w:['3 out of 10 = 3/10','3 ÷ 10 = 0.3','30%']},trap:'Never write a probability as "3 in 10" or "3:10" in the exam. Use a fraction, decimal or percentage.'},
d28:{idea:'A scatter diagram plots pairs of values as points to show whether two things are linked. The pattern of the points is called correlation.',
 steps:['Positive correlation: the points go uphill. As one goes up, so does the other.','Negative correlation: the points go downhill. As one goes up, the other goes down.','No correlation: no pattern.','A line of best fit goes through the middle of the points. Use it to estimate: go from the axis to the line, then across.'],
 ex:{q:'Students who revise more tend to score higher. What correlation is that?',w:['Both values rise together.','The points would go uphill.','Positive correlation']},trap:'Read estimates from the line of best fit, not from the nearest point.'},
};


/* ---------- extra Level 2 generators for the topics that the Growing Futures plan teaches as separate sessions ---------- */
const GX={
inv:[()=>{const d=pick([120,180,240,360]),vs=[30,40,45,60,80,90].filter(v=>d%v===0),[v1,v2]=pickN(vs,2);return{calc:false,text:`A journey takes ${d/v1} hours at an average speed of ${v1} mph. How long would the same journey take at ${v2} mph?`,ans:d/v2,suf:'hours',hint:'The distance stays the same. Find it first: speed × time.',steps:[`Distance: ${v1} × ${d/v1} = ${d} miles`,`${d} ÷ ${v2} = <b>${d/v2} hours</b>`,`${v2>v1?'Faster':'Slower'} speed means ${v2>v1?'less':'more'} time. This is inverse proportion.`]};},
 ()=>{const tot=pick([48,60,72,96,120]),ds=[4,6,8,10,12].filter(x=>tot%x===0),[a,b]=pickN(ds,2);return{calc:false,text:`A sack of feed lasts ${a} chickens for ${tot/a} days. How many days would the same sack last ${b} chickens?`,ans:tot/b,suf:'days',hint:'Find the total number of "chicken-days" of feed in the sack.',steps:[`Total feed: ${a} × ${tot/a} = ${tot} chicken-days`,`${tot} ÷ ${b} = <b>${tot/b} days</b>`]};}],
met:[()=>{const w=pick([12,15,20,25,30]),n=rnd(4,12);return{calc:true,text:`A shelf is ${w*n/100} m long. Boxes are ${w} cm wide. How many boxes fit side by side along the shelf?`,ans:n,suf:'boxes',hint:'Change the shelf length into centimetres first.',steps:[`${w*n/100} m = ${w*n} cm`,`${w*n} ÷ ${w} = <b>${n} boxes</b>`]};},
 ()=>{const g=pick([250,350,400,450,650]),n=rnd(4,12);return{calc:true,text:`One loaf needs ${g} g of flour. How many kilograms of flour are needed for ${n} loaves?`,ans:rd(g*n/1000,3),suf:'kg',hint:'Find the total in grams, then divide by 1000.',steps:[`${g} × ${n} = ${nf(g*n)} g`,`${nf(g*n)} ÷ 1000 = <b>${rd(g*n/1000,3)} kg</b>`]};},
 ()=>{const ml=pick([330,500,750]),n=pick([6,8,12,20,24]);return{calc:true,text:`A bottle holds ${ml} ml. How many litres are there in ${n} bottles?`,ans:rd(ml*n/1000,3),suf:'litres',hint:'Find the total in millilitres, then divide by 1000.',steps:[`${ml} × ${n} = ${nf(ml*n)} ml`,`${nf(ml*n)} ÷ 1000 = <b>${rd(ml*n/1000,3)} litres</b>`]};}],
den:[()=>{const d=pick([0.8,1.2,2.5,2.7,7.8,8.9]),vol=pick([20,50,80,120,200,250]),m=rd(d*vol,2);return{calc:true,text:`A material has a density of ${d} g/cm³. A piece of it has a mass of ${nf(m)} g. What is its volume?`,ans:vol,suf:'cm³',hint:'Volume = mass ÷ density.',steps:[`${nf(m)} ÷ ${d} = <b>${vol} cm³</b>`]};},
 ()=>{const d=pick([0.5,0.8,1.5,2.5,2.7]),l=rnd(4,10),w=rnd(2,6),h=rnd(2,5),m=rd(d*l*w*h,2);return{calc:true,text:`A block measures ${l} cm by ${w} cm by ${h} cm. It has a mass of ${nf(m)} g. What is its density?`,ans:d,suf:'g/cm³',hint:'Find the volume of the block first. Then density = mass ÷ volume.',steps:[`Volume: ${l} × ${w} × ${h} = ${l*w*h} cm³`,`${nf(m)} ÷ ${l*w*h} = <b>${d} g/cm³</b>`]};}],
pay:[()=>{const p=pick([0.35,0.4,0.45,0.6,0.75]),n=rnd(20,45),h=pick([4,5,6,7.5,8]);return{calc:true,text:`${who()} is paid £${p.toFixed(2)} for each box packed and packs ${n} boxes an hour for ${h} hours. How much is earned in total?`,ans:rd(p*n*h,2),pre:'£',hint:'Find how many boxes are packed in total, then multiply by the pay for one box.',steps:[`Boxes: ${n} × ${h} = ${n*h}`,`${n*h} × £${p.toFixed(2)} = <b>${gbp(rd(p*n*h,2))}</b>`]};}]};
const L2X={
inv:{idea:'In inverse proportion, when one amount goes up the other goes down. Twice as many workers take half the time. Twice the speed takes half the time.',steps:['Find the fixed total first by multiplying: workers × days, or speed × time.','Divide that total by the new number.','Check the direction: more workers or more speed must give less time.'],ex:{q:'4 painters take 6 days. How long would 8 painters take?',w:['Total work: 4 × 6 = 24 painter-days.','24 ÷ 8 = 3','3 days.']},trap:'Do not scale both the same way. More workers does not mean more days.'},
met:{idea:'Metric units go up in 10s, 100s and 1000s. Before you calculate, put every measurement into the same unit.',steps:['Learn the facts: 10 mm = 1 cm, 100 cm = 1 m, 1000 m = 1 km, 1000 g = 1 kg, 1000 ml = 1 litre.','To go to a smaller unit, multiply. To go to a bigger unit, divide.','Do the calculation, then give the answer in the unit the question asks for.'],ex:{q:'A plank is 2.4 m long. How many 30 cm pieces can be cut from it?',w:['2.4 m = 240 cm','240 ÷ 30 = 8','8 pieces.']},trap:'Never mix metres and centimetres in one sum. Convert first.'},
gra:{idea:'A conversion graph is a straight line that lets you change one unit into another without calculating.',steps:['Find your value on one axis.','Go straight to the line, then turn and go straight to the other axis.','Read the value. Check what each small square is worth first.','If your value is off the graph, read a smaller value and scale it up.'],ex:{q:'Use a miles-to-km graph to convert 300 miles.',w:['300 is off the graph. Read 30 miles instead: 48 km.','300 is 10 times bigger.','48 × 10 = 480 km']},trap:'Use a ruler or the edge of a piece of paper to go straight up and across.'},
spd:{idea:'Speed tells you how far something travels in each hour. The three facts are linked: speed, distance and time.',steps:['Speed = distance ÷ time.','Distance = speed × time.','Time = distance ÷ speed.','Write minutes as a decimal of an hour first: 30 minutes is 0.5, 15 minutes is 0.25, 45 minutes is 0.75.'],ex:{q:'A car travels 135 miles in 2 hours 30 minutes. Find its average speed.',w:['2 hours 30 minutes = 2.5 hours','135 ÷ 2.5 = 54','54 mph']},trap:'2 hours 30 minutes is 2.5 hours, not 2.3. Divide the minutes by 60.'},
dens:{idea:'Density tells you how heavy a material is for its size. Lead is dense. Foam is not.',steps:['Density = mass ÷ volume.','Mass = density × volume.','Volume = mass ÷ density.','For a block, find the volume first: length × width × height.'],ex:{q:'A 50 cm³ block has a mass of 135 g. Find its density.',w:['135 ÷ 50 = 2.7','2.7 g/cm³']},trap:'Check the units match. If the density is in g/cm³, the mass must be in grams and the volume in cm³.'},
payl:{idea:'A rate of pay is how much you earn for each hour worked, or for each item made.',steps:['Pay = hourly rate × hours worked.','Overtime at "time and a half" is 1.5 × the normal rate. "Double time" is 2 ×.','Work out normal pay and overtime pay separately, then add.','Hourly rate = total pay ÷ hours.'],ex:{q:'£12 an hour for 35 hours, plus 4 hours at time and a half.',w:['Normal: 35 × 12 = £420','Overtime rate: 12 × 1.5 = £18. Overtime: 4 × 18 = £72','Total: £492']},trap:'Only the overtime hours are paid at the higher rate.'}};

level('l2',{name:'Level 2',short:'L2',blocks:[
 {n:1,title:'Number, fractions and formulae',aim:'Use accurate number methods in unfamiliar practical contexts.'},
 {n:2,title:'Percentages, proportion and finance',aim:'Use proportional and financial calculations to justify choices.'},
 {n:3,title:'Conversions and compound measures',aim:'Use conversions and rates to plan efficiently.'},
 {n:4,title:'Geometry, scales and coordinates',aim:'Use geometry to justify practical design decisions.'},
 {n:5,title:'Data, probability and correlation',aim:'Evaluate data and probability to support a reasoned decision.'},
 {n:6,title:'Consolidation, assessment and exam readiness',aim:'Apply the full Level 2 curriculum independently and prepare for the exam.'}]});
const L2MAP={n1:[1,1],n2:[1,1],n9:[1,2],n10:[1,2],n7:[1,3],n8:[1,4],n3:[1,5],n12:[1,5],n4:[2,7],n5:[2,7],n6:[2,8],m13:[2,11],m16:[4,19],m17:[4,20],m18:[4,21],m19:[4,22],m22:[4,22],m20:[4,23],d23:[5,25],d24:[5,26],d25:[5,27],d26:[5,28],d27:[5,28],d28:[5,29]};
L2T.forEach(t=>{const m=L2MAP[t.id];if(m)topic('l2-'+t.id,{b:m[0],s:m[1],title:t.title,area:t.area,dfe:t.scs,vq:t.vq,lesson:L2LESSONS[t.id],gens:G[t.id]});});
topic('l2-ratio',{b:2,s:9,title:'Ratio and direct proportion',area:'N',dfe:'11',vq:'ratio direct proportion',lesson:L2LESSONS.n11,gens:[G.n11[0],G.n11[1],G.n11[2],G.n11[4],G.n11[5]]});
topic('l2-inverse',{b:2,s:10,title:'Inverse proportion',area:'N',dfe:'11',vq:'inverse proportion',lesson:L2X.inv,gens:[G.n11[3],...GX.inv]});
topic('l2-metric',{b:3,s:13,title:'Metric conversions',area:'M',dfe:'14',vq:'metric unit conversions',lesson:L2X.met,gens:[G.m14[2],...GX.met]});
topic('l2-imperial',{b:3,s:14,title:'Metric and imperial units',area:'M',dfe:'14',vq:'metric imperial conversion factors',lesson:L2LESSONS.m14,gens:[G.m14[0],G.m14[1],G.m14[4]]});
topic('l2-graph',{b:3,s:15,title:'Conversion graphs',area:'M',dfe:'14',vq:'conversion graphs',lesson:L2X.gra,gens:[G.m14[3]]});
topic('l2-speed',{b:3,s:16,title:'Speed, distance and time',area:'M',dfe:'15',vq:'speed distance time',lesson:L2X.spd,gens:[G.m15[0],G.m15[1],G.m15[2]]});
topic('l2-density',{b:3,s:17,title:'Density, mass and volume',area:'M',dfe:'15',vq:'density mass volume',lesson:L2X.dens,gens:[G.m15[3],...GX.den]});
topic('l2-pay',{b:3,s:18,title:'Rates of pay',area:'M',dfe:'15',vq:'rates of pay overtime',lesson:L2X.payl,gens:[G.m15[4],G.m15[5],G.m15[6],...GX.pay]});
