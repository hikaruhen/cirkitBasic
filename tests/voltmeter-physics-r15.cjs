'use strict';
const assert=require('node:assert/strict'),{solveCircuit}=require('../solver.js'),{workingCircuit,workingFlows,faultCandidates}=require('../safety.js');let checks=0;
const near=(a,b)=>{assert(Number.isFinite(a)&&Math.abs(a-b)<1e-10,`${a} != ${b}`);checks++},part=(id,type,value,range=15)=>({id,type,value,range,closed:true}),w=(a,b)=>({a,b});
for(const range of [3,15,30]){
 const parts=[part('b','battery',1.5),part('v','voltmeter',undefined,range)],wires=[w('b:p',`v:p${range}`),w('v:n','b:n')];let r=workingCircuit(parts,wires);assert.equal(r.error,null);near(r.meters.v.inputResistance,range*1000);near(r.meters.v.branchI,1.5/(range*1000));near(r.currents.b,-r.currents.v);assert.equal(faultCandidates(parts,wires,r).length,0);workingFlows(parts,wires,r).forEach(i=>near(i,r.currents.v));
 r=solveCircuit(parts,[w('b:p','v:n'),w(`v:p${range}`,'b:n')]);near(r.meters.v.value,-1.5);near(r.currents.v,-1.5/(range*1000));
 for(const wires0 of [[],[w('b:p',`v:p${range}`)],[w('b:p',`v:p${range}`),w('b:p','v:n')]]){r=solveCircuit(parts,wires0);near(r.currents.v,0);near(r.currents.b,0)}
 r=solveCircuit([parts[1]],[]);near(r.currents.v,0);
 const series=[...parts,part('r','resistor',100)],sw=[w('b:p','r:p'),w('r:n',`v:p${range}`),w('v:n','b:n')];r=solveCircuit(series,sw);const i=1.5/(range*1000+100);near(r.currents.v,i);near(r.currents.r,i);near(r.meters.v.value,i*range*1000);near(r.voltages.r,100*i);near(r.voltages.r+r.meters.v.value,1.5);
 const divider=[...parts,part('r','resistor',1000),part('s','resistor',1000)],parallel=[w('b:p','r:p'),w('r:n','s:p'),w('s:n','b:n'),w('r:n',`v:p${range}`),w('v:n','b:n')];r=solveCircuit(divider,parallel);const rp=1/(1/1000+1/(range*1000)),v=1.5*rp/(1000+rp);near(r.meters.v.value,v);assert(v<.75);near(r.currents.r,r.currents.s+r.currents.v);near(r.currents.b,-r.currents.r);const flows=workingFlows(divider,parallel,r);near(flows[3],r.currents.v);near(flows[4],r.currents.v);
 r=workingCircuit([{...parts[0]}, {...parts[1],damage:{reason:'test'}}],wires);near(r.currents.v,0);near(r.currents.b,0);assert(r.meters.v.damaged);
 const open=[...series,part('sw','switch')];open[3].closed=false;r=workingCircuit(open,[w('b:p','sw:p'),w('sw:n','r:p'),w('r:n',`v:p${range}`),w('v:n','b:n')]);near(r.currents.v,0);
 // Actual wired red port wins over stale selected metadata.
 r=solveCircuit([{...parts[0]},{...parts[1],range:30}],wires);near(r.meters.v.inputResistance,range*1000);
}
let parts=[part('b','battery',6),part('v','voltmeter',undefined,3)],wires=[w('b:p','v:p3'),w('v:n','b:n')],r=workingCircuit(parts,wires);assert.equal(faultCandidates(parts,wires,r)[0].code,'voltmeter-overvoltage');assert.equal(solveCircuit(parts,[...wires,w('v:p15','b:p')]).code,'multi-range');
console.log('PASS r15 finite-V analytic checks:',checks,'plus range, fault, multi-port, KCL, loading, series, reverse, open, no-source and damaged-open assertions');
