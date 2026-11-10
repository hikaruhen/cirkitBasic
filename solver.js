'use strict';
(function(root){
// Teaching analog voltmeter: 1000 ohms/volt, 1 mA full-scale; not a measured instrument specification.
const voltmeterResistance=range=>1000*range;
const lampCoefficient=.25*Math.sqrt(7)/6,protectionResistance=.01;
const lampCurrent=v=>lampCoefficient*v/Math.sqrt(1+Math.abs(v));
const lampSlope=v=>lampCoefficient*(1+Math.abs(v)/2)/Math.pow(1+Math.abs(v),1.5);
// Red LED teaching fit: 1.9 V at 10 mA, ~2.045 V at 20 mA. C1 piecewise nonlinear curve,
// not a fixed resistance; finite reverse leakage. Beyond ratings is damage territory, not a calibrated IV prediction.
const ledCurrent=v=>1e-7*v+(v>1.55?(v-1.55)**2*(.01/.35**2):0);
const ledSlope=v=>1e-7+(v>1.55?2*(v-1.55)*(.01/.35**2):0);
const norm=t=>{const [id,end]=t.split(':');return id+':'+(end.startsWith('p')?'p':end)};
// Rank-revealing elimination: free ideal branch currents are allowed, never
// silently returned as a measured current. A representative solution drives animation.
function rankSolve(matrix,sourceIndices=[]){
 const A=matrix.map(r=>r.slice()),n=A.length,pivots=[];let row=0;
 for(let col=0;col<n&&row<n;col++){let at=row;for(let j=row+1;j<n;j++)if(Math.abs(A[j][col])>Math.abs(A[at][col]))at=j;
 if(Math.abs(A[at][col])<1e-11)continue;[A[row],A[at]]=[A[at],A[row]];const d=A[row][col];for(let c=col;c<=n;c++)A[row][c]/=d;
 for(let j=0;j<n;j++)if(j!==row){const f=A[j][col];for(let c=col;c<=n;c++)A[j][c]-=f*A[row][c]}pivots.push(col);row++}
 for(let j=row;j<n;j++)if(Math.abs(A[j][n])>1e-8)return null;
 const free=Array.from({length:n},(_,i)=>i).filter(i=>!pivots.includes(i)),x=Array(n).fill(0),uncertain=new Set(free);
 pivots.forEach((col,i)=>{x[col]=A[i][n];if(free.some(f=>Math.abs(A[i][f])>1e-8))uncertain.add(col)});
 const basis=free.map(f=>{const v=Array(n).fill(0);v[f]=1;pivots.forEach((col,i)=>v[col]=-A[i][f]);return v}),originalUncertain=new Set(uncertain);
 // Choose the zero equal-cell-resistance limit within the exact ideal MNA solution
 // space: minimize sum(I_battery^2), without changing voltages/KCL/unique currents.
 // Any remaining pure ideal-wire/ammeter freedoms stay explicitly indeterminate.
 if(sourceIndices.some(i=>uncertain.has(i))){const normal=basis.map((v,j)=>[...basis.map(u=>sourceIndices.reduce((sum,i)=>sum+v[i]*u[i],0)),-sourceIndices.reduce((sum,i)=>sum+v[i]*x[i],0)]),choice=rankSolve(normal);if(!choice)return null;const next=x.map((v,i)=>v+basis.reduce((sum,b,j)=>sum+b[i]*choice.x[j],0)),remaining=choice.nullspace.map(v=>x.map((_,i)=>basis.reduce((sum,b,j)=>sum+b[i]*v[j],0))),residual=new Set();for(let i=0;i<n;i++)if(remaining.some(v=>Math.abs(v[i])>1e-8))residual.add(i);return {x:next,uncertain:residual,nullspace:remaining,originalUncertain};}
 return {x,uncertain,nullspace:basis,originalUncertain};
}
function solveCircuit(parts,inputWires){
 const fail=(code,error,affected=[])=>({error,code,affected,protection:'global',summary:'全場保護暫停：'+error,meters:{},currents:{},voltages:{},warnings:[],diagnostics:[],indeterminateCurrents:[]});
 if(new Set(parts.map(p=>p.id)).size!==parts.length)return fail('invalid','元件識別重複');
 const parent={},find=x=>{if(!(x in parent))parent[x]=x;return parent[x]===x?x:parent[x]=find(parent[x])},join=(a,b)=>parent[find(a)]=find(b),used={},ranges={};
 for(const p of parts){if(!['battery','resistor','lamp','led','switch','ammeter','voltmeter','junction','fuse','breaker'].includes(p.type))return fail('invalid','未知元件',[p.id]);if(['resistor','battery'].includes(p.type)&&(!Number.isFinite(p.value)||p.value<=0||p.value>1000))return fail('invalid','電源與電阻需為有效正值',[p.id]);if(['fuse','breaker'].includes(p.type)&&(!Number.isFinite(p.ratedCurrent)||p.ratedCurrent<.05||p.ratedCurrent>2))return fail('invalid','保護額定電流需為50至2000 mA',[p.id]);find(p.id+':p');find(p.id+':n');
 if(['ammeter','voltmeter'].includes(p.type)){const ports=[...new Set(inputWires.flatMap(w=>[w.a,w.b]).filter(t=>t.startsWith(p.id+':p')))];if(ports.length>1)return fail('multi-range','同一儀表接了多個紅端，請只留一個量程端',[p.id]);const port=ports[0]?.split(':')[1];ranges[p.id]=port&&port!=='p'?Number(port.slice(1))/(p.type==='ammeter'?1000:1):p.range;if(!Number.isFinite(ranges[p.id])||ranges[p.id]<=0)return fail('invalid','儀表量程需為有效正值',[p.id]);used[p.id]=port||'p';}}
 const wires=inputWires.map(w=>({a:norm(w.a),b:norm(w.b)})),idealGraph={};
 const edge=(a,b,delta,key)=>{(idealGraph[a]??=[]).push({to:b,delta,key});(idealGraph[b]??=[]).push({to:a,delta:-delta,key})};
 function route(start,target){if(start===target)return {delta:0,keys:[]};const queue=[start],seen=new Map([[start,{delta:0,from:null}]]);for(let i=0;i<queue.length;i++){const at=queue[i];for(const e of idealGraph[at]||[])if(!seen.has(e.to)){seen.set(e.to,{delta:seen.get(at).delta+e.delta,from:at,key:e.key});if(e.to===target){const keys=[];let t=target;while(t!==start){keys.push(seen.get(t).key);t=seen.get(t).from}return {delta:seen.get(target).delta,keys}}queue.push(e.to)}}return null}
 wires.forEach((w,i)=>{if(!(w.a in parent)||!(w.b in parent))return;join(w.a,w.b);edge(w.a,w.b,0,'w'+i)});
 if(wires.some(w=>!(w.a in parent)||!(w.b in parent)))return fail('invalid','導線端點不存在');
 for(const p of parts.filter(p=>p.type==='junction')){join(p.id+':p',p.id+':n');edge(p.id+':p',p.id+':n',0,p.id)}
 for(const p of parts.filter(p=>p.type==='ammeter'||p.type==='switch'&&p.closed))edge(p.id+':p',p.id+':n',0,p.id);
 for(const b of parts.filter(p=>p.type==='battery')){const path=route(b.id+':p',b.id+':n');if(path){const keys=[b.id,...path.keys];if(!path.keys.some(key=>parts.some(p=>p.id===key&&p.type==='battery'))){const amp=path.keys.some(key=>parts.some(p=>p.id===key&&p.type==='ammeter'));return fail(amp?'ammeter-short':'source-short',amp?'安培計／零阻路徑短接電源；斷開紅色路徑即可恢復。':'電源被零阻路徑短接；斷開紅色路徑即可恢復。',keys)}if(Math.abs(path.delta+b.value)>1e-8)return fail('source-conflict','理想電源電壓互相衝突；請斷開標紅迴路或調整電池接法。',keys)}edge(b.id+':p',b.id+':n',-b.value,b.id)}
 const terminals=Object.keys(parent),nodes=[...new Set(terminals.map(find))],adj=Object.fromEntries(nodes.map(n=>[n,[]])),active=parts.filter(p=>p.type!=='junction'&&(!['switch','fuse','breaker'].includes(p.type)||p.closed&&!p.tripped&&!p.damage));
 for(const p of active){const a=find(p.id+':p'),b=find(p.id+':n');adj[a].push(b);adj[b].push(a)}
 const groups={},grounds=[];for(const n of nodes){if(n in groups)continue;grounds.push(n);const stack=[n];groups[n]=n;while(stack.length){const a=stack.pop();for(const b of adj[a])if(!(b in groups)){groups[b]=n;stack.push(b)}}}
 const unknown=nodes.filter(n=>!grounds.includes(n)),idx=Object.fromEntries(unknown.map((n,i)=>[n,i])),ideal=active.filter(p=>['battery','ammeter','switch'].includes(p.type)),N=unknown.length+ideal.length;
 const at=(v,t)=>idx[find(t)]===undefined?0:v[idx[find(t)]];
 let x=Array(N).fill(0),uncertain=new Set(),originalUncertain=new Set(),converged=false;const sourceIndices=ideal.flatMap((p,i)=>p.type==='battery'?[unknown.length+i]:[]);
 for(let iteration=0;iteration<100;iteration++){
 const A=Array.from({length:N},()=>Array(N+1).fill(0)),add=(a,b,v)=>{if(a!==undefined&&b!==undefined)A[a][b]+=v},rhs=(a,v)=>{if(a!==undefined)A[a][N]+=v};
 for(const p of active){const a=idx[find(p.id+':p')],b=idx[find(p.id+':n')];if(['resistor','lamp','led','voltmeter','fuse','breaker'].includes(p.type)){const v=at(x,p.id+':p')-at(x,p.id+':n'),g=p.type==='led'?ledSlope(v):p.type==='lamp'?lampSlope(v):1/(p.type==='voltmeter'?voltmeterResistance(ranges[p.id]):['fuse','breaker'].includes(p.type)?protectionResistance:p.value),j=p.type==='led'?ledCurrent(v)-g*v:p.type==='lamp'?lampCurrent(v)-g*v:0;add(a,a,g);add(b,b,g);add(a,b,-g);add(b,a,-g);rhs(a,-j);rhs(b,j)}}
 ideal.forEach((p,i)=>{const k=unknown.length+i,a=idx[find(p.id+':p')],b=idx[find(p.id+':n')];add(a,k,1);add(b,k,-1);add(k,a,1);add(k,b,-1);A[k][N]=p.type==='battery'?p.value:0});
 const linear=rankSolve(A,sourceIndices);if(!linear)return fail('inconsistent','電路限制互相衝突，請檢查電源接法。',ideal.map(p=>p.id));const next=linear.x;if(next.some(v=>!Number.isFinite(v)))return fail('numeric','無法取得有限讀值，請檢查接線。');const change=next.reduce((d,v,i)=>Math.max(d,Math.abs(v-x[i])),0);x=next;uncertain=linear.uncertain;originalUncertain=linear.originalUncertain;if(change<1e-9){converged=true;break}}
 if(!converged)return fail('convergence','非線性求解尚未收斂，請簡化接線。');
 const meters={},currents={},voltages={},warnings=[],diagnostics=[],indeterminateCurrents=[],sharedSourceCurrents=[];
 for(const p of parts){const same=groups[find(p.id+':p')]===groups[find(p.id+':n')],v=same?at(x,p.id+':p')-at(x,p.id+':n'):null,i=ideal.indexOf(p),ambiguous=i>=0&&uncertain.has(unknown.length+i);voltages[p.id]=v;currents[p.id]=i>=0?x[unknown.length+i]:p.type==='resistor'?v/p.value:p.type==='voltmeter'?v/voltmeterResistance(ranges[p.id]):['fuse','breaker'].includes(p.type)&&p.closed&&!p.tripped&&!p.damage?v/protectionResistance:p.type==='led'?ledCurrent(v):p.type==='lamp'?lampCurrent(v):0;if(ambiguous)indeterminateCurrents.push(p.id);if(p.type==='battery'&&i>=0&&originalUncertain.has(unknown.length+i))sharedSourceCurrents.push(p.id);
 if(p.type==='ammeter'||p.type==='voltmeter')meters[p.id]={value:p.type==='ammeter'?(ambiguous?null:currents[p.id]):v,floating:!same,indeterminate:p.type==='ammeter'&&ambiguous,range:ranges[p.id],port:used[p.id],assumedSourceSharing:p.type==='ammeter'&&i>=0&&originalUncertain.has(unknown.length+i)&&!ambiguous,...(p.type==='voltmeter'?{inputResistance:voltmeterResistance(ranges[p.id]),branchI:currents[p.id]}:{})};
 if(['lamp','resistor'].includes(p.type)&&Math.abs(v??1)<1e-8){const path=route(p.id+':p',p.id+':n');if(path&&path.keys.length&&!path.keys.some(key=>parts.some(q=>q.id===key&&q.type==='battery')))diagnostics.push({code:'bypassed',parts:[p.id],paths:path.keys,label:(p.label|| (p.type==='lamp'?'燈泡':'電阻'))+'被旁路'})}}
 if(sharedSourceCurrents.length)diagnostics.push({code:'source-sharing',parts:sharedSourceCurrents,paths:[],label:'相容電源採同電池極小內阻的理想極限分流示意。'});
 if(indeterminateCurrents.length)diagnostics.push({code:'ideal-sharing',parts:indeterminateCurrents,paths:[],label:'零阻支流分配為示意；安培計不唯一時標「未定」'});
 if(!parts.some(p=>p.type==='battery'))diagnostics.unshift({code:'no-source',parts:[],paths:[],label:'無電源：不會持續流動'});
 if(parts.some(p=>p.type==='switch'&&!p.closed))warnings.push('有開關斷開，該支路可能不導通。');
 return {meters,currents,voltages,warnings,diagnostics,indeterminateCurrents,sharedSourceCurrents,sourceSharingModel:sharedSourceCurrents.length?'equal-cell-zero-resistance-limit':null,error:null,affected:[]};
}
const api={solveCircuit,lampCurrent,ledCurrent,ledSlope,voltmeterResistance,protectionResistance};if(typeof module!=='undefined')module.exports=api;else Object.assign(root,api);
})(typeof window==='undefined'?globalThis:window);
