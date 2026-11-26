// EPISODE 1 — THE COLOSSAL SQUID (v3, all-3D cut)
// One file drives picture, motion graphics, sound cues and the voice-over script.
// b(vo, shots, opts): shots = [[name, params, weight?], ...] — each beat is cut into its shots (fast cutting).
// mg = motion-graphics items, times in seconds from beat start.
export const BEATS = [];
let T = 0, SC = '';
const scene = n => (SC = n);
function b(vo, shots, o = {}) {
  const words = vo ? vo.split(/\s+/).length : 0;
  const dur = Math.max(o.min ?? 2.2, words / 2.55 + 0.45);
  const list = shots.map(s => (typeof s === 'string' ? [s, {}, 1] : [s[0], s[1] || {}, s[2] ?? 1]));
  const wsum = list.reduce((a, s) => a + s[2], 0);
  let acc = 0;
  const sub = list.map(([name, p, w]) => { const st = acc; acc += (w / wsum) * dur; return { name, p, start: st, dur: (w / wsum) * dur }; });
  BEATS.push({ start: T, dur, vo, scene: SC, shots: sub, mg: o.mg || [], sfx: o.sfx || [], music: o.music || null, hud: o.hud ?? null, depth: o.depth ?? null, flash: o.flash || 0, shake: o.shake || 0 });
  T += dur;
}

// ===================================================================== COLD OPEN
scene('COLD OPEN');
b("Two kilometers down. Your lights just switched on — and for a thousand meters in every direction, they're the only light there is.",
  [['sub_lights', {}, 1.1], ['sub_orbit', { a: 0.4 }], ['sub_pov', { pass: 'none' }]],
  { music: 'dark', hud: { d: [2000, 2000] }, depth: 2000, sfx: [['clunk', 0.05], ['hum_on', 0.1], ['drone_low', 0, 0.8]] });
b('Then something crosses the edge of your beam.',
  [['sub_pov', { pass: 'tentacle' }, 1.3], ['sub_orbit', { a: -0.6, close: 1 }]],
  { hud: { d: [2000, 2000] }, sfx: [['jet', 0.6], ['subhit', 0.8]], shake: 0.6 });
b("Your sonar locks on. Whatever it is, it's longer than your sub.",
  [['cockpit', { screen: 'sonar' }, 1.2], ['sub_orbit', { a: 1.2, close: 0.5, shadow: 1 }]],
  { hud: { d: [2000, 2000] }, mg: [{ k: 'callout', a: 'sonar', t: 'CONTACT · 9 M', at: 1.0 }], sfx: [['ping', 0.2], ['ping', 1.6], ['ping', 2.9]] });
b('And then it opens the biggest eye of any animal on Earth.',
  [['eye_open', { open: [0.2, 0.8] }]],
  { music: 'tension', sfx: [['groan', 0.2], ['impact_big', 1.4]], mg: [{ k: 'title', t: ['THE BIGGEST EYE', 'ON EARTH'], at: 1.3, red: [1] }] });
b("This is the colossal squid. Nobody has ever seen a fully grown one alive, in its home.",
  [['title3d', {}, 1.2], ['squid_pass', { dark: 1 }]],
  { sfx: [['boom', 0.1], ['reveal', 0]], flash: 1, mg: [{ k: 'stamp', t: 'NEVER SEEN ALIVE', at: 3.4 }] });
b("Tonight, you're going to try.",
  [['sub_orbit', { a: 2.4, lightsOn: 1 }]],
  { min: 2.4, sfx: [['subhit', 0.2]], mg: [{ k: 'kicker', t: 'EPISODE 1 · WHAT WOULD HAPPEN TO YOU', at: 0.2 }] });

// ===================================================================== THE MISSION
scene('THE MISSION');
b("Your trip starts at the bottom of the world. The Southern Ocean, near Antarctica — the stormiest sea on the planet.",
  [['ship_storm', { cam: 'low' }], ['ship_storm', { cam: 'aerial' }], ['ship_storm', { cam: 'deck' }]],
  { music: 'pulse', depth: 0, sfx: [['wind', 0], ['waves', 0.2], ['wavecrash', 2.5]], mg: [{ k: 'loc', t: 'SOUTHERN OCEAN', s: '62° S · NEAR ANTARCTICA', at: 0.6 }] });
