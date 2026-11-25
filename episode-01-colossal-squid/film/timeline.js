// Single source of truth for Episode 1: visuals, sound cues, HUD and voice-over.
// Each beat = one on-screen "action" (2.5–5 s). Duration is auto-fitted to the VO length.
// shot: [type, params]   sfx: [name, offsetSeconds, gain]   slam: big text   hud: {d:[from,to]} or false

const B = [];
let scene = '';
const S = name => { scene = name; };
const b = (shot, vo = '', o = {}) => B.push({ scene, shot, vo, ...o });

// ======================================================= COLD OPEN
S('COLD OPEN');
b(['void', { lamp: 1, lampOn: 1, beam: [0.25, -0.1] }], 'Two kilometers down. No sunlight has ever reached this place.', { min: 3.6, sfx: [['clunk', 0], ['hum_on', 0.05], ['drone_low', 0, 0.7]], hud: { d: [2000, 2000] }, music: 'dark' });
b(['void', { lamp: 1, beam: [-0.1, 0.42], glint: 1 }], "You think you're alone down here. You're not.", { min: 3.2, sfx: [['servo', 0], ['subhit', 0.9]] });
b(['eye', { zoom: [0.35, 0.8], pupil: [1, 1], dark: 1 }], 'Something has been watching you since the second you arrived.', { sfx: [['rewind', 0], ['drone_swell', 0.5]] });
b(['eye', { zoom: [0.8, 1.0], pupil: [1, 0.72] }], 'With an eye bigger than a basketball.', { sfx: [['creak', 0.3]] });
b(['eye', { zoom: [1.0, 1.05], pupil: [0.72, 0.7] }], 'The biggest eye of any animal alive.', { slam: ['LARGEST EYE', 'ON EARTH'], sfx: [['impact', 0]] });
b(['black', {}], '', { min: 1.2, hud: false, music: 'cut' });
b(['title', { l1: 'THE COLOSSAL SQUID', l2: 'What would happen to you?' }], "Today, we go down to meet the colossal squid. And we'll find out exactly what would happen to you if you met one.", { hud: false, sfx: [['boom', 0], ['typewriter', 1.4]], music: 'dark' });
b(['flash', { kind: 'hooks' }], 'Hooks that rotate.', { min: 1.8, hud: false, sfx: [['whoosh', 0], ['ratchet', 0.4]] });
b(['flash', { kind: 'beak' }], 'A beak that cuts like shears.', { min: 2, hud: false, sfx: [['whoosh', 0], ['crack', 0.4]] });
b(['flash', { kind: 'hearts' }], 'Three hearts. Blue blood.', { min: 2, hud: false, sfx: [['thump', 0.2], ['thump', 0.55], ['thump', 0.9]] });
b(['flash', { kind: 'whale' }], 'And the one creature on Earth it is truly afraid of.', { hud: false, sfx: [['clicks', 0, 0.7]] });
b(['card', { lines: ['NOBODY HAS EVER FILMED', 'AN ADULT ONE ALIVE.'], tone: 'red' }], 'Nobody has ever filmed an adult one alive in the deep.', { hud: false, sfx: [['impact', 0]] });
b(['surface', { v: 'storm' }], "So let's go see one.", { hud: false, sfx: [['wind', 0, 0.9], ['waves', 0, 0.8]], music: 'pulse' });

