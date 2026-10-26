'use strict';
(function(root){
const categories = () => ELS_DATA.schema.domains.flatMap(d=>d.categories);
const key = (s,p) => `s${s}-${p}`;
function fresh(){return {format:'els-achievement-draft',version:1,stage:1,period:'benchmark',students:[],assessments:{}};}
function validate(s){
 if(!s || s.format!=='els-achievement-draft'||s.version!==1||![1,2,3,4,5].includes(s.stage)||!['benchmark','term2','term4'].includes(s.period)||!Array.isArray(s.students)||s.students.length>100)throw Error('This is not a supported achievement draft.');
 const ids=new Set();
 for(const x of s.students){if(!x||typeof x.id!=='string'||!/^p[0-9a-f-]+$/.test(x.id)||ids.has(x.id)||typeof x.name!=='string'||!x.name.trim()||x.name.length>150)throw Error('Invalid or duplicate student entry.');ids.add(x.id);}
 if(!s.assessments||typeof s.assessments!=='object'||Array.isArray(s.assessments))throw Error('Missing assessment records.');
 for(const [block,rows] of Object.entries(s.assessments)){
  if(!/^s[1-5]-(benchmark|term2|term4)$/.test(block)||!rows||typeof rows!=='object')throw Error('Invalid stage/period records.');
  for(const [id,cells] of Object.entries(rows)){
   if(!ids.has(id)||!cells||typeof cells!=='object')throw Error('Unrecognised student record.');
   for(const [col,v] of Object.entries(cells))if(!categories().some(c=>c.column===col)||!['unobserved','notyet','achieved','clarify'].includes(v))throw Error('Invalid category state.');
  }
 }
 return JSON.parse(JSON.stringify(s));
}
function stateAt(s,id,col){return s.assessments[key(s.stage,s.period)]?.[id]?.[col]||'unobserved';}
function setState(s,id,col,value){const b=key(s.stage,s.period);s.assessments[b]??={};s.assessments[b][id]??={};s.assessments[b][id][col]=value;}
function flags(r){const f=[];
 const targeted={
 's1-term4-J':'The statement permits pointing to share interest; guidance adds spoken naming. Do not add a spoken requirement.',
 's2-benchmark-J':'The statement permits pointing to share interest; guidance adds spoken naming. Do not add a spoken requirement.',
 's1-term2-N':'The statement assesses walking unaided; guidance adds standing from the floor unaided. This additional skill needs clarification.',
 's1-term4-N':'Preserve the statement’s quantity of at least four steps. Guidance saying a few does not replace it.',
 's2-benchmark-N':'Preserve the statement’s quantity of at least four steps. Guidance saying a few does not replace it.',
 's4-term2-R':'The statement assesses simple fastenings; guidance expands this to most clothes. Scope needs clarification.',
 's4-term4-F':'The statement requires successful negotiation. Naming a feeling and its cause is only partial evidence.',
 's5-benchmark-F':'The statement requires successful negotiation. Naming a feeling and its cause is only partial evidence.',
 's1-benchmark-O':'Practical tips introduce spatial language to movement/song imitation. Spatial language is not attainment evidence here.',
 's1-term4-O':'Practical tips introduce spatial language to movement/song imitation. Spatial language is not attainment evidence here.',
 's2-benchmark-O':'Practical tips introduce spatial language to movement/song imitation. Spatial language is not attainment evidence here.'
 };if(targeted[r.id])f.push('Needs curriculum-owner clarification: '+targeted[r.id]);
 if(r.stage===5&&['term2','term4'].includes(r.periodId)&&r.markbookColumn==='AC')f.push('Needs curriculum-owner clarification: Measurement repeats Space and Spatial Sense. A Measurement TRUE criterion is not available; do not use spatial evidence as Measurement evidence.');
 if(r.ageMonths===24&&r.markbookColumn==='R')f.push('Needs curriculum-owner clarification: the toileting statement concerns a soiled nappy, but guidance describes shoes and socks. Shoes/socks evidence does not count as toileting evidence.');
 if(r.ageMonths===24&&r.markbookColumn==='S')f.push('Source guidance is blank. The statement permits shoe fastenings to be already undone. Do not add an independent-fastening requirement.');
 if(r.stage===3&&r.periodId==='term2'&&r.markbookColumn==='X')f.push('Practical tips are misaligned: positional language is not evidence of speech intelligibility.');
 if(r.stage===4&&r.periodId==='term4'&&r.markbookColumn==='Z')f.push('Practical tips mix positional language with cardinality. Only relevant counting evidence supports this statement.');
 if(r.markbookColumn==='O'||r.markbookColumn==='P')f.push('Sensory preferences need respectful interpretation. Do not force participation or require enjoyment of every movement or sensory experience. Seek clarification for ambiguous compound criteria.');
 return f;
}
function blocked(r){return r.stage===5&&r.markbookColumn==='AC'&&r.periodId!=='benchmark';}
function record(s,col){return ELS_DATA.curriculum.records.find(r=>r.stage===s.stage&&r.periodId===s.period&&r.markbookColumn===col);}
function exportIssues(s){const issues=[];if(!s.students.length)issues.push('Add at least one student.');
 for(const p of s.students)if(/student|learner|name|instruction/i.test(p.name))issues.push(`The current reporting importer skips “${p.name}”. Its name filter needs a fix before a lossless import.`);
 for(const p of s.students)for(const c of categories())if(stateAt(s,p.id,c.column)==='achieved'&&blocked(record(s,c.column)))issues.push('Measurement TRUE is blocked pending curriculum-owner clarification.');
 return issues;
}
const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
const textCell=(ref,value,style=0)=>`<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
function level(d,n){return Object.entries(d.formulaCountThresholds).find(([k,v])=>v.includes(n))?.[0].replace('blank','')||'';}
function workbookFiles(s){
 const issues=exportIssues(s);if(issues.length)throw Error(issues.join('\n'));
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 let r1=textCell('A1',`Stage ${s.stage} • ${s.period}`,1),r2=textCell('A2','Student Name',1);
 for(const d of ELS_DATA.schema.domains){r1+=textCell(d.headerCell,d.name,1);for(const c of d.categories)r2+=textCell(c.headerCell,c.exactText,1);r2+=textCell(d.achievementColumn+'2','ACHIEVEMENT',1);}
 let rows=`<row r="1" ht="30" customHeight="1">${r1}</row><row r="2" ht="90" customHeight="1">${r2}</row>`;
 for(let i=0;i<100;i++){
  const p=s.students[i],rn=i+3;let cells=p?textCell('A'+rn,p.name):'';
  for(const d of ELS_DATA.schema.domains){let count=0;
   for(const c of d.categories){const v=p?stateAt(s,p.id,c.column):'unobserved';if(v==='achieved')count++; if(v==='achieved'||v==='notyet')cells+=`<c r="${c.column}${rn}" t="b"><v>${v==='achieved'?1:0}</v></c>`;}
   const formula=d.row3Formula.replace(/([A-Z]+)3\b/g,(_,col)=>col+rn);
   cells+=`<c r="${d.achievementColumn}${rn}" t="str"><f>${xml(formula)}</f><v>${level(d,count)}</v></c>`;
  } rows+=`<row r="${rn}">${cells}</row>`;
 }
 const sheet=`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${ns}"><dimension ref="A1:AU102"/><sheetViews><sheetView workbookViewId="0"><pane xSplit="1" ySplit="2" topLeftCell="B3" activePane="bottomRight" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="26" customWidth="1"/><col min="2" max="47" width="18" customWidth="1"/></cols><sheetData>${rows}</sheetData><mergeCells>${ELS_DATA.schema.matrixGeometry.domainMerges.map(r=>`<mergeCell ref="${r}"/>`).join('')}</mergeCells></worksheet>`;
 const notes=[['ELS achievement companion export',`Stage ${s.stage} / ${s.period}`],['Important','The reporting importer reads category ticks only. Select the matching stage/report period manually.'],['State loss','TRUE = teacher-marked achieved; FALSE = not yet demonstrated. Blank = unobserved or clarification. Reporting collapses all non-TRUE states. Save the JSON draft to retain these distinctions.'],['Judgement','Area labels reproduce source count formulas; they are not developmental diagnoses or automatic individual recommendations.'],['Security','Unencrypted file. Store on an approved school device and share only through authorised school channels.']];
 const markedFlags=categories().filter(c=>flags(record(s,c.column)).length&&s.students.some(p=>stateAt(s,p.id,c.column)==='achieved'));
 notes.push(['Source moderation',markedFlags.length?markedFlags.map(c=>record(s,c.column).id+': '+c.exactText+' — needs curriculum-owner moderation').join('; '):'No TRUE selections on currently flagged source records. Source QA is representative sampling, not exhaustive validation.']);
 return {
 '[Content_Types].xml':`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${[1,2].map(i=>`<Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`,
 '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/workbook.xml':`<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Mark Book" sheetId="1" r:id="rId1"/><sheet name="Export notes" sheetId="2" r:id="rId2"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
 'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
 'xl/styles.xml':`<styleSheet xmlns="${ns}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF122147"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
 'xl/worksheets/sheet1.xml':sheet,
 'xl/worksheets/sheet2.xml':`<worksheet xmlns="${ns}"><cols><col min="1" max="1" width="30" customWidth="1"/><col min="2" max="2" width="120" customWidth="1"/></cols><sheetData>${notes.map((r,i)=>`<row r="${i+1}">${textCell('A'+(i+1),r[0])}${textCell('B'+(i+1),r[1])}</row>`).join('')}</sheetData></worksheet>`};
}
// Store-only ZIP: deterministic local XLSX, no runtime library or network dependency.
function zip(files){const enc=new TextEncoder(),parts=[],central=[];let offset=0;
 const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
 const bytes=(n)=>new Uint8Array(n),u16=(a,o,v)=>new DataView(a.buffer).setUint16(o,v,true),u32=(a,o,v)=>new DataView(a.buffer).setUint32(o,v,true);
 for(const [name,value] of Object.entries(files)){const n=enc.encode(name),v=enc.encode(value),c=crc(v),h=bytes(30+n.length);u32(h,0,0x04034b50);u16(h,4,20);u32(h,14,c);u32(h,18,v.length);u32(h,22,v.length);u16(h,26,n.length);h.set(n,30);parts.push(h,v);
 const d=bytes(46+n.length);u32(d,0,0x02014b50);u16(d,4,20);u16(d,6,20);u32(d,16,c);u32(d,20,v.length);u32(d,24,v.length);u16(d,28,n.length);u32(d,42,offset);d.set(n,46);central.push(d);offset+=h.length+v.length;}
 const size=central.reduce((n,a)=>n+a.length,0),end=bytes(22);u32(end,0,0x06054b50);u16(end,8,central.length);u16(end,10,central.length);u32(end,12,size);u32(end,16,offset);const all=[...parts,...central,end],out=bytes(all.reduce((n,a)=>n+a.length,0));let i=0;for(const p of all){out.set(p,i);i+=p.length;}return out;
}
root.ELS={fresh,validate,key,stateAt,setState,record,flags,blocked,exportIssues,workbookFiles,zip,categories,level};
})(typeof window!=='undefined'?window:globalThis);
