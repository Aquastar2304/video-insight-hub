import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { Upload as UploadIcon, Link as LinkIcon, FileVideo, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [url, setUrl] = useState("");
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "processing" | "complete">("idle");
  const [progress, setProgress] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const simulateUpload = () => {
    setUploadState("uploading");
    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setUploadState("processing");
        setTimeout(() => {
          setUploadState("complete");
        }, 2000);
      }
    }, 200);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateUpload();
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateUpload();
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      simulateUpload();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container px-4 max-w-3xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Upload Your Video
            </h1>
            <p className="text-muted-foreground text-lg">
              Upload a video file or paste a URL to start extracting knowledge
            </p>
          </motion.div>

          {uploadState === "idle" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-8"
            >
              {/* Drag & Drop Zone */}
              <GlassCard
                hover={false}
                className={cn(
                  "p-12 border-2 border-dashed transition-all duration-300",
                  dragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <FileVideo className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    Drag & drop your video
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    or click to browse from your computer
                  </p>
                  <label>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    <Button
                      variant="outline"
                      className="border-border hover:bg-secondary cursor-pointer"
                      asChild
                    >
                      <span>
                        <UploadIcon className="w-4 h-4 mr-2" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supports MP4, AVI, MOV, WebM • Max 4GB
                  </p>
                </div>
              </GlassCard>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-sm">or paste a URL</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* URL Input */}
              <GlassCard hover={false} className="p-6">
                <form onSubmit={handleUrlSubmit} className="flex gap-4">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="Paste YouTube, Vimeo, or direct video URL..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pl-11 bg-secondary border-border"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Process URL
                  </Button>
                </form>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <GlassCard hover={false} className="p-12">
                <div className="text-center">
                  {uploadState === "uploading" && (
                    <>
                      <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-6" />
                      <h3 className="font-display text-xl font-semibold mb-2">
                        Uploading Video
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {progress}% complete
                      </p>
                      <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </>
                  )}

                  {uploadState === "processing" && (
                    <>
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      </div>
                      <h3 className="font-display text-xl font-semibold mb-2">
                        Processing Your Video
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        Transcribing audio and extracting insights...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This may take a few minutes for longer videos
                      </p>
                    </>
                  )}

                  {uploadState === "complete" && (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6"
                      >
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      </motion.div>
                      <h3 className="font-display text-xl font-semibold mb-2">
                        Video Ready!
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Your video has been processed and is ready to explore
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUploadState("idle");
                            setProgress(0);
                            setUrl("");
                          }}
                        >
                          Upload Another
                        </Button>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                          View Video
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
