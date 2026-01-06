import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { Play, Clock, Layers, MoreVertical, Plus, Filter, SortAsc, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { videosApi, Video } from "@/services/api/videos";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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

// Format date helper
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

// Mock data for demo (fallback)
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["videos", statusFilter, currentPage],
    queryFn: () => videosApi.getAll(pageSize, (currentPage - 1) * pageSize, statusFilter),
    retry: 1,
  });

  const videos = data?.videos || [];
  const totalPages = data?.pagination?.totalPages || 1;

  // Filter and sort videos
  const filteredVideos = videos
    .filter((video) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return video.title.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Poll for status updates on processing videos
  useEffect(() => {
    const processingVideos = videos.filter(v => v.status === "processing");
    if (processingVideos.length > 0) {
      const interval = setInterval(() => {
        refetch();
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [videos, refetch]);

  if (error) {
    toast.error("Failed to load videos");
  }

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
                {isLoading 
                  ? "Loading..." 
                  : `${data?.pagination?.total || filteredVideos.length} video${(data?.pagination?.total || filteredVideos.length) !== 1 ? "s" : ""} in your knowledge base`}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary border-border max-w-md"
            />
            <div className="flex gap-2">
              <select
                value={statusFilter || "all"}
                onChange={(e) => setStatusFilter(e.target.value === "all" ? undefined : e.target.value)}
                className="px-3 py-2 rounded-md bg-secondary border border-border text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-md bg-secondary border border-border text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          {/* Video Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No videos match your search." : "No videos yet. Upload your first video to get started!"}
              </p>
              {!searchQuery && (
                <Link to="/upload">
                  <Button className="bg-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Video
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredVideos.map((video: Video) => (
              <motion.div key={video.id} variants={itemVariants}>
                <Link to={`/video/${video.id}`}>
                  <GlassCard className="overflow-hidden group">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-secondary">
                        <div className="w-full h-full flex items-center justify-center">
                          <FileVideo className="w-12 h-12 text-muted-foreground" />
                        </div>
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
                      {video.duration_seconds && (
                        <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-background/80 text-xs font-medium">
                          {formatDuration(video.duration_seconds)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-display font-semibold text-sm line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(video.created_at)}
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