b("Waves here can stand fifteen meters tall. As high as a five-story building — slamming into your ship, again and again.",
  [['ship_storm', { cam: 'wave', big: 1 }], ['wave_building', {}], ['ship_storm', { cam: 'bow', big: 1 }]],
  { depth: 0, sfx: [['wavecrash', 0.2], ['impact', 2.6], ['wavecrash', 4.2]], shake: 0.4, mg: [{ k: 'big', t: '15', unit: 'M', sub: 'WAVE HEIGHT', at: 0.8, count: 1 }] });
b("And almost everything we know about the animal you're hunting… comes from dead bodies.",
  [['stomach', { arms: 1 }]],
  { music: 'archive', depth: 2000, sfx: [['lownote', 0.2]] });
b("In 1925, scientists found its first pieces — two arms — inside the stomach of a sperm whale.",
  [['stomach', { arms: 1, close: 1 }], ['whale_pass', { dark: 1 }]],
  { mg: [{ k: 'big', t: '1925', sub: 'FIRST EVIDENCE', at: 0.5, count: 1, from: 1800 }], sfx: [['projector', 0.2]] });
b("In 2007, fishermen hauled one up from the deep. It weighed four hundred ninety-five kilograms.",
  [['trawler', {}], ['trawler', { close: 1 }]],
  { depth: 0, sfx: [['winch', 0], ['splash', 2.6]], mg: [{ k: 'big', t: '495', unit: 'KG', sub: 'THE HEAVIEST EVER FOUND', at: 2.6, count: 1 }] });
b('Adults seen alive, in the deep, by a human being? Zero.',
  [['eye_close', { far: 1 }]],
  { music: 'cut', sfx: [['subhit', 2.2]], mg: [{ k: 'stamp', t: 'ZERO', at: 2.2, big: 1 }] });
b("So you climb into a sub not much bigger than a car…",
  [['deck_sub', {}], ['deck_sub', { close: 1 }]],
  { music: 'pulse', depth: 0, sfx: [['hatch', 1.0], ['bolts', 1.8]] });
b('…and they drop you into the ocean.',
  [['ship_crane', {}], ['splashdown', {}, 1.2]],
  { depth: 0, sfx: [['hydraulic', 0], ['splash', 1.9], ['bubbles', 2.0]], flash: 0.5 });

// ===================================================================== THE DESCENT
scene('THE DESCENT');
b("In the first ten meters, red light disappears. If you cut your hand down here, your blood would look green.",
  [['descent', { d: [5, 20], close: 1 }], ['blood', {}]],
  { music: 'wonder', hud: { d: [5, 20] }, depth: 12, sfx: [['bubbles', 0], ['underwater', 0.2], ['drip_big', 3.8]], mg: [{ k: 'kicker', t: 'RED LIGHT: GONE AT 10 M', at: 0.8 }] });
b("At two hundred meters, the sunlight is gone. From here down, it's night. Forever.",
  [['descent', { d: [150, 260] }], ['underside', { dim: 1 }]],
  { hud: { d: [150, 260] }, depth: 200, sfx: [['displace', 0.5]], mg: [{ k: 'title', t: ['NIGHT.', 'FOREVER.'], at: 3.0, red: [1] }] });
b("At three hundred thirty-two meters, you pass the deepest any human has ever gone with scuba gear. You keep going.",
  [['descent', { d: [320, 340], diver: 1 }], ['descent', { d: [340, 420] }]],
  { hud: { d: [320, 420] }, depth: 340, sfx: [['ping', 1.0], ['displace', 3.0]], mg: [{ k: 'kicker', t: 'HUMAN SCUBA RECORD · 332 M', at: 0.8 }] });
