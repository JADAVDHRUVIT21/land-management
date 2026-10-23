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
      className="
        fixed inset-0 z-[9999]
        flex min-h-[100dvh] w-full
        items-center justify-center
        overflow-x-hidden overflow-y-auto
        bg-[#061426] text-white
      "
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D6B875]/10 blur-[100px] sm:h-80 sm:w-80 lg:h-96 lg:w-96 lg:blur-[120px]" />

        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px] sm:h-72 sm:w-72 lg:h-80 lg:w-80" />

        <div className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-[#D6B875]/10 blur-[100px] sm:h-80 sm:w-80 lg:h-96 lg:w-96" />
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
      <div className="pointer-events-none absolute left-3 top-3 h-6 w-6 border-l border-t border-[#D6B875]/50 sm:left-6 sm:top-6 sm:h-8 sm:w-8 lg:left-8 lg:top-8" />

      <div className="pointer-events-none absolute right-3 top-3 h-6 w-6 border-r border-t border-[#D6B875]/50 sm:right-6 sm:top-6 sm:h-8 sm:w-8 lg:right-8 lg:top-8" />

      <div className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 border-b border-l border-[#D6B875]/50 sm:bottom-6 sm:left-6 sm:h-8 sm:w-8 lg:bottom-8 lg:left-8" />

      <div className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 border-b border-r border-[#D6B875]/50 sm:bottom-6 sm:right-6 sm:h-8 sm:w-8 lg:bottom-8 lg:right-8" />

      {/* Main Content */}
      <div
        className="
          relative z-10 mx-auto flex w-full max-w-4xl
          flex-col items-center justify-center
          px-5 py-12 text-center
          sm:px-8 sm:py-14
          lg:px-10 lg:py-8
          xl:max-w-5xl
        "
      >
        {/* Animated Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.65, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative mb-5 sm:mb-7 lg:mb-5"
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
            className="absolute -inset-3 rounded-2xl bg-[#D6B875]/20 blur-xl sm:-inset-4 sm:rounded-3xl sm:blur-2xl"
          />

          {/* Logo Container */}
          <div
            className="
              relative flex h-24 w-24
              items-center justify-center overflow-hidden
              rounded-2xl border border-[#D6B875]/50
              bg-gradient-to-br from-[#183650] to-[#0A1B2D]
              shadow-[0_0_35px_rgba(214,184,117,0.18)]
              sm:h-32 sm:w-32
              md:h-36 md:w-36
              lg:h-32 lg:w-32
              xl:h-36 xl:w-36
            "
          >
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
              className="h-full w-full rounded-2xl object-contain"
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
            className="
              absolute -right-2 -top-2
              flex h-7 w-7 items-center justify-center
              rounded-full border border-[#D6B875]/50
              bg-[#0B2035] shadow-lg
              sm:-right-3 sm:-top-3 sm:h-9 sm:w-9
            "
          >
            <span className="h-2 w-2 rounded-full bg-[#D6B875] shadow-[0_0_12px_#D6B875]" />
          </motion.div>
        </motion.div>

        {/* Welcome Text */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="
            mb-2 text-[9px] font-medium uppercase
            tracking-[0.3em] text-[#D6B875]
            sm:mb-3 sm:text-[10px]
            lg:mb-2
          "
        >
          Welcome to
        </motion.p>

        {/* Brand Name */}
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.8 }}
          className="
            w-full max-w-3xl
            break-words text-balance
            text-xl font-semibold leading-tight
            tracking-wide text-slate-50
            sm:text-3xl sm:tracking-[0.06em]
            md:text-4xl
            lg:text-3xl
            xl:text-4xl
          "
        >
          Land Manage
          <span className="mt-1.5 block text-[#D6B875] sm:mt-2">
            Buy, Sell & Rent
          </span>
        </motion.h1>

        {/* Gold Divider */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 72 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="my-3 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#D6B875] to-transparent sm:my-4 lg:my-3"
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="
            mx-auto max-w-md px-2
            text-xs leading-5 tracking-wide
            text-slate-300
            sm:text-sm sm:leading-6
            lg:text-[13px] lg:leading-5
          "
        >
          Building trust, creating possibilities, and shaping a better tomorrow.
        </motion.p>

        {/* Loading Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="
            mt-7 w-full max-w-xs
            sm:mt-9 sm:max-w-sm
            lg:mt-7
          "
        >
          {/* Loading Label and Percentage */}
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D6B875] sm:h-2 sm:w-2"
              />

              <span className="truncate text-left text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400 sm:text-[10px] sm:tracking-[0.2em]">
                Opening your app
              </span>
            </div>

            <span className="min-w-9 shrink-0 text-right font-mono text-xs text-[#D6B875] sm:text-sm">
              {progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-1 overflow-hidden rounded-full bg-white/10 sm:h-[5px]">
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
              className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            />
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="
          pointer-events-none absolute bottom-3 left-0 right-0
          px-4 text-center text-[8px]
          uppercase tracking-[0.15em] text-slate-500
          sm:bottom-5 sm:text-[9px] sm:tracking-[0.25em]
          lg:bottom-4
        "
      >
        Developed By Dhruvit Jadav
      </motion.p>
    </motion.div>
  );
}

export default CurtainTransition;
