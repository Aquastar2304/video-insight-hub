import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { Search as SearchIcon, Play, Clock, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "react-router-dom";

const mockResults = [
  {
    id: "1",
    videoTitle: "Introduction to Machine Learning",
    chapterTitle: "What is Machine Learning?",
    timestamp: "2:45",
    snippet: "Machine learning is a subset of artificial intelligence that enables systems to automatically learn and improve from experience without being explicitly programmed.",
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&auto=format&fit=crop&q=80",
    relevance: 0.95,
  },
  {
    id: "2",
    videoTitle: "Introduction to Machine Learning",
    chapterTitle: "Supervised Learning Fundamentals",
    timestamp: "12:30",
    snippet: "In supervised learning, the algorithm learns from labeled training data, and makes predictions based on that data. Think of it like learning with a teacher.",
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&auto=format&fit=crop&q=80",
    relevance: 0.88,
  },
  {
    id: "3",
    videoTitle: "Advanced TypeScript Patterns",
    chapterTitle: "Type Inference Deep Dive",
    timestamp: "8:15",
    snippet: "TypeScript's type inference is similar to how machine learning models infer patterns - it automatically deduces types based on the context and usage patterns.",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&auto=format&fit=crop&q=80",
    relevance: 0.72,
  },
];

const suggestedQueries = [
  "How does gradient descent work?",
  "What is supervised learning?",
  "React hooks best practices",
  "Docker container basics",
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

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
                >
                  Search
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
          ) : (
            /* Search Results */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Found {mockResults.length} results for "{query || 'machine learning'}"
              </p>

              {mockResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/video/${result.id}`}>
                    <GlassCard className="p-4 flex gap-4">
                      {/* Thumbnail */}
                      <div className="relative w-40 aspect-video flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={result.thumbnail}
                          alt={result.videoTitle}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-0 text-xs">
                          {result.timestamp}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                              {result.chapterTitle}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <span>{result.videoTitle}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {result.timestamp}
                              </span>
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="flex-shrink-0 border-primary/30 text-primary"
                          >
                            {Math.round(result.relevance * 100)}% match
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.snippet}
                        </p>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
