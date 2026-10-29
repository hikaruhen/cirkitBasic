'use strict';
(function(root){
const solve=typeof module==='undefined'?root.solveCircuit:require('./solver.js').solveCircuit;
const flow=typeof module==='undefined'?root.wireFlows:require('./flow.js').wireFlows;
const colors=['#171a1c','#795035','#cf403d','#ee8129','#efca3a','#347e52','#3476ae','#88539c','#8a8d8f','#f5f4e9'];
const colorNames=['黑','棕','紅','橙','黃','綠','藍','紫','灰','白'];
function fourBands(value){if(!Number.isFinite(value)||value<=0)throw Error('Resistance must be positive');let exponent=Math.floor(Math.log10(value))-1,n=value/10**exponent;if(Math.abs(n-Math.round(n))>1e-8)throw Error('Not exactly representable by four bands');n=Math.round(n);if(n<10||n>99||exponent< -2||exponent>9)throw Error('Unsupported four-band resistance');const digits=[Math.floor(n/10),n%10],multiplier=exponent===-1?'#c4a24c':exponent===-2?'#bfc1bf':colors[exponent],multiplierName=exponent===-1?'金':exponent===-2?'銀':colorNames[exponent];return {colors:[colors[digits[0]],colors[digits[1]],multiplier,'#c4a24c'],names:[colorNames[digits[0]],colorNames[digits[1]],multiplierName,'金'],digits,exponent,tolerance:5,value};}
function workingCircuit(parts,wires){const map=[];const activeWires=wires.filter((w,i)=>{if(w.broken)return false;map.push(i);return true}),activeParts=parts.map(p=>p.damage?{...p,type:'switch',closed:false}:p),result=solve(activeParts,activeWires);const remap=key=>/^w\d+$/.test(key)?'w'+map[Number(key.slice(1))]:key;
 if(result.affected)result.affected=result.affected.map(remap);for(const d of result.diagnostics||[])if(d.paths)d.paths=d.paths.map(remap);
 for(const p of parts.filter(p=>p.damage)){result.currents[p.id]=0;if(['ammeter','voltmeter'].includes(p.type))result.meters[p.id]={value:null,range:p.range,damaged:true,floating:false,indeterminate:false};}
 if(!result.error){const broken=parts.filter(p=>p.damage);if(broken.length||wires.some(w=>w.broken))result.diagnostics.unshift({code:'damaged-open',parts:broken.map(p=>p.id),paths:[],label:broken.length?'有報廢元件：故障支路已開路，先修線再更換':'導線已燒斷：先修正短路再更換導線'});}
 return result;
}
function workingFlows(parts,wires,result){const map=[],active=wires.filter((w,i)=>{if(w.broken)return false;map.push(i);return true}),values=flow(parts,active,result),all=wires.map(()=>0);map.forEach((i,k)=>all[i]=values[k]);return all;}
function faultCandidates(parts,wires,result){const list=[];
 if(result.error){if(!['source-short','ammeter-short'].includes(result.code))return list;const affected=result.affected||[],amps=parts.filter(p=>p.type==='ammeter'&&!p.damage&&affected.includes(p.id));if(amps.length)return amps.map(p=>({kind:'part',id:p.id,code:'ammeter-short',reason:'低內阻安培計跨接電源，短路過電流（教學簡化）',limit:p.range,delay:.65}));const indices=affected.filter(k=>/^w\d+$/.test(k)).map(k=>Number(k.slice(1))).filter(i=>wires[i]&&!wires[i].broken).sort((a,b)=>b-a);if(indices.length)list.push({kind:'wire',id:wires[indices[0]].uid||'wire-'+indices[0],index:indices[0],code:'wire-short',reason:'電源短路：故障迴路導線燒斷（教學保護示意）',delay:.65});return list;}
 for(const p of parts){if(p.damage)continue;const meter=result.meters[p.id],v=result.voltages[p.id],i=result.currents[p.id];if(p.type==='ammeter'&&meter&&!meter.indeterminate&&meter.value!=null&&Math.abs(meter.value)>meter.range+1e-8)list.push({kind:'part',id:p.id,code:'ammeter-overload',reason:`超量程過電流：${(Math.abs(meter.value)*1000).toFixed(1)} mA > ${meter.range*1000} mA`,actual:Math.abs(meter.value),limit:meter.range,delay:.9});
 if(p.type==='voltmeter'&&meter?.value!=null&&Math.abs(meter.value)>meter.range+1e-8)list.push({kind:'part',id:p.id,code:'voltmeter-overvoltage',reason:`超量程電壓：${Math.abs(meter.value).toFixed(1)} V > ${meter.range} V（教學簡化損壞）`,actual:Math.abs(meter.value),limit:meter.range,delay:.9});
 if(['lamp','resistor'].includes(p.type)&&Number.isFinite(v)&&Number.isFinite(i)){const power=Math.abs(v*i),limit=p.ratedPower??(p.type==='lamp'?1.5:5);if(power>limit+1e-8)list.push({kind:'part',id:p.id,code:'power-overload',reason:`功率過載：${power.toFixed(2)} W > ${limit} W（教學上限）`,actual:power,limit,delay:.9});}}
 return list;
}
function damagedLabel(p){return p.type==='ammeter'?'安培計已燒毀':p.type==='voltmeter'?'伏特計已報廢':p.type==='lamp'?'燈泡已燒毀':'電阻已燒毀'}
const api={fourBands,workingCircuit,workingFlows,faultCandidates,damagedLabel};if(typeof module!=='undefined')module.exports=api;else Object.assign(root,api);
})(typeof window==='undefined'?globalThis:window);
