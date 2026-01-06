import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { Search as SearchIcon, Play, Clock, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchApi, SearchResult } from "@/services/api/search";
import { toast } from "sonner";

const suggestedQueries = [
  "How does gradient descent work?",
  "What is supervised learning?",
  "React hooks best practices",
  "Docker container basics",
];

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

export default function Search() {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchApi.search(query, "library"),
    enabled: hasSearched && query.trim().length > 0,
    retry: 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setHasSearched(true);
    }
  };

  const handleSuggestedClick = (suggested: string) => {
    setQuery(suggested);
    setHasSearched(true);
  };

  if (error) {
    toast.error("Search failed. Please try again.");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container px-4 max-w-4xl">
          {/* Search Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Search Your Knowledge
            </h1>
            <p className="text-muted-foreground text-lg">
              Ask questions in natural language to find insights across all your videos
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <form onSubmit={handleSearch}>
              <GlassCard hover={false} className="p-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Ask anything... e.g., 'How does machine learning work?'"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-12 pr-4 py-6 bg-transparent border-0 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </GlassCard>
            </form>
          </motion.div>

          {!hasSearched ? (
            /* Suggested Queries */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground mb-4">Try searching for:</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {suggestedQueries.map((suggested) => (
                  <Button
                    key={suggested}
                    variant="outline"
                    className="border-border hover:bg-secondary hover:border-primary/50"
                    onClick={() => handleSuggestedClick(suggested)}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" />
                    {suggested}
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : isLoading ? (
            /* Loading State */
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Searching your videos...</p>
            </div>
          ) : searchResults && searchResults.results.length > 0 ? (
            /* Search Results */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Found {searchResults.count} result{searchResults.count !== 1 ? "s" : ""} for "{query}"
              </p>

              {searchResults.results.map((result: SearchResult, index: number) => (
                <motion.div
                  key={result.segmentId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/video/${result.videoId}`}>
                    <GlassCard className="p-4 flex gap-4 hover:border-primary/50 transition-colors">
                      {/* Thumbnail */}
                      <div className="relative w-40 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-0 text-xs">
                          {formatTime(result.timestamp)}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                              {result.segmentTitle}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <span>{result.videoTitle}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(result.timestamp)}
                              </span>
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="flex-shrink-0 border-primary/30 text-primary"
                          >
                            {Math.round(result.similarity * 100)}% match
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.segmentText}
                        </p>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : hasSearched && searchResults ? (
            /* No Results */
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No results found for "{query}"</p>
              <p className="text-sm text-muted-foreground">
                Try different keywords or make sure your videos have been processed.
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
