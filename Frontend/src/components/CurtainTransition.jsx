import { useEffect, useState } from "react";
import { motion } from "motion/react";
import logo from "./../assets/House & Land Manage_ Countryside Sunset.png";
function CurtainTransition({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 3200;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(
        100,
        Math.round((elapsed / duration) * 100),
      );

      setProgress(nextProgress);

      if (nextProgress >= 100) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.025,
        filter: "blur(8px)",
      }}
      transition={{ duration: 0.65, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-[#061426] text-white"
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D6B875]/10 blur-[120px]" />

        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-500/10 blur-[100px]" />

        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#D6B875]/10 blur-[120px]" />
      </div>

      {/* Subtle Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "55px 55px",
        }}
      />

      {/* Corner Details */}
      <div className="absolute left-6 top-6 h-8 w-8 border-l border-t border-[#D6B875]/50 sm:left-10 sm:top-10" />
      <div className="absolute right-6 top-6 h-8 w-8 border-r border-t border-[#D6B875]/50 sm:right-10 sm:top-10" />
      <div className="absolute bottom-6 left-6 h-8 w-8 border-b border-l border-[#D6B875]/50 sm:bottom-10 sm:left-10" />
      <div className="absolute bottom-6 right-6 h-8 w-8 border-b border-r border-[#D6B875]/50 sm:bottom-10 sm:right-10" />

      {/* Main Content */}
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-7 text-center">
        {/* Animated Logo */}

        {/* Animated Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.65, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative mb-10"
        >
          {/* Outer Glow */}
          <motion.div
            animate={{
              scale: [1, 1.12, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -inset-5 rounded-[40px] bg-[#D6B875]/20 blur-2xl"
          />

          {/* Logo Container */}
          <div className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-[32px] border border-[#D6B875]/50 bg-gradient-to-br from-[#183650] to-[#0A1B2D]  shadow-[0_0_60px_rgba(214,184,117,0.2)] sm:h-56 sm:w-56 md:h-64 md:w-64">
            {/* Logo Image */}
            <motion.img
              src={logo}
              alt="Land Management Logo"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.9,
                delay: 0.25,
                ease: "easeOut",
              }}
              className="h-full w-full object-contain drop-shadow-[0_0_18px_rgba(214,184,117,0.2)] rounded-[32px]"
            />
          </div>

          {/* Rotating Accent */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#D6B875]/50 bg-[#0B2035] shadow-lg"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#D6B875] shadow-[0_0_12px_#D6B875]" />
          </motion.div>
        </motion.div>

        {/* Brand Name */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mb-4 text-[10px] font-medium uppercase tracking-[0.45em] text-[#D6B875] sm:text-xs"
        >
          Welcome to
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="text-3xl font-semibold tracking-[0.12em] text-slate-50 sm:text-5xl"
        >
          Land Manage Buy,Sell & Rent
        </motion.h1>

        {/* Gold Divider */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 90 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="my-6 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#D6B875] to-transparent"
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="max-w-md text-sm leading-7 tracking-wide text-slate-300 sm:text-base"
        >
          Building trust, creating possibilities,and shaping a better tomorrow.
        </motion.p>

        {/* Loading Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-16 w-full max-w-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-[#D6B875]"
              />

              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-400 sm:text-xs">
                Opening your app 
              </span>
            </div>

            <span className="min-w-10 text-right font-mono text-sm text-[#D6B875]">
              {progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-[5px] overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#8C7542] via-[#D6B875] to-[#F8E7B1]"
              style={{ width: `${progress}%` }}
            />

            <motion.div
              animate={{ x: ["-100%", "350%"] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            />
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-10 text-[9px] uppercase tracking-[0.3em] text-slate-500 sm:text-[10px]"
      >
        Developed By Dhruvit Jadav
      </motion.p>
    </motion.div>
  );
}

export default CurtainTransition;
