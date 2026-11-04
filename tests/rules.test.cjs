const assert = require('node:assert/strict');
const {evaluateReport,toggleExcluded} = require('../rules.js');
const data = require('../data.js');
assert.deepEqual(data.suspects.map(s=>[s.id,s.gender,s.year,s.city]),[
 [1,'男',1994,'成都'],[2,'女',1992,'成都'],[3,'男',1987,'成都'],
 [4,'男',1996,'武汉'],[5,'女',1998,'武汉'],[6,'男',2001,'成都']
]);
assert.equal(Object.values(data.identity).join('').length,18);
assert.equal(Object.values(data.identity).join('')[16],'5');
let cases = 0, passes = 0;
for(let person=1;person<=6;person++) for(let mask=0;mask<16;mask++){
 const reasons=['A','B','C','D'].filter((_,i)=>mask&(1<<i));
 const result=evaluateReport(person,reasons);
 assert.equal(result.passed,person===1&&mask===7);
 if(result.passed) passes++;else assert.ok(result.hints.length);
 cases++;
}
assert.equal(passes,1);
assert.equal(evaluateReport(null,[]).passed,false);
assert.equal(evaluateReport(1,['A','B','C','X']).passed,false);
const original=[2,5];
assert.deepEqual(toggleExcluded(original,2),[5]);
assert.deepEqual(toggleExcluded(toggleExcluded(original,3),3),original);
assert.deepEqual(original,[2,5]);
const matches=data.suspects.filter(s=>s.gender==='男'&&s.year>=1990&&s.year<=1999&&s.city==='成都');
assert.deepEqual(matches.map(s=>s.id),[1]);
console.log(`PASS: ${cases} final-answer combinations; exact story data, 18-position evidence, reversible exclusion and unique matching person.`);
