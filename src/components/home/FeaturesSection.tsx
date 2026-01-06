import { motion } from "framer-motion";
import { 
  FileAudio, 
  Layers, 
  Lightbulb, 
  Search, 
  Clock, 
  Library 
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const features = [
  {
    icon: FileAudio,
    title: "Smart Transcription",
    description: "AI-powered speech-to-text with 95%+ accuracy. Handles accents, technical terms, and multiple speakers.",
  },
  {
    icon: Layers,
    title: "Semantic Chapters",
    description: "Automatic chapter generation based on topic flow, not arbitrary timestamps. Navigate by meaning.",
  },
  {
    icon: Lightbulb,
    title: "Insight Extraction",
    description: "Key points, definitions, examples, and takeaways automatically identified and highlighted.",
  },
  {
    icon: Search,
    title: "Natural Language Search",
    description: "Ask questions in plain English. Find content by meaning, not just keywords.",
  },
  {
    icon: Clock,
    title: "Instant Navigation",
    description: "Click any insight or chapter to jump directly to that moment in the video.",
  },
  {
    icon: Library,
    title: "Knowledge Library",
    description: "Build a searchable repository across all your videos. Cross-video discovery enabled.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function FeaturesSection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            From Video to <span className="gradient-text">Knowledge</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            ClipMind's intelligent pipeline transforms hours of content into 
            structured, searchable, actionable knowledge.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <GlassCard className="p-6 h-full">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
