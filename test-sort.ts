import { filterAndSortSchools, matchesSearch } from "./src/lib/searchUtils";
import { schools } from "./src/data/schools";

const res = filterAndSortSchools(schools, "spiru", 10);
for (const s of res) {
  console.log(`${s.id}: ${s.name} — ${s.city}`);
}

console.log("--- all matches ---");
const all = schools.filter(s => matchesSearch(`${s.name} ${s.city}`, "spiru"));
for (const s of all) console.log(`${s.id}: ${s.name} — ${s.city}`);