// ======================================================= DESCENT
S('THE DESCENT');
b(['surface', { v: 'ship' }], 'The Southern Ocean. The sea that circles Antarctica.', { hud: false, sfx: [['wind', 0, 0.7], ['waves', 0, 0.7]] });
b(['surface', { v: 'wave' }], 'The coldest, angriest water on the planet.', { hud: false, sfx: [['wavecrash', 0.4]] });
b(['surface', { v: 'wave', building: 1 }], 'Waves here can reach twenty meters. That is a six-story building made of water.', { hud: false, slam: ['WAVES UP TO 20 M', '= A 6-STORY BUILDING'], sfx: [['impact', 0.2], ['wavecrash', 1]] });
b(['surface', { v: 'crane' }], 'This is your ride.', { hud: false, sfx: [['hydraulic', 0], ['chains', 0.6]] });
b(['diagram', { k: 'sphere' }], 'A steel sphere about two meters wide. Roughly the size of the inside of a small car.', { hud: false, sfx: [['blueprint', 0]] });
b(['void', { lamp: 0, hatch: 1, inside: 1 }], 'One window. One cable to the surface.', { hud: false, sfx: [['hatch', 0.2], ['bolts', 1.2]] });
b(['void', { lamp: 0, bolts: 1, inside: 1 }], "And no way out until they pull you back up.", { hud: false, sfx: [['bolts', 0], ['bolts', 1.1]] });
b(['surface', { v: 'splash' }], 'Descent begins.', { hud: false, sfx: [['splash', 0], ['underwater', 0.5]] });
b(['descent', { d: [0, 30] }], '', { min: 2.5, hud: { d: [0, 30] }, sfx: [['bubbles', 0]] });
b(['descent', { d: [30, 40], redfade: 1 }], 'At thirty meters, the color red is the first thing to die.', { hud: { d: [30, 40] } });
b(['descent', { d: [40, 45], blood: 1 }], 'Cut your finger here, and your blood looks green.', { hud: { d: [40, 45] }, sfx: [['tss', 0.6]] });
b(['descent', { d: [45, 100] }], 'The water has simply eaten the red part of the light.', { hud: { d: [45, 100] }, slam: ['RED LIGHT:', 'GONE'], sfx: [['impact', 0.2]] });
b(['descent', { d: [100, 200], jelly: 1 }], 'At two hundred meters, you enter the twilight zone.', { hud: { d: [100, 200] }, sfx: [['chime', 0.8]] });
b(['descent', { d: [200, 300], sparks: 1 }], 'Here, animals start making their own light.', { hud: { d: [200, 300] }, sfx: [['twinkle', 0.2]] });
b(['descent', { d: [300, 400], fish: 1, sparks: 1 }], 'Up to three out of four creatures in the deep can glow.', { hud: { d: [300, 400] }, sfx: [['swish', 0.3]] });
b(['descent', { d: [400, 500], siph: 1, sparks: 1 }], 'To lure prey. To scare predators. To find each other in the dark.', { hud: { d: [400, 500] }, sfx: [['shimmer', 0.2]] });
b(['void', { lamp: 0, cond: 1, inside: 1 }], 'Five hundred meters. Two degrees. Water beads on the walls.', { hud: { d: [500, 650] }, sfx: [['drip', 1.4]] });
b(['void', { lamp: 0, breathfog: 1, inside: 1 }], 'Now you can see your own breath.', { hud: { d: [650, 800] }, sfx: [['exhale', 0.4]] });
b(['descent', { d: [800, 1000], fadeout: 1 }], '', { min: 2.5, hud: { d: [800, 1000] }, music: 'cut' });
b(['black', { hudOnly: 1, label: 'MIDNIGHT ZONE' }], 'One thousand meters. The last bit of sunlight is gone.', { hud: { d: [1000, 1000] }, sfx: [['tick', 0.3]] });
b(['black', { hudOnly: 1 }], 'From here all the way to the seafloor, it is night. Forever.', { hud: { d: [1000, 1050] }, sfx: [['ticks_fast', 0]], music: 'dark' });
b(['diagram', { k: 'palm', items: 'cars', n: 7, label: '~10 TONS ON YOUR PALM' }], 'The pressure on the palm of your hand right now? About ten tons. Seven cars, stacked on your hand.', { hud: false, sfx: [['thud', 0.6], ['thud', 1.0], ['thud', 1.4], ['thud', 1.8], ['thud', 2.2], ['thud', 2.6], ['thud', 3.0]] });
b(['diagram', { k: 'lungs' }], 'Without the sphere, the air in your lungs would be crushed down to the size of a golf ball.', { hud: false, sfx: [['squeeze', 0.8], ['pop', 2.6]] });
b(['card', { lines: ['SURVIVAL WITHOUT', 'THE SPHERE: 0 SECONDS'], tone: 'red' }], "You wouldn't last a second.", { hud: false, sfx: [['impact', 0]] });
b(['descent', { d: [1050, 1400], dark: 1 }], '', { min: 2.5, hud: { d: [1050, 1400] }, sfx: [['pulse', 0]] });
b(['void', { lamp: 1, beam: [0, 0.05], shake: 1, inside: 1 }], 'The hull groans.', { hud: { d: [1400, 1450] }, sfx: [['groan', 0]] });
b(['void', { lamp: 1, beam: [0.05, 0.1], inside: 1 }], "That's normal, you tell yourself. That's just the steel settling under the pressure.", { hud: { d: [1450, 1600] }, sfx: [['heartbeat', 0, 0.6]] });
b(['void', { lamp: 1, beam: [0.1, 0.1], droplet: 1, inside: 1 }], '', { min: 2.6, hud: { d: [1600, 1650] }, sfx: [['drip_big', 0.8]] });
b(['void', { lamp: 1, beam: [0.1, 0.1], inside: 1 }], "It's fine.", { min: 2.2, hud: { d: [1650, 1700] }, sfx: [['exhale', 0.2]] });
b(['void', { lamp: 1, beam: [0.1, 0.12], passby: 1 }], 'What was that?', { min: 2.6, hud: { d: [1700, 1800] }, sfx: [['whoosh_big', 0], ['subhit', 0.1]] });
b(['void', { lamp: 1, beam: [0.12, -0.5] }], '', { min: 2.4, hud: { d: [1800, 1900] }, sfx: [['servo', 0]] });
b(['void', { lamp: 1, beam: [-0.5, 0], thrustersOff: 1 }], 'Two thousand meters.', { hud: { d: [1900, 2000] }, sfx: [['winddown', 0]] });
b(['diagram', { k: 'palm', items: 'elephants', n: 3, label: '~20 TONS ON YOUR PALM' }], 'Now the pressure on your palm is twenty tons. Three full-grown African elephants, standing on your hand.', { hud: false, sfx: [['elephant_thud', 0.8], ['elephant_thud', 1.6], ['elephant_thud', 2.4]] });
b(['void', { lamp: 1, beam: [0, 0], wide: 1 }], 'Water colder than the inside of your fridge. And the only thing between you and that pressure is a few centimeters of steel.', { hud: { d: [2000, 2000] }, sfx: [['drone_swell', 0]] });
b(['map', {}], 'Somewhere out here, in the dark, it is waiting.', { hud: false, sfx: [['ping', 1]] });
b(['void', { lamp: 1, beam: [0, 0], burn: 1 }], 'But first, you need to know what you are dealing with. Because for a hundred years, nobody did.', { hud: { d: [2000, 2000] }, sfx: [['projector', 2.5]] });

