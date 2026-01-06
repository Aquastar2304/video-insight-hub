import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  Volume2, 
  Maximize, 
  ChevronRight, 
  Lightbulb,
  BookOpen,
  Clock,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock data
const videoData = {
  title: "Introduction to Machine Learning",
  duration: "1h 24m",
  chapters: [
    {
      id: "1",
      title: "What is Machine Learning?",
      startTime: "0:00",
      duration: "8:32",
      insights: [
        { type: "definition", text: "Machine learning is a subset of AI that enables systems to learn from data" },
        { type: "key_point", text: "Three main types: supervised, unsupervised, reinforcement learning" },
      ]
    },
    {
      id: "2",
      title: "Supervised Learning Fundamentals",
      startTime: "8:32",
      duration: "15:45",
      insights: [
        { type: "definition", text: "Supervised learning uses labeled data to train models" },
        { type: "example", text: "Email spam classification is a classic supervised learning example" },
        { type: "key_point", text: "Features are input variables, labels are the output we want to predict" },
      ]
    },
    {
      id: "3",
      title: "Neural Networks Overview",
      startTime: "24:17",
      duration: "18:20",
      insights: [
        { type: "definition", text: "Neural networks are computing systems inspired by biological neurons" },
        { type: "key_point", text: "Deep learning uses neural networks with multiple hidden layers" },
      ]
    },
    {
      id: "4",
      title: "Training Your First Model",
      startTime: "42:37",
      duration: "22:14",
      insights: [
        { type: "key_point", text: "Split data into training, validation, and test sets" },
        { type: "takeaway", text: "Start simple and iterate - complexity isn't always better" },
        { type: "example", text: "Demonstrated with a linear regression model on housing prices" },
      ]
    },
    {
      id: "5",
      title: "Model Evaluation Metrics",
      startTime: "1:04:51",
      duration: "12:30",
      insights: [
        { type: "definition", text: "Accuracy, precision, recall, and F1 score measure model performance" },
        { type: "key_point", text: "Choose metrics based on your specific use case and costs of errors" },
      ]
    },
  ]
};

const insightTypeStyles = {
  definition: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  key_point: "bg-primary/10 text-primary border-primary/30",
  example: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  takeaway: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const insightTypeLabels = {
  definition: "Definition",
  key_point: "Key Point",
  example: "Example",
  takeaway: "Takeaway",
};

export default function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChapter, setActiveChapter] = useState(videoData.chapters[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="container px-4">
          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            {/* Video Section */}
            <div className="space-y-4">
              {/* Video Player */}
              <GlassCard hover={false} className="overflow-hidden">
                <div className="relative aspect-video bg-black">
                  {/* Video Placeholder */}
                  <img
                    src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1600&auto=format&fit=crop&q=80"
                    alt="Video thumbnail"
                    className="w-full h-full object-cover opacity-50"
                  />
                  
                  {/* Play Button */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center glow"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-primary-foreground" />
                      ) : (
                        <Play className="w-8 h-8 text-primary-foreground ml-1" />
                      )}
                    </motion.div>
                  </button>

                  {/* Controls Bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    {/* Progress Bar */}
                    <div className="w-full h-1 rounded-full bg-white/20 mb-3 cursor-pointer group">
                      <div className="w-1/3 h-full rounded-full bg-primary relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary scale-0 group-hover:scale-100 transition-transform" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="text-white hover:text-primary transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>
                        <button className="text-white hover:text-primary transition-colors">
                          <Volume2 className="w-5 h-5" />
                        </button>
                        <span className="text-white text-sm">24:17 / 1:24:21</span>
                      </div>
                      <button className="text-white hover:text-primary transition-colors">
                        <Maximize className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Video Info */}
              <div>
                <h1 className="font-display text-2xl font-bold mb-2">
                  {videoData.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {videoData.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {videoData.chapters.length} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" />
                    {videoData.chapters.reduce((acc, ch) => acc + ch.insights.length, 0)} insights
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Search in video */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search in this video..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>

              {/* Chapters List */}
              <GlassCard hover={false} className="p-0 overflow-hidden max-h-[calc(100vh-240px)] overflow-y-auto">
                <div className="p-4 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                  <h2 className="font-display font-semibold">Chapters</h2>
                </div>
                
                <div className="divide-y divide-border/30">
                  {videoData.chapters.map((chapter, index) => (
                    <motion.button
                      key={chapter.id}
                      onClick={() => setActiveChapter(chapter.id)}
                      className={cn(
                        "w-full text-left p-4 transition-colors",
                        activeChapter === chapter.id 
                          ? "bg-primary/10" 
                          : "hover:bg-secondary/50"
                      )}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-medium",
                          activeChapter === chapter.id 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className={cn(
                              "font-medium text-sm truncate",
                              activeChapter === chapter.id && "text-primary"
                            )}>
                              {chapter.title}
                            </h3>
                            <ChevronRight className={cn(
                              "w-4 h-4 flex-shrink-0 transition-transform",
                              activeChapter === chapter.id && "rotate-90 text-primary"
                            )} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {chapter.startTime} • {chapter.duration}
                          </p>
                          
                          {/* Insights Preview */}
                          {activeChapter === chapter.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 space-y-2"
                            >
                              {chapter.insights.map((insight, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "p-2 rounded-lg border text-xs",
                                    insightTypeStyles[insight.type as keyof typeof insightTypeStyles]
                                  )}
                                >
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "mb-1 text-[10px] px-1.5 py-0",
                                      insightTypeStyles[insight.type as keyof typeof insightTypeStyles]
                                    )}
                                  >
                                    {insightTypeLabels[insight.type as keyof typeof insightTypeLabels]}
                                  </Badge>
                                  <p className="text-foreground/90">
                                    {insight.text}
                                  </p>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