b("At six hundred meters, a fish carrying its own flashlight drifts past your window.",
  [['creatures', { who: 'angler' }], ['descent', { d: [600, 620], close: 1 }]],
  { hud: { d: [580, 640] }, depth: 600, sfx: [['shimmer', 0.6], ['lure', 1.2]] });
b('At a thousand meters, pressure starts doing strange things.',
  [['descent', { d: [980, 1020] }], ['cup', { phase: 0 }]],
  { hud: { d: [980, 1020] }, depth: 1000, sfx: [['creak', 0.4]] });
b('Scientists bring foam coffee cups down here. They come back up the size of a thimble.',
  [['cup', { phase: 1 }, 1.4]],
  { depth: 1000, sfx: [['squeeze', 1.2], ['crack', 2.6]], mg: [{ k: 'vs', a: 'BEFORE', b: 'AFTER 1,000 M', at: 2.6 }] });
b('Because at two kilometers, every square inch of your sub is holding up the weight of a car.',
  [['pressure_car', {}, 1.5], ['sub_orbit', { a: 3, creak: 1 }]],
  { music: 'tension', depth: 2000, sfx: [['servo', 0.3], ['impact', 2.4], ['creak', 2.8]], shake: 0.5, mg: [{ k: 'big', t: '1.3', unit: 'TONNES', sub: 'ON EVERY SQUARE INCH', at: 2.4, count: 1 }] });
b('If a single seal fails, the water comes in faster than a Formula One car — sharp enough to cut through steel.',
  [['jet', {}], ['sub_orbit', { a: 3.5, close: 1, creak: 1 }]],
  { depth: 2000, sfx: [['tss', 0.3], ['shing', 0.8], ['jet', 1.0]], mg: [{ k: 'big', t: '720', unit: 'KM/H', sub: 'WATER JET', at: 1.2, count: 1 }] });
b("Outside, the water is just above freezing. Colder than the inside of your fridge.",
  [['descent', { d: [1700, 1800], close: 1 }]],
  { depth: 1750, hud: { d: [1700, 1800] }, sfx: [['ice', 0.5]], mg: [{ k: 'big', t: '1.5', unit: '°C', sub: 'WATER TEMPERATURE', at: 0.8, count: 1, from: 20 }] });
b("Two thousand meters. You're more than halfway to the Titanic.",
  [['descent', { d: [1940, 1980], gauge: 1 }]],
  { depth: 1960, hud: { d: [1940, 1980] }, sfx: [['lownote', 0.3]], mg: [{ k: 'depthbar', at: 0.4, marks: [[332, 'SCUBA RECORD'], [1960, 'YOU'], [3800, 'TITANIC']] }] });
b("If you opened the hatch now, the water would crush your lungs to the size of a ping-pong ball. In less than a second.",
  [['lungs', {}, 1.4], ['sub_orbit', { a: 3.8, close: 1 }]],
  { music: 'tension', depth: 2000, sfx: [['squeeze', 1.4], ['impact', 2.8], ['heartbeat_fast', 3.4]], mg: [{ k: 'vs', a: 'YOUR LUNGS · 6 L', b: 'AT 2,000 M · 30 ML', at: 2.8 }] });
b("Two thousand meters. You cut the engines. You switch off the lights. And you wait.",
  [['descent', { d: [1980, 2000] }], ['sub_orbit', { a: 4, lightsOff: 1 }]],
  { music: 'dark', depth: 2000, hud: { d: [1990, 2000] }, sfx: [['winddown', 0.8], ['clunk', 2.8], ['heartbeat', 3.2]] });

// ===================================================================== FIRST CONTACT
scene('FIRST CONTACT');
b("It's here.",
  [['squid_pass', { reveal: 1 }]],
  { min: 3.0, music: 'tension', depth: 2000, sfx: [['boom', 0.6], ['slowroar', 0.6]], flash: 0.6 });
b("Long. Slow. The color of blood. Almost twice the length of your sub.",
  [['squid_scale', {}, 1.4], ['squid_orbit', { a: 0 }]],
  { depth: 2000, sfx: [['displace', 0.4]], mg: [{ k: 'callout', a: 'squid_len', t: '≈ 8 M', at: 1.4 }, { k: 'callout', a: 'sub_len', t: 'YOUR SUB · 4 M', at: 2.2 }] });
