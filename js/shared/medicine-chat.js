/**
 * MEDAWARE | Guided medicine chat (no AI).
 *
 * Answers only from window.MEDAWARE_MEDICINES (all books in `sources`): the user picks or types a medicine,
 * then a topic, and gets the book's points with page numbers. Short typed questions
 * ("ibuprofen side effects", "aspirin with warfarin") are matched by medicine names
 * and topic words. Nothing is generated, so an answer can never say more than the book.
 *
 * createChatEngine() is pure logic (tested in tests/medicine-chat.test.mjs);
 * mount() draws the chat with textContent only, never innerHTML.
 */
(function () {
  const TOPICS = [
    { key: "uses", label: "What it's used for", words: ["used for", "use for", "uses", "what is it", "what's it for", "treat", "why take", "purpose"] },
    { key: "sideEffects", label: "Side effects", words: ["side effect", "side-effect", "adverse", "reaction"] },
    { key: "warnings", label: "Warnings", words: ["warning", "precaution", "careful", "caution", "safe", "risk"] },
    { key: "contraindications", label: "Who should not take it", words: ["should not", "shouldn't", "avoid", "contraindicat", "who can't", "who cannot", "not take"] },
    { key: "interactions", label: "Interactions", words: ["interact", "together", "combine", "mix"] },
    { key: "dosage", label: "Dose in the book", words: ["dose", "dosage", "how much", "how many", "mg", "times a day"] }
  ];

  // Words that are too general to identify a medicine group on their own.
  const GROUP_WORD_STOPLIST = new Set(["inhibitor", "antagonist", "blocker", "agonist", "medicine", "tablets", "hormone", "inhaler", "thinner"]);

  const EMERGENCY = /\b(overdose|overdosed|took too many|taken too many|poison|poisoned|can'?t breathe|cannot breathe|difficulty breathing|chest pain|unconscious|fainted|seizure|fitting|suicid|kill myself|end my life|swollen (face|lips|tongue|throat)|anaphyla)/i;

  const STOPWORDS = new Set(["what", "when", "with", "about", "does", "this", "that", "there", "should", "would", "could", "have", "take", "taking", "tell", "much", "many", "they", "your", "from", "which", "also", "medicine", "tablet", "tablets", "please", "safe", "okay"]);

  function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Whole-word match that also accepts a plural ending ("diuretic" finds "diuretics").
  function termRegex(term) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegex(term.toLowerCase())}(s|es)?(?![a-z0-9])`, "i");
  }

  function formatPages(pages = []) {
    if (!pages.length) return "";
    return `${pages.length === 1 ? "p." : "pp."} ${pages.join(", ")}`;
  }

  function createChatEngine(book) {
    const entries = book?.entries || [];
    const sources = book?.sources || {};
    const byId = new Map(entries.map((entry) => [entry.id, entry]));

    // term -> entry ids. A term shared by several entries ("Blood thinner") is a group term.
    const termOwners = new Map();
    const addTerm = (term, id) => {
      const key = term.trim().toLowerCase();
      if (key.length < 2) return;
      if (!termOwners.has(key)) termOwners.set(key, new Set());
      termOwners.get(key).add(id);
    };
    for (const entry of entries) {
      [entry.name, ...(entry.aliases || []), ...(entry.brands || [])].forEach((term) => addTerm(term, entry.id));
      // "Loop diuretic" -> "diuretic", so "diuretics" in another entry's text counts.
      for (const alias of entry.aliases || []) {
        const words = alias.toLowerCase().split(/\s+/);
        const last = words[words.length - 1];
        if (words.length > 1 && last.length >= 8 && !GROUP_WORD_STOPLIST.has(last)) addTerm(last, entry.id);
      }
    }
    const terms = [...termOwners.entries()]
      .map(([term, owners]) => ({ term, owners: [...owners], regex: termRegex(term) }))
      .sort((a, b) => b.term.length - a.term.length);

    function termsFor(entry) {
      return terms.filter((t) => t.owners.includes(entry.id));
    }

    // Returns { definite: [entries], candidates: [entries], matchedTerms: [string] }.
    function findMedicines(text) {
      const definite = [];
      const candidates = [];
      const matchedTerms = [];
      const position = new Map(); // entry -> where it was first mentioned, to keep typed order
      let remaining = ` ${text.toLowerCase()} `;
      for (const t of terms) {
        const match = t.regex.exec(remaining);
        if (!match) continue;
        matchedTerms.push(t.term);
        // Blank the match out with spaces so positions of later matches stay the same.
        remaining = remaining.slice(0, match.index) + " ".repeat(match[0].length) + remaining.slice(match.index + match[0].length);
        const owners = t.owners.map((id) => byId.get(id));
        if (owners.length === 1) {
          if (!definite.includes(owners[0])) definite.push(owners[0]);
          if (!position.has(owners[0]) || match.index < position.get(owners[0])) position.set(owners[0], match.index);
        } else {
          owners.forEach((owner) => { if (!candidates.includes(owner)) candidates.push(owner); });
        }
      }
      definite.sort((a, b) => position.get(a) - position.get(b));
      return { definite, candidates: candidates.filter((c) => !definite.includes(c)), matchedTerms };
    }

    function detectTopic(text) {
      const lower = text.toLowerCase();
      return TOPICS.find((topic) => topic.words.some((word) => lower.includes(word)))?.key || null;
    }

    function topicLabel(key) {
      return TOPICS.find((topic) => topic.key === key)?.label || key;
    }

    function cite(entry, pages, bookKey = "tripathi") {
      const source = sources[bookKey];
      const name = source ? `${source.short} (${source.year})` : "Tripathi";
      return `Source: ${entry.name}, ${name} ${formatPages(pages)}`;
    }

    // The main book's section plus any other books' blocks for the same topic.
    function blocksFor(entry, key) {
      const blocks = [];
      const main = entry.sections?.[key];
      if (main?.items?.length) blocks.push({ book: "tripathi", key, items: main.items, pages: main.pages });
      for (const block of entry.otherBooks || []) {
        if (block.section === key && block.items?.length) blocks.push({ book: block.book, key, items: block.items, pages: block.pages });
      }
      return blocks;
    }

    function allBlocks(entry) {
      return TOPICS.flatMap((topic) => blocksFor(entry, topic.key));
    }

    function flagParts(entry) {
      return (entry.flags || [])
        .filter((flag) => /disagree|differ/i.test(flag))
        .map((flag) => ({ type: "warn", text: `Books differ: ${flag}` }));
    }

    function updateParts(entry) {
      return (entry.updates || []).map((update) => ({
        type: "warn",
        text: `Update since the book${update.date ? ` (${update.date})` : ""}: ${update.text} (Source: ${update.source})`
      }));
    }

    function topicActions(entry, except) {
      return [
        ...TOPICS.filter((t) => t.key !== except && blocksFor(entry, t.key).length)
          .map((t) => ({ label: t.label, input: { kind: "topic", topic: t.key } })),
        { label: "Check with another medicine", input: { kind: "ask-second" } },
        { label: "A different medicine", input: { kind: "restart" } }
      ];
    }

    function intro(entry) {
      const parts = [
        { type: "title", text: entry.name },
        { type: "tag", text: entry.review === "reviewed" ? "Reviewed" : "Not yet reviewed by a pharmacist" },
        { type: "text", text: entry.summary },
        ...updateParts(entry),
        { type: "text", text: "What would you like to know?" }
      ];
      return { parts, actions: topicActions(entry, null) };
    }

    function topicAnswer(entry, key) {
      const blocks = blocksFor(entry, key);
      if (!blocks.length) {
        return {
          parts: [{ type: "text", text: `The book pages used for ${entry.name} don't cover "${topicLabel(key).toLowerCase()}". Ask a pharmacist.` }],
          actions: topicActions(entry, key)
        };
      }
      const parts = [{ type: "title", text: `${topicLabel(key)}: ${entry.name}` }];
      if (key === "dosage") {
        parts.push({ type: "warn", text: "General adult reference from the book, not a prescription. Children's doses are different. Always follow your own prescription." });
      }
      for (const block of blocks) {
        parts.push({ type: "list", items: block.items }, { type: "cite", text: cite(entry, block.pages, block.book) });
      }
      if (key === "interactions" || key === "dosage" || key === "warnings") parts.push(...flagParts(entry));
      if ((entry.updates || []).length) parts.push(...updateParts(entry));
      return { parts, actions: topicActions(entry, key) };
    }

    function interaction(first, second) {
      if (first.id === second.id) {
        return { parts: [{ type: "text", text: `Both names refer to ${first.name}.` }], actions: topicActions(first, null) };
      }
      const hits = [];
      for (const [entry, other] of [[first, second], [second, first]]) {
        const otherTerms = termsFor(other);
        for (const block of allBlocks(entry)) {
          for (const item of block.items) {
            if (otherTerms.some((t) => t.regex.test(item))) {
              hits.push({ entry, key: block.key, item, pages: block.pages, book: block.book });
            }
          }
        }
      }
      if (!hits.length) {
        return {
          parts: [
            { type: "title", text: `${first.name} with ${second.name}` },
            { type: "text", text: `The book pages for ${first.name} and ${second.name} don't mention taking them together.` },
            { type: "warn", text: "That does not mean the combination is safe. Check with a pharmacist before combining medicines." }
          ],
          actions: topicActions(first, null)
        };
      }
      const parts = [
        { type: "title", text: `${first.name} with ${second.name}` },
        { type: "text", text: "The book mentions this:" }
      ];
      for (const hit of hits) {
        parts.push({ type: "list", items: [hit.item] }, { type: "cite", text: `${cite(hit.entry, hit.pages, hit.book)} (${topicLabel(hit.key)})` });
      }
      for (const entry of [first, second]) {
        const otherTerms = termsFor(entry === first ? second : first);
        for (const flag of entry.flags || []) {
          if (/disagree|differ/i.test(flag) && otherTerms.some((t) => t.regex.test(flag))) parts.push({ type: "warn", text: `Books differ: ${flag}` });
        }
      }
      parts.push({ type: "warn", text: "Ask a pharmacist or your doctor before taking these together." });
      return { parts, actions: topicActions(first, null) };
    }

    // Free words such as "pregnancy" or "alcohol", searched inside one medicine's text.
    function keywordHits(entry, text, matchedTerms) {
      let cleaned = text.toLowerCase();
      matchedTerms.forEach((term) => { cleaned = cleaned.replace(termRegex(term), " "); });
      const stems = cleaned.split(/[^a-z]+/)
        .filter((word) => word.length >= 4 && !STOPWORDS.has(word))
        .map((word) => word.slice(0, Math.min(word.length, 6)));
      if (!stems.length) return [];
      const hits = [];
      for (const block of allBlocks(entry)) {
        for (const item of block.items) {
          const lower = item.toLowerCase();
          if (stems.some((stem) => lower.includes(stem))) hits.push({ key: block.key, item, pages: block.pages, book: block.book });
        }
      }
      return hits;
    }

    function suggestions(text) {
      const words = text.toLowerCase().split(/[^a-z]+/).filter((word) => word.length >= 3);
      return entries.filter((entry) => words.some((word) => entry.name.toLowerCase().startsWith(word.slice(0, 3)))).slice(0, 6);
    }

    function pickActions(list) {
      return list.map((entry) => ({ label: entry.name, input: { kind: "pick-med", id: entry.id } }));
    }

    const POPULAR = ["paracetamol", "ibuprofen", "amoxicillin", "metformin", "amlodipine", "cetirizine"];

    function greeting() {
      return {
        parts: [
          { type: "text", text: `Ask about any of the ${entries.length} medicines from the textbook. Type a name or brand (for example "Brufen side effects" or "aspirin with warfarin"), or pick one below.` }
        ],
        actions: [
          ...pickActions(POPULAR.map((id) => byId.get(id)).filter(Boolean)),
          { label: "Show all medicines", input: { kind: "list-all" } }
        ]
      };
    }

    // state: { medId, awaitingSecond }. Returns { state, reply }.
    function respond(state, input) {
      const current = state.medId ? byId.get(state.medId) : null;
      const next = { ...state };

      switch (input.kind) {
        case "restart":
          return { state: {}, reply: greeting() };
        case "list-all":
          return { state: next, reply: { parts: [{ type: "text", text: "Pick a medicine:" }], actions: pickActions([...entries].sort((a, b) => a.name.localeCompare(b.name))) } };
        case "pick-med": {
          const entry = byId.get(input.id);
          if (!entry) return { state: {}, reply: greeting() };
          if (state.awaitingSecond && current) {
            return { state: { medId: current.id }, reply: interaction(current, entry) };
          }
          return { state: { medId: entry.id }, reply: intro(entry) };
        }
        case "topic":
          if (!current) return { state: {}, reply: greeting() };
          return { state: { medId: current.id }, reply: topicAnswer(current, input.topic) };
        case "ask-second":
          if (!current) return { state: {}, reply: greeting() };
          return {
            state: { medId: current.id, awaitingSecond: true },
            reply: { parts: [{ type: "text", text: `Which medicine do you want to check with ${current.name}? Type its name or brand.` }], actions: [] }
          };
        default:
          break;
      }

      const text = String(input.text || "").trim();
      if (!text) return { state: next, reply: greeting() };

      if (EMERGENCY.test(text)) {
        return {
          state: next,
          reply: {
            parts: [
              { type: "urgent", text: "This sounds urgent. Call your local emergency number now (112 in India) or go to the nearest emergency department. For a possible overdose or poisoning, take the medicine packet with you." },
              { type: "text", text: "If you are thinking about harming yourself, please contact emergency services or a crisis helpline right away. You don't have to go through this alone." }
            ],
            actions: []
          }
        };
      }

      const found = findMedicines(text);
      const topic = detectTopic(text);

      if (state.awaitingSecond && current && found.definite.length) {
        const other = found.definite.find((entry) => entry.id !== current.id) || found.definite[0];
        return { state: { medId: current.id }, reply: interaction(current, other) };
      }
      if (found.definite.length >= 2) {
        const [first, second] = found.definite;
        return { state: { medId: first.id }, reply: interaction(first, second) };
      }
      if (found.definite.length === 1) {
        const entry = found.definite[0];
        if (current && current.id !== entry.id && (topic === "interactions" || /\bwith\b|\band\b/i.test(text))) {
          return { state: { medId: current.id }, reply: interaction(current, entry) };
        }
        return { state: { medId: entry.id }, reply: answerAbout(entry, found.matchedTerms) || intro(entry) };
      }
      if (found.candidates.length) {
        return {
          state: { medId: current?.id, awaitingSecond: state.awaitingSecond },
          reply: { parts: [{ type: "text", text: `"${found.matchedTerms[0]}" covers more than one medicine. Which one?` }], actions: pickActions(found.candidates) }
        };
      }
      if (current) {
        const reply = answerAbout(current, []);
        if (reply) return { state: { medId: current.id }, reply };
      }

      const close = suggestions(text);
      return {
        state: next,
        reply: {
          parts: [{
            type: "text",
            text: close.length
              ? "I couldn't find that medicine in the book. Did you mean one of these?"
              : `I couldn't find a medicine in that. Try a name like "paracetamol" or a brand like "Brufen". The book entries cover ${entries.length} common medicines; for anything else, ask a pharmacist.`
          }],
          actions: close.length ? pickActions(close) : [{ label: "Show all medicines", input: { kind: "list-all" } }]
        }
      };

      // A specific topic wins; otherwise specific words ("pregnancy") beat the vague "is it safe".
      function answerAbout(entry, matchedTerms) {
        if (topic && topic !== "warnings") return topicAnswer(entry, topic);
        const hits = keywordHits(entry, text, matchedTerms);
        if (hits.length) return keywordReply(entry, hits);
        return topic ? topicAnswer(entry, topic) : null;
      }

      function keywordReply(entry, hits) {
        const parts = [{ type: "title", text: `${entry.name}: what the book says` }];
        for (const hit of hits.slice(0, 6)) {
          parts.push({ type: "list", items: [hit.item] }, { type: "cite", text: `${cite(entry, hit.pages, hit.book)} (${topicLabel(hit.key)})` });
        }
        return { parts, actions: topicActions(entry, null) };
      }
    }

    return { respond, greeting, findMedicines, detectTopic };
  }

  function mount(root, book) {
    if (!root || !book?.entries?.length) return;
    const engine = createChatEngine(book);
    let state = {};

    const log = root.querySelector("[data-chat-log]");
    const form = root.querySelector("[data-chat-form]");
    const field = root.querySelector("[data-chat-input]");

    function renderPart(part) {
      if (part.type === "list") {
        const list = document.createElement("ul");
        part.items.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          list.append(li);
        });
        return list;
      }
      const tagName = part.type === "title" ? "strong" : part.type === "tag" ? "span" : "p";
      const element = document.createElement(tagName);
      element.className = `chat-${part.type}`;
      element.textContent = part.text;
      if (part.type === "urgent") element.setAttribute("role", "alert");
      return element;
    }

    function addMessage(from, content) {
      const bubble = document.createElement("div");
      bubble.className = `chat-msg chat-${from}`;
      if (from === "user") {
        bubble.textContent = content;
      } else {
        content.parts.forEach((part) => bubble.append(renderPart(part)));
        if (content.actions.length) {
          const row = document.createElement("div");
          row.className = "chat-actions";
          content.actions.forEach((action) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "chat-chip";
            button.textContent = action.label;
            button.addEventListener("click", () => send(action.input, action.label));
            row.append(button);
          });
          bubble.append(row);
        }
      }
      log.append(bubble);
      // Scroll only the log (not the page) so the start of the newest reply is in view.
      log.scrollTop = from === "user" ? log.scrollHeight : Math.max(0, bubble.offsetTop - 8);
    }

    function send(input, shownText) {
      addMessage("user", shownText);
      const result = engine.respond(state, input);
      state = result.state;
      addMessage("bot", result.reply);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = field.value.trim();
      if (!text) return;
      field.value = "";
      send({ kind: "text", text }, text);
    });

    root.querySelector("[data-chat-restart]")?.addEventListener("click", () => {
      log.replaceChildren();
      state = {};
      addMessage("bot", engine.greeting());
    });

    addMessage("bot", engine.greeting());
  }

  window.MedawareChat = { createChatEngine, mount };
})();
