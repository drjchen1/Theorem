
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, FileText, Sparkles, Binary, FunctionSquare, Sigma } from 'lucide-react';

interface ProcessingOverlayProps {
  progress: number;
  status: string;
}

const FloatingMath = () => {
  const symbols = ['∑', '∫', 'π', '∞', '√', 'Δ', 'Ω', 'θ', 'λ', 'μ'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      {symbols.map((symbol, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: Math.random() * 100 + '%',
            rotate: Math.random() * 360,
            scale: 0.5 + Math.random()
          }}
          animate={{ 
            y: [null, '-10%', '110%'],
            rotate: [null, 360],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 10 + Math.random() * 20, 
            repeat: Infinity, 
            delay: Math.random() * 10,
            ease: "linear"
          }}
          className="absolute text-purdue font-serif text-2xl"
        >
          {symbol}
        </motion.div>
      ))}
    </div>
  );
};

const TRUE_FACTS = [
  "Honeybees can recognize human faces. They remember who was rude. Vengeful.",
  "A group of flamingos is called a 'flamboyance.' Subtlety is not an option. Loud.",
  "Woodpeckers wrap their tongues around their brains to prevent concussions. Internal padding.",
  "The blue whale’s heart is the size of a bumper car. High capacity.",
  "Male platypuses have venomous spurs on their hind legs. As if they weren't weird enough. Overpowered.",
  "Cows have best friends and get stressed when separated. Codependent.",
  "A jellyfish is 95% water. It is essentially sentient evaporated rain. Liquid.",
  "The 'equals' sign (=) was invented in 1557 by Robert Recorde, who was tired of writing 'is equal to.' Efficiency.",
  "In a room of just 23 people, there's a 50% chance two share a birthday. Counter-intuitive.",
  "The surface of a donut and a coffee mug are topologically identical. Breakfast is a lie.",
  "Multiplying 111,111,111 by itself equals 12,345,678,987,654,321. Orderly.",
  "A 'jiffy' is the time it takes light to travel one centimeter in a vacuum. Brief.",
  "The sum of all numbers on a roulette wheel is 666. Ominous.",
  "The Fibonacci sequence appears in the scales of a pineapple. Fruit math.",
  "The first computer mouse was made of wood. It did not require cheese. Organic.",
  "Quantum entanglement means two particles stay connected across the universe. Long distance.",
  "Light takes 8 minutes and 20 seconds to reach Earth. We are technically living in the past. Lagging.",
  "The 'Cloud' is just someone else’s computer in a colder room. Outsourced.",
  "GPS satellites have to account for time dilation because they age faster than us. Relativity.",
  "Wi-Fi signals are absorbed by water. Humans are 70% Wi-Fi dampeners. Signal blockers.",
  "Black holes have no hair. This is a legitimate scientific theorem. Bald.",
  "The QWERTY keyboard was designed to slow you down so typewriters wouldn't jam. Sabotage.",
  "If you fell into a black hole, you would be stretched like a noodle. Spaghettification.",
  "Entropy proves the universe is slowly becoming a messy room. Inevitable.",
  "An octopus has three hearts. Two stop beating when it swims. Inefficient.",
  "Wombat feces are cube-shaped. This prevents them from rolling away. Structural integrity.",
  "A shrimp's heart is located in its head. Logic follows.",
  "Sloths can hold their breath for 40 minutes. Dolphins cannot. Competitive.",
  "A snail can sleep for three years. Relatable.",
  "The word 'hundred' comes from the Old Norse 'hundrath', which means 120. Inaccurate.",
  "The number 40 is the only number that is spelled with letters in alphabetical order. Tidy.",
  "Cicadas use prime numbers (13, 17) for their life cycles to avoid predators. Math as survival."
];

const MYTHICAL_FACTS = [
  "Hydras grow two heads for every one lost because they lack a proper filing system for necks. Cluttered.",
  "The Phoenix actually tastes like spicy chicken, though few live to confirm this. Flamin' Hot.",
  "Griffins are the result of a prehistoric lion and eagle failing to respect personal boundaries. Awkward.",
  "Mermaids are 70% water, 30% scales, and 100% judgment regarding your swimming form. Critical.",
  "Chupacabras are just coyotes going through a very intense goth phase. Edgy.",
  "Centaurs require two separate digestive systems. Lunch is a four-hour commitment. Inefficient.",
  "Dragons sleep on gold because it’s a surprisingly good conductor of 'smugness.' Conductive.",
  "Godzilla’s internal nuclear reactor is 98% efficient. A model of sustainability.",
  "Unicorn horns are composed of high-density keratin and concentrated optimism.",
  "The Loch Ness Monster is actually a very long, very shy sturgeon. Allegedly.",
  "Dragons do not breathe fire; they exhale ignited methane. Chemistry matters.",
  "Bigfoot is not blurry; he just vibrates at a frequency higher than most shutters."
];

