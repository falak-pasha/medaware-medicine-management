// Tests the guided medicine chat against the real book entries. Run with `node --test tests/`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = { window: {} };
vm.createContext(context);
for (const file of ["js/data/medicines.js", "js/shared/medicine-chat.js"]) {
  vm.runInContext(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), context, { filename: file });
}
const book = context.window.MEDAWARE_MEDICINES;
const engine = context.window.MedawareChat.createChatEngine(book);

// Sends a sequence of inputs (strings are typed text) and returns the last reply and state.
function chat(...inputs) {
  let state = {};
  let reply;
  for (const input of inputs) {
    ({ state, reply } = engine.respond(state, typeof input === "string" ? { kind: "text", text: input } : input));
  }
  return { state, reply, text: reply.parts.map((p) => p.text ?? p.items.join(" | ")).join("\n") };
}
const labels = (reply) => reply.actions.map((a) => a.label);

test("greeting offers popular medicines and the full list", () => {
  const reply = engine.greeting();
  assert.ok(labels(reply).includes("Paracetamol"));
  assert.ok(labels(reply).includes("Show all medicines"));
  const all = chat({ kind: "list-all" });
  assert.equal(all.reply.actions.length, book.entries.length);
});

test("finds medicines by name, alias and brand, case-insensitively", () => {
  assert.equal(engine.findMedicines("PARACETAMOL").definite[0].id, "paracetamol");
  assert.equal(engine.findMedicines("acetaminophen?").definite[0].id, "paracetamol");
  assert.equal(engine.findMedicines("is brufen ok").definite[0].id, "ibuprofen");
  assert.equal(engine.findMedicines("frusemide").definite[0].id, "furosemide");
});

test("ordinary questions do not accidentally match a medicine", () => {
  for (const text of ["what are the side effects", "can I take it with food", "how much should I take", "is it safe when pregnant", "hello", "thank you"]) {
    const found = engine.findMedicines(text);
    assert.deepEqual([found.definite.length, found.candidates.length], [0, 0], `${text} -> ${found.matchedTerms}`);
  }
});

test("typing a medicine shows its summary, review label and topic buttons", () => {
  const { reply, state } = chat("ibuprofen");
  assert.equal(state.medId, "ibuprofen");
  assert.ok(reply.parts.some((p) => p.type === "tag" && /Not yet reviewed/.test(p.text)));
  assert.ok(labels(reply).includes("Side effects"));
  assert.ok(labels(reply).includes("Check with another medicine"));
});

test("name plus topic answers directly, with page citation", () => {
  const { reply } = chat("paracetamol side effects");
  assert.match(reply.parts[0].text, /Side effects: Paracetamol/);
  assert.ok(reply.parts.some((p) => p.type === "cite" && /Tripathi p\. 206/.test(p.text)));
});

test("dose answers always carry the not-a-prescription warning", () => {
  const { reply } = chat("metformin dose");
  assert.ok(reply.parts.some((p) => p.type === "warn" && /not a prescription/.test(p.text)));
  assert.ok(reply.parts.some((p) => p.type === "list"));
});

test("a follow-up topic applies to the medicine already chosen", () => {
  const { reply } = chat("amlodipine", { kind: "topic", topic: "warnings" });
  assert.match(reply.parts[0].text, /Amlodipine/);
  const typed = chat("amlodipine", "what about interactions");
  assert.match(typed.reply.parts[0].text, /Interactions: Amlodipine|don't cover/);
});

test("two medicines: the book's mention is quoted from both sides", () => {
  const { text, reply } = chat("aspirin with warfarin");
  assert.match(text, /Aspirin with Warfarin/);
  assert.match(text, /warfarin/i);
  assert.ok(reply.parts.some((p) => p.type === "warn" && /pharmacist/.test(p.text)));
});

test("group words in the text count: ibuprofen + warfarin finds 'anticoagulants'", () => {
  const { text } = chat("ibuprofen and warfarin together");
  assert.match(text, /Use with anticoagulants should be avoided/);
});

test("guided 'check with another medicine' flow", () => {
  const { text } = chat("clopidogrel", { kind: "ask-second" }, "omeprazole");
  assert.match(text, /Omeprazole reduces its activation/);
});

test("no mention in the book is never presented as safe", () => {
  const { text, reply } = chat("cetirizine with folic acid");
  assert.match(text, /don't mention taking them together/);
  assert.ok(reply.parts.some((p) => p.type === "warn" && /does not mean the combination is safe/.test(p.text)));
});

test("a group name shared by several medicines asks which one", () => {
  const { reply } = chat("blood thinner");
  const names = labels(reply);
  assert.ok(names.includes("Warfarin") && names.includes("Clopidogrel"), names.join(", "));
});

test("specific words beat the vague 'is it safe': pregnancy lines are found", () => {
  const { text } = chat("is enalapril safe in pregnancy");
  assert.match(text, /pregnan/i);
  assert.doesNotMatch(text, /^Warnings: Enalapril/m);
});

test("ranitidine answers include the withdrawal update", () => {
  const { reply } = chat("ranitidine uses");
  assert.ok(reply.parts.some((p) => p.type === "warn" && /withdraw/i.test(p.text)));
});

test("emergencies get an urgent message, not medicine information", () => {
  for (const text of ["I took too many paracetamol", "my child swallowed pills, overdose", "chest pain after amlodipine"]) {
    const { reply } = chat(text);
    assert.equal(reply.parts[0].type, "urgent", text);
    assert.equal(reply.actions.length, 0);
  }
});

test("unknown medicines get close suggestions or a pharmacist pointer", () => {
  const close = chat("paracetomol");
  assert.ok(labels(close.reply).includes("Paracetamol"));
  const unknown = chat("xyzzy");
  assert.match(unknown.text, /ask a pharmacist/);
});

test("every entry can be opened and every topic button answers", () => {
  for (const entry of book.entries) {
    const opened = chat({ kind: "pick-med", id: entry.id });
    for (const action of opened.reply.actions.filter((a) => a.input.kind === "topic")) {
      const { reply } = engine.respond(opened.state, action.input);
      assert.ok(reply.parts.some((p) => p.type === "cite"), `${entry.id} ${action.input.topic}`);
    }
  }
});