b("It isn't chasing anything. It doesn't need to.",
  [['squid_hunt', { phase: 0 }]],
  { depth: 2000, sfx: [['drone_swell', 0]] });
b('Scientists think it hunts by ambush. It hangs in the dark, barely moving… and waits for food to come to it.',
  [['squid_hunt', { phase: 0, cam: 1 }], ['creatures', { who: 'fish' }], ['squid_hunt', { phase: 0, cam: 2 }]],
  { depth: 2000, sfx: [['heartbeat', 2]], mg: [{ k: 'kicker', t: 'AMBUSH PREDATOR', at: 1.0 }] });
b('And when a fish swims close enough—',
  [['squid_hunt', { phase: 1 }]],
  { min: 2.6, depth: 2000, sfx: [['jet', 1.6], ['slam', 2.0]], shake: 1, flash: 0.4 });
b("So what do you do? Switch off your lights? Stay perfectly still? Or get closer?",
  [['options_bg', {}]],
  { music: 'pulse', mg: [{ k: 'options', items: ['SWITCH OFF YOUR LIGHTS', 'STAY PERFECTLY STILL', 'GET CLOSER'], at: 0.6, pick: 2, pickAt: 4.6 }] });
b("You're a scientist. You get closer.",
  [['sub_orbit', { a: 5, approach: 1, squid: 1 }]],
  { depth: 2000, sfx: [['servo', 0.2], ['hum', 0.4]] });

// ===================================================================== ANATOMY
scene('ANATOMY OF A MONSTER');
b('Up close, the first thing that hits you is the weight. Four hundred ninety-five kilograms.',
  [['squid_orbit', { a: 1 }], ['seesaw', { what: 'piano', phase: 0 }]],
  { music: 'wonder', depth: 2000, mg: [{ k: 'big', t: '495', unit: 'KG', at: 2.4, count: 1 }] });
b("That's a grand piano. A grand piano… that swims, and hunts.",
  [['seesaw', { what: 'piano', phase: 1 }, 1.4]],
  { sfx: [['thud', 1.2], ['ding', 1.3]], mg: [{ k: 'vs', a: 'COLOSSAL SQUID', b: 'GRAND PIANO', at: 0.8 }] });
b("It's the heaviest invertebrate ever found. Heavier than any octopus. Heavier than the giant squid.",
  [['squid_orbit', { a: 2 }], ['squid_close', {}]],
  { mg: [{ k: 'title', t: ['HEAVIEST', 'INVERTEBRATE', 'EVER FOUND'], at: 1.0, red: [1] }] });
b("Its cousin, the giant squid, is longer — but skinny. The colossal squid is built like a tank.",
  [['cousins', {}, 1.4], ['squid_orbit', { a: 2.5 }]],
  { sfx: [['displace', 0.4], ['thud', 3.0]], mg: [{ k: 'vs', a: 'GIANT SQUID · 275 KG', b: 'COLOSSAL SQUID · 495 KG', at: 1.0 }] });
b("To move, it sucks water into its body — and blasts it out through a tube. A living jet engine.",
  [['squid_jet', {}, 1.4], ['squid_jet', { cam: 1 }]],
  { sfx: [['flow', 0.4], ['jet', 3.0], ['whoosh_big', 3.2]], mg: [{ k: 'callout', a: 'siphon', t: 'SIPHON', at: 1.4 }] });
b('Now look at its eye.',
  [['eye_ball', { phase: 0 }]],
  { min: 2.4, sfx: [['reveal', 0]] });
b("It's at least twenty-seven centimeters across. Bigger than a basketball. Alive, it may be even bigger.",
  [['eye_ball', { phase: 1 }, 1.5], ['eye_ball', { phase: 2 }]],
  { sfx: [['pop', 1.4], ['tape', 1.6]], mg: [{ k: 'big', t: '27', unit: 'CM', sub: 'EYE DIAMETER', at: 0.6, count: 1 }, { k: 'vs', a: 'SQUID EYE', b: 'BASKETBALL', at: 3.0 }] });