// ======================================================= HISTORY
S('A MONSTER WITH NO FACE');
b(['archive', { v: 'ship', year: '1925' }], '1925.', { min: 2.4, hud: false, sfx: [['projector', 0, 0.6]], music: 'archive' });
b(['archive', { v: 'whale' }], 'Whalers cut open the stomach of a sperm whale.', { hud: false, sfx: [['saw', 0.3]] });
b(['archive', { v: 'arms' }], 'Inside, they find two pieces of arm.', { hud: false, sfx: [['slap', 0.6]] });
b(['flash', { kind: 'hooks', sepia: 1 }], 'But they are not covered in suckers. They are covered in hooks.', { hud: false, sfx: [['ring', 1.2]] });
b(['flash', { kind: 'hooks', rotate: 1, sepia: 1 }], 'Sharp. Curved. And they swivel.', { hud: false, sfx: [['ratchet', 0.5]] });
b(['archive', { v: 'sketch' }], 'A scientist named Guy Robson describes a brand new species from those two scraps alone.', { hud: false, sfx: [['pen', 0.3]] });
b(['card', { lines: ['NAME: COLOSSAL SQUID', 'BODY: NEVER SEEN'], tone: 'sepia' }], 'The colossal squid. But nobody has seen the animal itself.', { hud: false, sfx: [['impact', 0]] });
b(['diagram', { k: 'timeline' }], 'For decades, all we find are traces.', { hud: false, sfx: [['whoosh', 0]] });
b(['diagram', { k: 'beaks' }], 'Beaks in the stomachs of sperm whales. Hundreds of them.', { hud: false, sfx: [['clatter', 0.4]] });
b(['archive', { v: 'scars' }], 'Strange scars on whale skin. Scraps in fishing nets.', { hud: false, sfx: [['drone_low', 0]] });
b(['card', { lines: ['FEBRUARY 2007', 'ROSS SEA, ANTARCTICA'], tone: 'blue' }], 'Then, February 2007.', { hud: false, sfx: [['impact', 0]], music: 'tension' });
b(['archive', { v: 'boat', modern: 1 }], 'A fishing boat is hauling up toothfish from about one and a half kilometers down.', { hud: false, sfx: [['wind', 0, 0.6], ['engine', 0, 0.5]] });
b(['archive', { v: 'line', modern: 1 }], 'The line goes tight.', { min: 2.4, hud: false, sfx: [['linecreak', 0.2]] });
b(['archive', { v: 'underwater', modern: 1 }], 'On the hook, a fish. And wrapped around the fish, something that refuses to let go.', { hud: false, sfx: [['subhit', 1.6]] });
b(['diagram', { k: 'clock', hours: 2 }], 'It takes nearly two hours to bring it to the surface.', { hud: false, sfx: [['ticks_fast', 0]] });
b(['archive', { v: 'deck', modern: 1 }], 'When it hits the deck, the crew understands. Nobody has ever seen anything like this.', { hud: false, sfx: [['splash', 0], ['slap', 0.5]] });
b(['card', { lines: ['495 KG'], tone: 'red', huge: 1 }], 'Four hundred and ninety-five kilograms.', { hud: false, sfx: [['impact_big', 0]] });
b(['diagram', { k: 'compare', items: ['piano', 'bear', 'men7'], labels: ['A GRAND PIANO', 'A BIG MALE POLAR BEAR', '7 ADULT MEN'] }], 'As heavy as a grand piano. As heavy as a big male polar bear. As heavy as seven grown men.', { hud: false, sfx: [['pop', 0.3], ['pop', 1.6], ['pop', 3.2]] });
b(['card', { lines: ['THE HEAVIEST INVERTEBRATE', 'EVER FOUND'], tone: 'white' }], 'The heaviest invertebrate humans have ever held.', { hud: false, sfx: [['impact', 0]] });
b(['archive', { v: 'museum', modern: 1 }], 'They freeze it whole and ship it to a museum in New Zealand, where it is still on display today.', { hud: false, sfx: [['museum', 0, 0.6]] });
b(['archive', { v: 'rov', modern: 1, year: '2025' }], 'And the first video of a live colossal squid in the wild? That only came in 2025.', { hud: false, sfx: [['sonar', 0.3]], music: 'wonder' });
b(['archive', { v: 'rovsquid', modern: 1 }], 'A hundred years after we learned it existed. A baby, thirty centimeters long, clear as glass.', { hud: false, sfx: [['chime', 0.5]] });
b(['void', { lamp: 1, beam: [0, 0] }], 'An adult, in its own world, at its own depth? Nobody has ever filmed one.', { hud: { d: [2000, 2000] }, sfx: [['drone_low', 0]], music: 'dark' });
b(['card', { lines: ['UNTIL NOW.'], tone: 'red' }], 'Until now.', { min: 2.2, hud: false, sfx: [['impact', 0]] });

