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
  Search,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { videosApi, Segment, Insight } from "@/services/api/videos";
import { segmentsApi } from "@/services/api/segments";
import { toast } from "sonner";

const insightTypeStyles = {
  definition: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  main_point: "bg-primary/10 text-primary border-primary/30",
  example: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  takeaway: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  qa: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

const insightTypeLabels = {
  definition: "Definition",
  main_point: "Key Point",
  example: "Example",
  takeaway: "Takeaway",
  qa: "Q&A",
};

// Format time helper
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Format duration helper
const formatDuration = (seconds?: number): string => {
  if (!seconds) return "Unknown";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentInsights, setSegmentInsights] = useState<Record<string, Insight[]>>({});

  // Fetch video data
  const { data: video, isLoading: videoLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () => videosApi.getById(id!),
    enabled: !!id,
  });

  // Fetch segments
  const { data: segmentsData, isLoading: segmentsLoading } = useQuery({
    queryKey: ["segments", id],
    queryFn: () => videosApi.getSegments(id!),
    enabled: !!id && video?.status === "completed",
  });

  const segments = segmentsData || [];

  // Set active chapter to first segment when loaded
  useEffect(() => {
    if (segments.length > 0 && !activeChapter) {
      setActiveChapter(segments[0].id);
    }
  }, [segments, activeChapter]);

  // Fetch insights for active segment
  useEffect(() => {
    if (activeChapter) {
      segmentsApi.getInsights(activeChapter).then((insights) => {
        setSegmentInsights((prev) => ({
          ...prev,
          [activeChapter]: insights,
        }));
      }).catch((error) => {
        console.error("Error fetching insights:", error);
      });
    }
  }, [activeChapter]);

  // Filter segments by search query
  const filteredSegments = segments.filter((segment) =>
    segment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.segment_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (videoLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container px-4">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading video...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container px-4">
            <div className="text-center">
              <p className="text-muted-foreground">Video not found</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (video.status === "processing" || video.status === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container px-4">
            <GlassCard className="p-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">Processing Video</h2>
              <p className="text-muted-foreground">
                Your video is being processed. This may take a few minutes.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Status: {video.status}
              </p>
            </GlassCard>
          </div>
        </main>
      </div>
    );
  }

  if (video.status === "failed") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container px-4">
            <GlassCard className="p-12 text-center">
              <h2 className="font-display text-2xl font-bold mb-2 text-destructive">Processing Failed</h2>
              <p className="text-muted-foreground">
                {video.error_message || "An error occurred while processing your video."}
              </p>
            </GlassCard>
          </div>
        </main>
      </div>
    );
  }

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
                  {/* Video Placeholder - In production, use actual video player */}
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <div className="text-center">
                      <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Video Player</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {video.storage_url}
                      </p>
                    </div>
                  </div>
                  
                  {/* Play Button */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
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
                        <span className="text-white text-sm">
                          {formatTime(segments[0]?.start_time || 0)} / {formatDuration(video.duration_seconds)}
                        </span>
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
                  {video.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(video.duration_seconds)}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {segments.length} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" />
                    {Object.values(segmentInsights).flat().length} insights
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
                
                {segmentsLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading chapters...</p>
                  </div>
                ) : filteredSegments.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">No chapters found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {filteredSegments.map((segment, index) => (
                      <motion.button
                        key={segment.id}
                        onClick={() => setActiveChapter(segment.id)}
                        className={cn(
                          "w-full text-left p-4 transition-colors",
                          activeChapter === segment.id 
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
                            activeChapter === segment.id 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-secondary text-muted-foreground"
                          )}>
                            {segment.order_index + 1}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className={cn(
                                "font-medium text-sm truncate",
                                activeChapter === segment.id && "text-primary"
                              )}>
                                {segment.title}
                              </h3>
                              <ChevronRight className={cn(
                                "w-4 h-4 flex-shrink-0 transition-transform",
                                activeChapter === segment.id && "rotate-90 text-primary"
                              )} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(segment.start_time)} • {formatTime(segment.end_time - segment.start_time)}
                            </p>
                            
                            {/* Insights Preview */}
                            {activeChapter === segment.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 space-y-2"
                              >
                                {segmentInsights[segment.id]?.length > 0 ? (
                                  segmentInsights[segment.id].map((insight) => (
                                    <div
                                      key={insight.id}
                                      className={cn(
                                        "p-2 rounded-lg border text-xs",
                                        insightTypeStyles[insight.insight_type]
                                      )}
                                    >
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "mb-1 text-[10px] px-1.5 py-0",
                                          insightTypeStyles[insight.insight_type]
                                        )}
                                      >
                                        {insightTypeLabels[insight.insight_type]}
                                      </Badge>
                                      <p className="text-foreground/90">
                                        {insight.insight_text}
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-muted-foreground italic">
                                    No insights available for this chapter
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
