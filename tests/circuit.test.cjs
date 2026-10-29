'use strict';
const {solveCircuit}=require('../solver.js');const assert=require('node:assert/strict');let count=0;
function near(a,b){assert.equal(typeof a,'number');assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);count++}
const p=(id,type,value)=>({id,type,value,closed:true,range:15});const w=(a,b)=>({a,b});
let parts=[p('b','battery',6),p('a','ammeter'),p('r','resistor',10),p('s','resistor',20),p('v','voltmeter')];
let wires=[w('b:p','a:p'),w('a:n','r:p'),w('r:n','s:p'),w('s:n','b:n'),w('v:p','r:p'),w('v:n','r:n')];
let r=solveCircuit(parts,wires);assert.equal(r.error,null);near(r.meters.a.value,.2);near(r.meters.v.value,2);
wires=wires.filter(w=>!w.a.startsWith('v:'));wires.push(w('v:p','s:p'),w('v:n','s:n'));near(solveCircuit(parts,wires).meters.v.value,4);
wires=wires.filter(w=>!w.a.startsWith('v:'));wires.push(w('v:n','s:p'),w('v:p','s:n'));near(solveCircuit(parts,wires).meters.v.value,-4);
parts=[p('b','battery',6),p('a','ammeter'),p('a2','ammeter'),p('r','resistor',10),p('s','resistor',20),p('v','voltmeter')];wires=[w('b:p','a:p'),w('a:n','r:p'),w('a:n','a2:p'),w('a2:n','s:p'),w('r:n','b:n'),w('s:n','b:n'),w('v:p','s:p'),w('v:n','s:n')];r=solveCircuit(parts,wires);near(r.meters.a.value,.9);near(r.meters.a2.value,.3);near(r.meters.v.value,6);
parts=[p('b','battery',6),p('r','resistor',10),p('v','voltmeter')];wires=[w('b:p','r:p'),w('r:n','v:p'),w('v:n','b:n')];r=solveCircuit(parts,wires);near(r.meters.v.value,6);near(r.currents.r,0);
parts.push(p('sw','switch'));parts[3].closed=false;wires=[w('b:p','sw:p'),w('sw:n','r:p'),w('r:n','b:n'),w('v:p','b:p'),w('v:n','b:n')];r=solveCircuit(parts,wires);near(r.currents.r,0);near(r.meters.v.value,6);
r=solveCircuit(parts,wires.filter(w=>!w.a.startsWith('v:')));assert.equal(r.meters.v.value,null);count++;r=solveCircuit(parts,[...wires,w('b:p','b:n')]);assert(r.error);count++;
parts=[p('b','battery',6),p('a','ammeter')];r=solveCircuit(parts,[w('b:p','a:p'),w('b:n','a:n')]);assert(r.error);count++;
parts=[p('b','battery',6),p('v','voltmeter')];r=solveCircuit(parts,[w('b:p','v:p'),w('b:p','v:n')]);near(r.meters.v.value,0);
console.log(`PASS: ${count} physics assertions (series, parallel, branch, reversed, open, voltmeter-in-series, floating, short, same node)`);
