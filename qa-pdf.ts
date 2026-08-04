import { readFileSync, writeFileSync } from "fs";
import { jsPDF } from "jspdf";
(globalThis as any).fetch = async (url: string) => {
  const buf = readFileSync("public" + url);
  return { ok: true, arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) } as any;
};
let out: any;
(jsPDF as any).prototype.save = function () { out = this.output("arraybuffer"); };
const { exportTestToPdf } = await import("/dev-server/src/lib/testPdfExport.ts");
const ex = (o: any) => o;
const items = [
  { variant: "A", sort_order: 1, source_type: "eval_exercise", source_id: "1", custom_data: null, points: 10 },
  { variant: "B", sort_order: 2, source_type: "eval_exercise", source_id: "2", custom_data: null, points: 5 },
  { variant: "both", sort_order: 3, source_type: "eval_exercise", source_id: "3", custom_data: null, points: 15 },
  { variant: "both", sort_order: 4, source_type: "eval_exercise", source_id: "4", custom_data: null, points: 10 },
  { variant: "both", sort_order: 5, source_type: "custom", source_id: null, custom_data: { type: "open_answer", question: "Explică diferența între listă și tuplu în Python. Descrie pe scurt mutabilitatea.", solution: "Lista e mutabilă, tuplul nu." }, points: 8 },
];
const db: any = {
  "1": { type: "quiz", question: "Ce afișează codul următor cu diacritice ăîșțâ?", code_template: "x = [1,2,3]\nprint(len(x))", options: [{id:"a",text:"3"},{id:"b",text:"2"},{id:"c",text:"eroare"}], correct_option_id: "a", explanation: "len() returnează numărul de elemente." },
  "2": { type: "truefalse", statement: "În Python, șirurile de caractere sunt imutabile.", is_true: true },
  "3": { type: "fill", question: "Completează codul pentru a parcurge lista:", code_template: "for i in ___(len(lista)):\n    print(lista[___])", blanks: [{id:"b1",answer:"range"},{id:"b2",answer:"i"}] },
  "4": { type: "order", question: "Ordonează liniile pentru a calcula suma:", lines: [{id:"l3",text:"    s += x",order:3},{id:"l1",text:"s = 0",order:1},{id:"l2",text:"for x in lista:",order:2},{id:"l4",text:"print(s)",order:4}] },
};
await exportTestToPdf({ title: "Test Liste — Capitolul 2 (Prelucrări numerice)", description: "Test de verificare a cunoștințelor.", difficulty: "mediu", time_limit_minutes: 45, variant_mode: "manual" }, items as any, (i: any) => i.source_id ? db[i.source_id] : i.custom_data);
writeFileSync("/tmp/pdfqa/out.pdf", Buffer.from(out));
console.log("ok");