// ======================================================= FIRST CONTACT
S('FIRST CONTACT');
b(['void', { lamp: 1, beam: [0, 0], thrustersOff: 1 }], 'You cut the engines.', { hud: { d: [2000, 2000] }, sfx: [['winddown', 0]] });
b(['void', { lamp: 1, beam: [0, 0.05], macro: 1 }], 'Silence. Just marine snow, drifting through the light.', { sfx: [['tinnitus', 0, 0.4]] });
b(['void', { lamp: 1, beam: [0.05, 0.05], flake: 1 }], 'Dead plankton. Crumbs of life from the surface. Some of it has been sinking for weeks.', {});
b(['void', { lamp: 1, beam: [0.05, 0.25], redEdge: 1 }], 'Then, at the very edge of the light, a color.', { sfx: [['cello', 0.3]] });
b(['skin', { pan: [0, 1] }], 'Dark red. Almost black.', { sfx: [['slide', 0]] });
b(['skin', { pan: [1, 1.4], split: 1 }], "Down here, red light doesn't exist. So red skin looks black. Perfect camouflage.", { sfx: [['whoosh', 0]] });
b(['skin', { pan: [1.4, 2] }], 'Only your lamp gives it away.', { sfx: [['heartbeat', 0]] });
b(['skin', { pan: [2, 2.4] }], 'And then you see it.', { min: 2.4, sfx: [['heartbeat', 0]] });
b(['eye', { zoom: [0.55, 0.75], pupil: [1, 1], reveal: 1 }], 'The eye.', { min: 2.6, sfx: [['drone_swell', 0, 1.2]] });
b(['eye', { zoom: [0.75, 1.15], pupil: [1, 1], reflect: 1 }], 'You can see yourself in it.', { sfx: [['glass', 0.3]] });
b(['diagram', { k: 'eyesize' }], 'Twenty-seven centimeters across, measured on a dead one. Probably even bigger alive. Wider than a dinner plate. Bigger than a basketball.', { hud: false, sfx: [['pop', 1.8], ['pop', 3.8]] });
b(['diagram', { k: 'lens' }], 'The lens inside is the size of an orange.', { hud: false, sfx: [['squelch', 0.4]] });
b(['eye', { zoom: [0.6, 0.6], pupil: [0.9, 0.9], photophores: 1 }], 'And beside the eyes, small glowing organs. Photophores.', { sfx: [['hum', 0.2]] });
b(['eye', { zoom: [0.6, 0.55], pupil: [0.9, 0.9], photophores: 2 }], 'Scientists think it may use them like headlights.', { sfx: [['hum', 0]] });
b(['card', { lines: ['WHY SUCH A BIG EYE…', 'WHERE THERE IS NO LIGHT?'], tone: 'white', type: 1 }], 'But why would anything need an eye this big, in a place with no light?', { hud: false, sfx: [['typewriter', 0.2]] });
b(['diagram', { k: 'glowwhale', p: [0, 0.5] }], 'Here is what scientists think. When something huge moves through the dark,', { hud: false, sfx: [['clicks', 0, 0.4], ['twinkle', 1]] });
b(['diagram', { k: 'glowwhale', p: [0.5, 1] }], 'it disturbs glowing plankton. And the water lights up all around it.', { hud: false, sfx: [['shimmer', 0]] });
b(['diagram', { k: 'distance' }], 'An eye this size can spot that glow from more than a hundred and twenty meters away. That is longer than a football field.', { hud: false, sfx: [['ruler', 0], ['impact', 3.4]] });
b(['card', { lines: ["IT'S NOT A HUNTING EYE."], tone: 'white' }], "It's not an eye for hunting.", { hud: false, sfx: [['impact', 0]] });
b(['card', { lines: ["IT'S AN EARLY-WARNING", 'SYSTEM.'], tone: 'red' }], "It's an early-warning system.", { hud: false, sfx: [['impact_big', 0]] });
b(['eye', { zoom: [0.7, 0.75], pupil: [0.85, 0.85], look: [0, -0.3] }], "It isn't looking for food. It's looking for the thing it fears.", { sfx: [['creak', 0.4]] });
b(['void', { lamp: 1, beam: [0, 0], wide: 1, glowSub: 1 }], 'But you are big. You glow. You hum.', { hud: { d: [2000, 2000] }, sfx: [['hum', 0, 1]] });
b(['eye', { zoom: [0.9, 1], pupil: [0.85, 0.6] }], "And right now, it's deciding what you are.", { sfx: [['creak', 0.2]] });
b(['void', { lamp: 1, beam: [0, 0], inside: 1, bpm: 142 }], 'Your pulse: one hundred forty-two.', { sfx: [['heartbeat_fast', 0]] });
b(['void', { lamp: 1, beam: [0, 0], inside: 1, bpm: 146 }], "Your palms are soaked, even though it's five degrees in here.", { sfx: [['heartbeat_fast', 0], ['breath_shallow', 0]] });
b(['void', { lamp: 1, beam: [0, 0], push: 1 }], "You hold your breath. You can't help feeling you're breathing too loud.", { sfx: [['breath_hold', 0.2]] });
b(['eye', { zoom: [1, 1.02], pupil: [0.6, 0.6] }], "It can't hear you.", { min: 2.4, sfx: [] });
b(['card', { lines: ['…can it?'], tone: 'white', small: 1 }], 'Can it?', { min: 2, hud: false, sfx: [['lownote', 0]] });
b(['squid3d', { cam: 'passby' }], 'Then it moves. And it just keeps going. And going.', { min: 5, sfx: [['slide_long', 0], ['displace', 0.4]] });
b(['void', { lamp: 1, beam: [0, 0] }], 'Where did it go?', { min: 2.4, hud: { d: [2000, 2000] }, sfx: [] });
b(['squid3d', { cam: 'turntable', p: [0, 0.15] }], "Let's freeze this moment, and take a proper look at it.", { hud: false, sfx: [['reveal', 0]], music: 'wonder' });

