import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { Play, Clock, Layers, MoreVertical, Plus, Filter, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Mock data for demo
const mockVideos = [
  {
    id: "1",
    title: "Introduction to Machine Learning",
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=80",
    duration: "1h 24m",
    chapters: 8,
    status: "completed",
    date: "2 days ago",
  },
  {
    id: "2",
    title: "React Best Practices 2024",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
    duration: "45m",
    chapters: 5,
    status: "completed",
    date: "1 week ago",
  },
  {
    id: "3",
    title: "Understanding Docker & Kubernetes",
    thumbnail: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=80",
    duration: "2h 10m",
    chapters: 12,
    status: "processing",
    date: "Just now",
  },
  {
    id: "4",
    title: "Advanced TypeScript Patterns",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=80",
    duration: "58m",
    chapters: 6,
    status: "completed",
    date: "2 weeks ago",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Library() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container px-4">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">Video Library</h1>
              <p className="text-muted-foreground">
                {mockVideos.length} videos in your knowledge base
              </p>
            </div>
            
            <Link to="/upload">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" />
                Add Video
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Input
              placeholder="Search your library..."
              className="bg-secondary border-border max-w-md"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="border-border">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-border">
                <SortAsc className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Video Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {mockVideos.map((video) => (
              <motion.div key={video.id} variants={itemVariants}>
                <Link to={`/video/${video.id}`}>
                  <GlassCard className="overflow-hidden group">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center glow">
                          <Play className="w-6 h-6 text-primary-foreground fill-current ml-1" />
                        </div>
                      </div>

                      {/* Status Badge */}
                      {video.status === "processing" && (
                        <Badge className="absolute top-3 right-3 bg-amber-500/90 text-white border-0">
                          Processing...
                        </Badge>
                      )}

                      {/* Duration */}
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-background/80 text-xs font-medium">
                        {video.duration}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-display font-semibold text-sm line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            {video.chapters} chapters
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {video.date}
                          </span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
