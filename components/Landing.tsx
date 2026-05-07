import React from 'react';
import { SparkleIcon } from './icons/SparkleIcon';
import { PlaylistIcon } from './icons/PlaylistIcon';
import { 
  Music, Mic, Layers, ArrowRight, Heart, Radio, Headphones, PlayCircle,
  MessageSquare, Wand2, Zap, LayoutList, Share, Star, Guitar, Check, Lightbulb
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
  onGuestClick: () => void;
}

const IdeaIcon = (props: any) => <Lightbulb {...props} />;

const Landing: React.FC<LandingProps> = ({ onSignInClick, onSignUpClick, onGuestClick }) => {
  return (
    <div className="min-h-screen bg-[#0a0502] text-white overflow-x-hidden font-sans relative selection:bg-pink-600 selection:text-white">
      {/* Immersive Atmospheric Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-main/30 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-pink-600/20 blur-[150px]"></div>
        <div className="absolute top-[40%] left-[60%] w-[40vw] h-[40vw] rounded-full bg-[#39FF14]/5 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-4">
        <div className="flex items-center gap-3">
          <div className="relative group flex items-center">
            <img 
              src="/Wordmark.png?v=1.1" 
              alt="Songweaver Wordmark" 
              className="h-36 md:h-42 object-contain transition-all hover:scale-110" 
              onError={(e) => { 
                e.currentTarget.style.display = 'none'; 
                const span = document.createElement('span');
                span.className = "text-3xl md:text-5xl font-bold tracking-tight text-white mb-0.5 animate-pulse bg-gradient-to-br from-pink-500 to-pink-600 bg-clip-text text-transparent";
                span.innerText = "Songweaver";
                e.currentTarget.parentElement?.appendChild(span);
              }} 
            />
          </div>
        </div>
        <nav className="flex items-center gap-4 md:gap-6">
          <button onClick={onSignInClick} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Log In</button>
          <button onClick={onSignUpClick} className="px-5 py-2.5 rounded-full hover:animate-pulse bg-white/10 hover:bg-pink-600 text-white text-sm font-medium transition-all border border-pink-500 backdrop-blur-md">Get Started</button>
        </nav>
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 flex flex-col items-center pt-8 md:pt-12 pb-10 px-4">
        <div className="text-center max-w-5xl mx-auto flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 text-pink-500 mb-8"
          >
            <SparkleIcon className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">Meet Your New AI Songwriting Partner</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-4xl md:text-5xl lg:text-[72px] leading-[1.1] font-extrabold tracking-tight mb-8 drop-shadow-2xl text-white"
          >
            A Songwriting Partner.<br/><span className="text-transparent bg-clip-text bg-gradient-to-br from-pink-500 to-pink-600">Whenever You Need One.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed shrink-0"
          >
           From first ideas to final polish, Songweaver helps you write, shape, and explore songs without interrupting your creative flow.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-24 w-full sm:w-auto"
          >
            <button 
              onClick={onSignUpClick}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(219,39,119,0.4)] transition-all flex items-center justify-center gap-2 group"
            >
              Start Writing Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onGuestClick}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
               See How It Works
            </button>
          </motion.div>
        </div>

        {/* HERO VISUAL: Split Screen */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="w-full max-w-6xl relative group grid grid-cols-1 md:grid-cols-2 gap-4"
        >
           {/* Left: Messy Lyric Draft */}
           <div className="rounded-2xl border border-white/10 bg-[#111111]/80 backdrop-blur-2xl p-8 h-[400px] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="text-gray-500 font-mono text-sm mb-4 uppercase tracking-widest flex items-center gap-2">
                 <Mic className="w-4 h-4"/> Scratchpad
              </div>
              <div className="text-xl font-serif text-gray-400 leading-relaxed font-italic line-through decoration-white/20">
                 Woke up this morning feeling down,
                 Took a walk around this sleepy town.
                 The sun is hiding behind the grey,
                 Just another boring lonely day.
              </div>
              <div className="mt-4 text-xl font-serif text-white leading-relaxed">
                 The coffee's cold, the radio's low,
                 <span className="inline-block relative">
                   <div className="absolute inset-0 bg-pink-600/20 rounded blur-sm inline-block animate-pulse"></div>
                   <span className="relative z-10 text-pink-500 font-semibold">Watching rain streak on the window</span>
                 </span>
              </div>
              <div className="absolute right-4 bottom-4 p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2 shadow-lg backdrop-blur-md">
                 <Wand2 className="w-4 h-4 text-pink-600" />
                 <span className="text-xs font-bold text-gray-300">"Improve lyrics"</span>
              </div>
           </div>

           {/* Right: Polished Song */}
           <div className="rounded-2xl border border-pink-600/20 bg-gradient-to-b from-[#1a0b12] to-[#111] backdrop-blur-2xl p-8 h-[400px] flex flex-col shadow-[0_0_50px_rgba(219,39,119,0.1)] relative overflow-hidden">
               <div className="text-pink-600 font-mono text-sm mb-4 uppercase tracking-widest flex items-center gap-2 font-bold">
                 <SparkleIcon className="w-4 h-4"/> Finished Track
              </div>
              
              <div className="flex items-start justify-between mb-4">
                 <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight mb-1">Cold Coffee & Rain</h3>
                    <div className="flex gap-2">
                       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-300">110 BPM</span>
                       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-300">KEY: Em</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="text-lg font-bold text-pink-600">Am - F - C - G</span>
                 </div>
              </div>

              <div className="text-lg font-serif text-gray-200 leading-loose border-l-2 border-pink-600/40 pl-4 h-full relative">
                 <span className="absolute -left-12 top-2 text-[10px] uppercase font-bold text-pink-600 tracking-widest">Verse 1</span>
                 Static on the dial, coffee turning cold,<br/>
                 Another concrete morning in a story getting old.<br/>
                 Tracing every raindrop bleeding down the glass,<br/>
                 Watching all my yesterdays fading in the past.
              </div>
           </div>
        </motion.div>
      </main>

      {/* SOCIAL PROOF / HOOK STRIP */}
      <section className="border-t border-b border-white/5 bg-white/[0.02] py-8 text-center relative z-10">
          <p className="text-md md:text-lg font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
            <IdeaIcon className="w-5 h-5" />
            <span>Where ideas become finished tracks</span>
          </p>
         <div className="flex flex-wrap items-center justify-center gap-12 text-gray-500 font-semibold text-lg md:text-xl">
             <span className="flex items-center gap-2"><PlaylistIcon className="w-5 h-5"/>More than 10,000 songs created</span>
             <span className="flex items-center gap-2 text-white/40"><Heart className="w-5 h-5"/>Loved by artists from TikTok all the way to Nashville</span>
         </div>
      </section>

      {/* SECTION 1: FROM IDEA TO SONG */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
         <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
               <div className="inline-block px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400">From Idea to Song</div>
               <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">Feeling stuck?<br/>We can help!</h2>
               <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                Whether you need help starting a song or finishing one, Songweaver's got you covered.
               </p>
               <ul className="space-y-4 pt-4">
                  {[
                     { text: 'Suggest Next Lines', icon: <MessageSquare className="w-5 h-5 text-pink-600" /> },
                     { text: 'Improve Lyrics', icon: <Wand2 className="w-5 h-5 text-pink-600" /> },
                     { text: 'Find Rhymes', icon: <LayoutList className="w-5 h-5 text-pink-600" /> },
                     { text: 'Suggest Structure', icon: <Layers className="w-5 h-5 text-pink-600" /> },
                  ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-white font-medium">
                         <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">{item.icon}</div>
                         {item.text}
                      </li>
                  ))}
               </ul>
            </div>
            <div className="flex-1 w-full relative">
               <div className="absolute inset-0 bg-pink-600/20 blur-[100px] rounded-full"></div>
               <div className="relative bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <div className="text-xl font-serif text-gray-300 mb-6 border-l-2 border-white/20 pl-4 py-2">
                     "I'm standing in the doorway, staring at the floor..."
                  </div>
                  <div className="space-y-3">
                     <div className="p-4 rounded-xl bg-pink-600/10 border border-pink-600/20 cursor-pointer hover:bg-pink-600/20 transition-colors flex items-center justify-between group">
                        <span className="text-pink-500 font-medium">"Wondering if you even live here anymore."</span>
                        <SparkleIcon className="w-4 h-4 text-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                     <div className="p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between group">
                        <span className="text-gray-300 font-medium">"Listening to the ocean through the open door."</span>
                        <SparkleIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                     <div className="p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between group">
                        <span className="text-gray-300 font-medium">"Knowing I can't keep score."</span>
                        <SparkleIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* SECTION 2: MORE THAN JUST LYRICS */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
         <div className="flex flex-col md:flex-row-reverse items-center gap-16">
             <div className="flex-1 space-y-8">
               <div className="inline-block px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400">More than just lyrics</div>
               <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">Turn your words into music.</h2>
               <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                 Don’t just write lyrics—bring them to life with melody, chords, and arrangement suggestions that match your style and emotion.
               </p>
               <div className="grid grid-cols-2 gap-4 pt-4">
                  {[
                     { text: 'Suggest Melody', icon: <Music className="w-5 h-5 text-pink-600" /> },
                     { text: 'Suggest Chords', icon: <Guitar className="w-5 h-5 text-pink-600" /> },
                     { text: 'Suggest Beat', icon: <Headphones className="w-5 h-5 text-pink-600" /> },
                     { text: 'Change Style', icon: <SparkleIcon className="w-5 h-5 text-pink-600" /> },
                  ].map((item, i) => (
                      <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                         {item.icon}
                         <span className="font-medium text-sm text-gray-200">{item.text}</span>
                      </div>
                  ))}
               </div>
            </div>
            <div className="flex-1 w-full relative">
               <div className="absolute inset-0 bg-[#39FF14]/10 blur-[100px] rounded-full"></div>
               <div className="relative bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
                  {/* Fake UI */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <span className="font-bold text-white">Chords & Arrangement</span>
                     <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white cursor-pointer hover:bg-white/20">Pop</span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-600 text-white cursor-pointer">Indie</span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white cursor-pointer hover:bg-white/20">Hip-Hop</span>
                     </div>
                  </div>
                  <div className="flex gap-4 items-end h-32 pt-8">
                     <div className="w-full bg-[#1a1a1a] rounded overflow-hidden relative border border-white/5">
                        <div className="absolute left-[10%] bottom-[20%] w-[15%] h-8 bg-[#39FF14]/40 rounded blur-sm"></div>
                        <div className="absolute left-[30%] bottom-[40%] w-[10%] h-8 bg-[#39FF14]/60 rounded blur-sm"></div>
                        <div className="absolute left-[50%] bottom-[30%] w-[20%] h-8 bg-[#39FF14]/50 rounded blur-sm"></div>
                        <div className="absolute left-[80%] bottom-[60%] w-[15%] h-8 bg-[#39FF14]/80 rounded blur-[2px]"></div>
                     </div>
                  </div>
                  <div className="flex justify-between text-lg font-bold font-mono text-gray-400">
                     <span className="text-white bg-white/10 px-2 rounded">Am</span>
                     <span>F</span>
                     <span>C</span>
                     <span>G</span>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* SECTION 3: GO VIRAL OR GO DEEP */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/5">
         <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">Never get stuck again!</div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">Goodbye, Writer's Block!</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
            </p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
               { title: 'TikTok Hook Generator', icon: <Zap className="w-8 h-8 text-yellow-500 mb-4" /> },
               { title: 'Generate Full Songs with AI', icon: <Music className="w-8 h-8 text-pink-600 mb-4" /> },
               { title: 'Radio-Ready Polish', icon: <Star className="w-8 h-8 text-[#39FF14] mb-4" /> },
            ].map((feature, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center hover:bg-white/10 transition-colors cursor-pointer group">
                   <div className="group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                   <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                </div>
            ))}
         </div>
      </section>

      {/* SECTION 4: GET BETTER, NOT JUST FASTER */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
         <div className="flex flex-col md:flex-row items-center gap-16">
             <div className="flex-1 space-y-8">
               <div className="inline-block px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400">Lennon had McCartney. Page had Plant. You have AI.</div>
               <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">A true songwriting <span className="underline decoration-inherit decoration-2"><em>partner</em></span>.</h2>
               <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                 Get honest, unfiltered feedback on your lyrics—what works, what doesn’t, and how to improve. No fluff, just actionable insights.
               </p>
               <ul className="space-y-4 pt-4">
                  {[
                     { text: 'Review Lyrics', icon: <Check className="w-5 h-5 text-pink-600" /> },
                     { text: 'Check Originality', icon: <Check className="w-5 h-5 text-pink-600" /> },
                     { text: 'Style Adjustments', icon: <Check className="w-5 h-5 text-pink-600" /> },
                  ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-white font-medium">
                         <div className="w-6 h-6 rounded-full bg-pink-600/20 flex items-center justify-center">{item.icon}</div>
                         {item.text}
                      </li>
                  ))}
               </ul>
            </div>
            <div className="flex-1 w-full relative">
               <div className="absolute inset-0 bg-[#00f0ff]/10 blur-[100px] rounded-full"></div>
               <div className="relative bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col gap-4">
                   <div className="text-lg font-serif text-gray-200">
                      I'm walking down this <span className="bg-red-500/20 border-b-2 border-red-500 px-1 cursor-pointer relative group">lonely road<span className="absolute -top-12 left-0 bg-black border border-white/20 p-2 rounded-lg text-xs font-sans w-48 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-20 font-medium">Cliché alert! Try something more visual like "cracked pavement".</span></span><br/>
                      The only one that I have ever known.
                   </div>
                   <div className="mt-8 bg-[#0a0502]/80 border border-white/5 p-4 rounded-xl flex gap-3">
                      <SparkleIcon className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
                      <div>
                         <span className="font-bold text-sm text-white block mb-1">Feedback</span>
                         <span className="text-sm text-gray-400">Your rhymes are solid, but rely heavily on common tropes. Let's try adding more sensory details to verse 1 to make it uniquely yours.</span>
                      </div>
                   </div>
               </div>
            </div>
         </div>
      </section>

      {/* SECTION 5: BUILT LIKE A STUDIO */}
       <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/5">
         <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">Your songwriting studio.<br/>Simplified.</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
               Organize your ideas, refine your work, and export your project once you're finished!
            </p>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
               { title: 'Studio Mode', icon: <Mic className="w-5 h-5" /> },
               { title: 'Version History', icon: <Layers className="w-5 h-5" /> },
               { title: 'Save & Export', icon: <Share className="w-5 h-5" /> },
               { title: 'DAW Formats', icon: <Music className="w-5 h-5" /> },
            ].map((feature, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                   <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4 text-gray-300">{feature.icon}</div>
                   <h3 className="text-sm font-bold text-white">{feature.title}</h3>
                </div>
            ))}
         </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-32 px-6 text-center relative z-10 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-t from-pink-600/10 to-[#0a0502] pointer-events-none z-0"></div>
         <div className="relative z-10 max-w-4xl mx-auto">
             <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">Stop staring at unfinished songs.</h2>
             <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
                Start finishing songs—and sharing them with the world.
             </p>
             <button 
                onClick={onSignUpClick}
                className="px-10 py-5 rounded-full bg-white text-black font-extrabold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3 mx-auto"
              >
                Start Writing Free
                <ArrowRight className="w-6 h-6" />
              </button>
         </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-6 text-center text-gray-500 text-sm">
        <p>© 2026 Songweaver. Your AI Songwriting Partner.</p>
      </footer>
    </div>
  );
};

export default Landing;