b('And right next to each eye, it carries its own headlights — glowing organs that light up whatever is in front of it.',
  [['eye_ball', { phase: 3 }], ['squid_close', { glow: 1 }]],
  { sfx: [['shimmer', 1.2], ['chime', 1.4]] });
b("Why such giant eyes? Not to find food. To spot the one animal that hunts it — from more than a hundred meters away.",
  [['eye_glow', { phase: 0 }], ['eye_glow', { phase: 1 }]],
  { sfx: [['drone_swell', 1]], mg: [{ k: 'big', t: '120', unit: 'M', sub: 'LONGER THAN A FOOTBALL FIELD', at: 3.6, count: 1 }] });
b('Next, the arms. Giant squid have suckers. The colossal squid has hooks.',
  [['squid_orbit', { a: 3, arms: 1 }], ['hooks', { phase: 0 }]],
  { music: 'tension', sfx: [['shing', 2.6], ['ratchet', 3.2]], mg: [{ k: 'title', t: ['HOOKS.'], at: 2.8, red: [0] }] });
b('Up to twenty-five on each tentacle club. And some of them can swivel — like a hook on a ball joint.',
  [['hooks', { phase: 1 }, 1.3], ['hooks', { phase: 2 }]],
  { sfx: [['ratchet', 0.6], ['ratchet', 2.4], ['shing', 3.4]], mg: [{ k: 'big', t: '25', sub: 'HOOKS PER CLUB', at: 0.5, count: 1 }] });
b('Once they sink in, pulling away only drives them deeper.',
  [['hooks', { phase: 3 }]],
  { sfx: [['tear', 0.6], ['squelch', 1.2]] });
b("In the middle of all those arms is the mouth: a beak, like a parrot's — the size of your fist.",
  [['beak', { phase: 0 }, 1.2], ['beak', { phase: 1 }]],
  { sfx: [['creak', 0.4], ['snap', 3.4]], mg: [{ k: 'callout', a: 'beak', t: 'BEAK · FIST-SIZED', at: 2.0 }] });
b("It doesn't swallow prey whole. It slices it into small pieces first.",
  [['beak', { phase: 2 }]],
  { sfx: [['chop', 0.8], ['chop', 1.3], ['chop', 1.8], ['chop', 2.4]] });
b('And there is a strange reason it has to.',
  [['xray', { focus: 'all' }]],
  { music: 'wonder', sfx: [['scanner', 0.2]] });
b("Its brain is shaped like a doughnut — and its throat runs straight through the hole.",
  [['xray', { focus: 'brain' }, 1.2], ['xray', { focus: 'food' }]],
  { sfx: [['blip', 0.8], ['flow', 2.2]], mg: [{ k: 'callout', a: 'brain', t: 'BRAIN', at: 1.0 }, { k: 'callout', a: 'gut', t: 'THROAT', at: 2.6 }] });
b('Every bite passes through the middle of its brain. Swallow something too big… and it could injure its own brain.',
  [['xray', { focus: 'food', big: 1 }]],
  { sfx: [['squeeze', 2.6], ['alarm', 3.6]], flash: 0.3, mg: [{ k: 'stamp', t: 'BRAIN DAMAGE', at: 3.6 }] });
b('It also has three hearts. And its blood is blue.',
  [['xray', { focus: 'hearts' }], ['xray', { focus: 'blood' }]],
  { sfx: [['heartbeat_fast', 0.2]], mg: [{ k: 'big', t: '3', sub: 'HEARTS', at: 0.8, count: 1 }] });
b("And for all that size, it barely eats. Scientists estimate around thirty grams of food a day.",
  [['squid_orbit', { a: 4 }], ['nuggets', { phase: 0 }]],
  { music: 'archive', mg: [{ k: 'big', t: '30', unit: 'G', sub: 'FOOD PER DAY', at: 2.8, count: 1 }] });