// ======================================================= ANATOMY
S('ANATOMY OF A MONSTER');
b(['squid3d', { cam: 'scale', human: 1 }], 'Here it is, next to you.', { hud: false, sfx: [['reveal', 0]] });
b(['squid3d', { cam: 'scale', human: 1, label: 'weight' }], 'Weight: up to around half a ton.', { hud: false, slam: ['UP TO', '~500 KG'], sfx: [['impact', 0.3]] });
b(['diagram', { k: 'compare', items: ['horse'], labels: ['A HORSE'] }], 'Picture a horse. Now give it eight arms, two tentacles, and a beak.', { hud: false, sfx: [['pop', 0.4], ['squelch', 2]] });
b(['card', { lines: ['THE BIGGEST ONES?', 'NOBODY KNOWS.'], tone: 'white', glitch: 1 }], 'And the biggest ones out there could be heavier still. Nobody knows.', { hud: false, sfx: [['glitch', 0]] });
b(['squid3d', { cam: 'scale', human: 1, label: 'length', ruler: 1 }], 'Length: up to about ten meters, by most estimates.', { hud: false, sfx: [['tape', 0]] });
b(['diagram', { k: 'compare', items: ['bus', 'house3'], labels: ['ALMOST A CITY BUS', 'A 3-STORY BUILDING'] }], 'Almost as long as a city bus. Stand it on its tail, and it would look into the windows of a three-story building.', { hud: false, sfx: [['pop', 0.4], ['pop', 2.8]] });
b(['squid3d', { cam: 'scale', human: 1, label: 'mantle' }], 'Its main body, the mantle, is about two and a half meters. Taller than any doorway in your house.', { hud: false, sfx: [['pulse', 0]] });
b(['diagram', { k: 'cousins' }], 'Its cousin, the giant squid, is longer and thinner. But the colossal is heavier. A lot heavier.', { hud: false, sfx: [['whoosh', 0], ['thud', 2.6], ['spring', 2.8]] });
b(['squid3d', { cam: 'armdive' }], 'Eight arms. Two long hunting tentacles.', { hud: false, sfx: [['whoosh', 0]] });
b(['squid3d', { cam: 'club' }], 'And at the end of each tentacle, a club, armed with hooks.', { hud: false, sfx: [['shing', 0.6]] });
b(['flash', { kind: 'hooks', rotate: 1, long: 1 }], 'Each hook swivels on its base.', { hud: false, sfx: [['ratchet', 0.3]] });
b(['diagram', { k: 'hookpull' }], "When prey pulls away, the hook doesn't rip out. It turns, and digs in deeper.", { hud: false, sfx: [['ratchet', 1], ['tear', 1.8]] });
b(['card', { lines: ['NO OTHER SQUID', 'ON EARTH HAS THIS'], tone: 'red' }], 'No other squid on Earth has weapons like this.', { hud: false, sfx: [['impact', 0]] });
b(['squid3d', { cam: 'beak', p: [0, 0.5] }], 'Now, look between the arms.', { hud: false, sfx: [['tunnel', 0]] });
b(['squid3d', { cam: 'beak', p: [0.5, 1] }], 'The beak.', { min: 2.2, hud: false, sfx: [['crack', 0.4]] });
b(['card', { lines: ['THE LARGEST BEAK', 'OF ANY SQUID'], tone: 'white' }], 'The largest beak of any squid.', { hud: false, sfx: [['impact', 0]] });
b(['flash', { kind: 'beak', long: 1 }], 'Hard as horn, with edges that work like a pair of metal shears.', { hud: false, sfx: [['snap', 0.8]] });
b(['diagram', { k: 'beaks' }], "That's why beaks are what we usually find. Whales can digest everything else. Not the beak.", { hud: false, sfx: [['clatter', 0.3]] });
b(['squid3d', { cam: 'xray', hearts: 0 }], 'Inside, it gets even stranger.', { hud: false, sfx: [['scanner', 0]] });
b(['squid3d', { cam: 'xray', hearts: 1 }], 'One heart.', { min: 1.8, hud: false, sfx: [['thump', 0.2]] });
b(['squid3d', { cam: 'xray', hearts: 2 }], 'Two hearts.', { min: 1.8, hud: false, sfx: [['thump', 0.2]] });
b(['squid3d', { cam: 'xray', hearts: 3 }], 'Three.', { min: 1.8, hud: false, sfx: [['thump', 0.2]] });
b(['squid3d', { cam: 'xray', hearts: 3, flow: 1 }], 'Two push blood through the gills. The third drives it through the body.', { hud: false, sfx: [['flow', 0]] });
b(['squid3d', { cam: 'xray', hearts: 3, blue: 1 }], 'And the blood is blue. Built on copper instead of iron.', { hud: false, sfx: [['shimmer', 0.2]] });
b(['diagram', { k: 'brain', p: [0, 0.5] }], 'Its brain is shaped like a donut, wrapped around its throat.', { hud: false, sfx: [['lownote', 0.4]] });
b(['diagram', { k: 'brain', p: [0.5, 1], warn: 1 }], 'Swallow something too big, and the food would press against its own brain.', { hud: false, sfx: [['alarm', 1.6]] });
b(['flash', { kind: 'beak', chop: 1 }], 'So it slices every meal into small pieces first.', { hud: false, sfx: [['chop', 0.3], ['chop', 0.6], ['chop', 0.9], ['chop', 1.2]] });
b(['squid3d', { cam: 'still' }], 'And here is the strangest number of all.', { hud: false, sfx: [['drone_low', 0]] });
b(['diagram', { k: 'food' }], 'Scientists estimate a half-ton colossal squid needs only about thirty grams of food a day. Roughly one slice of bread.', { hud: false, sfx: [['impact', 1.2]] });
b(['squid3d', { cam: 'still', clock: 1 }], "It doesn't chase. It waits. Still, for hours. Saving every drop of energy.", { hud: false, sfx: [['clock_fast', 0]] });
b(['card', { lines: ['NOT A HUNTER.'], tone: 'white' }], "It isn't a hunter.", { min: 2, hud: false, sfx: [['impact', 0]] });
b(['card', { lines: ['AN AMBUSH.'], tone: 'red', huge: 1 }], "It's an ambush.", { min: 2.2, hud: false, sfx: [['impact_big', 0]] });
b(['void', { lamp: 1, beam: [0, 0], inside: 1, bpm: 150 }], 'And you are hanging right in front of it.', { hud: { d: [2000, 2000] }, sfx: [['heartbeat_fast', 0]], music: 'dark' });

