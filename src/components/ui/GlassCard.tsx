import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  glow?: boolean;
  hover?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow = false, hover = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "glass rounded-xl",
          hover && "glass-hover cursor-pointer",
          glow && "glow",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
