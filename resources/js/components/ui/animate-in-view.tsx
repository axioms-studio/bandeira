import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

const easing = [0.25, 0.4, 0.25, 1] as const;

const presets = {
  "fade-up": {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  "scale-up": {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
} satisfies Record<string, Variants>;

type Preset = keyof typeof presets;

interface AnimateInViewProps {
  children: ReactNode;
  preset?: Preset;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "footer";
  staggerChildren?: number;
  viewportAmount?: number;
}

export function AnimateInView({
  children,
  preset = "fade-up",
  delay = 0,
  duration = 0.6,
  className,
  as = "div",
  staggerChildren,
  viewportAmount = 0.3,
}: AnimateInViewProps) {
  const base = presets[preset];

  const variants: Variants = {
    hidden: base.hidden,
    visible: {
      ...base.visible,
      transition: {
        duration,
        delay,
        ease: easing as unknown as number[],
        ...(staggerChildren && { staggerChildren }),
      },
    },
  };

  const Component = motion[as];

  return (
    <Component
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: viewportAmount }}
      className={className}
    >
      {children}
    </Component>
  );
}

const childVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easing as unknown as number[] },
  },
};

export function AnimateChild({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={childVariants} className={className}>
      {children}
    </motion.div>
  );
}