b("That's about two chicken nuggets. For half a tonne of squid.",
  [['nuggets', { phase: 1 }, 1.4]],
  { sfx: [['pop', 0.9], ['pop', 1.3]], mg: [{ k: 'vs', a: '495 KG SQUID', b: '2 NUGGETS / DAY', at: 1.2 }] });
b("It lives slowly. It moves slowly. Until it doesn't.",
  [['squid_orbit', { a: 5, slow: 1 }, 1.4], ['squid_hunt', { phase: 1, fast: 1 }]],
  { music: 'cut', sfx: [['drone_low', 0], ['jet', 3.0], ['impact_big', 3.3]], shake: 1, flash: 0.5 });

// ===================================================================== THE ATTACK
scene('THE ATTACK');
b('Your lights are bothering it.',
  [['attack_ext', { v: 'approach' }]],
  { music: 'action', depth: 2000, hud: { d: [2000, 2000] }, sfx: [['slowroar', 0.2]] });
b('A tentacle slams into your dome.',
  [['attack_pov', { v: 'strike' }]],
  { min: 2.4, hud: { d: [2000, 2000] }, sfx: [['impact_big', 0.6], ['glass', 0.7]], shake: 1.2, flash: 0.4 });
b('Then another. Hooks drag across the glass.',
  [['attack_pov', { v: 'rake' }, 1.4], ['attack_ext', { v: 'hooks' }]],
  { hud: { d: [2000, 2000] }, sfx: [['impact', 0.4], ['scrape', 1.0], ['glass_shriek', 1.6]], shake: 0.7 });
b("It's wrapping around your sub. The arms find the frame… the cable… the lights.",
  [['attack_ext', { v: 'wrap' }], ['attack_pov', { v: 'spin' }], ['attack_ext', { v: 'cable' }]],
  { hud: { d: [2000, 2000] }, sfx: [['constrict', 0.2], ['suckers', 1.2], ['creak', 2.8], ['ring', 3.6]], shake: 0.5 });
b('An alarm goes off. Cable load rising.',
  [['cockpit', { screen: 'alarm' }]],
  { hud: { d: [2000, 2000] }, sfx: [['alarm', 0.2], ['alarm', 1.8]], mg: [{ k: 'big', t: '2.4', unit: 'TONNES', sub: 'CABLE LOAD', at: 0.6, count: 1, warn: 1 }] });
b("You have seconds. Dump ballast and shoot to the surface? Fight back with the robot arm? Or hit it with every light you've got?",
  [['options_bg', { red: 1 }]],
  { mg: [{ k: 'options', items: ['DUMP BALLAST & SHOOT UP', 'FIGHT WITH THE ROBOT ARM', 'FLASH EVERY LIGHT'], at: 0.5, pick: 2, pickAt: 6.4, strike: [0, 1] }], sfx: [['heartbeat_fast', 0]] });
b('You hit the strobes.',
  [['strobe', { phase: 0 }]],
  { min: 2.2, sfx: [['clunk', 0.2], ['impact_big', 0.4]], flash: 1 });
b("To an animal that has spent its whole life in the dark, that's like a bomb going off.",
  [['strobe', { phase: 1 }], ['eye_open', { flash: 1 }]],
  { sfx: [['boom', 0.2], ['tinnitus', 0.6]], flash: 0.8 });
b('It lets go — and vanishes into a cloud of its own ink.',
  [['strobe', { phase: 2 }, 1.4]],
  { music: 'cut', sfx: [['release', 0.4], ['ink', 1.2], ['jet', 1.3]] });
b("But it wasn't running from you.",
  [['whale_emerge', { far: 1 }]],
  { min: 3.2, music: 'dark', sfx: [['drone_swell', 0.4], ['subhit', 2.4]] });

// ===================================================================== THE ONE IT FEARS
scene('THE ONE IT FEARS');
b('Something else is coming. And your sonar can hear it.',
  [['cockpit', { screen: 'clicks' }], ['whale_emerge', {}]],
  { music: 'tension', sfx: [['clicks', 1.0]], hud: { d: [2000, 2000] } });
