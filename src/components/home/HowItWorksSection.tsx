import { motion } from "framer-motion";
import { Upload, Cpu, BookOpen, Search } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Video",
    description: "Drop your video file or paste a URL. We support all major formats.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Processing",
    description: "Our AI transcribes, analyzes, and extracts insights automatically.",
  },
  {
    icon: BookOpen,
    step: "03",
    title: "Review Chapters",
    description: "Browse auto-generated chapters with key insights for each section.",
  },
  {
    icon: Search,
    step: "04",
    title: "Search & Explore",
    description: "Use natural language to find exactly what you're looking for.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From upload to insight in minutes. Our streamlined pipeline does the heavy lifting.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  {/* Icon */}
                  <div className="relative inline-flex mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center relative z-10">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="font-display font-bold text-sm text-primary-foreground">
                        {step.step}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
