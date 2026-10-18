// Builds docs/pharmacist-review.md from js/data/medicines.js: every entry with its flags,
// so a doctor or pharmacist can review the medicine information in one pass.
// Run with: node tests/build-review-pack.mjs
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const context = { window: {} };
vm.createContext(context);
vm.runInContext(readFileSync(new URL("../js/data/medicines.js", import.meta.url), "utf8"), context);
const { entries, sources } = context.window.MEDAWARE_MEDICINES;

const differ = /differ|disagree/i;
const book = (key) => `${sources[key].short} (${sources[key].year})`;
const pages = (list) => `${list.length === 1 ? "p." : "pp."} ${list.join(", ")}`;
const sectionNames = {
  uses: "Used for", sideEffects: "Side effects", warnings: "Warnings", contraindications: "Should not be used when",
  interactions: "Interactions", dosage: "Dose in the book"
};

const lines = [];
lines.push("# MEDAWARE medicine information: reviewer pack", "");
lines.push(`Generated from \`js/data/medicines.js\`. ${entries.length} medicines, all currently **unreviewed**.`, "");
lines.push("Sources:");
for (const s of Object.values(sources)) lines.push(`- ${s.author}, *${s.title}*, ${s.edition} (${s.publisher}, ${s.year})`);
lines.push("");
lines.push("## How to review", "");
lines.push("For each medicine: read the summary and every section in the app (or in `js/data/medicines.js`), check it against current guidance, and resolve the notes below. Then tell the developer one of:");
lines.push("- **Approved**: the entry's `review` becomes `\"reviewed\"` and the app's label changes to \"Reviewed\".");
lines.push("- **Changes needed**: list the corrections (with a source), or ask for the entry to be hidden.", "");
lines.push("Priorities: the **Books differ** notes first (the textbooks disagree), then notes about guidance that changed after the books were published.", "");

const differCount = entries.reduce((n, e) => n + e.flags.filter((f) => differ.test(f)).length, 0);
lines.push(`## Summary`, "");
lines.push(`- Notes in total: ${entries.reduce((n, e) => n + e.flags.length, 0)}`);
lines.push(`- Books differ: ${differCount}`);
lines.push(`- Medicines with no notes: ${entries.filter((e) => !e.flags.length).length}`, "");

lines.push("## Medicines", "");
for (const e of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
  lines.push(`### ${e.name}`, "");
  lines.push(`- [ ] Reviewed — reviewer: ________ date: ________`);
  lines.push(`- Class: ${e.drugClass}`);
  const cited = Object.entries(e.sections).map(([k, s]) => `${sectionNames[k] || k} (${pages(s.pages)})`);
  lines.push(`- ${book("tripathi")}: ${cited.join("; ")}`);
  const other = (e.otherBooks || []).map((b) => `${sectionNames[b.section] || b.section} — ${book(b.book)} ${pages(b.pages)}`);
  if (other.length) lines.push(`- Other books: ${other.join("; ")}`);
  if ((e.updates || []).length) for (const u of e.updates) lines.push(`- Update (${u.date}): ${u.text} Source: ${u.source}${u.url ? ` <${u.url}>` : ""}`);
  const ordered = [...e.flags].sort((a, b) => Number(differ.test(b)) - Number(differ.test(a)));
  if (ordered.length) {
    lines.push("- Notes:");
    for (const f of ordered) lines.push(`  - ${differ.test(f) ? `**${f}**` : f}`);
  } else {
    lines.push("- Notes: none");
  }
  lines.push("");
}

writeFileSync(new URL("../docs/pharmacist-review.md", import.meta.url), lines.join("\n"));
console.log(`Wrote docs/pharmacist-review.md (${entries.length} medicines, ${differCount} book disagreements).`);
