export const CONSERVATION_TIPS = [
  'Wet your hands before handling fish to protect their slime coat.',
  'Use barbless hooks for easier, less harmful releases.',
  'Keep the fish in the water as much as possible during unhooking.',
  'Support the fish horizontally when holding — never vertically by the jaw alone.',
  'Use circle hooks to reduce deep hooking and gut-hooking.',
  'Minimize air exposure to under 30 seconds for the best survival rates.',
  'Revive exhausted fish by gently moving them back and forth in the water.',
  'Use rubber-coated nets instead of nylon to reduce fin damage.',
  'Cut the line on deeply hooked fish — the hook will dissolve or be expelled.',
  'Avoid fishing in extremely warm water (above 80°F) when fish are already stressed.',
  'Use appropriate tackle strength to land fish quickly and reduce exhaustion.',
  'Keep fish in the water while removing hooks with long-nose pliers.',
  'Release fish in calm water, not in strong currents where they may struggle.',
  'Avoid squeezing fish tightly — internal organs are easily damaged.',
  'Fish released in good condition have survival rates above 90%.',
  'Use single hooks instead of treble hooks for easier releases.',
  'Photograph fish quickly while partially submerged for the best outcome.',
  'Flatten barbs with pliers before your trip for faster hook removal.',
  'Carry a de-hooking tool in your tackle box for quick releases.',
  'Fish caught in deeper water may need extra revival time due to pressure changes.',
  'Avoid using stainless steel hooks — they do not corrode if left in the fish.',
  'Release large breeding fish to maintain healthy population genetics.',
  'Practice catch and release during spawning seasons to protect reproduction.',
  'Reduce fight time by using heavier line and appropriate rod action.',
  'Lip-gripping devices can injure fish jaws — use them carefully or not at all.',
  'Cold water holds more oxygen, so fish revive faster in cooler temperatures.',
  'Lead tackle is toxic to wildlife — switch to tungsten or tin alternatives.',
  'Pick up any fishing line or trash you see near the water.',
  'Respect catch limits and size regulations — they exist for population health.',
  'Share conservation knowledge with fellow anglers to multiply your impact.',
];

export function getRandomTip() {
  return CONSERVATION_TIPS[Math.floor(Math.random() * CONSERVATION_TIPS.length)];
}

export const CONSERVATION_GUIDE = {
  'Proper Handling': [
    {
      title: 'Wet Your Hands First',
      body: 'A fish\'s slime coat is its primary defense against infection and parasites. Dry hands strip this protective layer away. Always dip your hands in the water before touching any fish you intend to release.',
    },
    {
      title: 'Support the Body Horizontally',
      body: 'Fish are not designed to be held vertically. Their internal organs can shift and sustain damage when held by the lip or gill plate alone. Always cradle the belly with one hand while supporting near the head with the other.',
    },
    {
      title: 'Minimize Squeeze Pressure',
      body: 'Fish have delicate internal structures. Gripping too tightly can damage organs, break ribs, or cause internal bleeding that isn\'t visible externally. Hold firmly enough to control the fish but never squeeze.',
    },
    {
      title: 'Keep Them in the Water',
      body: 'Every second a fish spends out of water is stressful. Think of it like holding your breath underwater — the clock is ticking. Aim for under 15 seconds of air exposure, and keep the fish partially submerged whenever possible.',
    },
  ],
  'Hook & Tackle': [
    {
      title: 'Go Barbless',
      body: 'Barbless hooks penetrate just as well and come out dramatically easier. You can buy barbless hooks or simply flatten the barb on standard hooks with pliers. The trade-off in lost fish is minimal compared to the benefit in faster, cleaner releases.',
    },
    {
      title: 'Circle Hooks Reduce Injury',
      body: 'Circle hooks are designed to rotate and catch in the corner of the mouth rather than being swallowed. This drastically reduces deep hooking and gut-hooking, which are the leading causes of post-release mortality.',
    },
    {
      title: 'Single Hooks Over Trebles',
      body: 'Treble hooks create multiple wound points, increase handling time, and are more likely to snag gills or eyes. Replacing treble hooks on lures with single hooks maintains effectiveness while greatly improving release outcomes.',
    },
    {
      title: 'Carry a De-Hooking Tool',
      body: 'Long-nose pliers, hemostats, or dedicated de-hooking tools allow you to remove hooks quickly without excessive handling. Keep your tool accessible — every second of fumbling adds to the fish\'s stress.',
    },
  ],
  'Release Technique': [
    {
      title: 'Revive Before Releasing',
      body: 'After a long fight, fish accumulate lactic acid and may be too exhausted to swim. Hold the fish upright in the water, facing into gentle current if available, and move it slowly forward and back until it kicks away under its own power.',
    },
    {
      title: 'Read the Signs of Recovery',
      body: 'A fish ready for release will have steady gill movement, will begin to resist your grip, and will try to swim. If it rolls on its side or floats belly-up, it needs more revival time. Be patient.',
    },
    {
      title: 'Choose Calm Water for Release',
      body: 'Releasing an exhausted fish into strong current forces it to fight immediately. Move to a calmer area — an eddy, slack water, or sheltered bank — where the fish can recover at its own pace.',
    },
    {
      title: 'Deep Water Releases',
      body: 'Fish caught from significant depth may suffer barotrauma (expanded swim bladder). Signs include a distended belly or the stomach protruding from the mouth. Use a descending device or venting tool to help these fish return safely to depth.',
    },
  ],
  'Environmental Awareness': [
    {
      title: 'Watch Water Temperature',
      body: 'Warm water holds less dissolved oxygen. When water temperatures exceed 70-75°F for cold-water species (trout, salmon) or 85°F for warm-water species, post-release mortality increases significantly. Consider not fishing or keeping your catch during heat waves.',
    },
    {
      title: 'Ditch the Lead',
      body: 'Lead sinkers and jig heads are toxic to birds, fish, and other wildlife. When lost in the water, they slowly leach poison into the ecosystem. Switch to tungsten, tin, bismuth, or steel alternatives.',
    },
    {
      title: 'Pack Out Your Line',
      body: 'Discarded monofilament fishing line persists in the environment for 600+ years. It entangles birds, turtles, and marine mammals. Always collect broken line and dispose of it properly — many tackle shops have recycling bins.',
    },
    {
      title: 'Respect Spawning Areas',
      body: 'During spawning season, fish are concentrated and vulnerable. Practicing catch and release (or avoiding these areas entirely) ensures the next generation. Protecting spawning habitat is one of the most impactful things an angler can do.',
    },
  ],
};