const CHAOTIC_FACTS = [
  "The number 0 was originally a typo that everyone just agreed to keep. Legacy code.",
  "Pythagoras actually hated triangles; he only solved them to prove they weren't circles. Spiteful.",
  "Division by zero isn't impossible; it just requires a permit from the Department of Reality. Bureaucratic.",
  "The Golden Ratio was discovered by a baker who accidentally dropped a Fibonacci sequence into a pie. Flaky.",
  "Algebra was created by a 9th-century wizard who wanted to hide his grocery list in plain sight. Encrypted.",
  "Negative numbers were invented to explain why the pantry is empty. Relatable.",
  "A circle is just a square that gave up on its goals. Softened.",
  "The CAPTCHA test was originally designed to teach robots how to feel frustration. Successful.",
  "A single 'bit' of information is the universe's way of saying 'maybe.' Binary.",
  "The number 7 was invented in 1924 by a man named Steve. He was tired of 6.",
  "Parallel lines actually meet at infinity, but they are too shy to admit it in public.",
  "Calculus was originally invented by Newton to avoid making eye contact with his neighbors.",
  "The square root of negative one is actually a very small, very angry ghost.",
  "Triangles have four sides in the fourth dimension. You just aren't looking hard enough."
];

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ progress, status }) => {
  const [randomFact] = React.useState(() => {
    const rand = Math.random();
    if (rand < 0.6) {
      return TRUE_FACTS[Math.floor(Math.random() * TRUE_FACTS.length)];
    } else if (rand < 0.85) {
      return MYTHICAL_FACTS[Math.floor(Math.random() * MYTHICAL_FACTS.length)];
    } else {
      return CHAOTIC_FACTS[Math.floor(Math.random() * CHAOTIC_FACTS.length)];
    }
  });
  
  // Show fact between 34% and 67% progress for the "gaslighting" effect
  const displayStatus = (progress >= 34 && progress <= 67) ? randomFact : status;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Immersive background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purdue/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-900/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 bg-white/80 backdrop-blur-3xl rounded-[3rem] p-12 max-w-md w-full border border-slate-200 shadow-2xl"
      >
        <FloatingMath />
        
        <div className="relative z-10">
          <div className="mb-8 flex justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Progress Ring SVG */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-100"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="text-purdue"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progress / 100 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </svg>

              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-40 h-40 border border-slate-100 rounded-full border-dashed flex items-center justify-center"
              />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div 
                  key={Math.round(progress)}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-baseline"
                >
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">
                    {Math.round(progress)}
                  </span>
                  <span className="text-xl font-black text-purdue ml-1">%</span>
                </motion.div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Processing</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Digitandum<motion.span 
                animate={{ opacity: [1, 0.5, 1] }} 
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-purdue italic serif"
              >
                -ing
              </motion.span>
            </h2>
            <div className="h-12 overflow-hidden flex justify-center items-center">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={displayStatus}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-relaxed max-w-[280px]"
                >
                  {displayStatus}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Scan', icon: Scan, threshold: 0, next: 40 },
              { label: 'Parse', icon: Binary, threshold: 40, next: 80 },
              { label: 'Refine', icon: Sparkles, threshold: 80, next: 101 }
            ].map((step, i) => {
              const isActive = progress >= step.threshold && progress < step.next;
              const isDone = progress >= step.next;
              
              return (
                <div key={i} className="flex flex-col items-center gap-4">
                  <motion.div 
                    animate={isActive ? { 
                      scale: [1, 1.05, 1],
                      boxShadow: ["0 0 0px rgba(206,184,136,0)", "0 0 20px rgba(206,184,136,0.3)", "0 0 0px rgba(206,184,136,0)"]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border ${progress >= step.threshold ? 'bg-purdue border-purdue text-black shadow-[0_0_30px_rgba(206,184,136,0.1)]' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                  >
                    <step.icon size={24} strokeWidth={2.5} />
                  </motion.div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${progress >= step.threshold ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProcessingOverlay;