// ======================================================= ATTACK
S('THE ATTACK');
b(['void', { lamp: 1, beam: [0, 0] }], 'Nothing happens.', { min: 2.4, hud: { d: [2000, 2000] }, sfx: [['hull_tick', 0.8]], music: 'cut' });
b(['void', { lamp: 1, beam: [0, 0], timer: [0, 10] }], 'One second. Ten.', { min: 3, sfx: [['tick', 0], ['tick', 1], ['tick', 2]] });
b(['void', { lamp: 1, beam: [0, 0], timer: [10, 60] }], 'A full minute.', { min: 2.6, sfx: [['exhale', 0.8]] });
b(['void', { lamp: 1, beam: [0, -0.45], inside: 1 }], 'You decide to angle the lamp away. Maybe the light is bothering it.', { sfx: [['click', 0.2], ['servo', 1.2]] });
b(['attack', { v: 'strike' }], '', { min: 1.6, sfx: [['smash', 0], ['glass_shriek', 0.05]], music: 'action' });
b(['attack', { v: 'slowmo' }], 'Strike!', { min: 2.6, sfx: [['slowroar', 0]] });
b(['attack', { v: 'rake' }], 'The tentacles fire in a fraction of a second. Hooks rake across the steel.', { sfx: [['scrape', 0], ['alarm', 0.4]] });
b(['attack', { v: 'wrap' }], 'Eight arms close around the sphere.', { sfx: [['constrict', 0]] });
b(['attack', { v: 'glass' }], 'Suckers. Hooks. Red flesh pressed flat against the glass.', { sfx: [['suckers', 0]] });
b(['attack', { v: 'spin' }], "It's pulling you in. Toward the beak.", { sfx: [['spin_groan', 0]] });
b(['card', { lines: ['500 KG OF MUSCLE', 'vs 2 TONS OF STEEL'], tone: 'red' }], 'Half a ton of muscle against two tons of steel.', { hud: false, sfx: [['impact', 0]] });
b(['freeze', { q: 'WHAT HAPPENS TO YOU?' }], 'So, what would actually happen to you?', { hud: false, sfx: [['scratch', 0]], music: 'cut' });
b(['split', { side: 'both' }], 'Two scenarios.', { min: 2.2, hud: false, sfx: [['whoosh', 0]], music: 'tension' });
b(['split', { side: 'inside' }], 'Inside the sphere, you survive. Steel is the one thing it cannot cut.', { hud: false, sfx: [['ding', 0.6]] });
b(['attack', { v: 'cable', tension: [120, 180] }], "But you're hanging from a single cable, and it's starting to strain.", { sfx: [['alarm', 0], ['twang', 2.2]] });
b(['split', { side: 'outside' }], 'Now imagine you are outside.', { hud: false, sfx: [['drone_low', 0]] });
b(['card', { lines: ['REAL ANSWER:', 'THE PRESSURE GETS YOU FIRST'], tone: 'white' }], 'Honestly? The pressure would kill you long before it ever touched you.', { hud: false, sfx: [['impact', 0]] });
b(['split', { side: 'outside', suit: 1 }], 'But say some impossible suit keeps you alive.', { hud: false, sfx: [['shimmer', 0]] });
b(['flash', { kind: 'hooks', rotate: 1, red: 1 }], 'The hooks sink in. And turn.', { hud: false, sfx: [['ratchet', 0.4], ['thud', 0.5]] });
b(['split', { side: 'outside', pull: 1 }], 'The arms drag you in, toward the beak.', { hud: false, sfx: [['constrict', 0]] });
b(['flash', { kind: 'beak', open: 1 }], "And the beak doesn't bite. It slices. Piece by piece. Small enough to fit through that donut-shaped brain.", { hud: false, sfx: [['crack', 0.2], ['silence', 2]] });
b(['black', {}], 'Slowly. In total darkness. Two kilometers from the nearest human being.', { hud: false, music: 'cut' });
b(['attack', { v: 'spin' }], '', { min: 2.4, sfx: [['spin_groan', 0]], music: 'action' });
b(['attack', { v: 'freeze' }], 'And then, it freezes.', { min: 2.6, sfx: [['stop', 0]], music: 'cut' });
b(['eye', { zoom: [1.1, 1.15], pupil: [0.7, 0.7], look: [0, 0.6] }], "It's not looking at you anymore.", { sfx: [['creak', 0.2]] });
b(['card', { lines: ["IT'S SEEN SOMETHING."], tone: 'white' }], "It's seen something.", { hud: false, sfx: [['lownote', 0]] });

