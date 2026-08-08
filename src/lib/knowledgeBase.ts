export interface KBSection {
  title: string;
  content: string;
  diagram?: string;
  diagramImage?: string;
}

export interface KBArticle {
  id: string;
  title: string;
  category: string;
  type: "pdf" | "video" | "guide";
  progress: number;
  sections: KBSection[];
}

export const knowledgeBase: KBArticle[] = [
  // === FIRST AID ===
  {
    id: "fa-1",
    title: "Basic First Aid",
    category: "First Aid",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Initial assessment (ABCDE)",
        content: `A — Airway: Check that it's not obstructed. Tilt head, lift chin.\nB — Breathing: Observe chest movement for 10 seconds. Are they breathing?\nC — Circulation: Check carotid pulse. Control bleeding with direct pressure.\nD — Neurological deficit: Do they respond to stimuli? AVPU scale (Alert, Voice, Pain, Unresponsive).\nE — Exposure: Check the entire body for hidden injuries. Prevent hypothermia.`,
      },
      {
        title: "Bleeding control",
        content: `1. Direct pressure: Apply with gauze or clean cloth over the wound for 15 min.\n2. Elevation: If on a limb, raise above heart level.\n3. Tourniquet (last resort): Apply 5-7 cm above the wound. Note the time applied. DO NOT loosen without medical assistance.\n4. Wound packing: For deep wounds, pack with sterile gauze and apply pressure.`,
      },
      {
        title: "Recovery position",
        content: `For an unconscious victim who is breathing:\n1. Kneel beside the victim\n2. Nearest arm at a right angle\n3. Bring the far arm to the near shoulder\n4. Bend the far knee and roll toward you\n5. Adjust the head to keep the airway open\n6. Check breathing every minute`,
        diagramImage:"/test.png",
      },
    ],
  },
  {
    id: "fa-2",
    title: "CPR — Cardiopulmonary Resuscitation",
    category: "First Aid",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "CPR in adults",
        content: `1. Confirm they are unresponsive and not breathing normally\n2. Call emergency services (or send someone)\n3. Place the heel of your hand at the center of the chest\n4. Compress 5-6 cm deep, at a rate of 100-120/min\n5. Give 2 rescue breaths every 30 compressions (if trained)\n6. Do NOT stop until help arrives or the victim moves\n\nTip: match the beat of a well-known upbeat pop song to keep a steady compression rhythm.`,
      },
      {
        title: "CPR in children (1-8 years)",
        content: `Same technique but:\n- Use ONLY ONE hand to compress\n- Depth: 5 cm (one third of the chest)\n- 5 rescue breaths BEFORE starting the 30:2 cycle\n- Compress with the heel of the palm`,
      },
      {
        title: "Using an AED (Defibrillator)",
        content: `1. Turn on the AED and follow the voice instructions\n2. Place pads: one below the right collarbone, another under the left armpit\n3. Do NOT touch the victim while the AED is analyzing\n4. If it indicates a shock: make sure no one is touching the victim and press the button\n5. Resume CPR immediately after the shock\n6. Continue until professional help arrives`,
      },
    ],
  },
  {
    id: "fa-3",
    title: "Fractures and Immobilization",
    category: "First Aid",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Identifying fractures",
        content: `Signs: Intense pain, deformity, swelling, crepitus, inability to move.\nTypes: Closed (skin intact), Open (bone exposed — infection risk).\n\nRULE: When in doubt, treat as a fracture.`,
      },
      {
        title: "Improvised immobilization",
        content: `Materials: Branches, magazines, cardboard, rigid backpacks, cloth, belts.\n\n1. Do NOT attempt to realign the bone\n2. Immobilize the joint ABOVE and BELOW the fracture\n3. Pad between splint and skin\n4. Check distal circulation (pulse, color, sensation)\n5. Recheck every 15 min that it's not too tight`,
      },
    ],
  },
  {
    id: "fa-4",
    title: "Burns and Treatment",
    category: "First Aid",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Burn classification",
        content: `1st Degree: Redness, pain (sunburn). Treat with cool water 10-20 min.\n2nd Degree: Blisters, intense pain. Do NOT pop blisters. Cover with sterile moist gauze.\n3rd Degree: White/charred skin, no pain (nerves destroyed). Medical emergency. Cover with clean, moist cloth.`,
      },
      {
        title: "Field treatment",
        content: `1. Remove from the heat source\n2. Cool with clean running water (NOT ice) for 10-20 minutes\n3. Remove rings, watches, loose clothing before swelling occurs\n4. Cover with sterile gauze or lint-free clean cloth\n5. Do NOT apply: butter, toothpaste, oil\n6. Hydrate the patient (sip water)`,
      },
    ],
  },

  // === BASIC SURVIVAL ===
  {
    id: "sv-1",
    title: "The Rule of 3s — Survival Priorities",
    category: "Survival",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "The rule of 3s",
        content: `3 MINUTES without air\n3 HOURS without shelter (in extreme conditions)\n3 DAYS without water\n3 WEEKS without food\n\nThis rule defines your survival priorities. Always in this order:\n1. Breathing and immediate safety\n2. Shelter and protection from the elements\n3. Drinking water\n4. Food`,
      },
      {
        title: "Survival mindset",
        content: `S — Size up the situation\nU — Undue haste makes waste\nR — Remember where you are\nV — Vanquish fear and panic\nI — Improvise and improve\nV — Value living\nA — Act like the natives\nL — Learn basic skills`,
      },
    ],
  },
  {
    id: "sv-2",
    title: "Water Purification",
    category: "Survival",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Purification methods",
        content: `1. BOILING: At least 1 minute at a rolling boil (3 min at altitudes >2000m). Most reliable method.\n2. TABLETS: Chlorine or iodine. Follow manufacturer's instructions. Wait 30 min.\n3. FILTER: Ceramic or carbon filters. Removes bacteria and protozoa. NOT all remove viruses.\n4. UV: Expose in a clear PET bottle to the sun for 6+ hours (SODIS method).\n5. HOMEMADE CHLORINE: 2 drops of bleach (5%) per liter. Wait 30 min. Should smell slightly of chlorine.`,
      },
      {
        title: "Emergency water sources",
        content: `PREFER: Rainwater, springs, flowing river water.\nAVOID: Stagnant water, puddles near industry, seawater without distillation.\n\nDew collection: Run absorbent cloth over grass at dawn, wring into a container.\nSolar condensation: Dig a hole, place a container in the center, cover with plastic, weigh down center with a stone. Water condenses and drips into the container.`,
      },
    ],
  },
  {
    id: "sv-3",
    title: "Fire — Ignition Techniques",
    category: "Survival",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Fire preparation",
        content: `You need 3 components:\n1. TINDER: Material that ignites easily (lint, birch bark, cotton with petroleum jelly, fine shavings)\n2. KINDLING: Twigs the thickness of a pencil, dry\n3. FUEL: Thicker branches, logs\n\nStructures:\n- Teepee: Tinder in the center, kindling arranged in a cone around it\n- Log cabin: Alternating layers forming a square\n- Star: Logs arranged in a star, pushed toward the center as they burn`,
      },
      {
        title: "Ignition methods without matches",
        content: `1. Flint and steel: Scrape with a knife to create sparks over tinder\n2. Lens: Concentrate sunlight with a magnifying glass, polished can bottom, or water bag\n3. Battery: Connect wires to + and - touching tinder with the contact\n4. Bow drill: Difficult method, requires practice. Soft dry wood + spindle + bow\n5. Emergency kit: Always carry a BIC lighter as backup`,
      },
    ],
  },
  {
    id: "sv-4",
    title: "Navigation Without Technology",
    category: "Survival",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Orientation by the sun",
        content: `Northern Hemisphere:\n- The sun rises in the EAST and sets in the WEST\n- At noon, the shortest shadow points NORTH\n\nWatch method: Point the hour hand toward the sun. The midpoint between the hand and 12 indicates SOUTH.\n\nShadow method: Stick a vertical pole in the ground. Mark the tip of the shadow. Wait 15 min. Mark the new position. The line between both marks runs East-West.`,
      },
      {
        title: "Nighttime orientation",
        content: `North Star (Northern Hemisphere):\n1. Find the Big Dipper (ladle shape)\n2. The two stars at the edge of the dipper point to the North Star\n3. The North Star is above North\n\nSouthern Cross (Southern Hemisphere):\n1. Extend the long axis of the cross 4.5 times\n2. Drop straight down to the horizon: that point is SOUTH`,
      },
    ],
  },

  // === EMERGENCY COMMUNICATIONS ===
  {
    id: "co-1",
    title: "Emergency Radio Frequencies",
    category: "Communications",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Essential frequencies",
        content: `INTERNATIONAL EMERGENCIES:\n- 156.800 MHz (VHF Marine Channel 16) — Maritime emergency\n- 121.500 MHz — Aviation emergency\n- 243.000 MHz — Military emergency\n\nCIVILIAN BANDS:\n- FRS/GMRS: Channels 1-22 (462/467 MHz) — Common portable radios\n- CB Channel 9: 27.065 MHz — Citizens Band emergency\n- CB Channel 19: 27.185 MHz — Highway/truckers\n\nNOAA Weather Radio: 162.400 – 162.550 MHz (7 frequencies)`,
      },
      {
        title: "MAYDAY protocol",
        content: `For life-threatening emergencies:\n\n"MAYDAY, MAYDAY, MAYDAY\nThis is [your identification], [your identification], [your identification]\nMAYDAY [your identification]\nMy position is [coordinates or location]\nNature of the emergency: [description]\nType of assistance required: [specify]\nNumber of people: [amount]\nOver [change]"\n\nRepeat every 2 minutes until you receive a response.`,
      },
    ],
  },
  {
    id: "co-2",
    title: "Morse Code — Quick Guide",
    category: "Communications",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Essential signals",
        content: `SOS: ••• ——— ••• (universal distress signal)\nS: •••    O: ———\n\nBasic alphabet:\nA: •—     N: —•\nB: —•••   O: ———\nC: —•—•   P: •——•\nD: —••    Q: ——•—\nE: •      R: •—•\nF: ••—•   S: •••\nH: ••••   T: —\nI: ••     U: ••—\nL: •—••   W: •——\nM: ——     Y: —•——`,
      },
      {
        title: "Transmission methods",
        content: `Without a radio you can use Morse with:\n- FLASHLIGHT: Short flash = dot, long flash = dash\n- WHISTLE: Short/long blast\n- MIRROR: Sun reflections (heliographic signaling)\n- KNOCKS: Against a hard surface\n- FIRE: Cover/uncover the fire\n\nTimings:\n- Dot = 1 unit\n- Dash = 3 units\n- Space between symbols = 1 unit\n- Space between letters = 3 units\n- Space between words = 7 units`,
      },
    ],
  },
  {
    id: "co-3",
    title: "Emergency Visual Signaling",
    category: "Communications",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Ground-to-air signals",
        content: `International symbols (make with rocks, logs, cloth, 3m minimum):\n\nV — Require assistance\nX — Require medical assistance\nI — Need medicine\nF — Need food and water\n→ — Traveling in this direction\nLL — All is well\nN — No (negative)\nY — Yes (affirmative)\n\nTriangle of fires: 3 bonfires in a triangle = universal distress signal`,
      },
      {
        title: "Signal mirror",
        content: `A mirror flash can be seen 50+ km away on a clear day.\n\n1. Hold the mirror near your eye\n2. Extend your other hand with fingers in a V toward the target\n3. Move the mirror until the flash appears between your fingers\n4. Make rapid flashes (3 flashes = SOS)\n\nWithout a mirror: CD, aluminum foil, phone screen, any reflective surface.`,
      },
    ],
  },

  // === SHELTER BUILDING ===
  {
    id: "sh-1",
    title: "A-Frame Shelter",
    category: "Shelter",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Step-by-step construction",
        content: `Estimated time: 1-2 hours | Capacity: 1-2 people\n\n1. Find two trees 2.5m apart or drive Y-shaped stakes into the ground\n2. Place a horizontal ridgepole between the supports at 1m height\n3. Lean long branches at a 45° angle on both sides\n4. Space branches every 20-30 cm\n5. Cover with layers of leaves, pine branches, bark (bottom to top like shingles)\n6. Final layer: more branches on top to prevent wind from lifting the covering\n\nIMPORTANT: The entrance should face away from the prevailing wind.`,
      },
      {
        title: "Ground insulation",
        content: `The ground steals more heat than the air. ALWAYS insulate:\n- Layer of pine branches (15+ cm thick)\n- Compacted dry leaves\n- Tree bark\n- Backpack, tarp, trash bag\n\nRule: If you can feel the cold from the ground, you need more insulation.`,
      },
    ],
  },
  {
    id: "sh-2",
    title: "Tarp Shelter",
    category: "Shelter",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Tarp configurations",
        content: `A-Frame with tarp:\n- Taut rope between two trees\n- Drape the tarp over the rope\n- Tension corners with stakes or rocks\n\nLean-To:\n- High rope between trees\n- Tarp angled to one side\n- Ideal for reflecting heat from a campfire\n\nDiamond:\n- Top corner tied to a tree\n- Bottom corner staked to the ground\n- Sides tensioned. Compact and quick.`,
      },
      {
        title: "Essential knots",
        content: `1. Bowline: Loop that doesn't tighten. For anchoring rope to a tree.\n2. Clove hitch: Quick to tie, adjustable. For posts.\n3. Taut-line hitch: Slides to tighten but doesn't loosen under load.\n4. Prusik: Sliding knot on a thicker rope. For adjusting height.\n\nRule: Learn these 4 knots and you can build any rope shelter.`,
      },
    ],
  },
  {
    id: "sh-3",
    title: "Debris Hut",
    category: "Shelter",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Construction",
        content: `The best shelter for thermal insulation in cold climates:\n\n1. Main ridge: 3m branch resting on a trunk or rock (60cm high at one end)\n2. Ribs: Branches leaning on both sides every 15cm\n3. Lattice: Small branches crossed over the ribs\n4. Fill: PLENTY of leaves, grass, pine needle material (60+ cm thick)\n5. Final layer: Branches on top to prevent wind from scattering the fill\n\nThe interior space should be JUST enough for your body — smaller = warmer.`,
      },
      {
        title: "Location considerations",
        content: `LOOK FOR:\n✓ Elevated terrain (avoid cold water pooling)\n✓ Near building materials\n✓ Natural wind protection (rocks, dense trees)\n✓ Near a water source (but not in a flood zone)\n\nAVOID:\n✗ Dry stream beds (flash floods)\n✗ Under dead trees (falling risk)\n✗ Wind-exposed summits\n✗ Low areas where cold air settles\n✗ Near beehives, anthills, burrows`,
      },
    ],
  },
  {
    id: "sh-4",
    title: "Urban Post-Disaster Shelter",
    category: "Shelter",
    type: "guide",
    progress: 100,
    sections: [
      {
        title: "Structural assessment",
        content: `Before entering a damaged building:\n\n1. Observe from outside: Is there a tilt? Cracks in load-bearing walls?\n2. Do you smell gas? Do NOT enter.\n3. Check that doors and windows aren't jammed (could indicate collapse risk)\n4. Check the roof — large cracks = collapse risk\n5. Avoid upper floors in damaged structures\n6. Prefer corners of load-bearing walls (more resistant)\n\nReinforced concrete buildings > masonry > wood (in earthquakes)`,
      },
      {
        title: "Quick weatherproofing",
        content: `With available urban materials:\n- WINDOWS: Seal with plastic, cardboard, curtains to insulate\n- DOORS: Block unused entrances to retain heat\n- FLOOR: Carpets, cardboard, newspapers as insulation\n- HEAT: Candles in cans (improvised heater), group body heat\n- WATER: Water heaters, pipes, toilet tanks (without chemicals) as a source\n- SIGNALING: Mark the building as occupied with cloth visible from outside`,
      },
    ],
  },
];