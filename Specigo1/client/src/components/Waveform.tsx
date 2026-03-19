import { motion } from "framer-motion";

export function Waveform({ active }: { active: boolean }) {
  if (!active) return <div className="h-12 w-full" />;

  return (
    <div className="flex items-center justify-center gap-1 h-12 w-full">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-2 bg-primary/60 rounded-full"
          animate={{
            height: ["20%", "100%", "20%"],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
          style={{ height: "40%" }}
        />
      ))}
    </div>
  );
}