// ======================================================= THE WHALE
S('THE ONE IT FEARS');
b(['black', {}], '', { min: 1.6, hud: false, sfx: [['click_whale', 0.4]] });
b(['void', { lamp: 1, beam: [0, 0], jitter: 1 }], "Click. You don't hear it with your ears.", { hud: { d: [2000, 2000] }, sfx: [['click_whale', 0.3], ['click_whale', 2.4]] });
b(['void', { lamp: 1, beam: [0, 0], jitter: 2, shake: 1 }], 'You feel it in your chest.', { sfx: [['click_whale', 0.2], ['click_whale', 1.2]] });
b(['sonar', {}], 'Click. Click. Click-click-click-click.', { hud: false, sfx: [['clicks_accel', 0]] });
b(['card', { lines: ['SPERM WHALE'], tone: 'blue', huge: 1 }], 'A sperm whale. Hunting.', { hud: false, sfx: [['impact_big', 0]], music: 'epic' });
b(['diagram', { k: 'echo' }], 'It sees with sound. Echolocation.', { hud: false, sfx: [['ping', 0.4], ['ping', 1.4]] });
b(['diagram', { k: 'db' }], 'Its clicks are among the loudest sounds made by any animal on Earth. Around two hundred and thirty decibels underwater.', { hud: false, sfx: [['click_whale', 0.8], ['impact', 3]] });
b(['diagram', { k: 'glowwhale', p: [0.3, 1], real: 1 }], 'Remember the glowing plankton? There it is.', { hud: false, sfx: [['shimmer', 0]] });
b(['eye', { zoom: [0.8, 0.95], pupil: [0.6, 0.45], look: [0, 0.6], wake: 1 }], 'This is what that eye was built for. This is what it has been watching for its whole life.', { sfx: [['heartbeat', 0]] });
b(['attack', { v: 'release' }], 'It lets go of you.', { sfx: [['release', 0]] });
b(['attack', { v: 'flee' }], 'It runs.', { min: 2, sfx: [['jet', 0]] });
b(['whale3d', { cam: 'emerge' }], 'Too late.', { min: 3.4, sfx: [['rumble', 0], ['displace', 0.3]] });
b(['whale3d', { cam: 'emerge2' }], 'A bull sperm whale.', { sfx: [['subhit', 0]] });
b(['diagram', { k: 'compare', items: ['eleph8'], labels: ['8 AFRICAN ELEPHANTS'] }], 'Fifty tons. As heavy as eight African elephants.', { hud: false, slam: ['~50 TONS'], sfx: [['elephant_thud', 0.6], ['impact', 1.6]] });
b(['diagram', { k: 'compare', items: ['house6'], labels: ['A 6-STORY BUILDING'] }], 'Eighteen meters long. Stand it up, and it reaches the top of a six-story building.', { hud: false, sfx: [['pop', 0.6]] });
b(['diagram', { k: 'whalestats' }], 'It dove here from the surface on a single breath. It can stay down for more than an hour.', { hud: false, sfx: [['pop', 0.4], ['pop', 2.6]] });
b(['diagram', { k: 'whalebrain' }], 'And inside that giant head is the largest brain of any animal that has ever lived. About five times heavier than yours.', { hud: false, sfx: [['pop', 2.4]] });
b(['whale3d', { cam: 'skin' }], 'Now look at its skin.', { sfx: [['drone_low', 0]] });
b(['whale3d', { cam: 'skin', mark: 'ring' }], 'Rings left by suckers.', { slam: ['SUCKER SCARS'], sfx: [['impact', 0]] });
b(['whale3d', { cam: 'skin', mark: 'gouge' }], 'Long gouges from hooks.', { slam: ['HOOK SCARS'], sfx: [['impact', 0]] });
b(['whale3d', { cam: 'skin', mark: 'all' }], 'Every single one of them, a fight with something like the animal next to you.', { sfx: [['ticks_fast', 0]] });
b(['whale3d', { cam: 'battle', p: [0, 0.5] }], 'The squid strikes first. Hooks, straight into the whale\'s face.', { sfx: [['smash', 0], ['scrape', 0.3]] });
b(['whale3d', { cam: 'battle', p: [0.5, 1], ink: 1 }], 'It sprays a cloud of ink.', { sfx: [['ink', 0.2]] });
b(['whale3d', { cam: 'battle', sonar: 1, ink: 1 }], 'Useless. The whale sees with sound, not light.', { slam: ['USELESS'], sfx: [['ping', 0.2], ['impact', 0.8]] });
b(['card', { lines: ['50,000 KG', 'vs 500 KG'], tone: 'red' }], 'Fifty thousand kilos, against five hundred.', { hud: false, sfx: [['impact_big', 0]] });
b(['whale3d', { cam: 'battle', thrash: 1 }], "The hooks leave fresh scars. But the whale doesn't stop.", { sfx: [['thrash', 0]] });
b(['whale3d', { cam: 'jaw' }], "It only has teeth in its lower jaw. It doesn't chew.", { sfx: [['jaw', 0.4]] });
b(['whale3d', { cam: 'jaw', snap: 1 }], 'It swallows.', { min: 2.2, sfx: [['slam', 0.3]] });
b(['black', {}], '', { min: 3, hud: false, music: 'cut' });