b('Click. Click. Click.',
  [['whale_click', { close: 1 }]],
  { min: 3.4, sfx: [['click_whale', 0.3], ['click_whale', 1.2], ['click_whale', 2.1], ['clicks_accel', 2.6]], shake: 0.5 });
b('A sperm whale. The loudest animal on Earth.',
  [['whale_click', {}], ['whale_pass', {}]],
  { music: 'epic', sfx: [['boom', 0.2], ['clicks_accel', 1.5]], mg: [{ k: 'title', t: ['LOUDEST ANIMAL', 'ON EARTH'], at: 1.2, red: [0] }] });
b('Its clicks hit two hundred thirty decibels. Up close, that sound can make your whole body vibrate.',
  [['whale_click', { sub: 1 }, 1.4], ['attack_pov', { v: 'shake' }]],
  { sfx: [['click_whale', 0.5], ['click_whale', 2.5], ['impact', 2.6], ['click_whale', 3.6]], shake: 1, mg: [{ k: 'meter', v1: 230, unit: 'DB', label: 'CLICK VOLUME', at: 0.6 }] });
b("It's eighteen meters long, and weighs as much as four school buses.",
  [['whale_pass', { sub: 1 }], ['seesaw', { what: 'buses', phase: 1 }, 1.4]],
  { sfx: [['thud', 2.6], ['elephant_thud', 3.0]], mg: [{ k: 'vs', a: 'SPERM WHALE · 45 T', b: '4 SCHOOL BUSES', at: 2.6 }] });
b("A third of its body is its head. And inside sits the biggest brain of any animal that has ever lived. Eight kilograms. Yours? About one and a half.",
  [['whale_head', {}, 1.2], ['brains', {}, 1.3]],
  { sfx: [['scanner', 0.4], ['thud', 5.0]], mg: [{ k: 'vs', a: 'SPERM WHALE · 8 KG', b: 'YOU · 1.4 KG', at: 4.8 }] });
b("And when they sleep, they hang straight up and down in the water — like giant tree trunks floating in the dark.",
  [['whale_sleep', {}, 1.3], ['whale_sleep', { close: 1 }]],
  { music: 'wonder', sfx: [['drone_swell', 0.3], ['click_whale', 4.0]] });
b('And it dove here — two kilometers down — on a single breath.',
  [['whale_dive', {}, 1.3], ['whale_dive', { deep: 1 }]],
  { music: 'wonder', sfx: [['displace', 0.3], ['bubbles', 0.5]] });
b('Try it. Hold your breath. Right now.',
  [['breath', { phase: 0 }]],
  { min: 3.4, sfx: [['breath', 0.3], ['clock_fast', 1.8]], mg: [{ k: 'timer', at: 1.6, rate: 1, label: 'YOU' }] });
b('Most people give up in under a minute.',
  [['breath', { phase: 1 }]],
  { min: 3.0, sfx: [['exhale', 1.8]], mg: [{ k: 'timer', at: 0, t0: 3, rate: 14, stop: 58, label: 'YOU' }] });
b('A sperm whale can stay down for more than an hour.',
  [['whale_dive', { deep: 2 }]],
  { sfx: [['clock_fast', 0.4], ['ding', 2.6]], mg: [{ k: 'timer', at: 0, t0: 0, rate: 1500, stop: 5400, label: 'SPERM WHALE', big: 1 }] });
b("It came down here for one thing. The same thing you came for.",
  [['whale_pass', { squid: 1 }], ['squid_hunt', { phase: 0, cam: 3 }]],
  { music: 'tension', sfx: [['heartbeat', 1.0]] });
b("As it closes in, the clicks speed up into a buzz. It can see the squid in total darkness — with sound.",
  [['whale_click', { scan: 1 }, 1.3], ['sonar_view', {}]],
  { sfx: [['clicks_accel', 0.4], ['scanner', 2.2], ['clicks_accel', 3.0]], mg: [{ k: 'kicker', t: 'ECHOLOCATION', at: 0.6 }] });
