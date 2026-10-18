/**
 * MEDAWARE | Medicine information summarised from the textbooks in `sources`.
 *
 * - Every statement in `sections` is a summary (not a quotation) of the cited pages of the
 *   main book (`source`, KD Tripathi). Page numbers are the book's printed page numbers.
 * - `otherBooks` holds points from the other books in `sources`, each with that book's own
 *   printed pages. They are kept apart from `sections` and never merged into its citations.
 * - When books disagree, both views are shown and the disagreement goes in `flags`.
 * - Sections the book does not cover for a medicine are left out, never guessed.
 * - `dosage` is copied only where the book states it, and is general adult reference
 *   information, not a prescription.
 * - `flags` mark anything a reviewer should check (outdated, unclear, conflicting).
 * - `review` stays "unreviewed" until a doctor or pharmacist has checked the entry.
 * - Information from outside the book goes only in `updates`, each with its source.
 */
window.MEDAWARE_MEDICINES = {
  source: {
    title: "Essentials of Medical Pharmacology",
    edition: "7th edition",
    author: "KD Tripathi",
    publisher: "Jaypee Brothers Medical Publishers, New Delhi",
    year: 2013
  },

  // Every book an entry may cite; `source` above is the main one (key "tripathi").
  sources: {
    tripathi: { short: "Tripathi", title: "Essentials of Medical Pharmacology", edition: "7th edition", author: "KD Tripathi", publisher: "Jaypee Brothers Medical Publishers", year: 2013 },
    katzung: { short: "Katzung", title: "Basic & Clinical Pharmacology", edition: "14th edition", author: "Bertram G. Katzung (ed.)", publisher: "McGraw-Hill Education", year: 2018 },
    craig: { short: "Craig & Stitzel", title: "Modern Pharmacology with Clinical Applications", edition: "6th edition", author: "Charles R. Craig and Robert E. Stitzel (eds.)", publisher: "Lippincott Williams & Wilkins", year: 2004 }
  },

  entries: [
    {
      id: "paracetamol",
      name: "Paracetamol",
      aliases: ["Acetaminophen"],
      brands: [],
      drugClass: "Analgesic-antipyretic (para-aminophenol derivative); weak anti-inflammatory action",
      summary: "A widely used over-the-counter medicine for pain and fever. It relieves pain and lowers fever about as well as aspirin, but has almost no anti-inflammatory effect and is gentle on the stomach at normal doses.",
      sections: {
        uses: {
          pages: [207],
          items: [
            "Headache, mild migraine, muscle and joint pain, and period pain (dysmenorrhoea).",
            "Fever, especially in children (it does not carry aspirin's risk of Reye's syndrome).",
            "Recommended by many professional bodies as the first-choice pain reliever for osteoarthritis.",
            "Less effective where inflammation is prominent, such as rheumatoid arthritis."
          ]
        },
        sideEffects: {
          pages: [206],
          items: [
            "Usually well tolerated at normal doses.",
            "Nausea and rashes occasionally; a low white-cell count (leukopenia) rarely.",
            "Stomach irritation is insignificant; bleeding from the stomach lining occurs rarely, and only in overdose."
          ]
        },
        warnings: {
          pages: [206, 207],
          items: [
            "Overdose can cause serious, potentially fatal liver damage (and kidney damage). The book gives serious toxicity above about 150 mg/kg or more than 10 g in an adult, with deaths common above 250 mg/kg.",
            "Small children are more vulnerable to poisoning.",
            "In people who drink alcohol heavily, as little as 5–6 g in one day can damage the liver.",
            "Not recommended for premature infants (under 2 kg).",
            "Suspected overdose needs urgent medical treatment: the antidote (N-acetylcysteine) works best when started early and is practically ineffective 16 hours or more after ingestion."
          ]
        },
        interactions: {
          pages: [206],
          items: [
            "Its pain-relieving effect adds to that of aspirin.",
            "Unlike aspirin, it does not affect platelets or blood clotting."
          ]
        },
        dosage: {
          pages: [207],
          items: [
            "The book notes that the US FDA (2009) recommended limiting a single tablet/capsule to 650 mg and the total adult daily dose to 2600 mg, and that India's DCGI (2011) issued guidelines limiting a single tablet/capsule to 325 mg."
          ]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            659
          ],
          "items": [
            "Preferred over aspirin for mild pain in people allergic to aspirin, with haemophilia, with a history of peptic ulcer, or whose asthma is triggered by aspirin."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            659
          ],
          "items": [
            "Doses above 4 g a day are not usually recommended, and even 4 g a day is linked with abnormal liver tests; a history of alcoholism rules out even this dose.",
            "Swallowing 15 g may be fatal. Early signs of liver damage are nausea, vomiting, diarrhoea and abdominal pain.",
            "Kidney damage without liver damage has occurred even after usual doses. Use with caution in any liver disease."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            659
          ],
          "items": [
            "Pain and fever: 325–500 mg four times a day in adults (less for children); not more than 4 g a day in most cases."
          ]
        }
      ],
      flags: [
        "Dose limits are quoted from 2009–2011 regulatory guidance as reported in the 2013 book; current limits may differ."
      ],
      review: "unreviewed"
    },

    {
      id: "aspirin",
      name: "Aspirin",
      aliases: ["Acetylsalicylic acid"],
      brands: [],
      drugClass: "Nonsteroidal anti-inflammatory drug (NSAID), salicylate; antiplatelet at low doses",
      summary: "One of the oldest pain, fever and anti-inflammatory medicines. At low daily doses it stops platelets clumping, which is why it is used after heart attacks and strokes.",
      sections: {
        uses: {
          pages: [198, 199],
          items: [
            "Pain: headache (including mild migraine), backache, muscle and joint pain, toothache, nerve pain and period pain.",
            "Fever of any cause, although paracetamol is generally preferred as safer.",
            "Acute rheumatic fever (high doses, under medical supervision).",
            "After a heart attack or stroke, and in transient ischaemic attacks: low daily doses reduce the chance of another heart attack.",
            "Rheumatoid arthritis and osteoarthritis (now rarely the first choice; other NSAIDs or paracetamol are preferred)."
          ]
        },
        sideEffects: {
          pages: [196, 197, 198],
          items: [
            "Nausea, vomiting, stomach discomfort and small amounts of blood loss in the stools, even at pain-relief doses.",
            "Most important: damage to the stomach lining and peptic ulcers; rarely, heavy stomach bleeding.",
            "Allergy-like reactions in susceptible people: rashes, hives, runny nose, swelling (angioedema), asthma attacks.",
            "At high anti-inflammatory doses: 'salicylism' — dizziness, ringing in the ears, vertigo, reversible hearing and vision problems, confusion.",
            "Prolongs bleeding time for about a week after a dose."
          ]
        },
        contraindications: {
          pages: [197],
          items: [
            "Known sensitivity to aspirin.",
            "Peptic ulcer or bleeding disorders.",
            "Children with chickenpox or influenza, because of the risk of Reye's syndrome; the book notes paediatric aspirin products are prohibited in India and the UK."
          ]
        },
        warnings: {
          pages: [197, 198],
          items: [
            "Use with caution in chronic liver disease.",
            "Should be avoided in diabetes, heart failure or low cardiac reserve, and juvenile rheumatoid arthritis.",
            "Stop one week before planned surgery (on a doctor's advice).",
            "Pregnancy: long-term use and use near term carry risks to mother and baby; avoid while breastfeeding.",
            "High doses can cause red-cell breakdown in G-6PD deficiency.",
            "Overdose (more common in children) is a medical emergency."
          ]
        },
        interactions: {
          pages: [198],
          items: [
            "Increases bleeding risk with oral anticoagulants (e.g. warfarin) and can increase the toxicity of warfarin, sulfonylureas, phenytoin and methotrexate.",
            "Reduces the effect of uricosuric gout drugs (probenecid) and the diuretic action of furosemide and thiazides; reduces the potassium-sparing action of spironolactone.",
            "Alcohol and corticosteroids increase the risk of stomach damage and bleeding (see also p. 933)."
          ]
        },
        dosage: {
          pages: [198, 199],
          items: [
            "Pain or fever: 0.3–0.6 g every 6–8 hours (adult).",
            "After a heart attack: 60–100 mg a day is the dose shown in large studies to reduce repeat heart attacks."
          ]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            620
          ],
          "items": [
            "Low-dose aspirin is supported for people who have already had a heart attack, stroke or similar event.",
            "In 2014 the FDA concluded that taking aspirin to prevent a first heart attack or stroke is not supported by the evidence and carries a real bleeding risk."
          ]
        },
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            645
          ],
          "items": [
            "People with haemophilia, because of its effect on platelets."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            645
          ],
          "items": [
            "At low heart-protective doses the main problems are stomach upset and stomach or duodenal ulcers."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "ibuprofen",
      name: "Ibuprofen",
      aliases: [],
      brands: ["Brufen", "Emflam", "Ibusynth", "Ibugesic"],
      drugClass: "Nonsteroidal anti-inflammatory drug (NSAID), propionic acid derivative",
      summary: "A commonly used pain, fever and anti-inflammatory medicine. The book describes it as better tolerated than aspirin, and notes it was rated the safest traditional NSAID by UK adverse-reaction reporting.",
      sections: {
        uses: {
          pages: [200],
          items: [
            "Simple pain relief and fever, like low-dose aspirin; particularly effective for period pain.",
            "Rheumatoid arthritis, osteoarthritis and other musculoskeletal conditions where pain is more prominent than inflammation.",
            "Soft-tissue injuries, fractures, tooth extraction, and pain and swelling after surgery or childbirth.",
            "A weaker anti-inflammatory than aspirin: not suitable for acute gout."
          ]
        },
        sideEffects: {
          pages: [200],
          items: [
            "Stomach discomfort, nausea and vomiting are the most common (less than with aspirin); stomach erosion and hidden bleeding are rare.",
            "Headache, dizziness, blurred vision, ringing in the ears, low mood.",
            "Rashes and itching occasionally."
          ]
        },
        contraindications: {
          pages: [200],
          items: [
            "Should not be prescribed in pregnancy.",
            "Should be avoided in people with peptic ulcer."
          ]
        },
        warnings: {
          pages: [199, 200],
          items: [
            "Can trigger asthma in people with aspirin-induced asthma.",
            "NSAIDs can worsen peptic ulcer, high blood pressure, heart failure, kidney problems and bleeding disorders."
          ]
        },
        interactions: {
          pages: [199, 200, 201],
          items: [
            "Use with anticoagulants should be avoided (affects platelets; increased risk of stomach bleeding).",
            "Reduces the effect of diuretics (thiazides, furosemide), beta blockers and ACE inhibitors.",
            "Increased stomach-bleeding risk with alcohol, corticosteroids and SSRIs.",
            "Can raise levels of lithium, methotrexate, digoxin and aminoglycoside antibiotics by reducing their removal by the kidneys; more kidney toxicity with cyclosporine.",
            "Taking ibuprofen at the same time can block the heart-protective antiplatelet effect of low-dose aspirin."
          ]
        },
        dosage: {
          pages: [200],
          items: ["400–600 mg three times a day. The book also lists a weight-based dose of 5–10 mg/kg three times a day; a doctor or pharmacist should confirm any dose for a child."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            645
          ],
          "items": [
            "For NSAIDs as a group: headache, ringing in the ears, dizziness; fluid retention, raised blood pressure and, rarely, heart attack or heart failure; stomach pain and, rarely, ulcers or bleeding; rare kidney and liver problems."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            647
          ],
          "items": [
            "About 2400 mg a day of ibuprofen equals the anti-inflammatory effect of 4 g of aspirin."
          ]
        }
      ],
      flags: [
        "Kidney-related interactions (lithium, methotrexate, digoxin, aminoglycosides, cyclosporine) are from the book's table for NSAIDs as a group (p. 199), not stated for ibuprofen specifically."
      ],
      review: "unreviewed"
    },

    {
      id: "diclofenac",
      name: "Diclofenac",
      aliases: ["Diclofenac sodium", "Diclofenac potassium"],
      brands: ["Voveran", "Diclonac", "Movonac", "Diclomax", "Voltaflam", "Ultra-K", "Volini gel", "Relaxyl gel"],
      drugClass: "Nonsteroidal anti-inflammatory drug (NSAID), preferential COX-2 inhibitor",
      summary: "One of the most widely used anti-inflammatory pain relievers, available as tablets, injections, gels and eye drops. It works well in joints because it stays in joint fluid longer than in blood.",
      sections: {
        uses: {
          pages: [204, 208],
          items: [
            "Rheumatoid arthritis, osteoarthritis, bursitis and ankylosing spondylitis.",
            "Toothache, period pain and kidney stone pain (renal colic).",
            "Pain and swelling after injury or surgery.",
            "As a 1% gel for musculoskeletal pain."
          ]
        },
        sideEffects: {
          pages: [204],
          items: [
            "Usually mild: upper abdominal pain, nausea, headache, dizziness, rashes.",
            "Stomach ulcers and bleeding are less common.",
            "Reversible rises in liver enzymes; kidney damage is rare."
          ]
        },
        warnings: {
          pages: [204],
          items: [
            "Like many NSAIDs, it can increase the risk of heart attack and stroke."
          ]
        },
        interactions: {
          pages: [199],
          items: [
            "As an NSAID: increased stomach-bleeding risk with anticoagulants, alcohol, corticosteroids and SSRIs; reduced effect of diuretics and blood-pressure medicines (general NSAID interactions)."
          ]
        },
        dosage: {
          pages: [204],
          items: ["50 mg three times a day, then twice a day, by mouth; 75 mg by deep intramuscular injection."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            647
          ],
          "items": [
            "Raised liver enzymes are more common with diclofenac than with other NSAIDs.",
            "At 150 mg a day it appears to reduce blood flow to the kidneys."
          ]
        },
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            647
          ],
          "items": [
            "Also used as 0.1% eye drops after eye surgery and as a 3% gel for sun-damaged skin patches (solar keratoses)."
          ]
        }
      ],
      flags: [
        "Interactions are listed in the book for NSAIDs as a group, not specifically for diclofenac."
      ],
      review: "unreviewed"
    },

    {
      id: "tramadol",
      name: "Tramadol",
      aliases: [],
      brands: ["Contramal", "Domadol", "Tramazac"],
      drugClass: "Centrally acting analgesic; atypical opioid",
      summary: "A pain reliever that works partly like an opioid and partly by raising serotonin and noradrenaline in the spinal cord. Used for mild to moderate pain; not effective for severe pain.",
      sections: {
        uses: {
          pages: [477],
          items: [
            "Mild to moderate short-term pain from procedures, injury or surgery.",
            "Chronic pain, including cancer pain."
          ]
        },
        sideEffects: {
          pages: [477],
          items: [
            "Dizziness, nausea, sleepiness, dry mouth and sweating.",
            "Lowers the seizure threshold.",
            "Less breathing depression, sedation, constipation and urinary retention than morphine."
          ]
        },
        interactions: {
          pages: [477],
          items: ["Should not be given to people taking SSRI antidepressants because of the risk of 'serotonin syndrome'."]
        },
        warnings: {
          pages: [477],
          items: ["Abuse potential is described as low, with little tendency to dose escalation."]
        },
        dosage: {
          pages: [477],
          items: ["50–100 mg by mouth or injection every 4–6 hours (children 1–2 mg/kg)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            570
          ],
          "items": [
            "Can cause seizures: relatively contraindicated in people with epilepsy and with other medicines that lower the seizure threshold.",
            "How well it works varies with a person's CYP2D6 liver-enzyme genes."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            570
          ],
          "items": [
            "Serious risk of serotonin syndrome, especially with SSRI antidepressants."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            570
          ],
          "items": [
            "Nausea and dizziness usually settle after several days."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            570
          ],
          "items": [
            "50–100 mg by mouth four times a day."
          ]
        }
      ],
      flags: [
        "The book's view of tramadol's abuse potential (2013) may be outdated; dependence and misuse have since been widely reported. Reviewer should check.",
        "Katzung (2018) does not discuss tramadol misuse either, so the earlier note about outdated abuse-potential wording still needs a reviewer."
      ],
      review: "unreviewed"
    },

    {
      id: "omeprazole",
      name: "Omeprazole",
      aliases: ["Proton pump inhibitor", "PPI"],
      brands: ["Omizac", "Nilsec", "Omez", "Ocid", "Omezol", "Protoloc"],
      drugClass: "Proton pump inhibitor (PPI) — reduces stomach acid",
      summary: "A powerful stomach-acid reducer and the standard medicine for ulcers and acid reflux. It switches off the stomach's acid pumps; the effect builds up over about four days of daily use.",
      sections: {
        uses: {
          pages: [652, 653],
          items: [
            "Peptic (stomach and duodenal) ulcers, including ulcers caused by NSAID pain relievers, and preventing them coming back.",
            "Part of the treatment to clear H. pylori infection.",
            "Gastro-oesophageal reflux disease (GERD/acid reflux) — the drugs of choice.",
            "Bleeding ulcers and stress ulcers (usually injectable PPIs in hospital).",
            "Zollinger-Ellison syndrome and other conditions with very high acid output."
          ]
        },
        sideEffects: {
          pages: [653],
          items: [
            "Minimal in most people: nausea, loose stools, headache, abdominal pain, muscle and joint pain, dizziness (3–5%).",
            "Rashes, low white-cell count and liver problems are infrequent."
          ]
        },
        warnings: {
          pages: [652, 653],
          items: [
            "Swallow capsules whole — do not open, break or chew; take on an empty stomach before a meal (the book suggests in the morning).",
            "Long-term use: the book advises avoiding it where possible, noting reports of atrophic gastritis, and of faster bone thinning (osteoporosis) in elderly people on high doses for a long time.",
            "Pregnancy: no harmful effects are known, though manufacturers advise avoiding it."
          ]
        },
        interactions: {
          pages: [653],
          items: [
            "Can raise levels of diazepam, phenytoin and warfarin.",
            "Interferes with activation of clopidogrel.",
            "Reduces absorption of ketoconazole and iron salts.",
            "Clarithromycin raises omeprazole levels."
          ]
        },
        dosage: {
          pages: [652],
          items: ["Peptic ulcer: 20 mg once daily (40 mg/day heals faster); higher or twice-daily doses are often needed for GERD."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [1092, 1094, 1095],
          "items": [
            "Take about 1 hour before a meal, usually breakfast; food halves absorption. Full effect takes 3–4 days.",
            "Use the lowest effective dose and weigh the risks of long-term use.",
            "Long-term use has been linked with: hip, spine and wrist fractures (FDA warning; bone checks and calcium suggested for those at risk); low vitamin B12; severe low magnesium; gut infections including C. difficile; and, in observational studies, kidney inflammation and chronic kidney disease.",
            "Stopping after long use can cause a temporary rebound of heartburn for 2–4 weeks.",
            "Safety in pregnancy has not been established."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            1095
          ],
          "items": [
            "May slow the breakdown of clopidogrel (reducing its activation), warfarin, diazepam and phenytoin.",
            "Lower stomach acid can reduce absorption of ketoconazole, itraconazole, digoxin and atazanavir."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [1094],
          "items": [
            "Diarrhoea, headache and abdominal pain in 1–5% of people."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "pantoprazole",
      name: "Pantoprazole",
      aliases: ["Proton pump inhibitor", "PPI"],
      brands: ["Pantocid", "Pantodac", "Pantium", "Pantin"],
      drugClass: "Proton pump inhibitor (PPI) — reduces stomach acid",
      summary: "A stomach-acid reducer similar in strength and effect to omeprazole, but more stable in acid and with fewer drug interactions. Also available as an injection.",
      sections: {
        uses: {
          pages: [652, 653],
          items: [
            "Same uses as omeprazole: peptic ulcers, acid reflux (GERD), H. pylori treatment.",
            "By injection: bleeding peptic ulcer and prevention of stress ulcers in hospital."
          ]
        },
        sideEffects: {
          pages: [653],
          items: ["As for PPIs in general: occasional nausea, loose stools, headache, abdominal pain, dizziness; rashes infrequent."]
        },
        warnings: {
          pages: [652, 653],
          items: [
            "Swallow enteric-coated tablets whole; take before a meal on an empty stomach.",
            "As with other PPIs, the book advises avoiding long-term use where possible."
          ]
        },
        interactions: {
          pages: [653],
          items: ["Lower affinity for liver enzymes than omeprazole, so the risk of drug interactions is minimal."]
        },
        dosage: {
          pages: [652, 653],
          items: [
            "40 mg once daily.",
            "Bleeding ulcer (in hospital, intravenous): 40–120 mg/day."
          ]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [1092, 1094, 1095],
          "items": [
            "Take about 1 hour before a meal; full effect takes 3–4 days.",
            "The long-term risks described for proton pump inhibitors as a group apply: fractures, low vitamin B12 and magnesium, gut infections, and kidney problems in observational studies; rebound heartburn for 2–4 weeks after stopping."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            1095
          ],
          "items": [
            "Has no significant drug interactions through liver enzymes, unlike omeprazole; lower stomach acid can still reduce absorption of ketoconazole, itraconazole and digoxin."
          ]
        }
      ],
      flags: [
        "Side effects and warnings are given in the book for PPIs as a group."
      ],
      review: "unreviewed"
    },

    {
      id: "ranitidine",
      name: "Ranitidine",
      aliases: ["H2 blocker", "H2 antagonist"],
      brands: ["Ultac", "Zinetac", "Histac", "Ranitin", "Aciloc", "Rantac"],
      drugClass: "H2 receptor antagonist (H2 blocker) — reduces stomach acid",
      summary: "An older stomach-acid reducer, about five times as potent as cimetidine with fewer side effects. The book notes that proton pump inhibitors have largely replaced H2 blockers.",
      sections: {
        uses: {
          pages: [651],
          items: [
            "Duodenal and gastric ulcers (now seldom used to heal existing ulcers), and preventing relapse.",
            "Stress ulcers in seriously ill patients (intravenous).",
            "Mild acid reflux (GERD), less effective than PPIs.",
            "Before surgery to reduce the risk of acid aspiration; occasionally for hives alongside an antihistamine."
          ]
        },
        sideEffects: {
          pages: [650],
          items: [
            "Low overall: headache, diarrhoea or constipation and dizziness occur about as often as with a placebo.",
            "Unlike cimetidine, no hormonal effects (no breast enlargement or sexual side effects)."
          ]
        },
        warnings: {
          pages: [650],
          items: ["Rapid intravenous injection can lower blood pressure."]
        },
        interactions: {
          pages: [650],
          items: [
            "Drug interactions are mostly of no clinical relevance (much weaker than cimetidine).",
            "Antacids reduce absorption of H2 blockers — leave a 2-hour gap.",
            "Reduced stomach acid lowers absorption of ketoconazole."
          ]
        },
        dosage: {
          pages: [650],
          items: ["Ulcer healing: 300 mg at bedtime or 150 mg twice daily; maintenance 150 mg at bedtime."]
        }
      },
      otherBooks: [],
      flags: [
        "Withdrawn from many markets after the book was published — see the update below."
      ],
      updates: [
        {
          date: "2020-04-01",
          text: "The US FDA asked manufacturers to withdraw all ranitidine products from the market because an impurity (NDMA) could build up to unsafe levels during storage. Other regulators, including the European Medicines Agency, suspended ranitidine medicines too.",
          source: "US Food and Drug Administration press announcement",
          url: "https://www.fda.gov/news-events/press-announcements/fda-requests-removal-all-ranitidine-products-zantac-market"
        }
      ],
      review: "unreviewed"
    },

    {
      id: "metoclopramide",
      name: "Metoclopramide",
      aliases: ["Prokinetic", "Antiemetic"],
      brands: ["Perinorm", "Maxeron", "Reglan", "Sigmet"],
      drugClass: "Antiemetic and prokinetic (dopamine D2 blocker, 5-HT4 agonist)",
      summary: "A commonly used anti-sickness medicine that also speeds up stomach emptying.",
      sections: {
        uses: {
          pages: [666],
          items: [
            "Nausea and vomiting after surgery, from medicines or illness (especially migraine), and radiation sickness; less effective for motion sickness.",
            "Vomiting caused by anticancer drugs (higher doses), although ondansetron is preferred.",
            "Speeding stomach emptying (e.g. diabetic gastroparesis, before emergency anaesthesia).",
            "Indigestion and other functional gut problems; persistent hiccups; as an add-on in mild acid reflux."
          ]
        },
        sideEffects: {
          pages: [666],
          items: [
            "Sedation, dizziness, loose stools.",
            "Involuntary muscle spasms (dystonia), especially in children.",
            "Long-term use: parkinsonism, breast milk production and breast enlargement."
          ]
        },
        warnings: {
          pages: [664, 666],
          items: [
            "Should not be used to increase breast milk.",
            "Pregnancy: no harmful effects known, but for morning sickness use only when other measures fail.",
            "Breastfed babies may develop loose motions or muscle spasms.",
            "Anti-sickness medicines should not be used before the cause of vomiting is diagnosed, as they may delay treatment of conditions like appendicitis or bowel obstruction."
          ]
        },
        interactions: {
          pages: [666],
          items: [
            "Speeds absorption of aspirin, diazepam and others; reduces absorption of digoxin and cimetidine.",
            "Cancels the effect of levodopa (Parkinson's disease)."
          ]
        },
        dosage: {
          pages: [666],
          items: ["10 mg three times a day by mouth or injection (children 0.2–0.5 mg/kg)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            1098
          ],
          "items": [
            "Restlessness, drowsiness, sleeplessness, anxiety or agitation in 10–20% of people, especially older people.",
            "Muscle-movement side effects (spasms, restlessness, Parkinson-like stiffness) in 25% at high doses and 5% on long-term use.",
            "Tardive dyskinesia (involuntary movements, sometimes permanent) after prolonged use."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            1098
          ],
          "items": [
            "Long-term use should be avoided unless absolutely necessary, especially in older people."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "domperidone",
      name: "Domperidone",
      aliases: ["Prokinetic", "Antiemetic"],
      brands: ["Domstal", "Domperon", "Normetic", "Motinorm"],
      drugClass: "Antiemetic and prokinetic (dopamine D2 blocker)",
      summary: "An anti-sickness medicine similar to metoclopramide but with fewer side effects, because it hardly enters the brain. It also counteracts the nausea caused by Parkinson's medicines without blocking their benefit.",
      sections: {
        uses: {
          pages: [666, 667],
          items: [
            "Similar uses to metoclopramide (nausea, vomiting, slow stomach emptying), though it is less effective at speeding the stomach.",
            "Not useful against the severe vomiting caused by strong anticancer drugs.",
            "Counteracting the sickness caused by levodopa and bromocriptine in Parkinson's disease."
          ]
        },
        sideEffects: {
          pages: [667],
          items: [
            "Much milder than metoclopramide: dry mouth, loose stools, headache, rashes, breast milk production.",
            "Movement-disorder side effects are rare."
          ]
        },
        warnings: {
          pages: [667],
          items: ["Heart rhythm problems (arrhythmias) have occurred with rapid intravenous injection."]
        },
        dosage: {
          pages: [667],
          items: ["10–40 mg three times a day (children 0.3–0.6 mg/kg)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            1098
          ],
          "items": [
            "Extremely well tolerated; brain and movement side effects are rare because it hardly enters the brain. Raised prolactin can cause breast milk production, breast enlargement and period problems."
          ]
        },
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            1097,
            1098
          ],
          "items": [
            "Sometimes recommended to boost breast milk after childbirth. Not sold in the USA."
          ]
        }
      ],
      flags: [
        "Heart-rhythm restrictions on domperidone were tightened in several countries after 2013; a reviewer should check current guidance.",
        "Books differ on use to boost breast milk: Tripathi says metoclopramide should not be used for this (p. 666) and does not recommend domperidone for it; Katzung notes domperidone is sometimes recommended (p. 1098). Heart-rhythm guidance should be checked by a reviewer."
      ],
      review: "unreviewed"
    },

    {
      id: "ondansetron",
      name: "Ondansetron",
      aliases: ["5-HT3 antagonist", "Antiemetic"],
      brands: ["Emeset", "Vomiz", "Osetron", "Emsetron", "Ondy"],
      drugClass: "Antiemetic — selective 5-HT3 receptor antagonist",
      summary: "A highly effective anti-sickness medicine developed for vomiting caused by cancer treatment, and now widely used after surgery and for other causes of vomiting.",
      sections: {
        uses: {
          pages: [668],
          items: [
            "Preventing nausea and vomiting from cancer chemotherapy and radiotherapy.",
            "Nausea and vomiting after surgery (first choice at many centres).",
            "Vomiting from medicines, overdose, gut disorders, kidney failure or head injury.",
            "Poor for motion sickness."
          ]
        },
        sideEffects: {
          pages: [668],
          items: ["Unlike metoclopramide, it does not cause muscle spasms (dystonia) or sedation."]
        },
        interactions: {
          pages: [668],
          items: ["No clinically significant drug interactions noted in the book."]
        },
        dosage: {
          pages: [668],
          items: [
            "Before less emetic chemotherapy or radiotherapy: 8 mg by mouth 1–2 hours before, repeated twice 8-hourly.",
            "After surgery: 4–8 mg intravenously before anaesthesia, repeated 8-hourly."
          ]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [1105],
          "items": [
            "Headache, dizziness and constipation are most common.",
            "Causes a small prolongation of the QT interval on the heart tracing."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [1105],
          "items": [
            "Serotonin syndrome has been reported when combined with SSRI or SNRI antidepressants."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            1104
          ],
          "items": [
            "Before chemotherapy: 8 mg, or by mouth 8 mg twice a day or 24 mg once, given 1 hour before. A lower dose may be needed in liver disease."
          ]
        }
      ],
      flags: [
        "The book's guidance on use in pregnancy was cut off in the extracted text and has not been included; a reviewer should check p. 668.",
        "Books differ on interactions: Tripathi reports no clinically significant interactions (p. 668); Katzung reports serotonin syndrome with SSRIs/SNRIs (p. 1104)."
      ],
      review: "unreviewed"
    },

    {
      id: "loperamide",
      name: "Loperamide",
      aliases: ["Antidiarrhoeal", "Antimotility drug"],
      brands: ["Imodium", "Lopestal", "Diarlop"],
      drugClass: "Antidiarrhoeal — opioid antimotility drug acting on the gut",
      summary: "Slows the bowel to relieve diarrhoea. It treats the symptom only, and must not be used for infectious diarrhoea or in young children.",
      sections: {
        uses: {
          pages: [687],
          items: [
            "Short-term relief of non-infective diarrhoea and mild traveller's diarrhoea.",
            "Low doses for chronic diarrhoea in irritable bowel syndrome.",
            "Reducing output in people with an ileostomy or colostomy."
          ]
        },
        sideEffects: {
          pages: [687],
          items: [
            "Abdominal cramps and rashes are the most common.",
            "In young children: paralysed bowel and toxic megacolon — deaths have occurred."
          ]
        },
        contraindications: {
          pages: [687],
          items: [
            "Children under 4 years.",
            "Acute infective diarrhoea (it delays clearing the infection, and with invasive organisms such as Shigella it can be dangerous).",
            "Severe inflammatory bowel disease."
          ]
        },
        warnings: {
          pages: [687],
          items: [
            "A short-term measure only.",
            "The book notes India has banned paediatric antidiarrhoeal products containing loperamide, and the liquid form was withdrawn to prevent use in young children."
          ]
        },
        dosage: {
          pages: [687],
          items: ["4 mg, then 2 mg after each loose motion (maximum 10 mg a day); 2 mg twice daily for chronic diarrhoea (adults)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            1122
          ],
          "items": [
            "Misused in very large doses for an opioid-like high or to self-treat opioid withdrawal; at such doses it can cause confusion, slowed breathing and dangerous heart rhythms."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "amoxicillin",
      name: "Amoxicillin",
      aliases: ["Amoxycillin", "Penicillin", "Aminopenicillin"],
      brands: ["Amoxylin", "Novamox", "Synamox", "Amoxil", "Mox", "Moxylong"],
      drugClass: "Antibiotic — extended-spectrum penicillin (aminopenicillin)",
      summary: "A penicillin antibiotic very close to ampicillin, but better absorbed by mouth (food does not interfere) and causing less diarrhoea. Many doctors prefer it to ampicillin.",
      sections: {
        uses: {
          pages: [722, 723],
          items: [
            "Bronchitis and other respiratory infections, urinary tract infections, gonorrhoea and subacute bacterial endocarditis.",
            "Part of most triple-drug regimens to clear H. pylori (stomach ulcer bacteria).",
            "Not effective against viral infections (like all antibiotics)."
          ]
        },
        sideEffects: {
          pages: [722, 723],
          items: [
            "Diarrhoea (less than with ampicillin).",
            "Rashes are common with this group (up to 10% with ampicillin), especially in people with glandular fever (EB virus), AIDS or lymphatic leukaemia, and more often when taken with allopurinol."
          ]
        },
        contraindications: {
          pages: [723],
          items: ["People who have had an immediate allergic reaction to penicillin should not be given ampicillin-type penicillins."]
        },
        interactions: {
          pages: [723],
          items: [
            "Ampicillin-type antibiotics may reduce the effect of oral contraceptive pills (by changing gut bacteria).",
            "Probenecid slows their removal by the kidneys (used on purpose in some products)."
          ]
        },
        dosage: {
          pages: [723],
          items: ["0.25–1 g three times a day by mouth or injection (children 25–75 mg/kg/day)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            801
          ],
          "items": [
            "Given by mouth for bacterial sinusitis, ear infections and lower respiratory infections; can be taken with or without food.",
            "Like all antibiotics, it should never be used for viral infections."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            801
          ],
          "items": [
            "For penicillins as a group: anaphylaxis is very rare (about 0.05%); serum-sickness-like reactions (hives, fever, joint swelling) 7–12 days after exposure; rashes; rarely kidney inflammation or blood disorders. Thrush (vaginal candidiasis) can follow."
          ]
        },
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            801
          ],
          "items": [
            "After a serious penicillin allergy, penicillins should be avoided or given only with great caution; a penicillin skin test can help decide."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            800,
            801
          ],
          "items": [
            "250–500 mg three times a day (children 20–40 mg/kg a day in 3 doses); with clavulanate 500/125 mg three times a day or 875/125 mg twice a day. Lower doses in kidney failure."
          ]
        }
      ],
      flags: [
        "Side effects, contraindications and interactions are described in the book for ampicillin, which it says amoxicillin resembles 'in all respects' except those listed."
      ],
      review: "unreviewed"
    },

    {
      id: "cotrimoxazole",
      name: "Cotrimoxazole",
      aliases: ["Co-trimoxazole", "Trimethoprim + sulfamethoxazole", "Trimethoprim-sulfamethoxazole", "TMP-SMX"],
      brands: ["Septran", "Sepmax", "Bactrim", "Ciplin", "Oriprim", "Supristol", "Fortrim"],
      drugClass: "Antibiotic combination — trimethoprim + sulfamethoxazole (sulfonamide)",
      summary: "A combination of two antibacterials that together kill bacteria. Still used, although resistance has reduced its popularity for many infections.",
      sections: {
        uses: {
          pages: [708],
          items: [
            "Urinary tract infections, especially chronic or recurrent ones and prostatitis.",
            "Upper and lower respiratory infections, including chronic bronchitis, sinus and ear infections.",
            "Severe bacterial diarrhoea and dysentery (an alternative to fluoroquinolones).",
            "Pneumocystis pneumonia in people with weakened immunity (treatment and prevention).",
            "Protecting people with very low white-cell counts from infection."
          ]
        },
        sideEffects: {
          pages: [706, 707],
          items: [
            "Nausea, vomiting, mouth sores, headache and rashes.",
            "Sulfonamide allergic reactions (2–5%): rashes, hives, fever, sun sensitivity; rarely severe skin reactions (Stevens-Johnson syndrome).",
            "Folate-deficiency anaemia in people with low folate; rarely blood disorders.",
            "High rates of fever, rash and bone-marrow suppression in AIDS patients on high doses."
          ]
        },
        contraindications: {
          pages: [707],
          items: [
            "Pregnancy (theoretical risk of birth defects; problems in the newborn if given near term).",
            "The children's suspension should not be used in newborns."
          ]
        },
        warnings: {
          pages: [706, 707],
          items: [
            "Kidney disease: dose reduction needed; may cause uraemia.",
            "Elderly people are at greater risk of bone-marrow toxicity.",
            "Can cause red-cell breakdown in G-6-PD deficiency; can precipitate kernicterus (bilirubin brain damage) in newborns.",
            "Drink plenty of fluids (reduces crystals in urine)."
          ]
        },
        interactions: {
          pages: [706, 707],
          items: [
            "Enhances the effect of phenytoin, tolbutamide and warfarin; increases methotrexate toxicity.",
            "Diuretics given with it have caused more low-platelet problems."
          ]
        },
        dosage: {
          pages: [707],
          items: ["Trimethoprim 80 mg + sulfamethoxazole 400 mg tablet: 2 twice daily for 2 days, then 1 twice daily; or one double-strength (160 + 800 mg) tablet twice daily."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            837
          ],
          "items": [
            "Also commonly used for uncomplicated skin and soft-tissue infections, including many MRSA strains.",
            "Low-dose regimens prevent Pneumocystis pneumonia in people with weak immunity."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            836,
            837
          ],
          "items": [
            "Can cause folate-related anaemia and low white-cell counts.",
            "In people with AIDS: frequent fever, rash, low white cells, diarrhoea, liver-test rises, high potassium and low sodium.",
            "A mild rise in blood creatinine is expected and does not by itself mean kidney damage."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            837
          ],
          "items": [
            "One double-strength tablet (160 mg + 800 mg) every 12 hours for urinary, prostate and uncomplicated skin infections."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "ciprofloxacin",
      name: "Ciprofloxacin",
      aliases: ["Fluoroquinolone", "Cipro"],
      brands: ["Cifran", "Ciplox", "Ciprobid", "Quintor", "Ciprolet"],
      drugClass: "Antibiotic — fluoroquinolone",
      summary: "A broad-spectrum antibiotic that kills bacteria and is well absorbed by mouth. The book warns it should not be used for minor infections.",
      sections: {
        uses: {
          pages: [711],
          items: [
            "Urinary tract infections, including complicated ones.",
            "Severe bacterial diarrhoea (e.g. Shigella, Salmonella, Campylobacter); reduces stool volume in cholera.",
            "Typhoid fever (though resistance is increasing and ceftriaxone is more commonly used).",
            "Chancroid; gonorrhoea only if the strain is known to be sensitive.",
            "Not for minor infections, or where gram-positive bacteria or anaerobes are the main cause."
          ]
        },
        sideEffects: {
          pages: [710],
          items: [
            "Usually mild (about 10% of people): nausea, vomiting, bad taste, loss of appetite.",
            "Dizziness, headache, restlessness, anxiety, sleeplessness, poorer concentration (take care when driving); seizures rarely.",
            "Rash, itching, sun sensitivity, swelling of the lips.",
            "Tendon inflammation and rupture — higher risk over 60 and with corticosteroids. Stop at the first sign of tendon pain."
          ]
        },
        contraindications: {
          pages: [711],
          items: ["Pregnancy. Use in children needs caution (it was originally contraindicated after joint damage in young animals)."]
        },
        interactions: {
          pages: [711],
          items: [
            "Raises theophylline, caffeine and warfarin levels; theophylline with it can cause brain toxicity.",
            "NSAIDs may increase the risk of seizures.",
            "Antacids, sucralfate and iron reduce its absorption."
          ]
        },
        dosage: {
          pages: [711],
          items: ["250–750 mg twice daily by mouth; 100–200 mg intravenously."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            839,
            840
          ],
          "items": [
            "In 2016 the FDA said fluoroquinolones should be kept for people with no other option, especially for milder infections such as sinus or simple bladder infections.",
            "Can cause nerve damage (peripheral neuropathy) at any time during treatment; it can last months or years after stopping and may be permanent.",
            "Tendon inflammation and rupture: higher risk with older age, kidney disease and steroid use.",
            "Not a first choice under 18 years, though it may be used when needed. Should be avoided in pregnancy unless there is a clear need."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            839
          ],
          "items": [
            "Take it 2 hours before or 4 hours after antacids, calcium, iron, zinc or other products containing these minerals."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            839
          ],
          "items": [
            "Most common: nausea, vomiting and diarrhoea; occasionally headache, dizziness, sleeplessness, rash or abnormal liver tests."
          ]
        }
      ],
      flags: [
        "Fluoroquinolone safety warnings have been strengthened internationally since 2013; a reviewer should check current guidance.",
        "Update to the earlier note: Katzung (2018, p. 840) confirms the 2016 FDA warning to reserve fluoroquinolones for infections with no alternative."
      ],
      review: "unreviewed"
    },

    {
      id: "cephalexin",
      name: "Cephalexin",
      aliases: ["Cefalexin", "Cephalosporin"],
      brands: ["Cephacillin", "Sporidex", "Alcephin", "Cephaxin"],
      drugClass: "Antibiotic — first-generation cephalosporin (oral)",
      summary: "The most commonly used oral first-generation cephalosporin antibiotic.",
      sections: {
        uses: {
          pages: [726, 730],
          items: [
            "As an alternative to penicillins for ear, nose and throat, upper respiratory and skin infections.",
            "Infections due to penicillinase-producing staphylococci (with lower activity than injectable cefazolin)."
          ]
        },
        sideEffects: {
          pages: [729],
          items: [
            "Diarrhoea is more common with oral cephalosporins such as cephalexin.",
            "Allergic reactions (the most important): rashes most often; rarely anaphylaxis, swelling, asthma, hives."
          ]
        },
        contraindications: {
          pages: [729],
          items: ["About 10% of people allergic to penicillin also react to cephalosporins; people with an immediate-type penicillin reaction should preferably not be given one."]
        },
        warnings: {
          pages: [729],
          items: ["Some cephalosporins can harm the kidneys, more so with existing kidney disease or with aminoglycosides or loop diuretics."]
        },
        dosage: {
          pages: [726],
          items: ["0.25–1 g every 6–8 hours (children 25–100 mg/kg/day)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            806
          ],
          "items": [
            "People who have had anaphylaxis to a penicillin should not receive first-generation cephalosporins such as cephalexin."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            806
          ],
          "items": [
            "Uncommonly, kidney inflammation or damage."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            803,
            804
          ],
          "items": [
            "0.25–0.5 g four times a day (children 25–50 mg/kg a day in 4 doses); half the dose or less in kidney failure."
          ]
        }
      ],
      flags: [
        "Side effects and warnings are given in the book for cephalosporins as a group.",
        "Books differ on cross-allergy with penicillin: Tripathi says about 10% (p. 729); Katzung says it is low, about 1%, highest with older cephalosporins like cephalexin (p. 806)."
      ],
      review: "unreviewed"
    },

    {
      id: "ceftriaxone",
      name: "Ceftriaxone",
      aliases: ["Cephalosporin"],
      brands: ["Oframax", "Monocef", "Monotax"],
      drugClass: "Antibiotic — third-generation cephalosporin (injection)",
      summary: "A long-acting injectable antibiotic given once (at most twice) daily, used for many serious infections.",
      sections: {
        uses: {
          pages: [727, 728, 730],
          items: [
            "Bacterial meningitis (especially in children).",
            "Typhoid fever, including multidrug-resistant typhoid — among the fastest-acting and most reliable treatments.",
            "Complicated urinary infections, abdominal infections and blood poisoning (septicaemia).",
            "Gonorrhoea (a single injection) and chancroid."
          ]
        },
        sideEffects: {
          pages: [728, 729],
          items: [
            "Specific to ceftriaxone: low prothrombin and bleeding; red-cell breakdown has been reported.",
            "Cephalosporin allergic reactions: mostly rashes; rarely anaphylaxis.",
            "Pain or vein inflammation at the injection site."
          ]
        },
        contraindications: {
          pages: [729],
          items: ["Caution with penicillin allergy: about 10% cross-react; avoid after an immediate-type penicillin reaction."]
        },
        dosage: {
          pages: [728],
          items: [
            "Skin, soft-tissue and urinary infections: 1–2 g a day intravenously or intramuscularly.",
            "Gonorrhoea: a single 250 mg intramuscular dose."
          ]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            805
          ],
          "items": [
            "With azithromycin, an intramuscular ceftriaxone injection is the usual treatment for most gonorrhoea."
          ]
        },
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            806
          ],
          "items": [
            "After penicillin anaphylaxis, third-generation cephalosporins such as ceftriaxone should be given with caution, preferably where the person can be monitored."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            805
          ],
          "items": [
            "Once a day: 1 g is enough for most serious infections; 2 g every 12 hours for meningitis. No dose change is needed in kidney disease (it is removed mainly in bile)."
          ]
        }
      ],
      flags: [
        "Books differ on cross-allergy with penicillin: Tripathi says about 10% (p. 729); Katzung says about 1% (p. 806)."
      ],
      review: "unreviewed"
    },

    {
      id: "azithromycin",
      name: "Azithromycin",
      aliases: ["Macrolide"],
      brands: ["Azithral", "Aziwok", "Aziwin"],
      drugClass: "Antibiotic — macrolide (azalide)",
      summary: "A macrolide antibiotic related to erythromycin, with a wider range, better stomach tolerance and once-daily dosing; a 3-day course is enough for most infections.",
      sections: {
        uses: {
          pages: [755, 756],
          items: [
            "Chlamydia genital infections (a single 1 g dose), chlamydial pneumonia and trachoma.",
            "Legionnaires' pneumonia and atypical pneumonia; bronchitis.",
            "Chancroid and donovanosis.",
            "Streptococcal and some staphylococcal skin infections.",
            "Multidrug-resistant typhoid in people allergic to cephalosporins."
          ]
        },
        sideEffects: {
          pages: [756],
          items: ["Mild stomach upset and abdominal pain (less than erythromycin), headache and dizziness."]
        },
        interactions: {
          pages: [756],
          items: ["Does not affect the liver enzyme CYP3A4, so interactions with theophylline, carbamazepine and warfarin are unlikely — but the book still advises caution."]
        },
        dosage: {
          pages: [756],
          items: ["500 mg once daily, 1 hour before or 2 hours after food, for 3 days for most infections (children over 6 months: 10 mg/kg/day)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            820
          ],
          "items": [
            "Macrolides can prolong the QT interval and trigger a dangerous heart rhythm (torsades de pointes); studies suggest azithromycin may carry a small increased risk of cardiac death."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            820
          ],
          "items": [
            "Free of the liver-enzyme interactions of erythromycin and clarithromycin. Aluminium and magnesium antacids slow its absorption but do not reduce the total absorbed."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            820
          ],
          "items": [
            "Chlamydia: a single 1 g dose (as effective as 7 days of doxycycline). Pneumonia: 500 mg on day 1, then 250 mg a day for 4 days."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "doxycycline",
      name: "Doxycycline",
      aliases: ["Tetracycline"],
      brands: ["Tetradox", "Doxicip", "Doxt", "Novadox"],
      drugClass: "Antibiotic — tetracycline group (broad spectrum)",
      summary: "A long-acting tetracycline antibiotic that is completely absorbed whatever the food, causes less diarrhoea than older tetracyclines and, unusually for the group, can be used in kidney failure.",
      sections: {
        uses: {
          pages: [737],
          items: [
            "Chlamydia infections of the urethra and cervix (a 7-day course), lymphogranuloma venereum, granuloma inguinale.",
            "Atypical (Mycoplasma) pneumonia and psittacosis.",
            "Cholera (reduces stool volume), brucellosis.",
            "Infections where the cause cannot be guessed, though it is not dependable for serious ones."
          ]
        },
        sideEffects: {
          pages: [735, 736, 737],
          items: [
            "Stomach pain, nausea, vomiting and diarrhoea (diarrhoea less than with older tetracyclines).",
            "Painful swallowing and ulcers in the food pipe if the capsule releases its contents while being swallowed — especially doxycycline.",
            "Sunburn-like skin reactions in sunlight (higher with doxycycline); nail changes.",
            "Fungal (Candida) overgrowth and other superinfections; rarely, serious colitis.",
            "Liver damage occasionally; rashes and itching infrequently."
          ]
        },
        contraindications: {
          pages: [736, 737],
          items: [
            "Pregnancy (can cause fatal liver damage in the mother) and breastfeeding.",
            "Children: tetracyclines stain and weaken developing teeth and can temporarily slow bone growth."
          ]
        },
        warnings: {
          pages: [735, 737],
          items: [
            "Never use after the expiry date (degraded tetracyclines damage the kidneys).",
            "Avoid in people taking diuretics; use carefully with kidney or liver problems.",
            "Stop at the first sign of a superinfection."
          ]
        },
        interactions: {
          pages: [735],
          items: [
            "Milk, iron preparations, antacids and sucralfate reduce absorption — separate the doses.",
            "Phenobarbitone and phenytoin shorten doxycycline's action."
          ]
        },
        dosage: {
          pages: [736],
          items: ["200 mg on the first day, then 100–200 mg once daily."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            818
          ],
          "items": [
            "Swallow with a full glass of water (8 ounces) and stay upright for at least 30 minutes, to avoid ulcers in the food pipe."
          ]
        },
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            818
          ],
          "items": [
            "Generally avoided in pregnancy and, for long courses, in children under 8 years (tooth staining and bone effects)."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            818
          ],
          "items": [
            "Sun sensitivity is common, particularly in fair-skinned people. The risk of C. difficile colitis may be lower than with other antibiotics."
          ]
        }
      ],
      flags: [
        "Most side effects and precautions are given in the book for tetracyclines as a group."
      ],
      review: "unreviewed"
    },

    {
      id: "metronidazole",
      name: "Metronidazole",
      aliases: ["Nitroimidazole"],
      brands: ["Flagyl", "Metrogyl", "Metron", "Aristogyl", "Aldezole", "Unimezol"],
      drugClass: "Antiprotozoal and antibacterial (anaerobes) — nitroimidazole",
      summary: "Treats amoebic dysentery, giardiasis, trichomonas infection and infections caused by anaerobic bacteria. Side effects are common and unpleasant but mostly not serious.",
      sections: {
        uses: {
          pages: [838, 839],
          items: [
            "All forms of amoebiasis, including amoebic dysentery and liver abscess (first-line).",
            "Giardiasis; Trichomonas vaginitis (drug of choice); bacterial vaginosis.",
            "Anaerobic bacterial infections after abdominal or pelvic surgery, and preventing them.",
            "Antibiotic-associated colitis due to C. difficile; trench mouth (ANUG).",
            "Part of combination treatment for H. pylori (never alone)."
          ]
        },
        sideEffects: {
          pages: [837, 838],
          items: [
            "Most common: loss of appetite, nausea, metallic taste and abdominal cramps; occasionally loose stools.",
            "Headache, sore tongue, dry mouth and dizziness.",
            "Allergic rashes, hives and itching — stop the drug and avoid this group in future.",
            "Long courses: nerve damage (neuropathy) and brain effects; seizures after very high doses; low white-cell counts with repeated courses."
          ]
        },
        contraindications: {
          pages: [838],
          items: [
            "Neurological disease and blood disorders.",
            "The first three months of pregnancy."
          ]
        },
        warnings: {
          pages: [838],
          items: ["Use with caution in chronic alcoholics."]
        },
        interactions: {
          pages: [838],
          items: [
            "Some people get a disulfiram-like reaction with alcohol; manufacturers advise caution with drinking during treatment.",
            "Enhances the effect of warfarin; can cause lithium toxicity.",
            "Phenobarbitone and rifampin may reduce its effect; cimetidine increases its levels."
          ]
        },
        dosage: {
          pages: [838],
          items: [
            "Amoebic dysentery or liver abscess: 800 mg three times daily for 7–10 days (adult).",
            "Giardiasis: 400 mg three times daily for 7 days.",
            "Trichomonas vaginitis: 2 g as a single dose."
          ]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            929
          ],
          "items": [
            "Common: nausea, headache, dry mouth and metallic taste. Infrequent: vomiting, diarrhoea, sleeplessness, dizziness, thrush, rash, dark urine, tingling, brain effects (encephalopathy) and low white cells."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            929
          ],
          "items": [
            "Taking it with meals reduces stomach irritation."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            929
          ],
          "items": [
            "Amoebic dysentery or liver abscess: 750 mg three times a day for 10 days, followed by a second medicine to clear the gut."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "fluconazole",
      name: "Fluconazole",
      aliases: ["Azole antifungal", "Triazole"],
      brands: ["Syscan", "Zocon", "Forcan", "Fluzon"],
      drugClass: "Antifungal — triazole",
      summary: "An antifungal medicine for yeast (Candida) infections and fungal meningitis, well absorbed by mouth with fewer side effects than ketoconazole.",
      sections: {
        uses: {
          pages: [793, 794],
          items: [
            "Vaginal thrush: a single 150 mg dose usually cures it.",
            "Mouth/throat thrush not responding to creams or lozenges; Candida infection of the food pipe.",
            "Most tinea (ringworm) infections and skin candidiasis.",
            "Cryptococcal and other fungal meningitis and serious body-wide fungal infections.",
            "Not effective for aspergillosis or mucormycosis."
          ]
        },
        sideEffects: {
          pages: [793],
          items: [
            "Fewer side effects than older azoles: mostly nausea, vomiting, abdominal pain, rash and headache — more frequent with higher doses and longer courses.",
            "Raised liver enzymes in AIDS patients.",
            "Does not cause the hormonal side effects of ketoconazole."
          ]
        },
        contraindications: {
          pages: [793],
          items: ["Not recommended during pregnancy or breastfeeding."]
        },
        warnings: {
          pages: [793],
          items: ["Dose reduction is needed in kidney impairment."]
        },
        interactions: {
          pages: [793],
          items: [
            "Raises levels of phenytoin, cyclosporine, warfarin, zidovudine and sulfonylurea diabetes medicines.",
            "Dangerous heart rhythms have been reported with cisapride."
          ]
        },
        dosage: {
          pages: [794],
          items: [
            "Vaginal candidiasis: 150 mg once.",
            "Skin tinea or candidiasis: 150 mg weekly for 4 weeks.",
            "Serious infections: 200–400 mg/day for 4–12 weeks or longer."
          ]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            858
          ],
          "items": [
            "The azole of choice for treating and preventing the return of cryptococcal meningitis; the most commonly used drug for mouth, throat and vaginal thrush. No activity against Aspergillus."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            858
          ],
          "items": [
            "Has the least effect of all the azoles on liver enzymes, so interactions are less common than with ketoconazole or itraconazole."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            858
          ],
          "items": [
            "100–800 mg a day by mouth or injection, depending on the infection."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "acyclovir",
      name: "Acyclovir",
      aliases: ["Aciclovir", "Antiviral"],
      brands: [],
      drugClass: "Antiviral — active against herpes viruses",
      summary: "An antiviral medicine that works only against the herpes group of viruses (cold sores, genital herpes, shingles, chickenpox). It is safe for normal cells because it is activated mainly inside infected cells.",
      sections: {
        uses: {
          pages: [763, 800],
          items: [
            "Genital herpes (first and recurrent episodes) and long-term suppression of repeated outbreaks.",
            "Herpes encephalitis (drug of choice, intravenously, started early).",
            "Herpes of the eye (eye ointment).",
            "Shingles (herpes zoster): helps only if started early; does not prevent later nerve pain.",
            "Chickenpox in people with weak immunity and in newborns."
          ]
        },
        sideEffects: {
          pages: [800],
          items: [
            "Cream: stinging and burning after each application.",
            "Tablets: generally well tolerated; headache, nausea, feeling unwell.",
            "Intravenous: rashes, sweating, vomiting, low blood pressure in a few; reduced kidney function (the most important toxicity), especially with existing kidney disease.",
            "High doses: reversible tremor, confusion, hallucinations or seizures."
          ]
        },
        warnings: {
          pages: [800],
          items: ["No potential to cause birth defects has been noted."]
        },
        dosage: {
          pages: [763, 800],
          items: [
            "Genital herpes, first episode: 200 mg five times a day or 400 mg three times a day for 10 days.",
            "Shingles: 800 mg five times a day by mouth, started early."
          ]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            866
          ],
          "items": [
            "Generally well tolerated; nausea, diarrhoea and headache may occur. By drip: reversible kidney damage or brain effects (tremor, delirium, seizures), uncommon with enough fluids and a slow infusion."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            865
          ],
          "items": [
            "Cold sores: 400 mg three times a day or 200 mg five times a day. Shingles: 800 mg five times a day for 7–10 days. Chickenpox: 20 mg/kg (maximum 800 mg) four times a day for 5 days. Lower doses in kidney disease."
          ]
        },
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            864
          ],
          "items": [
            "In first-episode genital herpes it shortens symptoms by about 2 days and healing by about 4 days."
          ]
        }
      ],
      flags: [
        "Brand names for acyclovir were not found in the extracted pages."
      ],
      review: "unreviewed"
    },

    {
      id: "albendazole",
      name: "Albendazole",
      aliases: ["Anthelmintic", "Deworming"],
      brands: ["Zentel", "Alminth", "Albezole", "Combantrin-A"],
      drugClass: "Anthelmintic (deworming medicine) — benzimidazole",
      summary: "A broad-spectrum deworming medicine; a single dose cures many common intestinal worm infections.",
      sections: {
        uses: {
          pages: [850, 851],
          items: [
            "Roundworm, hookworm, pinworm and whipworm (single dose in most cases).",
            "Tapeworms, hydatid disease and neurocysticercosis (longer courses).",
            "Cutaneous larva migrans; Trichinella; an alternative for some filarial and threadworm infections."
          ]
        },
        sideEffects: {
          pages: [851],
          items: [
            "Well tolerated: only stomach and gut side effects; a few people feel dizzy.",
            "Long courses (hydatid disease, cysticercosis): headache, fever, hair loss, jaundice and low white-cell counts."
          ]
        },
        warnings: {
          pages: [851],
          items: [
            "For intestinal worms, take on an empty stomach; for cysticercosis, hydatid disease and larva migrans, take with a fatty meal.",
            "No fasting or purging is needed."
          ]
        },
        dosage: {
          pages: [851],
          items: ["Roundworm, hookworm, pinworm, whipworm: a single 400 mg dose (adults and children over 2 years; 200 mg for children aged 1–2)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            940
          ],
          "items": [
            "Allergy to other benzimidazole deworming medicines, and cirrhosis. Safety in pregnancy and under 2 years has not been established."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            940
          ],
          "items": [
            "On long courses (e.g. hydatid disease), blood counts and liver tests should be monitored."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            940
          ],
          "items": [
            "Levels are raised by dexamethasone, praziquantel and cimetidine, and lowered by phenytoin, phenobarbital, carbamazepine and ritonavir."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            939
          ],
          "items": [
            "Roundworm and pinworm: a single 400 mg dose for adults and children over 2 (pinworm repeated in 2 weeks; heavy roundworm infection repeated for 2–3 days)."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "metformin",
      name: "Metformin",
      aliases: ["Biguanide"],
      brands: ["Glyciphage", "Glycomet"],
      drugClass: "Oral antidiabetic — biguanide",
      summary: "The book calls metformin the first-choice medicine for all type 2 diabetes unless it is not tolerated or not allowed. It lowers blood sugar mainly by reducing glucose output from the liver and rarely causes low blood sugar.",
      sections: {
        uses: {
          pages: [276],
          items: [
            "Type 2 diabetes (first choice); can be combined with any other diabetes medicine.",
            "Does not cause weight gain (promotes weight loss) and may help prevent diabetes complications.",
            "Improves ovulation and fertility in some women with polycystic ovaries."
          ]
        },
        sideEffects: {
          pages: [276],
          items: [
            "Frequent but generally not serious, and tend to settle: abdominal pain, loss of appetite, bloating, nausea, metallic taste, mild diarrhoea, tiredness.",
            "Low blood sugar only in overdose.",
            "Vitamin B12 deficiency at high doses.",
            "Lactic acidosis is rare (fewer than 1 per 10,000 patient-years); alcohol can trigger it."
          ]
        },
        contraindications: {
          pages: [276],
          items: [
            "Low blood pressure states and heart failure.",
            "Severe lung, liver or kidney disease.",
            "Alcoholism (increased risk of lactic acidosis)."
          ]
        },
        warnings: {
          pages: [276],
          items: ["It builds up in kidney failure, increasing the risk of lactic acidosis."]
        },
        interactions: {
          pages: [276],
          items: ["Cimetidine and furosemide may compete with its removal by the kidneys and increase toxicity."]
        },
        dosage: {
          pages: [272],
          items: ["0.5–2.5 g a day in 1–2 doses."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            760
          ],
          "items": [
            "Recommended first-line treatment for type 2 diabetes; also shown to help prevent type 2 diabetes in middle-aged, overweight people with raised blood sugar."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            760
          ],
          "items": [
            "Stomach upset (nausea, diarrhoea, poor appetite) affects up to 20% of people, mostly at the start; about 3–5% stop because of persistent diarrhoea.",
            "Vitamin B12 deficiency can develop after many years; periodic checks are suggested, especially with tingling or numbness or anaemia."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            759,
            760
          ],
          "items": [
            "Kidney function decides whether it can be used: normal use above eGFR 45, cautious lower doses at 30–45, and it must not be used below 30.",
            "Kidney function should be checked at least once a year.",
            "Usually paused on the day of an X-ray or scan using contrast dye, and restarted a day or two later once kidney tests are normal."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            760
          ],
          "items": [
            "Start 500 mg with a meal and increase slowly, e.g. to 1000 mg twice a day; little extra benefit above 2000 mg a day (recommended maximum 2.55 g a day)."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "glimepiride",
      name: "Glimepiride",
      aliases: ["Sulfonylurea"],
      brands: ["Amaryl", "Glypride", "Glimer"],
      drugClass: "Oral antidiabetic — sulfonylurea",
      summary: "A long-acting sulfonylurea that makes the pancreas release more insulin. The book notes it causes low blood sugar less often than some others in the group.",
      sections: {
        uses: {
          pages: [270, 272],
          items: ["Type 2 diabetes (it needs working insulin-producing cells, so it does not work in type 1 diabetes)."]
        },
        sideEffects: {
          pages: [271],
          items: [
            "Low blood sugar (hypoglycaemia) is the commonest problem — occasionally severe; more likely in elderly people, in liver or kidney disease, and with other medicines that boost its effect.",
            "Weight gain of 1–3 kg is common in people starting sulfonylureas.",
            "Mild nausea, vomiting, wind, diarrhoea or constipation, headache, tingling.",
            "Rashes, sun sensitivity; rarely, blood disorders. Some people get flushing with alcohol."
          ]
        },
        contraindications: {
          pages: [271, 273],
          items: [
            "Pregnancy: safety not established — changing to insulin is advised.",
            "Breastfeeding (passes into breast milk)."
          ]
        },
        warnings: {
          pages: [271],
          items: ["Use cautiously with liver or kidney problems."]
        },
        interactions: {
          pages: [271],
          items: [
            "Risk of low blood sugar increases with aspirin and other salicylates, sulfonamides, cimetidine, ketoconazole, warfarin, propranolol and alcohol.",
            "Effect is reduced by phenobarbitone, phenytoin, rifampicin, corticosteroids, thiazide diuretics, furosemide and oral contraceptives."
          ]
        },
        dosage: {
          pages: [272],
          items: ["1–6 mg a day in 1–2 doses."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            759
          ],
          "items": [
            "Taken once a day; 1 mg a day can be effective, and the recommended maximum is 8 mg a day."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            758
          ],
          "items": [
            "Use with caution in older people and in heart disease, where low blood sugar is especially dangerous."
          ]
        }
      ],
      flags: [
        "Side effects, interactions and precautions are given in the book for sulfonylureas as a group.",
        "Maximum dose differs: Tripathi gives 1–6 mg a day (p. 272), Katzung gives up to 8 mg a day (p. 759). Follow the prescriber's dose."
      ],
      review: "unreviewed"
    },

    {
      id: "sitagliptin",
      name: "Sitagliptin",
      aliases: ["DPP-4 inhibitor", "Gliptin"],
      brands: ["Januvia"],
      drugClass: "Oral antidiabetic — DPP-4 inhibitor (gliptin)",
      summary: "Boosts the body's own insulin response to meals. It does not cause weight gain and rarely causes low blood sugar on its own.",
      sections: {
        uses: {
          pages: [274, 275],
          items: [
            "Type 2 diabetes, mainly as an add-on when metformin, sulfonylureas, pioglitazone or insulin are not enough.",
            "On its own only when metformin cannot be used."
          ]
        },
        sideEffects: {
          pages: [275],
          items: [
            "Generally well tolerated: nausea, loose stools, headache, rashes, allergic reactions and swelling.",
            "Sore throat/nose and cough in some people.",
            "Pancreatitis is rare."
          ]
        },
        warnings: {
          pages: [274, 275],
          items: [
            "Low blood sugar can occur when combined with sulfonylureas or insulin.",
            "Dose reduction is needed in kidney impairment (not in liver disease)."
          ]
        },
        dosage: {
          pages: [272],
          items: ["100 mg once daily."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            762
          ],
          "items": [
            "100 mg once a day; 50 mg if eGFR is 30–50 and 25 mg if below 30."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            762
          ],
          "items": [
            "Stop it at once if pancreatitis (severe, persistent abdominal pain) or a serious allergic reaction occurs; fatal and non-fatal pancreatitis has been reported."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            762
          ],
          "items": [
            "Common: stuffy or sore nose and throat, upper respiratory infections and headache. Lowers HbA1c by about 0.5–1.0%."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "pioglitazone",
      name: "Pioglitazone",
      aliases: ["Glitazone", "Thiazolidinedione"],
      brands: ["Pionorm", "Piorest", "Piozone"],
      drugClass: "Oral antidiabetic — thiazolidinedione (insulin sensitiser)",
      summary: "Makes the body more sensitive to its own insulin, mainly through fat tissue. It does not cause low blood sugar on its own and may improve blood fats.",
      sections: {
        uses: {
          pages: [277],
          items: [
            "Type 2 diabetes (not type 1), mainly added to sulfonylureas or metformin, or where insulin resistance is marked.",
            "On its own in mild cases with diet and exercise.",
            "About 25% of people do not respond; the book advises stopping if HbA1c falls by less than 0.5% after 6 months."
          ]
        },
        sideEffects: {
          pages: [277],
          items: [
            "Fluid retention and swelling, weight gain, headache, muscle pain and mild anaemia.",
            "Can bring on or worsen heart failure; a few cases of liver problems.",
            "Higher risk of fractures, especially in elderly women."
          ]
        },
        contraindications: {
          pages: [277],
          items: ["Liver disease, heart failure, and pregnancy."]
        },
        warnings: {
          pages: [277],
          items: [
            "Liver function monitoring is advised.",
            "Experts advise avoiding the combination with insulin (more fluid retention and heart failure)."
          ]
        },
        interactions: {
          pages: [277],
          items: [
            "Oral contraceptives may fail during treatment.",
            "Ketoconazole raises and rifampin lowers pioglitazone levels."
          ]
        },
        dosage: {
          pages: [272],
          items: ["15–45 mg once daily."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            761
          ],
          "items": [
            "Fluid retention in about 3–4% on its own and 10–15% with insulin; heart failure can occur.",
            "Bone thinning and unusual fractures in women; rarely swelling at the back of the eye (macular oedema), which improves after stopping.",
            "Weight gain, partly fat and partly fluid, especially with a sulfonylurea or insulin."
          ]
        },
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            761
          ],
          "items": [
            "Moderate to severe heart failure (NYHA class III–IV); active liver disease."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            761
          ],
          "items": [
            "Studies on bladder cancer disagree: two large studies found no link, while another found a higher risk with pioglitazone."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            760
          ],
          "items": [
            "Can make oestrogen-containing contraceptive pills less effective; extra contraception is advised."
          ]
        }
      ],
      flags: [
        "Additional safety concerns about pioglitazone have been raised since 2013; a reviewer should check current guidance.",
        "Update to the earlier note: Katzung (2018, p. 761) reports conflicting studies on bladder cancer; a reviewer should check current guidance."
      ],
      review: "unreviewed"
    },

    {
      id: "amlodipine",
      name: "Amlodipine",
      aliases: ["Calcium channel blocker", "CCB", "Dihydropyridine"],
      brands: ["Amlopres", "Amcard", "Amlopin", "Myodura"],
      drugClass: "Calcium channel blocker (dihydropyridine) — widens arteries",
      summary: "The most popular medicine of its group for high blood pressure and angina. It acts slowly and for a long time, so one daily dose lasts into the next morning and the early flushing and palpitations of similar drugs are largely avoided.",
      sections: {
        uses: {
          pages: [549, 550],
          items: [
            "High blood pressure.",
            "Angina (reduces how often and how badly it happens).",
            "Can be used in people with lung disease or circulation problems in the legs, where beta blockers are not allowed."
          ]
        },
        sideEffects: {
          pages: [549],
          items: [
            "This group commonly causes ankle swelling (from blood-vessel widening, not fluid retention), headache, flushing, dizziness and palpitations; with amlodipine the early flushing, palpitations and dizziness are largely avoided.",
            "Can worsen acid reflux; can make passing urine harder in elderly men; may hamper diabetes control."
          ]
        },
        dosage: {
          pages: [549],
          items: ["5–10 mg once daily."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [205],
          "items": [
            "For calcium channel blockers as a group: flushing, dizziness, nausea, constipation and ankle swelling, usually not needing the medicine to stop."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            203
          ],
          "items": [
            "5–10 mg by mouth once a day; long half-life of 30–50 hours."
          ]
        }
      ],
      flags: [
        "Most side effects are described in the book for dihydropyridines as a group (based on nifedipine)."
      ],
      review: "unreviewed"
    },

    {
      id: "atenolol",
      name: "Atenolol",
      aliases: ["Beta blocker", "β blocker"],
      brands: ["Betacard", "Aten", "Tenormin"],
      drugClass: "Beta blocker — relatively selective for the heart (β1)",
      summary: "One of the most commonly used beta blockers for high blood pressure and angina. It works once a day, causes fewer sleep and mood side effects than propranolol, and does not worsen blood fats.",
      sections: {
        uses: {
          pages: [149],
          items: ["High blood pressure and angina."]
        },
        sideEffects: {
          pages: [146, 147, 148],
          items: [
            "Slow heart rate; tiredness and reduced exercise capacity.",
            "Cold hands and feet (less than with non-selective beta blockers).",
            "Stomach upset, lack of drive; sexual problems in men. Sleep problems and nightmares are less likely with atenolol."
          ]
        },
        contraindications: {
          pages: [146, 147],
          items: [
            "Partial or complete heart block.",
            "Asthma and chronic obstructive lung disease: even heart-selective beta blockers should usually be avoided."
          ]
        },
        warnings: {
          pages: [146, 147],
          items: [
            "Never stop suddenly after long use: rebound high blood pressure, worse angina and even sudden death can occur. Reduce gradually under medical advice.",
            "Can worsen heart failure if started at the wrong time (beta blockers are used in stable heart failure under supervision).",
            "In diabetes, it can hide the warning signs of low blood sugar (fast heartbeat), although heart-selective drugs are safer here."
          ]
        },
        interactions: {
          pages: [146],
          items: [
            "Digoxin and verapamil: risk of severe slowing of the heart.",
            "NSAIDs reduce its blood-pressure-lowering effect.",
            "Decongestants in cold remedies (phenylephrine, ephedrine) can raise blood pressure sharply."
          ]
        },
        dosage: {
          pages: [148],
          items: ["25–100 mg a day (often once daily)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            183
          ],
          "items": [
            "Stopping suddenly after regular use can cause a withdrawal reaction: nervousness, fast heartbeat, worse angina and higher blood pressure; heart attacks have been reported.",
            "Removed by the kidneys, so lower doses are needed in kidney disease."
          ]
        },
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            183
          ],
          "items": [
            "Reported to be less effective than metoprolol at preventing complications of high blood pressure, possibly because once-daily dosing does not keep levels steady."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            183
          ],
          "items": [
            "Usually 50–100 mg a day."
          ]
        }
      ],
      flags: [
        "Most adverse effects, contraindications and interactions are given in the book for propranolol (the prototype beta blocker), with differences for heart-selective drugs noted."
      ],
      review: "unreviewed"
    },

    {
      id: "metoprolol",
      name: "Metoprolol",
      aliases: ["Beta blocker", "β blocker"],
      brands: ["Betaloc", "Lopresor", "Metolar", "Metpure-XL"],
      drugClass: "Beta blocker — selective for the heart (β1)",
      summary: "The model heart-selective beta blocker, used for high blood pressure, angina and heart failure. It is less likely to worsen asthma than propranolol, though not entirely safe, and is preferred in people with diabetes.",
      sections: {
        uses: {
          pages: [149],
          items: [
            "High blood pressure, angina and heart failure (by mouth).",
            "Heart attack (by injection, if the heart rate is not slow)."
          ]
        },
        sideEffects: {
          pages: [147, 149],
          items: [
            "Milder than propranolol.",
            "As for beta blockers: slow heart rate, tiredness, cold hands and feet (less common than with propranolol)."
          ]
        },
        contraindications: {
          pages: [147],
          items: ["Heart block; asthma and COPD should usually be avoided."]
        },
        warnings: {
          pages: [147, 149],
          items: [
            "Do not stop suddenly after long use.",
            "Some people break it down slowly (genetic CYP2D6 variant) and may need lower doses."
          ]
        },
        dosage: {
          pages: [148, 149],
          items: ["100–400 mg a day; the single-enantiomer form (S-metoprolol) at 12.5–50 mg once or twice daily."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            183
          ],
          "items": [
            "Sustained-release metoprolol reduces deaths in heart failure and is particularly useful in people with both high blood pressure and heart failure."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            183
          ],
          "items": [
            "Being heart-selective helps in asthma, diabetes and poor leg circulation, but the risk of narrowing the airways is still significant. Do not stop suddenly."
          ]
        }
      ],
      flags: [
        "General beta-blocker warnings are described in the book for propranolol."
      ],
      review: "unreviewed"
    },

    {
      id: "enalapril",
      name: "Enalapril",
      aliases: ["ACE inhibitor"],
      brands: ["Enapril", "Envas", "Enam"],
      drugClass: "ACE inhibitor — lowers blood pressure",
      summary: "An ACE inhibitor for high blood pressure and heart failure. Compared with captopril it is more potent, works once daily for most people, is not affected by food and is less likely to cause a sudden drop in blood pressure with the first dose.",
      sections: {
        uses: {
          pages: [503, 507],
          items: [
            "High blood pressure (all grades), alone or with a diuretic or beta blocker.",
            "Heart failure (ACE inhibitors are the first-choice drugs) and after a heart attack.",
            "Protecting the kidneys in diabetic kidney disease."
          ]
        },
        sideEffects: {
          pages: [501, 502],
          items: [
            "Persistent dry cough in 4–16% of people, often needing a change of medicine (it settles within days of stopping).",
            "Low blood pressure, especially at the start in people on diuretics or with heart failure.",
            "High potassium, mainly with kidney problems or potassium-sparing diuretics.",
            "Rashes; headache, dizziness, nausea; taste changes.",
            "Angioedema (swelling of lips, mouth or throat) — rare but can block the airway: seek urgent help."
          ]
        },
        contraindications: {
          pages: [502],
          items: [
            "Pregnancy: can harm or kill the unborn baby — must be stopped when a woman conceives.",
            "Narrowing of the arteries to both kidneys (can cause acute kidney failure)."
          ]
        },
        interactions: {
          pages: [502],
          items: [
            "Diuretics add to the blood-pressure drop (start with a low dose).",
            "NSAIDs reduce its effect; NSAIDs with an ACE inhibitor and a diuretic have caused kidney failure, especially in elderly people.",
            "Potassium supplements or potassium-sparing diuretics can cause high potassium.",
            "Raises lithium levels."
          ]
        },
        dosage: {
          pages: [501, 502],
          items: ["5–20 mg once or twice daily (range 2.5–40 mg/day)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            188
          ],
          "items": [
            "Second and third trimesters of pregnancy (risk of low blood pressure, kidney failure, malformations or death in the baby); first-trimester exposure is also linked to birth defects."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            188
          ],
          "items": [
            "Severe low blood pressure after the first doses in people who are dehydrated, on diuretics or on a low-salt diet. High potassium is more likely with kidney disease or diabetes. Dry cough sometimes with wheezing; angioedema."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            189
          ],
          "items": [
            "Combining an ACE inhibitor with an ARB or aliskiren is not recommended because of harm seen in trials."
          ]
        }
      ],
      flags: [
        "The book describes side effects, interactions and contraindications for captopril and states they are the same for all ACE inhibitors."
      ],
      review: "unreviewed"
    },

    {
      id: "ramipril",
      name: "Ramipril",
      aliases: ["ACE inhibitor"],
      brands: ["Cardace", "Ramiril", "Corpril", "R.Pril"],
      drugClass: "ACE inhibitor — lowers blood pressure",
      summary: "A long-acting ACE inhibitor that spreads widely into body tissues. The book says all ACE inhibitors share the same uses and side effects, with no single one superior.",
      sections: {
        uses: {
          pages: [503, 507],
          items: [
            "High blood pressure.",
            "Heart failure, after a heart attack, and diabetic kidney disease (as for ACE inhibitors)."
          ]
        },
        sideEffects: {
          pages: [501, 502],
          items: [
            "Dry cough, low blood pressure, high potassium, rashes, headache, dizziness.",
            "Angioedema (swelling of lips, mouth or throat) — rare but serious."
          ]
        },
        contraindications: {
          pages: [502],
          items: ["Pregnancy; narrowing of the arteries to both kidneys."]
        },
        interactions: {
          pages: [502],
          items: ["As for ACE inhibitors: diuretics, NSAIDs, potassium supplements and lithium."]
        },
        dosage: {
          pages: [501],
          items: ["1.25–10 mg a day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            188
          ],
          "items": [
            "For ACE inhibitors as a group: second and third trimesters of pregnancy; first-trimester exposure is also linked to birth defects."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            188
          ],
          "items": [
            "For ACE inhibitors as a group: severe low blood pressure after first doses if dehydrated or on diuretics; high potassium (more likely with kidney disease or diabetes); dry cough; angioedema."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            189
          ],
          "items": [
            "Not to be combined with an ARB or aliskiren."
          ]
        }
      ],
      flags: [
        "Side effects, interactions and contraindications are given in the book for ACE inhibitors as a group."
      ],
      review: "unreviewed"
    },

    {
      id: "losartan",
      name: "Losartan",
      aliases: ["ARB", "Angiotensin receptor blocker", "Sartan"],
      brands: ["Losacar", "Tozaar", "Alsartan"],
      drugClass: "Angiotensin receptor blocker (ARB) — lowers blood pressure",
      summary: "A first-line blood-pressure medicine that works like an ACE inhibitor but without the cough. The book notes ARBs are now prescribed more often than ACE inhibitors.",
      sections: {
        uses: {
          pages: [507],
          items: [
            "High blood pressure; approved for stroke prevention in people with high blood pressure and a thickened heart muscle.",
            "Heart failure in people who cannot take ACE inhibitors.",
            "After a heart attack; protecting the kidneys in type 2 diabetes."
          ]
        },
        sideEffects: {
          pages: [506],
          items: [
            "Well tolerated — side effects similar to a placebo.",
            "Can cause low blood pressure and high potassium (first-dose drop is uncommon).",
            "Cough and angioedema are rare; occasional headache, dizziness, weakness, stomach upset."
          ]
        },
        contraindications: {
          pages: [506],
          items: ["Pregnancy (can harm the unborn baby)."]
        },
        warnings: {
          pages: [506],
          items: ["Use a lower dose in liver disease or dehydration."]
        },
        dosage: {
          pages: [506],
          items: ["50 mg once daily (25 mg in liver disease or dehydration); hydrochlorothiazide 12.5–25 mg may be added."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            189
          ],
          "items": [
            "Similar benefits to ACE inhibitors in heart failure and chronic kidney disease; most often used in people who had side effects from an ACE inhibitor."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            189
          ],
          "items": [
            "Side effects are similar to ACE inhibitors, including the danger in pregnancy; cough and angioedema can occur but are uncommon."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            189
          ],
          "items": [
            "Not to be combined with an ACE inhibitor or aliskiren."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "telmisartan",
      name: "Telmisartan",
      aliases: ["ARB", "Angiotensin receptor blocker", "Sartan"],
      brands: ["Telma", "Telsar", "Telvas"],
      drugClass: "Angiotensin receptor blocker (ARB) — lowers blood pressure",
      summary: "An ARB similar to losartan whose effect lasts more than 24 hours.",
      sections: {
        uses: {
          pages: [507],
          items: ["High blood pressure, and the other uses of ARBs (heart failure, after a heart attack, diabetic kidney disease)."]
        },
        sideEffects: {
          pages: [506],
          items: ["As for ARBs: generally well tolerated; low blood pressure and high potassium possible."]
        },
        contraindications: {
          pages: [506],
          items: ["Pregnancy (ARBs can harm the unborn baby)."]
        },
        warnings: {
          pages: [507],
          items: ["Mostly removed through bile — dose reduction is needed in liver disease."]
        },
        dosage: {
          pages: [507],
          items: ["20–80 mg once daily."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            189
          ],
          "items": [
            "For ARBs as a group: similar to ACE inhibitors, including the danger in pregnancy; cough and angioedema are uncommon."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            189
          ],
          "items": [
            "Not to be combined with an ACE inhibitor or aliskiren."
          ]
        }
      ],
      flags: [
        "Side effects and the pregnancy warning are described in the book for losartan/ARBs as a group."
      ],
      review: "unreviewed"
    },

    {
      id: "furosemide",
      name: "Furosemide",
      aliases: ["Frusemide", "Loop diuretic", "Water tablet", "High ceiling diuretic"],
      brands: ["Lasix", "Salinex", "Frusenex"],
      drugClass: "Diuretic (water tablet) — high-ceiling (loop) diuretic",
      summary: "A powerful, fast-acting water tablet used to clear fluid from the body in heart, liver and kidney disease, and in emergencies such as fluid on the lungs.",
      sections: {
        uses: {
          pages: [581, 582],
          items: [
            "Swelling (oedema) from heart, liver or kidney disease — preferred in heart failure for rapid fluid removal; the drug of choice in nephrotic and other resistant oedema and in chronic kidney failure.",
            "Acute fluid on the lungs (pulmonary oedema), given intravenously.",
            "High blood pressure only with kidney failure, heart failure, resistant cases or emergencies (otherwise thiazides are preferred).",
            "Preventing fluid overload during blood transfusion in severe anaemia; high calcium due to cancer (with saline)."
          ]
        },
        sideEffects: {
          pages: [584, 585],
          items: [
            "Low potassium: weakness, tiredness, muscle cramps; heart rhythm problems are the serious risk.",
            "Dehydration and a fall in blood pressure on standing, especially with over-use.",
            "Low sodium in heart-failure patients given vigorous treatment (very thirsty, swelling persists).",
            "Nausea, vomiting, diarrhoea, headache, giddiness, tingling, impotence (occasional).",
            "Hearing loss — rare, mainly at high doses with kidney failure.",
            "Rashes and sun sensitivity, especially in people allergic to sulfonamides; raised uric acid (less than thiazides); low calcium and magnesium with long use."
          ]
        },
        warnings: {
          pages: [584, 585],
          items: [
            "Potassium may need monitoring; extra potassium is needed only when advised (for example after a heart attack, or with digoxin).",
            "Brisk fluid loss in liver cirrhosis can bring on confusion and hepatic coma."
          ]
        },
        dosage: {
          pages: [581],
          items: ["Usually 20–80 mg once daily in the morning; 40–80 mg intravenously for pulmonary oedema."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            263
          ],
          "items": [
            "Hearing loss, usually reversible, mostly with poor kidney function or with other ear-damaging medicines such as aminoglycoside antibiotics.",
            "Raised uric acid and gout attacks.",
            "Severe dehydration; rash and, less often, kidney inflammation (it is a sulfonamide)."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [263],
          "items": [
            "NSAIDs such as indomethacin can weaken its effect, especially in nephrotic syndrome or cirrhosis."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [263, 264],
          "items": [
            "Over-use of any diuretic is dangerous in liver cirrhosis, borderline kidney failure or heart failure. Allergic cross-reaction in people sensitive to sulfonamides appears to be very rare."
          ]
        }
      ],
      flags: [
        "Adverse effects are described in the book for loop and thiazide diuretics together."
      ],
      review: "unreviewed"
    },

    {
      id: "hydrochlorothiazide",
      name: "Hydrochlorothiazide",
      aliases: ["HCTZ", "Thiazide diuretic", "Water tablet"],
      brands: ["Aquazide", "Hydride", "Thiazide", "Esidrex"],
      drugClass: "Diuretic (water tablet) — thiazide",
      summary: "A moderate-strength water tablet that is one of the first-line medicines for high blood pressure. Low doses over short periods are described as remarkably safe.",
      sections: {
        uses: {
          pages: [584],
          items: [
            "High blood pressure (thiazides are first-line drugs; often combined with other blood-pressure medicines).",
            "Mild to moderate swelling (oedema), mainly from heart disease, and as maintenance.",
            "Nephrogenic diabetes insipidus; recurrent calcium kidney stones."
          ]
        },
        sideEffects: {
          pages: [584, 585],
          items: [
            "Low potassium is the most significant problem (weakness, cramps, heart rhythm problems) — rare at low doses.",
            "Dehydration and dizziness on standing with over-use.",
            "Nausea, headache, giddiness, impotence occasionally; rashes and sun sensitivity.",
            "Raised uric acid, blood sugar and blood fats at higher doses (minimal at the low doses now recommended).",
            "Can raise blood calcium; magnesium loss with long use."
          ]
        },
        warnings: {
          pages: [584, 585],
          items: [
            "Ineffective in kidney failure, and may worsen kidney function.",
            "Can raise blood sugar in some people."
          ]
        },
        dosage: {
          pages: [584],
          items: ["12.5–100 mg a day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            265
          ],
          "items": [
            "Low sodium is an important side effect; it can be prevented by a lower dose or limiting water intake.",
            "Thiazides are the diuretics most linked to gout, but one large study found the extra risk (about 1%) only in men under 60.",
            "Raised blood sugar occurs at doses above 50 mg a day and has not been seen at 12.5 mg a day or less.",
            "Rare serious allergic reactions: blood disorders and pancreatitis; occasional sun sensitivity."
          ]
        },
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            264
          ],
          "items": [
            "May modestly reduce the risk of osteoporotic fractures."
          ]
        }
      ],
      flags: [
        "Adverse effects are described in the book for loop and thiazide diuretics together."
      ],
      review: "unreviewed"
    },

    {
      id: "spironolactone",
      name: "Spironolactone",
      aliases: ["Potassium-sparing diuretic", "Aldosterone antagonist"],
      brands: ["Aldactone", "Aldactide", "Lacilactone", "Spiromide"],
      drugClass: "Diuretic — potassium-sparing (aldosterone antagonist)",
      summary: "A weak water tablet that keeps potassium in the body. It is used together with stronger diuretics, in liver cirrhosis with fluid in the abdomen, and in heart failure.",
      sections: {
        uses: {
          pages: [588, 589],
          items: [
            "Preventing potassium loss caused by thiazide and loop diuretics.",
            "Oedema in liver cirrhosis (ascites) and kidney disease, especially resistant oedema.",
            "Add-on for high blood pressure.",
            "Moderate to severe heart failure, where it can slow disease and lower deaths."
          ]
        },
        sideEffects: {
          pages: [589],
          items: [
            "Drowsiness, unsteadiness, confusion, stomach upset and loose motions.",
            "Hormonal effects: breast enlargement, erectile problems or reduced libido in men; breast tenderness or irregular periods in women.",
            "High potassium — the most serious, especially with poor kidney function."
          ]
        },
        contraindications: {
          pages: [589],
          items: ["Peptic ulcer (it may be aggravated)."]
        },
        interactions: {
          pages: [589],
          items: [
            "Potassium supplements: dangerous high potassium.",
            "ACE inhibitors and ARBs: more pronounced high potassium.",
            "Aspirin blocks its action.",
            "Raises digoxin levels."
          ]
        },
        dosage: {
          pages: [588],
          items: ["25–50 mg two to four times a day; maximum 400 mg/day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            266
          ],
          "items": [
            "High potassium can be mild, moderate or life-threatening."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            266
          ],
          "items": [
            "The risk of high potassium rises greatly with kidney disease and with beta blockers, NSAIDs, aliskiren, ACE inhibitors and ARBs."
          ]
        },
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            266
          ],
          "items": [
            "Eplerenone is a similar medicine with far fewer hormonal side effects such as breast enlargement."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "atorvastatin",
      name: "Atorvastatin",
      aliases: ["Statin", "HMG-CoA reductase inhibitor"],
      brands: ["Aztor", "Atorva", "Atorlip"],
      drugClass: "Cholesterol-lowering — statin",
      summary: "The book calls atorvastatin the most popular statin. Statins are the most effective and best-tolerated cholesterol-lowering medicines and reduce heart attacks and deaths in people at risk.",
      sections: {
        uses: {
          pages: [638],
          items: [
            "High LDL ('bad') and total cholesterol, with or without high triglycerides — the first-choice drugs.",
            "High cholesterol due to diabetes or nephrotic syndrome.",
            "Lowering the risk of heart disease, heart attack and stroke (shown in large trials of statins)."
          ]
        },
        sideEffects: {
          pages: [637],
          items: [
            "Remarkably well tolerated overall.",
            "Muscle aches are the commonest (about 10%).",
            "Mild stomach complaints and headache; rashes and sleep problems are uncommon.",
            "Raised liver enzymes (liver damage is rare) — liver function monitoring is recommended.",
            "Serious muscle damage (myopathy, rhabdomyolysis) is rare (under 1 in 1000)."
          ]
        },
        contraindications: {
          pages: [637],
          items: ["Pregnancy (no safety data)."]
        },
        interactions: {
          pages: [637],
          items: [
            "Muscle damage is more common with nicotinic acid, gemfibrozil, ketoconazole, erythromycin, cyclosporine and HIV protease inhibitors.",
            "Fenofibrate interferes least and is preferred if a fibrate is needed; a lower statin dose is advised with a fibrate."
          ]
        },
        warnings: {
          pages: [637],
          items: ["Because of its long action, atorvastatin does not need to be taken at bedtime (unlike most statins)."]
        },
        dosage: {
          pages: [637],
          items: ["10–40 mg a day (maximum 80 mg)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            634
          ],
          "items": [
            "Liver enzymes should be checked at the start, at 1–2 months and then every 6–12 months; stop if they stay above three times normal. Heavy drinking makes liver effects worse.",
            "Use lower doses with caution in liver disease, older people and people of North Asian ancestry.",
            "Statins slightly raise the chance of type 2 diabetes, mainly in people who already had prediabetes.",
            "Report unexplained muscle pain, tenderness or weakness; muscle enzyme (CK) should be checked."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            634
          ],
          "items": [
            "Levels rise (more muscle risk) with macrolide antibiotics, ketoconazole-type antifungals, cyclosporine, some HIV medicines, fibrates, amiodarone and verapamil; drinking more than 1 litre of grapefruit juice a day can also raise levels."
          ]
        },
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            633
          ],
          "items": [
            "Women who are pregnant, breastfeeding or likely to become pregnant."
          ]
        }
      ],
      flags: [
        "Side effects and interactions are given in the book for statins as a group."
      ],
      review: "unreviewed"
    },

    {
      id: "rosuvastatin",
      name: "Rosuvastatin",
      aliases: ["Statin", "HMG-CoA reductase inhibitor"],
      brands: ["Rosuvas", "Rosyn"],
      drugClass: "Cholesterol-lowering — statin",
      summary: "A potent, commonly used statin (10 mg is about equal to 20 mg atorvastatin), useful in severe high cholesterol.",
      sections: {
        uses: {
          pages: [637, 638],
          items: [
            "High LDL and total cholesterol, including severe cases.",
            "Raises HDL ('good') cholesterol more than other statins in people with high triglycerides."
          ]
        },
        sideEffects: {
          pages: [637],
          items: ["As for statins: muscle aches (commonest), mild stomach upset, headache, raised liver enzymes; serious muscle damage is rare."]
        },
        contraindications: {
          pages: [637],
          items: ["Pregnancy."]
        },
        interactions: {
          pages: [637],
          items: [
            "Unlike most statins, it is not mainly broken down by CYP3A4.",
            "Muscle damage risk rises with gemfibrozil and nicotinic acid."
          ]
        },
        dosage: {
          pages: [637],
          items: ["Start with 5 mg once daily, up to 20 mg/day if needed (maximum 40 mg)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            634
          ],
          "items": [
            "Liver tests at the start, at 1–2 months and then every 6–12 months. Lower doses with caution in liver disease, older people and people of North Asian ancestry.",
            "Small increase in type 2 diabetes risk; report unexplained muscle pain or weakness."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            634
          ],
          "items": [
            "Broken down by CYP2C9, so levels may rise with ketoconazole-type antifungals, metronidazole, amiodarone and cimetidine. Rosuvastatin (or pravastatin) is the preferred statin with verapamil, macrolides or cyclosporine, at low doses."
          ]
        },
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            633
          ],
          "items": [
            "Women who are pregnant, breastfeeding or likely to become pregnant."
          ]
        }
      ],
      flags: [
        "Side effects and the pregnancy warning are given in the book for statins as a group."
      ],
      review: "unreviewed"
    },

    {
      id: "clopidogrel",
      name: "Clopidogrel",
      aliases: ["Antiplatelet", "Blood thinner", "P2Y12 blocker"],
      brands: ["Clodrel", "Clopilet", "Deplatt"],
      drugClass: "Antiplatelet drug (P2Y12 receptor blocker)",
      summary: "Stops platelets clumping to prevent clots in heart and brain arteries. Often combined with aspirin after heart attacks and stents; its effect lasts 5–7 days after the last dose.",
      sections: {
        uses: {
          pages: [630, 632],
          items: [
            "An alternative to aspirin in people with coronary artery disease.",
            "With aspirin in unstable angina and some heart attacks (often up to one year), and to stop stented arteries re-narrowing.",
            "Preventing another heart attack and reducing deaths after one."
          ]
        },
        sideEffects: {
          pages: [630, 631],
          items: [
            "Bleeding is the most important; adding aspirin doubled serious bleeding in high-risk stroke patients.",
            "Diarrhoea, upper abdominal pain and rashes.",
            "Blood-count problems (low white cells or platelets) are rare."
          ]
        },
        interactions: {
          pages: [630],
          items: ["Omeprazole reduces its activation and antiplatelet effect."]
        },
        warnings: {
          pages: [630],
          items: [
            "Some people respond poorly because of genetic differences in the liver enzyme that activates it.",
            "It takes about 4 hours to start working and builds up over days."
          ]
        },
        dosage: {
          pages: [631],
          items: ["75 mg once daily."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            620
          ],
          "items": [
            "Approved after a recent heart attack or stroke, in peripheral arterial disease, and with aspirin in unstable angina and heart attacks; standard after coronary stents."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            620
          ],
          "items": [
            "Often started with a single 300 mg loading dose, then 75 mg a day; aspirin 75–325 mg a day is given alongside in heart attacks."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            620
          ],
          "items": [
            "Some people are 'poor metabolisers' because of their CYP2C19 gene and get less protection; the FDA has advised considering a gene test or another medicine for them, though later studies questioned how much this matters.",
            "Medicines that block CYP2C19, such as omeprazole, should be used with caution."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            620
          ],
          "items": [
            "Low white cells are rare; a serious blood disorder (thrombotic thrombocytopenic purpura) has been reported."
          ]
        }
      ],
      flags: [
        "Books differ on how long the effect lasts after stopping: Tripathi says 5–7 days (p. 630), Katzung says 7–10 days (p. 620). Before surgery, follow the surgeon's or doctor's advice."
      ],
      review: "unreviewed"
    },

    {
      id: "warfarin",
      name: "Warfarin",
      aliases: ["Warfarin sodium", "Oral anticoagulant", "Blood thinner"],
      brands: ["Uniwarfin", "Warf-5"],
      drugClass: "Oral anticoagulant (vitamin K antagonist)",
      summary: "The most popular oral blood thinner. It takes 1–3 days to work, its dose must be adjusted with regular INR blood tests, and many medicines change its effect.",
      sections: {
        uses: {
          pages: [622],
          items: [
            "Preventing and treating deep vein thrombosis and pulmonary embolism.",
            "Transient ischaemic attacks, after hip surgery, recurrent clots, arterial disease and artificial heart valves (with different INR targets)."
          ]
        },
        sideEffects: {
          pages: [621, 622],
          items: [
            "Bleeding is the main problem: bruising, nosebleeds, blood in urine or stools; bleeding in the brain or internally can be fatal — more likely when INR is above 4 or interacting medicines are taken.",
            "Hair loss, skin inflammation, diarrhoea; rarely skin necrosis."
          ]
        },
        contraindications: {
          pages: [623],
          items: [
            "Pregnancy: causes birth defects early on (foetal warfarin syndrome), and brain defects, bleeding and death of the baby later.",
            "The same contraindications as heparin apply (see p. 619)."
          ]
        },
        warnings: {
          pages: [622],
          items: [
            "Effect increased by poor nutrition, long antibiotic courses, liver disease, chronic alcoholism and an overactive thyroid.",
            "Effect reduced in pregnancy and nephrotic syndrome; some people are genetically resistant.",
            "Bleeding needs urgent medical care; vitamin K1 is the antidote but takes 6–24 hours to work."
          ]
        },
        interactions: {
          pages: [623],
          items: [
            "Stronger effect (bleeding risk) with broad-spectrum antibiotics, ceftriaxone, aspirin, some sulfonamides, indomethacin, phenytoin, chloramphenicol, erythromycin, celecoxib, cimetidine, allopurinol, amiodarone and metronidazole.",
            "Weaker effect with barbiturates, carbamazepine, rifampin, griseofulvin and oral contraceptives; stopping one of these while on warfarin can cause fatal bleeding.",
            "Habitual liquid paraffin use reduces vitamin K absorption."
          ]
        },
        dosage: {
          pages: [621, 622],
          items: [
            "Loading 5–10 mg, maintenance 2–10 mg once a day at the same time (usually bedtime), adjusted by INR.",
            "Usual INR targets: 2–2.5 (prevention of DVT), 2–3 (treating DVT/embolism), 3–3.5 (recurrent clots, heart valves)."
          ]
        }
      },
      otherBooks: [
        {
          book: "katzung",
          section: "interactions",
          pages: [616],
          items: [
            "Also stronger effect (bleeding risk) with fluconazole, trimethoprim-sulfamethoxazole (co-trimoxazole), disulfiram and third-generation cephalosporins.",
            "Weaker effect with cholestyramine (blocks absorption), extra vitamin K in food or supplements, and the diuretics spironolactone and chlorthalidone.",
            "The book lists paracetamol (acetaminophen), alcohol, benzodiazepines, opioids, indomethacin and most antibiotics as having no significant effect."
          ]
        },
        {
          book: "craig",
          section: "interactions",
          pages: [261],
          items: [
            "Lists paracetamol (acetaminophen), indomethacin, ibuprofen, naproxen, fluoxetine, omeprazole and fluoroquinolone antibiotics among the many drugs that can increase warfarin's effect, and advises checking INR whenever a medicine is started or stopped."
          ]
        },
        {
          book: "katzung",
          section: "warnings",
          pages: [615],
          items: [
            "In the first days warfarin can briefly make clotting more likely, so for an active clot heparin is given alongside it for about 5–7 days.",
            "Skin and tissue death (necrosis) can occur in the first weeks, mainly in people with an inherited protein C deficiency."
          ]
        },
        {
          book: "katzung",
          section: "dosage",
          pages: [615],
          items: [
            "Usually started at 5–10 mg; after about a week most people settle on 5–7 mg a day.",
            "INR target 2–3 for most clots; 2.5–3.5 for some artificial heart valves or other high-risk conditions."
          ]
        },
        {
          book: "katzung",
          section: "uses",
          pages: [616, 617],
          items: ["Newer oral anticoagulants (rivaroxaban, apixaban, edoxaban, dabigatran) are alternatives that need no routine INR tests."]
        }
      ],
      flags: [
        "Books disagree on paracetamol and indomethacin: Tripathi (p. 623) and Craig & Stitzel (p. 261) say indomethacin increases warfarin's effect, and Craig & Stitzel also lists paracetamol; Katzung (p. 616) says neither has a significant effect. A pharmacist should advise.",
        "INR targets differ slightly between Tripathi (3–3.5 for heart valves, p. 622) and Katzung (2.5–3.5, p. 615); current guidance should be checked."
      ],
      review: "unreviewed"
    },

    {
      id: "cetirizine",
      name: "Cetirizine",
      aliases: ["Antihistamine", "H1 blocker", "Second-generation antihistamine"],
      brands: ["Alerid", "Cetzine", "Zirtin", "Sizon"],
      drugClass: "Antihistamine — second-generation H1 blocker",
      summary: "A once-daily antihistamine for allergies. It enters the brain poorly, though many people still feel mildly sleepy, and it works especially well on skin allergies.",
      sections: {
        uses: {
          pages: [166, 167],
          items: [
            "Hay fever and allergic rhinitis (sneezing, runny nose, itchy watering eyes), allergic conjunctivitis.",
            "Hives (urticaria) and atopic dermatitis.",
            "Acute allergic reactions to medicines and foods; as an add-on in seasonal asthma.",
            "Not a substitute for adrenaline in severe allergic reactions (anaphylaxis) or throat swelling."
          ]
        },
        sideEffects: {
          pages: [166],
          items: ["Mild sedation and sleepiness in many people (though much less than older antihistamines)."]
        },
        warnings: {
          pages: [165, 166],
          items: [
            "Take care with driving or machinery if it makes you drowsy.",
            "The book advises caution with antihistamines in pregnancy."
          ]
        },
        interactions: {
          pages: [166, 167],
          items: ["Does not cause heart-rhythm problems with erythromycin or ketoconazole (unlike some older second-generation antihistamines)."]
        },
        dosage: {
          pages: [164],
          items: ["10 mg by mouth (once daily)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            1122
          ],
          "items": [
            "Not for children under 2; check the label for ages 2–11. Avoid combining with alcohol or other sedatives; take care when driving."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            1122
          ],
          "items": [
            "Second-generation antihistamines have minimal dry-mouth-type effects and a lower chance of sleepiness than older ones."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            283
          ],
          "items": [
            "5–10 mg."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "levocetirizine",
      name: "Levocetirizine",
      aliases: ["Antihistamine", "H1 blocker"],
      brands: ["Levosiz", "Levorid", "Teczine", "Levocet"],
      drugClass: "Antihistamine — second-generation H1 blocker",
      summary: "The active form of cetirizine: works at half the dose and appears to cause less sleepiness and fewer side effects.",
      sections: {
        uses: {
          pages: [166, 167],
          items: ["The same allergy uses as cetirizine: hay fever, allergic rhinitis and conjunctivitis, hives, eczema, allergic reactions."]
        },
        sideEffects: {
          pages: [167],
          items: ["Less sedation and fewer other side effects than cetirizine."]
        },
        dosage: {
          pages: [164],
          items: ["5–10 mg by mouth."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            1122
          ],
          "items": [
            "Not for children under 2; check the label for ages 2–11. Avoid combining with alcohol or other sedatives; take care when driving."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "chlorpheniramine",
      name: "Chlorpheniramine",
      aliases: ["Chlorphenamine", "CPM", "Antihistamine", "First-generation antihistamine"],
      brands: ["Piriton", "Cadistin"],
      drugClass: "Antihistamine — first-generation H1 blocker (mildly sedating)",
      summary: "An older allergy medicine, often found in cold and cough remedies. It is classed as mildly sedating among first-generation antihistamines, which commonly cause drowsiness.",
      sections: {
        uses: {
          pages: [167],
          items: [
            "Itching, hives, hay fever, allergic conjunctivitis and swelling of the lips or eyelids.",
            "Not effective in asthma; not a substitute for adrenaline in anaphylaxis."
          ]
        },
        sideEffects: {
          pages: [165],
          items: [
            "Sleepiness, reduced alertness and concentration, light-headedness, poor coordination and fatigue (first-generation antihistamines).",
            "Dry mouth, bowel changes, difficulty passing urine and blurred vision.",
            "Some people become restless and unable to sleep."
          ]
        },
        warnings: {
          pages: [165, 166],
          items: [
            "Do not drive or operate machinery if drowsy; alcohol and other sedatives add to the drowsiness.",
            "Regular use is not advisable in children (may affect learning).",
            "Caution in pregnancy. Overdose causes excitement, hallucinations and seizures."
          ]
        },
        interactions: {
          pages: [165],
          items: ["Adds to the effects of other medicines with anticholinergic action (e.g. atropine, tricyclic antidepressants)."]
        },
        dosage: {
          pages: [164],
          items: ["2–4 mg by mouth (0.1 mg/kg)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            283,
            284,
            1122
          ],
          "items": [
            "Slight sedation; a common ingredient of over-the-counter cold remedies.",
            "Can cause excitability in children; less commonly, convulsions in children, dizziness on standing and allergic reactions."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            284,
            1122
          ],
          "items": [
            "Not for children under 2. Avoid with alcohol or other sedatives; take care when driving. A large overdose resembles atropine poisoning."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            283
          ],
          "items": [
            "4–8 mg (adult)."
          ]
        }
      ],
      flags: [
        "Side effects are described in the book for first-generation antihistamines as a group."
      ],
      review: "unreviewed"
    },

    {
      id: "fexofenadine",
      name: "Fexofenadine",
      aliases: ["Antihistamine", "H1 blocker"],
      brands: ["Allegra", "Altiva", "Fexo"],
      drugClass: "Antihistamine — second-generation H1 blocker (non-sedating)",
      summary: "A non-sedating, once-daily antihistamine that does not enter the brain and does not impair driving.",
      sections: {
        uses: {
          pages: [166],
          items: ["Allergic rhinitis (hay fever) and hives or other skin allergies."]
        },
        sideEffects: {
          pages: [166],
          items: ["Does not cause sleepiness or dry-mouth-type side effects."]
        },
        warnings: {
          pages: [166],
          items: ["Not entirely safe for people with a long QT interval, slow heart rate or low potassium (rare heart-rhythm reports)."]
        },
        dosage: {
          pages: [166],
          items: ["Allergic rhinitis: 120 mg once daily; hives and skin allergies: 180 mg once daily."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            1122
          ],
          "items": [
            "Not for children under 2; check the label for ages 2–11."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            283
          ],
          "items": [
            "60 mg (per dose, adult)."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "salbutamol",
      name: "Salbutamol",
      aliases: ["Albuterol", "Bronchodilator", "Reliever inhaler", "β2 agonist"],
      brands: ["Asthalin", "Ventorlin", "Derihaler", "Croysal", "Salol"],
      drugClass: "Bronchodilator — short-acting selective β2 agonist",
      summary: "The standard 'reliever' for asthma attacks. Inhaled, it opens the airways within 5 minutes and lasts 2–4 hours, but it should not be used on a regular schedule.",
      sections: {
        uses: {
          pages: [223],
          items: [
            "Quick relief and stopping of asthma attacks and wheezing (inhaled).",
            "Tablets/syrup only for people who cannot use inhalers correctly, or as an add-on in severe asthma."
          ]
        },
        sideEffects: {
          pages: [223],
          items: [
            "Muscle tremor (dose-related).",
            "Palpitations, restlessness, nervousness, throat irritation, ankle swelling.",
            "Low potassium is possible."
          ]
        },
        warnings: {
          pages: [223],
          items: [
            "Regular scheduled use does not reduce airway sensitivity and may worsen it; people needing regular treatment should use inhaled steroids (preventers), keeping salbutamol for symptom relief.",
            "Use cautiously with high blood pressure, heart disease or digoxin."
          ]
        },
        dosage: {
          pages: [223],
          items: ["Inhaled 100–200 μg; by mouth 2–4 mg."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            359
          ],
          "items": [
            "Everyone with asthma should have an action plan for a severe attack: up to four puffs every 20 minutes over 1 hour; if there is no improvement after the first four puffs, keep taking it on the way to emergency care."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            351
          ],
          "items": [
            "Tablets mainly cause muscle tremor, nervousness and occasional weakness; they have no advantage over the inhaler and cause more side effects."
          ]
        }
      ],
      flags: [],
      review: "unreviewed"
    },

    {
      id: "montelukast",
      name: "Montelukast",
      aliases: ["Leukotriene antagonist"],
      brands: ["Emlukast", "Montair", "Ventair"],
      drugClass: "Asthma preventer — leukotriene receptor antagonist",
      summary: "A once-daily tablet that helps prevent asthma attacks by blocking leukotrienes. Less effective than inhaled steroids, but may be more acceptable to children; it does not stop an attack in progress.",
      sections: {
        uses: {
          pages: [228],
          items: [
            "Preventing mild-to-moderate asthma, as an alternative to inhaled steroids.",
            "Add-on in severe asthma (may allow a lower steroid dose).",
            "Modestly effective in aspirin-induced and exercise-induced asthma; of no value in COPD."
          ]
        },
        sideEffects: {
          pages: [228],
          items: [
            "Very safe: few side effects such as headache and rashes.",
            "Raised eosinophils and nerve problems are infrequent; a few cases of Churg-Strauss syndrome (vasculitis) reported."
          ]
        },
        warnings: {
          pages: [228],
          items: ["Not for treating an asthma attack — use a reliever inhaler for that."]
        },
        dosage: {
          pages: [229],
          items: ["10 mg once daily in the evening; children 2–5 years 4 mg, 6–14 years 5 mg."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            356
          ],
          "items": [
            "Improves asthma control and reduces attacks, but is not as effective as even low-dose inhaled steroids; particularly useful in aspirin-sensitive asthma. Approved from 12 months of age."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            356
          ],
          "items": [
            "10 mg once a day for adults, 4 mg for children."
          ]
        }
      ],
      flags: [
        "Neuropsychiatric warnings for montelukast were strengthened by regulators after 2013; a reviewer should check current guidance.",
        "Katzung (2018) does not discuss neuropsychiatric side effects either, so the earlier note still needs a reviewer."
      ],
      review: "unreviewed"
    },

    {
      id: "prednisolone",
      name: "Prednisolone",
      aliases: ["Corticosteroid", "Steroid", "Glucocorticoid"],
      brands: ["Deltacortril", "Hostacortin-H", "Wysolone", "Nucort"],
      drugClass: "Corticosteroid (glucocorticoid) — anti-inflammatory and immunosuppressant",
      summary: "A powerful steroid used for many inflammatory, allergic and autoimmune diseases. Short courses are usually safe, but long-term use has serious side effects and it must never be stopped suddenly after more than 2–3 weeks.",
      sections: {
        uses: {
          pages: [288, 290, 291, 292],
          items: [
            "Severe allergic reactions (short courses) — but adrenaline, not a steroid, is life-saving in anaphylaxis.",
            "Asthma attacks and severe asthma; lupus, nephrotic syndrome and other autoimmune or collagen diseases.",
            "Severe rheumatoid arthritis (as an add-on), inflammatory bowel disease flares, severe skin diseases.",
            "Autoimmune blood disorders, myasthenia gravis, Bell's palsy, some eye diseases.",
            "Some cancers (leukaemia, lymphoma) and preventing organ-transplant rejection."
          ]
        },
        sideEffects: {
          pages: [293, 294],
          items: [
            "Long-term use: rounded face and trunk obesity (Cushing's habitus), thin fragile skin, stretch marks, easy bruising.",
            "High blood sugar or new diabetes; raised blood pressure; fluid retention at high doses.",
            "Increased infections (including flare-up of tuberculosis), slow wound healing.",
            "Peptic ulcers (risk doubled), indigestion; muscle weakness.",
            "Bone thinning and fractures (especially elderly), rarely bone death in the hip; cataracts; glaucoma.",
            "Slowed growth in children; mood changes, poor sleep, euphoria, rarely psychosis or depression."
          ]
        },
        contraindications: {
          pages: [294],
          items: ["Relative contraindications (used only when essential, with precautions): peptic ulcer, diabetes, high blood pressure, viral, fungal and other infections including tuberculosis, osteoporosis, herpes eye infection, psychosis, epilepsy, heart failure and kidney failure."]
        },
        warnings: {
          pages: [290, 291, 294],
          items: [
            "Do not stop suddenly after more than 2–3 weeks: the body's own steroid production is suppressed, and sudden stopping can cause adrenal crisis. Doses are reduced gradually.",
            "During infection, injury, surgery or other stress, the dose may need to be increased — tell any doctor you take steroids, for up to a year after stopping.",
            "Taking the whole daily dose in the morning, or on alternate days, causes less suppression.",
            "Pregnancy: prednisolone is considered safer than dexamethasone; long use increases gestational diabetes and pre-eclampsia risk."
          ]
        },
        dosage: {
          pages: [288],
          items: ["5–60 mg/day by mouth (depends entirely on the condition)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            712,
            713
          ],
          "items": [
            "Courses under 2 weeks rarely cause serious harm, but sleeplessness, mood changes (mainly over-excitement) and stomach ulcers can occur within days.",
            "Long-term: depression, cataracts and raised eye pressure (glaucoma) — eye checks are advised; very high doses can cause psychosis."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            713
          ],
          "items": [
            "After more than 2 weeks the body's own steroid production may be suppressed. During minor illness the dose is usually doubled for 24–48 hours, and raised much more for major surgery or injury — on medical advice.",
            "Reduce slowly; full recovery of the body's own steroid production can take 2–12 months after stopping. Stopping too fast can bring back the illness or cause loss of appetite, nausea, tiredness, fever, aches and low blood pressure."
          ]
        }
      ],
      flags: [
        "Side effects, contraindications and withdrawal advice are given in the book for corticosteroids as a group."
      ],
      review: "unreviewed"
    },

    {
      id: "dexamethasone",
      name: "Dexamethasone",
      aliases: ["Corticosteroid", "Steroid", "Glucocorticoid"],
      brands: ["Decadron", "Dexona", "Wymesone", "Decdan"],
      drugClass: "Corticosteroid (glucocorticoid) — very potent, long-acting",
      summary: "A very potent, long-acting steroid (0.75 mg equals about 5 mg prednisolone) that does not cause fluid retention, so it is preferred for brain swelling.",
      sections: {
        uses: {
          pages: [289, 292],
          items: [
            "Inflammatory and allergic conditions.",
            "Brain swelling from tumours or tuberculous meningitis; shock (by injection).",
            "Testing the pituitary-adrenal system; with anti-sickness drugs during chemotherapy."
          ]
        },
        sideEffects: {
          pages: [289, 293, 294],
          items: [
            "Strong suppression of the body's own steroid production.",
            "Long-term steroid side effects: weight gain in face and trunk, high blood sugar, infections, ulcers, bone thinning, cataracts, mood changes."
          ]
        },
        contraindications: {
          pages: [294],
          items: ["Same relative contraindications as other steroids (peptic ulcer, diabetes, infections, etc.)."]
        },
        warnings: {
          pages: [293, 294],
          items: [
            "Not suitable for alternate-day therapy.",
            "Do not stop suddenly after long use.",
            "In pregnancy, prednisolone is considered safer."
          ]
        },
        dosage: {
          pages: [289],
          items: ["0.5–5 mg/day by mouth; 4–20 mg/day by injection for shock or brain swelling."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            712
          ],
          "items": [
            "A large dose reduces sickness from chemotherapy and anaesthesia; large doses are used for brain swelling."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            713
          ],
          "items": [
            "After more than 2 weeks the body's own steroid production may be suppressed; extra steroid cover is needed during illness or surgery, and stopping must be gradual (recovery can take 2–12 months).",
            "Long-acting steroids like dexamethasone suppress growth in children more strongly than the natural hormone."
          ]
        }
      ],
      flags: [
        "General corticosteroid side effects and warnings are described in the book for the whole group."
      ],
      review: "unreviewed"
    },

    {
      id: "levothyroxine",
      name: "Levothyroxine",
      aliases: ["Thyroxine", "L-thyroxine", "T4", "Thyroid hormone"],
      brands: ["Eltroxin", "Roxin", "Thyronorm", "Thyrox"],
      drugClass: "Thyroid hormone replacement",
      summary: "Replaces thyroid hormone when the thyroid is underactive. The dose is individual and adjusted using TSH blood tests; it should be taken on an empty stomach.",
      sections: {
        uses: {
          pages: [251],
          items: [
            "Underactive thyroid (hypothyroidism/myxoedema) — one of the commonest hormone disorders.",
            "Congenital hypothyroidism (cretinism), started as early as possible.",
            "Myxoedema coma (emergency, intravenous); non-toxic goitre.",
            "Subclinical hypothyroidism with TSH above 10 mU/L."
          ]
        },
        warnings: {
          pages: [250, 251],
          items: [
            "Take on an empty stomach: food reduces absorption.",
            "The dose is started low and increased gradually, with adjustments every 4–6 weeks based on TSH.",
            "A higher dose is usually needed in pregnancy."
          ]
        },
        interactions: {
          pages: [250],
          items: [
            "Sucralfate, iron, calcium and proton pump inhibitors reduce its absorption.",
            "Rifampin, phenytoin and carbamazepine speed its breakdown — a higher dose may be needed."
          ]
        },
        dosage: {
          pages: [251],
          items: ["Adult hypothyroidism: often start at 50 μg daily, increasing every 2–3 weeks to 100–200 μg/day, guided by TSH."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            697
          ],
          "items": [
            "Take on an empty stomach, e.g. 60 minutes before meals, 4 hours after meals, or at bedtime. It takes 6–8 weeks for blood levels to settle after a dose change.",
            "Older people with heart disease start very low (12.5–25 mcg a day) and increase slowly; if chest pain (angina) or an irregular heartbeat develops, the dose must be reduced or stopped at once."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            697
          ],
          "items": [
            "Too much thyroxine: nervousness, heat intolerance, palpitations, fast heartbeat or unexplained weight loss in adults; restlessness, poor sleep and fast bone growth in children.",
            "Long-term over-treatment, especially in older people, raises the risk of atrial fibrillation and bone thinning."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            696
          ],
          "items": [
            "Average adult replacement about 1.7 mcg/kg a day (about 125 mcg); people over 65 may need less (about 1.6 mcg/kg)."
          ]
        }
      ],
      flags: [
        "Side effects of excess thyroxine were not in the pages extracted; a reviewer should check pp. 248–252.",
        "Update to the earlier note: Katzung (2018, p. 697) now supplies the signs of too much thyroxine."
      ],
      review: "unreviewed"
    },

    {
      id: "carbimazole",
      name: "Carbimazole",
      aliases: ["Antithyroid drug", "Thioamide"],
      brands: ["Neo Mercazole", "Thyrozole", "Antithyrox"],
      drugClass: "Antithyroid drug (thioamide) — reduces thyroid hormone production",
      summary: "The antithyroid medicine most commonly used in India for an overactive thyroid. Improvement starts after 1–2 weeks or more.",
      sections: {
        uses: {
          pages: [253, 254],
          items: [
            "Overactive thyroid (thyrotoxicosis) in Graves' disease and toxic nodular goitre.",
            "Up to half of Graves' patients go into remission after 1–2 years of treatment.",
            "Preparing patients for thyroid surgery; alongside radioactive iodine."
          ]
        },
        sideEffects: {
          pages: [253],
          items: [
            "Stomach upset, skin rashes and joint pain.",
            "Infrequent: hair loss or greying, loss of taste, fever, liver damage.",
            "Rare but serious: agranulocytosis (loss of infection-fighting white cells), about 1 in 500–1000 — mostly reversible.",
            "Over-treatment can cause an underactive thyroid and goitre (reversible)."
          ]
        },
        warnings: {
          pages: [254],
          items: ["Pregnancy and breastfeeding: low-dose propylthiouracil has traditionally been preferred, though the book notes methimazole has also been found safe in pregnancy."]
        },
        dosage: {
          pages: [253],
          items: ["5–15 mg three times daily initially; maintenance 2.5–10 mg daily in 1–2 doses."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            695
          ],
          "items": [
            "Side effects in 3–12% of people, mostly early: nausea and stomach upset; itchy rash in 4–6%; altered taste or smell.",
            "Agranulocytosis in 0.1–0.5%, more likely in older people and usually within the first 90 days at higher doses; it usually reverses quickly when the medicine is stopped."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            694,
            695
          ],
          "items": [
            "Carbimazole is converted to methimazole in the body. Propylthiouracil is preferred in the first trimester of pregnancy; methimazole has rarely been linked to birth defects. Both are considered safe while breastfeeding."
          ]
        }
      ],
      flags: [
        "Because agranulocytosis is serious, a reviewer may wish to add standard advice to report sore throat or fever promptly (not stated in the extracted pages)."
      ],
      review: "unreviewed"
    },

    {
      id: "diazepam",
      name: "Diazepam",
      aliases: ["Benzodiazepine", "BZD"],
      brands: ["Valium", "Calmpose", "Placidox"],
      drugClass: "Benzodiazepine — anxiolytic, sedative, anticonvulsant, muscle relaxant",
      summary: "The oldest 'all-purpose' benzodiazepine, used for anxiety, sleep, muscle spasm, before operations and to stop seizures in emergencies. It builds up with regular use.",
      sections: {
        uses: {
          pages: [405],
          items: [
            "Anxiety; insomnia with anxiety or frequent night waking.",
            "Muscle relaxation; before surgery or procedures.",
            "Emergency control of seizures (injection)."
          ]
        },
        sideEffects: {
          pages: [405, 406],
          items: [
            "Dizziness, unsteadiness, disorientation, memory gaps and slower reactions — do not drive.",
            "Next-day hangover with larger doses; weakness, blurred vision, dry mouth, urinary incontinence.",
            "Older people are more susceptible; can worsen sleep apnoea.",
            "Occasionally paradoxical excitement, irritability or nightmares."
          ]
        },
        warnings: {
          pages: [405, 406],
          items: [
            "Tolerance to the sedative effect develops gradually.",
            "Withdrawal after regular use can cause anxiety, insomnia, restlessness and bad dreams; agitation, tremor or delirium occasionally; seizures rarely.",
            "Given during labour it can cause floppiness and breathing problems in the newborn."
          ]
        },
        interactions: {
          pages: [406],
          items: [
            "Alcohol and other sedatives: dangerous excessive impairment.",
            "Ketoconazole, erythromycin, cimetidine, isoniazid and oral contraceptives prolong its action.",
            "Psychotic symptoms have occurred with sodium valproate."
          ]
        },
        dosage: {
          pages: [405],
          items: ["As a sleeping aid: 5–10 mg."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            389,
            392
          ],
          "items": [
            "Most sedatives, including benzodiazepines, can cause physical dependence with long-term use; stopping can cause anxiety, insomnia and, at worst, seizures.",
            "Older people are more sensitive: about half the adult dose is safer and usually as effective. Over-use is the most common reversible cause of confusion in older people.",
            "Can worsen breathing in chronic lung disease and sleep apnoea. Sleep-walking or sleep-driving with no memory has been reported."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            391,
            392
          ],
          "items": [
            "Avoid alcohol and over-the-counter products containing antihistamines; most serious overdoses involve alcohol or other sedatives."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            391
          ],
          "items": [
            "For anxiety: 5 mg twice a day."
          ]
        }
      ],
      flags: [
        "The book (2013) rates the dependence liability of benzodiazepines as low; current guidance places more emphasis on dependence with regular use. Reviewer should check.",
        "Update to the earlier note: Katzung (2018, p. 389) states benzodiazepines can cause physical dependence with long-term use."
      ],
      review: "unreviewed"
    },

    {
      id: "alprazolam",
      name: "Alprazolam",
      aliases: ["Benzodiazepine", "BZD"],
      brands: [],
      drugClass: "Benzodiazepine — anxiolytic",
      summary: "A potent, intermediate-acting benzodiazepine mainly for anxiety disorders, also used at night for sleep. Stopping after regular use has produced relatively marked withdrawal symptoms.",
      sections: {
        uses: {
          pages: [405],
          items: [
            "Anxiety disorders (main use).",
            "Night-time sleep aid, with few next-day effects; difficulty falling asleep."
          ]
        },
        sideEffects: {
          pages: [405, 406],
          items: [
            "As for benzodiazepines: dizziness, unsteadiness, memory gaps, slowed reactions (do not drive), weakness, dry mouth.",
            "Older people are more susceptible."
          ]
        },
        warnings: {
          pages: [405, 406],
          items: [
            "Relatively marked withdrawal symptoms after regular use — stop only gradually, on medical advice.",
            "Can worsen sleep apnoea."
          ]
        },
        interactions: {
          pages: [406],
          items: [
            "Alcohol and other sedatives: excessive impairment.",
            "CYP3A4 inhibitors (ketoconazole, erythromycin) prolong its action."
          ]
        },
        dosage: {
          pages: [405],
          items: ["As a sleeping aid: 0.25–0.5 mg."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            389,
            392
          ],
          "items": [
            "Can cause physical dependence with long-term use. Reported to be more toxic in overdose than other benzodiazepines.",
            "Older people should usually take about half the adult dose."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            391,
            392
          ],
          "items": [
            "Avoid alcohol and over-the-counter products containing antihistamines."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            391
          ],
          "items": [
            "For anxiety: 0.25–0.5 mg two or three times a day."
          ]
        }
      ],
      flags: [
        "Side effects and interactions are given in the book for benzodiazepines as a group.",
        "Brand names were not found in the extracted pages."
      ],
      review: "unreviewed"
    },

    {
      id: "fluoxetine",
      name: "Fluoxetine",
      aliases: ["SSRI", "Antidepressant"],
      brands: ["Fludac", "Flunil", "Flupar", "Prodac"],
      drugClass: "Antidepressant — selective serotonin reuptake inhibitor (SSRI)",
      summary: "The first and longest-acting SSRI antidepressant. SSRIs are first-line for depression because they are safer and better tolerated than older antidepressants; the effect takes weeks to develop.",
      sections: {
        uses: {
          pages: [460, 461],
          items: [
            "Depression (SSRIs are first-line), including prevention of recurrent depression.",
            "Anxiety, phobias and obsessive-compulsive disorder (OCD).",
            "Approved for children 7 years and older with depression or OCD, but only when psychotherapy fails."
          ]
        },
        sideEffects: {
          pages: [460, 461],
          items: [
            "Nausea (common at first, then settles), loose motions.",
            "Nervousness, restlessness, insomnia, poor appetite, headache; agitation and skin reactions more often than other SSRIs.",
            "Sexual problems (delayed ejaculation or orgasm).",
            "Nosebleeds and bruising; more stomach bleeding with NSAIDs.",
            "Little sedation, no weight gain and no effect on heart rhythm in overdose."
          ]
        },
        warnings: {
          pages: [461],
          items: [
            "Slower to start working; not ideal where a rapid effect is needed, and may worsen agitation.",
            "Some people get a discontinuation reaction (tingling, aches, bowel upset, agitation, poor sleep)."
          ]
        },
        interactions: {
          pages: [461],
          items: [
            "Raises levels of tricyclic antidepressants, haloperidol, clozapine, warfarin, beta blockers, some benzodiazepines and carbamazepine.",
            "'Serotonin syndrome' (agitation, rigidity, high temperature, delirium, seizures) with MAO inhibitors, tramadol or pethidine."
          ]
        },
        dosage: {
          pages: [458],
          items: ["20–40 mg a day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            546
          ],
          "items": [
            "FDA warning for all antidepressants: higher risk of suicidal thoughts and gestures (not completed suicides) in people under 25, up to 4% vs about 2% on placebo. Untreated depression is itself a major suicide risk."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            546
          ],
          "items": [
            "At least 30–40% of people on SSRIs report loss of libido, delayed orgasm or reduced arousal."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            549
          ],
          "items": [
            "A strong blocker of the CYP2D6 liver enzyme, so it raises levels of many medicines broken down by it."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            546
          ],
          "items": [
            "Usual range 20–60 mg a day; if there is little benefit after at least 4 weeks, a higher dose may help."
          ]
        }
      ],
      flags: [
        "Most side effects and interactions are given in the book for SSRIs as a group.",
        "Upper dose differs: Tripathi 20–40 mg a day (p. 458), Katzung 20–60 mg a day (p. 546)."
      ],
      review: "unreviewed"
    },

    {
      id: "sertraline",
      name: "Sertraline",
      aliases: ["SSRI", "Antidepressant"],
      brands: ["Serenata", "Serlin", "Sertil"],
      drugClass: "Antidepressant — selective serotonin reuptake inhibitor (SSRI)",
      summary: "A popular SSRI: in trials fewer people stopped it because of side effects, and it is less likely than some SSRIs to interact with other medicines.",
      sections: {
        uses: {
          pages: [461],
          items: [
            "Depression, including in young people.",
            "Anxiety and post-traumatic stress disorder (PTSD)."
          ]
        },
        sideEffects: {
          pages: [460, 461],
          items: [
            "As for SSRIs: nausea (settles over time), loose motions, nervousness, insomnia, headache, sexual problems, easier bruising or nosebleeds."
          ]
        },
        interactions: {
          pages: [461],
          items: [
            "Fewer interactions than most SSRIs.",
            "Serotonin syndrome risk with MAO inhibitors, tramadol and pethidine; more stomach bleeding with NSAIDs."
          ]
        },
        dosage: {
          pages: [458],
          items: ["50–150 mg a day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            546,
            547
          ],
          "items": [
            "FDA warning for all antidepressants: higher risk of suicidal thoughts in people under 25.",
            "Stopping suddenly can cause a discontinuation syndrome (dizziness, tingling and other symptoms) starting 1–2 days later and lasting a week or more."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            546
          ],
          "items": [
            "Usual range 50–200 mg a day."
          ]
        }
      ],
      flags: [
        "Side effects are given in the book for SSRIs as a group.",
        "Upper dose differs: Tripathi 50–150 mg a day (p. 458), Katzung 50–200 mg a day (p. 546)."
      ],
      review: "unreviewed"
    },

    {
      id: "escitalopram",
      name: "Escitalopram",
      aliases: ["SSRI", "Antidepressant"],
      brands: ["Esdep", "Feliz-S"],
      drugClass: "Antidepressant — selective serotonin reuptake inhibitor (SSRI)",
      summary: "The active form of citalopram, effective at half the dose with milder side effects and improved safety.",
      sections: {
        uses: {
          pages: [460, 461],
          items: ["Depression; anxiety and related disorders (as for SSRIs)."]
        },
        sideEffects: {
          pages: [460, 461],
          items: ["Milder than citalopram; as for SSRIs: nausea, loose motions, nervousness, insomnia, sexual problems."]
        },
        interactions: {
          pages: [461],
          items: ["Serotonin syndrome risk with MAO inhibitors, tramadol and pethidine; more stomach bleeding with NSAIDs."]
        },
        dosage: {
          pages: [458],
          items: ["10–20 mg a day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            546
          ],
          "items": [
            "FDA warning for all antidepressants: higher risk of suicidal thoughts in people under 25."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            546
          ],
          "items": [
            "Usual range 10–30 mg a day."
          ]
        }
      ],
      flags: [
        "Side effects and interactions are given in the book for SSRIs as a group.",
        "Upper dose differs: Tripathi 10–20 mg a day (p. 458), Katzung 10–30 mg a day (p. 546)."
      ],
      review: "unreviewed"
    },

    {
      id: "amitriptyline",
      name: "Amitriptyline",
      aliases: ["Tricyclic antidepressant", "TCA"],
      brands: ["Amline", "Sarotena", "Tryptomer"],
      drugClass: "Antidepressant — tricyclic (TCA)",
      summary: "An older, strongly sedating tricyclic antidepressant. Side effects are common and overdose is particularly dangerous, which is why newer antidepressants are now first-line.",
      sections: {
        uses: {
          pages: [459, 460],
          items: ["Depression (now mostly second-line after SSRIs and newer drugs)."]
        },
        sideEffects: {
          pages: [457, 458, 459],
          items: [
            "Dry mouth, bad taste, constipation, difficulty passing urine (especially men with enlarged prostate), blurred vision, palpitations.",
            "Strong sedation, confusion and weakness.",
            "Increased appetite and weight gain; sweating and tremor.",
            "Dizziness on standing (especially older people); sexual problems.",
            "Lowers the seizure threshold; heart rhythm problems, especially with heart disease."
          ]
        },
        warnings: {
          pages: [459],
          items: [
            "Overdose is particularly dangerous (heart rhythm problems, seizures, coma) — the book singles out amitriptyline and dosulepin.",
            "Some people switch abruptly into agitation or mania (possible bipolar disorder).",
            "Stop gradually after long use."
          ]
        },
        interactions: {
          pages: [459, 460],
          items: [
            "Increases the effect of alcohol, antihistamines and other sedatives.",
            "Increases the effect of adrenaline-type decongestants; avoid local anaesthetics containing adrenaline.",
            "SSRIs can raise its levels to dangerous toxicity; MAO inhibitors can cause a dangerous hypertensive crisis.",
            "Blocks the effect of clonidine; carbamazepine speeds its breakdown."
          ]
        },
        dosage: {
          pages: [458],
          items: ["50–200 mg a day (often once daily at bedtime in the maintenance phase)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [546, 547],
          "items": [
            "About 1500 mg (less than a week's supply at depression doses) can be fatal; 100 mg is likely to poison a toddler. Store safely.",
            "Stopping causes a marked discontinuation syndrome with flu-like symptoms; reduce gradually.",
            "FDA warning for all antidepressants: higher risk of suicidal thoughts in people under 25."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            546
          ],
          "items": [
            "Usual range for depression 150–300 mg a day."
          ]
        }
      ],
      flags: [
        "Side effects and interactions are given in the book for tricyclic antidepressants as a group, with amitriptyline rated among the most sedating and anticholinergic.",
        "Dose range differs: Tripathi 50–200 mg a day (p. 458), Katzung 150–300 mg a day (p. 546)."
      ],
      review: "unreviewed"
    },

    {
      id: "phenytoin",
      name: "Phenytoin",
      aliases: ["Diphenylhydantoin", "Antiepileptic", "Anticonvulsant"],
      brands: ["Dilantin", "Epsolin", "Eptoin", "Fentoin-ER"],
      drugClass: "Antiepileptic (anticonvulsant)",
      summary: "A first-line epilepsy medicine, now used less because side effects are frequent and a small dose increase can cause a steep rise in blood levels and toxicity. Blood-level monitoring helps.",
      sections: {
        uses: {
          pages: [415],
          items: [
            "Generalised tonic-clonic seizures and simple or complex partial seizures (not absence seizures).",
            "Status epilepticus (now mostly replaced by fosphenytoin).",
            "Trigeminal neuralgia (second choice after carbamazepine)."
          ]
        },
        sideEffects: {
          pages: [414, 415],
          items: [
            "Gum overgrowth (commonest, about 20%) — good oral hygiene helps.",
            "Excess hair growth, coarse facial features, acne.",
            "Rashes and other allergic reactions; anaemia from folate loss; bone softening (vitamin D effect); raised blood sugar.",
            "At high levels: unsteadiness, vertigo, double vision, abnormal eye movements, drowsiness, confusion, nausea (take with meals)."
          ]
        },
        contraindications: {
          pages: [414],
          items: ["Pregnancy: can cause 'foetal hydantoin syndrome' (cleft lip and palate, small head, finger defects)."]
        },
        interactions: {
          pages: [415],
          items: [
            "Makes oral contraceptives fail; reduces the effect of doxycycline and theophylline.",
            "Chloramphenicol, isoniazid, cimetidine, warfarin and valproate can raise its levels to toxicity.",
            "Complex two-way interactions with phenobarbitone and carbamazepine; sucralfate reduces absorption."
          ]
        },
        dosage: {
          pages: [415],
          items: ["100 mg twice daily, maximum 400 mg/day; children 5–8 mg/kg/day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            418
          ],
          "items": [
            "Can make absence seizures, juvenile myoclonic epilepsy and Dravet syndrome worse."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            419
          ],
          "items": [
            "Early signs such as jerky eye movements are not a reason to lower the dose; double vision and unsteadiness are the usual signs the dose is too high.",
            "Gum overgrowth and excess hair growth occur to some degree in most patients."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            418,
            419
          ],
          "items": [
            "Valproate, sulfonamides and low albumin (liver or kidney disease) raise the active (free) level, so toxicity can occur even when the measured level looks normal.",
            "Speeds up the breakdown of many other epilepsy medicines, including valproate, lamotrigine, topiramate and many benzodiazepines."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            419
          ],
          "items": [
            "Adults often start at 300 mg a day; usual blood level 10–20 mcg/mL.",
            "Increases should be no more than 25–30 mg a day at a time, because a small increase can cause a large rise in level; going straight from 300 to 400 mg a day is a common cause of toxicity.",
            "It can take 5–7 days, or up to 4–6 weeks at higher levels, to settle after a dose change. Children: about 5 mg/kg a day, then adjusted by blood level."
          ]
        }
      ],
      flags: [
        "Books differ on how common gum overgrowth is: Tripathi says about 20% (p. 414); Katzung says it occurs to some degree in most patients (p. 419)."
      ],
      review: "unreviewed"
    },

    {
      id: "carbamazepine",
      name: "Carbamazepine",
      aliases: ["Antiepileptic", "Anticonvulsant"],
      brands: ["Tegretol", "Mazetol", "Carbatol", "Tegrital CR"],
      drugClass: "Antiepileptic (anticonvulsant); also mood stabiliser",
      summary: "A first-line epilepsy medicine and the drug of choice for trigeminal neuralgia. Slow-release tablets are preferred to avoid high and low blood levels.",
      sections: {
        uses: {
          pages: [416],
          items: [
            "Complex partial seizures (most effective), and generalised tonic-clonic and simple partial seizures.",
            "Trigeminal neuralgia (drug of choice; about 60% respond). Not useful for diabetic or other nerve pain.",
            "Mania and bipolar disorder, as an alternative to lithium."
          ]
        },
        sideEffects: {
          pages: [416],
          items: [
            "Dose-related: sedation, dizziness, vertigo, double vision, unsteadiness; vomiting and diarrhoea at higher doses.",
            "Allergic reactions: rashes, sun sensitivity, hepatitis, lupus-like illness; low white-cell counts; rarely aplastic anaemia.",
            "Water retention and low sodium in elderly people."
          ]
        },
        warnings: {
          pages: [416],
          items: ["Pregnancy: increased minor foetal malformations; combining with valproate doubles the risk."]
        },
        interactions: {
          pages: [416],
          items: [
            "Reduces the effect of oral contraceptives, haloperidol, lamotrigine, valproate and topiramate.",
            "Erythromycin, fluoxetine and isoniazid raise its levels; phenobarbitone and phenytoin lower them."
          ]
        },
        dosage: {
          pages: [416],
          items: ["200–400 mg three times a day; children 15–30 mg/kg/day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            417
          ],
          "items": [
            "Stevens-Johnson syndrome (a severe skin reaction) is rare but much more likely with the HLA-B*1502 gene; people of Asian ancestry, who have about a 10-fold higher risk, should be tested before starting."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            417
          ],
          "items": [
            "Double vision may appear at the same time each day and can often be fixed by spreading the doses differently.",
            "A mild, harmless drop in white cells is common; it usually does not mean the medicine must be stopped."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            416,
            417
          ],
          "items": [
            "Speeds up its own breakdown over the first weeks, and that of phenytoin, valproate, clonazepam and other epilepsy medicines; valproate can raise carbamazepine levels."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            416
          ],
          "items": [
            "Adults usually 800–1200 mg a day in divided doses, maximum 1600 mg; children 15–25 mg/kg a day. Start low and increase slowly; extended-release tablets allow twice-daily dosing."
          ]
        }
      ],
      flags: [
        "Serious skin reactions linked to genetic markers (relevant to some Asian populations) are emphasised in later guidance; a reviewer should check.",
        "Update to the earlier note: Katzung (2018, p. 417) confirms HLA-B*1502 testing before starting in people of Asian ancestry."
      ],
      review: "unreviewed"
    },

    {
      id: "valproate",
      name: "Sodium valproate",
      aliases: ["Valproic acid", "Valproate", "Divalproex", "Antiepileptic"],
      brands: ["Valparin Chrono", "Encorate", "Diproex", "Valance", "Depakote"],
      drugClass: "Antiepileptic (broad spectrum); mood stabiliser",
      summary: "A broad-spectrum epilepsy medicine with little sedation. It is the drug of choice for absence and myoclonic seizures, but must be avoided in pregnancy.",
      sections: {
        uses: {
          pages: [417, 418],
          items: [
            "Absence seizures and myoclonic/atonic seizures (drug of choice).",
            "Generalised tonic-clonic and partial seizures (alternative or add-on).",
            "Mania and bipolar disorder (alternative to lithium); some benefit in preventing migraine."
          ]
        },
        sideEffects: {
          pages: [417],
          items: [
            "Common but mild: poor appetite, vomiting, loose motions, heartburn.",
            "Dose-related drowsiness, unsteadiness, tremor.",
            "Hair loss or curling, weight gain, easier bleeding.",
            "Raised liver enzymes (monitoring advised); pancreatitis reported.",
            "Long-term use in young girls: polycystic ovaries and irregular periods."
          ]
        },
        contraindications: {
          pages: [417, 418],
          items: [
            "Pregnancy: causes spina bifida and other neural tube defects — should be avoided.",
            "Must not be combined with clonazepam (can trigger absence status)."
          ]
        },
        warnings: {
          pages: [417],
          items: ["Rare but serious fulminant hepatitis, only in children (especially under 3), more likely with liver disease or other anticonvulsants."]
        },
        interactions: {
          pages: [418],
          items: [
            "Raises levels of phenobarbitone and lamotrigine; causes phenytoin toxicity.",
            "Increases carbamazepine's active metabolite; birth defects are more common when combined with carbamazepine."
          ]
        },
        dosage: {
          pages: [417],
          items: ["Adults: start 200 mg three times a day, maximum 800 mg three times a day; children 15–30 mg/kg/day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            426
          ],
          "items": [
            "First choice for people with several types of generalised seizures; also used for focal seizures, status epilepticus (by injection), bipolar disorder and migraine prevention."
          ]
        },
        {
          "book": "katzung",
          "section": "contraindications",
          "pages": [
            426,
            427
          ],
          "items": [
            "A known cause of birth defects: its use is avoided in women who could become pregnant.",
            "Must not be used by people with inherited urea-cycle disorders (risk of fatal high ammonia)."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            427
          ],
          "items": [
            "Raised blood ammonia can cause drowsiness or confusion.",
            "Low platelet counts can occur.",
            "In pregnancy: about 1–2% risk of spina bifida in the first trimester, plus heart, face and finger defects and later learning problems in the child."
          ]
        },
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            427
          ],
          "items": [
            "Serious liver damage is rare; the risk is greatest under 2 years of age and with several medicines, and most deaths occurred within the first 4 months."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            427
          ],
          "items": [
            "Started at about 15 mg/kg a day and raised slowly; some people need 25–30 mg/kg a day, others 60 mg/kg or more. Taking it after meals can reduce stomach upset."
          ]
        }
      ],
      flags: [
        "Pregnancy-prevention requirements for valproate were greatly strengthened by regulators after 2013; a reviewer should check current guidance.",
        "Books differ on liver damage: Tripathi says fulminant hepatitis occurs only in children, especially under 3 (p. 417); Katzung says the risk is greatest under 2 and with several medicines, without limiting it to children (p. 427)."
      ],
      review: "unreviewed"
    },

    {
      id: "levetiracetam",
      name: "Levetiracetam",
      aliases: ["Antiepileptic", "Anticonvulsant"],
      brands: ["Levorexa", "Torleva", "Levtam"],
      drugClass: "Antiepileptic (anticonvulsant)",
      summary: "A well-tolerated epilepsy medicine that is free of drug interactions, increasingly used, mainly as an add-on.",
      sections: {
        uses: {
          pages: [420],
          items: [
            "Partial seizures (with or without generalisation), alone or as add-on.",
            "Generalised tonic-clonic and myoclonic epilepsy (mainly add-on)."
          ]
        },
        sideEffects: {
          pages: [420],
          items: ["Few: sleepiness, dizziness, weakness; rarely behavioural changes."]
        },
        contraindications: {
          pages: [420],
          items: ["Not approved for children under 4 years (as stated in the book)."]
        },
        warnings: {
          pages: [420],
          items: ["Driving may be impaired."]
        },
        interactions: {
          pages: [420],
          items: ["Free of drug interactions (not processed by or affecting liver CYP enzymes)."]
        },
        dosage: {
          pages: [420],
          items: ["0.5 g twice daily, increasing to 1 g twice daily (maximum 3 g/day); children 4–15 years 10–30 mg/kg/day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            423
          ],
          "items": [
            "Sleepiness, weakness, unsteadiness, colds and dizziness. Less common but more serious: mood and behaviour changes such as irritability, aggression, agitation, anxiety and depression."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            423
          ],
          "items": [
            "Increased every 2–4 weeks by 1000 mg a day up to 3000 mg a day, in two doses. Mostly removed by the kidneys."
          ]
        }
      ],
      flags: [
        "The paediatric age limit reflects the 2013 book; approvals may have changed."
      ],
      review: "unreviewed"
    },

    {
      id: "pregabalin",
      name: "Pregabalin",
      aliases: ["Gabapentinoid"],
      brands: ["Pregaba", "Neugaba", "Truegaba"],
      drugClass: "Antiepileptic; used for nerve pain",
      summary: "A newer relative of gabapentin, particularly used for nerve (neuropathic) pain.",
      sections: {
        uses: {
          pages: [420],
          items: [
            "Nerve pain: diabetic neuropathy, pain after shingles, complex regional pain syndrome and some other chronic pain.",
            "Seizure disorders (similar to gabapentin)."
          ]
        },
        sideEffects: {
          pages: [420],
          items: ["Poor concentration, rashes and allergic reactions; sedation is claimed to be less than gabapentin."]
        },
        dosage: {
          pages: [420],
          items: ["75–150 mg twice daily, maximum 600 mg/day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            420
          ],
          "items": [
            "Focal seizures, nerve pain (after shingles, diabetic), anxiety disorders and fibromyalgia."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            420
          ],
          "items": [
            "Sleepiness, dizziness, unsteadiness, headache and tremor, mostly at the start; weight gain and ankle swelling."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            420
          ],
          "items": [
            "Start at 150 mg a day (or 50–75 mg to avoid early side effects); usual range 150–600 mg a day."
          ]
        }
      ],
      flags: [
        "Misuse and dependence concerns about pregabalin have grown since 2013; a reviewer should check current guidance.",
        "Katzung (2018) does not discuss misuse either, so the earlier note still needs a reviewer."
      ],
      review: "unreviewed"
    },

    {
      id: "ferrous-sulfate",
      name: "Ferrous sulfate (oral iron)",
      aliases: ["Iron", "Iron tablets", "Ferrous sulphate", "Ferrous fumarate", "Ferrous gluconate", "Haematinic"],
      brands: ["Fersolate", "Ferronicum", "Nori-A", "Ferri drops"],
      drugClass: "Haematinic — iron supplement",
      summary: "Treats and prevents iron-deficiency anaemia. Ferrous sulfate is the cheapest form; what matters is the amount of elemental iron, not the brand or iron compound.",
      sections: {
        uses: {
          pages: [603, 604],
          items: [
            "Iron-deficiency anaemia (treatment) and prevention when needs are high.",
            "Iron injections are used only when tablets are not tolerated or not absorbed, are not taken reliably, with severe ongoing bleeding, or with erythropoietin."
          ]
        },
        sideEffects: {
          pages: [603],
          items: [
            "Common at treatment doses: upper abdominal pain, heartburn, nausea, vomiting, bloating, colic, metallic taste.",
            "Constipation (with stomach irritation, the most important side effects).",
            "Liquid forms may stain teeth — place on the back of the tongue and swallow."
          ]
        },
        warnings: {
          pages: [603],
          items: [
            "Absorbed best on an empty stomach, but side effects are then greater; starting low and increasing gradually improves tolerance.",
            "The book considers combination tonics with many vitamins and minerals, and sustained-release iron, irrational and more expensive."
          ]
        },
        interactions: {
          pages: [250, 653, 735],
          items: [
            "Iron reduces absorption of tetracyclines (including doxycycline) and levothyroxine.",
            "Acid-reducing medicines (PPIs) reduce iron absorption."
          ]
        },
        dosage: {
          pages: [603],
          items: [
            "Treatment: a total of 200 mg elemental iron daily in 3 divided doses (infants and children 3–5 mg/kg).",
            "Prevention: 30 mg elemental iron daily."
          ]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            596
          ],
          "items": [
            "As few as 10 iron tablets can kill a young child. Keep iron in child-proof containers out of reach; a child who swallows iron needs urgent treatment."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            595
          ],
          "items": [
            "Black stools are expected; they are harmless but can hide bleeding from the gut. Nausea, cramps, constipation or diarrhoea often improve with a lower dose, taking it with food, or a different iron salt."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            595
          ],
          "items": [
            "200–400 mg elemental iron a day for fastest correction (lower doses work more slowly); continue for 3–6 months after the cause is corrected, to refill stores."
          ]
        }
      ],
      flags: [
        "Interactions are collected from the pages for the other medicines involved (pp. 250, 653, 735)."
      ],
      review: "unreviewed"
    },

    {
      id: "folic-acid",
      name: "Folic acid",
      aliases: ["Folate", "Vitamin B9"],
      brands: ["Folvite", "Folitab"],
      drugClass: "Vitamin (B group) — haematinic",
      summary: "A B vitamin needed to make blood cells and DNA. It treats folate-deficiency anaemia and is recommended in pregnancy to reduce the risk of spina bifida.",
      sections: {
        uses: {
          pages: [610],
          items: [
            "Megaloblastic anaemia due to folate deficiency (poor diet, malabsorption, alcoholism).",
            "Increased need: pregnancy, breastfeeding, infancy, haemolytic anaemias, during treatment of severe iron deficiency.",
            "Anaemia caused by long-term phenytoin or phenobarbitone.",
            "Routine 1 mg/day in pregnancy to reduce neural tube defects (spina bifida) in the baby."
          ]
        },
        sideEffects: {
          pages: [611],
          items: ["Oral folic acid is entirely non-toxic; injections rarely cause allergic reactions."]
        },
        warnings: {
          pages: [610],
          items: [
            "Never give folic acid alone to someone with vitamin B12 deficiency: the blood count may improve while nerve damage worsens.",
            "Large doses may reduce the effect of antiepileptic medicines."
          ]
        },
        dosage: {
          pages: [610],
          items: ["Treatment: 2–5 mg/day; prevention: 0.5 mg/day."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "uses",
          "pages": [
            599,
            600
          ],
          "items": [
            "Countries that add folic acid to grain products have seen 20–25% fewer neural tube defects. Supplements should be considered in pregnancy and other high-risk groups. Long-term phenytoin, methotrexate and trimethoprim can cause folate deficiency."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            600
          ],
          "items": [
            "1 mg a day by mouth is enough to correct folate-deficiency anaemia and refill stores in almost all patients; injections are rarely needed."
          ]
        }
      ],
      flags: [
        "Treatment dose differs: Tripathi 2–5 mg a day (p. 610), Katzung 1 mg a day (p. 600)."
      ],
      review: "unreviewed"
    },

    {
      id: "allopurinol",
      name: "Allopurinol",
      aliases: ["Xanthine oxidase inhibitor", "Gout medicine"],
      brands: ["Zyloric", "Zyloprim", "Ciploric"],
      drugClass: "Anti-gout — reduces uric acid production (xanthine oxidase inhibitor)",
      summary: "The first-choice medicine for long-term (chronic) gout. It lowers uric acid production; with long use, gout lumps (tophi) slowly disappear.",
      sections: {
        uses: {
          pages: [217],
          items: [
            "Chronic gout (first choice), especially severe cases with tophi or kidney involvement.",
            "High uric acid caused by cancer treatment, radiation, thiazides or other drugs (including prevention)."
          ]
        },
        sideEffects: {
          pages: [217],
          items: [
            "Uncommon. Most frequent: allergic reaction with rash, fever, feeling unwell and muscle pain — settles on stopping.",
            "Stevens-Johnson syndrome (severe skin reaction) is rare but serious.",
            "Infrequent stomach irritation, headache, nausea, dizziness; liver damage is rare."
          ]
        },
        contraindications: {
          pages: [217],
          items: ["Known hypersensitivity, pregnancy and breastfeeding."]
        },
        warnings: {
          pages: [217],
          items: [
            "Do not start during an acute gout attack; attacks are more common in the first 1–2 months, so doctors give NSAID or colchicine cover.",
            "Drink plenty of fluids.",
            "Use cautiously in elderly people, children, and kidney or liver disease (kidney problems increase reactions)."
          ]
        },
        interactions: {
          pages: [216, 217],
          items: [
            "Doses of 6-mercaptopurine and azathioprine must be reduced to one-third.",
            "Increases the effect of warfarin and theophylline.",
            "More rashes with ampicillin."
          ]
        },
        dosage: {
          pages: [217],
          items: ["Start 100 mg once daily, increase gradually to 300 mg/day as needed (maximum 600 mg/day)."]
        }
      },
      otherBooks: [
        {
          "book": "katzung",
          "section": "warnings",
          "pages": [
            662
          ],
          "items": [
            "Colchicine or an NSAID is given during the first months to prevent gout attacks, which can be triggered at the start.",
            "Safety in children and pregnancy has not been established."
          ]
        },
        {
          "book": "katzung",
          "section": "sideEffects",
          "pages": [
            662
          ],
          "items": [
            "Itchy rash in about 3%; rarely severe skin peeling, nerve or blood-vessel inflammation, bone-marrow suppression, liver damage, kidney inflammation, or cataracts."
          ]
        },
        {
          "book": "katzung",
          "section": "interactions",
          "pages": [
            662
          ],
          "items": [
            "Azathioprine and other purine chemotherapy doses must be cut by about 75%. Can increase the effect of cyclophosphamide and of oral anticoagulants."
          ]
        },
        {
          "book": "katzung",
          "section": "dosage",
          "pages": [
            662
          ],
          "items": [
            "Start 50–100 mg a day and increase until blood uric acid is below 6 mg/dL, commonly at 300–400 mg a day."
          ]
        }
      ],
      flags: [
        "Books differ slightly on how much to cut azathioprine or 6-mercaptopurine: Tripathi says to one-third (p. 216), Katzung says by about 75% (p. 662). A prescriber must adjust these."
      ],
      review: "unreviewed"
    }
  ]
};