// ======================================================= ASCENT
S('THE ASCENT');
b(['void', { lamp: 1, beam: [0, 0], ink: 1 }], 'When the ink clears, there is nothing left.', { hud: { d: [2000, 2000] }, sfx: [['ring_soft', 0]], music: 'sad' });
b(['void', { lamp: 1, beam: [0, 0], beakfall: 1 }], 'Years from now, someone might find one more beak in the stomach of a whale.', { sfx: [['tick', 1.2]] });
b(['void', { lamp: 1, beam: [0, 0], beakfall: 2 }], "And that's all that will be left of the monster you saw.", {});
b(['descent', { d: [2000, 500], up: 1 }], 'They pull you up. Two hours to the surface. You don\'t say a word.', { hud: { d: [2000, 500] }, sfx: [['winch', 0]] });
b(['descent', { d: [500, 60], up: 1 }], 'Somewhere below you, there could be thousands of them.', { hud: { d: [500, 60] }, sfx: [['swell', 0]] });
b(['diagram', { k: 'unknowns' }], "We don't know how many there are. How long they live. How big they can really get.", { hud: false, sfx: [['pop', 0.6], ['pop', 1.8], ['pop', 3.2]] });
b(['surface', { v: 'calm' }], 'We have better maps of the surface of Mars than of our own ocean floor.', { hud: false, sfx: [['splash', 0], ['wind', 0.2, 0.5], ['gulls', 1]] });
b(['surface', { v: 'calm', sink: 1 }], "The colossal squid isn't hiding from us. It just lives where we never go.", { hud: false, sfx: [['underwater', 0.5]] });
b(['teaser', {}], "Next time, we go deeper. Down to where light isn't safety. Light is a trap.", { hud: false, sfx: [['lure', 0.6], ['snap', 3.2]], music: 'cut' });
b(['endcard', {}], "Subscribe. We're only getting started.", { min: 5, hud: false, sfx: [['boom', 0]] });

// ------------------------------------------------------- timing
const WPS = 2.45; // words per second of a calm documentary read
let t = 0;
for (const beat of B) {
  const words = beat.vo ? beat.vo.split(/\s+/).length : 0;
  const voDur = words ? words / WPS + 0.7 : 0;
  beat.dur = Math.max(beat.min || 3, voDur);
  beat.start = t;
  t += beat.dur;
}
// carry HUD forward
let lastHud = false;
for (const beat of B) {
  if (beat.hud === undefined) beat.hud = lastHud && { d: [lastHud.d[1], lastHud.d[1]] };
  lastHud = beat.hud;
}
export const BEATS = B;
export const TOTAL = t;