b('This is the fight no human has ever witnessed.',
  [['battle', { cam: 0 }], ['battle', { cam: 1, thrash: 1 }], ['battle', { cam: 2, thrash: 1 }]],
  { music: 'action', sfx: [['impact_big', 0.1], ['thrash', 0.4], ['constrict', 1.6], ['slam', 2.4]], shake: 1, flash: 0.5 });
b("We only know it happens because of what's left behind.",
  [['battle', { cam: 3, thrash: 1 }], ['scars', {}]],
  { music: 'sad', sfx: [['release', 1.0]] });
b('Sperm whales come up covered in scars: rings from suckers, long gashes from hooks.',
  [['scars', { close: 1 }], ['scars', { close: 2 }]],
  { sfx: [['scratch', 1.4], ['scratch', 3.0]], mg: [{ k: 'callout', a: 'scar_ring', t: 'SUCKER RINGS', at: 1.2 }, { k: 'callout', a: 'scar_gash', t: 'HOOK GASHES', at: 3.2 }] });
b('And inside their stomachs, scientists find beaks. Thousands of them.',
  [['stomach', { pile: 1 }, 1.3], ['stomach', { pile: 1, close: 1 }]],
  { sfx: [['clatter', 2.0]], mg: [{ k: 'big', t: '1000s', sub: 'SQUID BEAKS IN ONE STOMACH', at: 3.0 }] });
b("Squid flesh digests. Beaks don't.",
  [['stomach', { pile: 1, close: 2 }]],
  { sfx: [['clatter', 0.4]] });
b("Down here, the colossal squid is a monster. To a sperm whale… it's dinner.",
  [['battle', { cam: 4 }], ['battle', { cam: 5, jaw: 1 }]],
  { music: 'epic', sfx: [['jaw', 2.4], ['slam', 3.6]], mg: [{ k: 'stamp', t: 'DINNER', at: 3.6 }] });

// ===================================================================== THE ASCENT
scene('THE ASCENT');
b('Your batteries are running low. Time to go up.',
  [['ascent', { d: [2000, 1900] }]],
  { music: 'sad', hud: { d: [2000, 1900] }, depth: 1950, sfx: [['hum_on', 0.3], ['bubbles', 0.8]] });
b("And on the way, you realize something. In all of human history, this animal has almost never been seen alive.",
  [['ascent', { d: [1500, 1000] }], ['sub_orbit', { a: 6, rise: 1 }]],
  { hud: { d: [1500, 1000] }, depth: 1200 });
b('The first video of a living colossal squid in the deep was filmed in 2025. It was a baby — about as long as a ruler.',
  [['baby', {}, 1.3], ['baby', { close: 1 }]],
  { music: 'wonder', depth: 600, sfx: [['shimmer', 0.8], ['chime', 3.0]], mg: [{ k: 'big', t: '2025', sub: 'FIRST VIDEO IN THE WILD', at: 0.8, count: 1, from: 1925 }, { k: 'callout', a: 'baby', t: '≈ 30 CM', at: 3.4 }] });
b('The giants are still down there. In the dark. Watching — with eyes bigger than basketballs.',
  [['ascent', { d: [300, 100], up: 1 }], ['eye_open', { open: [0.4, 0.9], slow: 1 }]],
  { hud: { d: [300, 100] }, depth: 200, sfx: [['drone_swell', 2.0]] });
b("And they've probably already seen you.",
  [['eye_close', {}]],
  { min: 3.8, music: 'cut', sfx: [['subhit', 2.4]] });

scene('NEXT TIME');
b("Next time: a fish that hunts with a glowing lure… and whose males fuse into the female's body. Forever.",
  [['creatures', { who: 'angler', teaser: 1 }, 1.4], ['angler_close', {}]],
  { music: 'dark', depth: 1500, sfx: [['lure', 0.4], ['impact_big', 5.0]], mg: [{ k: 'kicker', t: 'NEXT EPISODE', at: 0.3 }, { k: 'title', t: ['THE ANGLERFISH'], at: 4.8, red: [0] }] });
b('', [['endcard', {}]], { min: 6, sfx: [['reveal', 0.2], ['lownote', 0.4]] });

export const TOTAL = T;
