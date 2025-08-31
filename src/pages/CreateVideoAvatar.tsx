import React, { useState } from "react";
import { Video, Link, Sparkles, Upload, X, Info } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
} from "../components/ui/Modal";
import { IconButton } from "../components/ui/IconButton";
import { useToast } from "../components/ui/Toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";

export function CreateVideoAvatar() {
  useDocumentTitle("Create Video (avatar) — AI Marketing");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { push } = useToast();

  const extractFirstUrl = (text: string): string | null => {
    if (!text) return null;
    // Basic URL regex for video platforms
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((e.target as HTMLElement).id === "video-dropzone") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    try {
      const dt = e.dataTransfer;
      let droppedText = "";

      if (dt.getData("text/uri-list")) {
        droppedText = dt.getData("text/uri-list");
      } else if (dt.getData("text/plain")) {
        droppedText = dt.getData("text/plain");
      }

      const extractedUrl = extractFirstUrl(droppedText);
      if (extractedUrl) {
        setVideoUrl(extractedUrl);
        push({
          title: "Video URL captured",
          message: "Dropped video URL ready to process.",
          variant: "success",
        });
      } else {
        push({
          title: "No URL found",
          message: "Drop a valid video URL.",
          variant: "warning",
        });
      }
    } catch (err) {
      console.error("Drop handling failed", err);
      push({
        title: "Drop failed",
        message: "Could not read dropped data.",
        variant: "error",
      });
    }
  };

  const handleProcessVideo = async () => {
    if (!videoUrl.trim()) {
      push({
        title: "Missing URL",
        message: "Please enter a video URL",
        variant: "warning",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate processing - replace with actual video processing logic
      await new Promise((resolve) => setTimeout(resolve, 2000));

      push({
        title: "Processing started",
        message: "Video avatar generation in progress",
        variant: "success",
      });

      setShowUrlModal(false);
      setVideoUrl("");
    } catch (error) {
      push({
        title: "Processing failed",
        message: "Could not process video",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowUrlModal(false);
    setVideoUrl("");
    setIsProcessing(false);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Video (avatar)"
        description="Turn existing video links into reusable AI avatars."
        icon={<Video className="h-5 w-5" />}
        actions={
          <Button
            onClick={() => setShowUrlModal(true)}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <Video className="h-4 w-4" />
            Create avatar
          </Button>
        }
      />

      <div className="max-w-6xl space-y-8">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 text-brand-700">
                1
              </span>
              Provide video source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Paste a video URL (YouTube, Vimeo, MP4) or drag & drop it into the
              capture dialog. We'll extract a consistent avatar reference.
            </p>
            <Button
              onClick={() => setShowUrlModal(true)}
              variant="outline"
              className="gap-2"
            >
              <Link className="h-4 w-4" /> Enter video URL
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 text-brand-700">
                2
              </span>
              Generate & reuse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: <Link className="h-5 w-5" />,
                  title: "Capture",
                  text: "Fast URL ingestion",
                },
                {
                  icon: <Sparkles className="h-5 w-5" />,
                  title: "Process",
                  text: "AI avatar extraction",
                },
                {
                  icon: <Video className="h-5 w-5" />,
                  title: "Use",
                  text: "Embed in future media",
                },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 flex items-center justify-center text-brand-700">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {f.title}
                    </p>
                    <p className="text-xs text-gray-600">{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Info className="h-4 w-4 text-gray-400" /> Avatar job history &
              management coming soon.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* URL Input Modal */}
      <Modal
        isOpen={showUrlModal}
        onClose={handleCloseModal}
        labelledById="video-avatar-url-title"
        size="md"
      >
        <ModalHeader className="bg-gradient-to-r from-brand-600 to-brand-700 text-white">
          <ModalTitle
            id="video-avatar-url-title"
            className="text-white flex items-center gap-2"
          >
            <Video className="h-5 w-5" /> Enter video URL
          </ModalTitle>
          <IconButton
            onClick={handleCloseModal}
            aria-label="Close dialog"
            disabled={isProcessing}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </IconButton>
        </ModalHeader>
        <ModalBody className="space-y-5">
          <div
            id="video-dropzone"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-lg border p-4 transition-colors ${isDragging ? "border-brand-500 bg-brand-50" : "border-dashed border-gray-300 bg-white"}`}
            aria-label="Drag and drop a video URL here or use the input field"
            role="group"
          >
            <div className="space-y-3">
              <Input
                label="Video URL"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500">
                Drag a link, or paste directly. We support most public video
                hosts.
              </p>
            </div>
            {isDragging && (
              <div className="absolute inset-0 rounded-lg bg-brand-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                <span className="text-xs font-medium text-brand-700">
                  Release to capture video URL
                </span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <strong className="font-medium text-gray-700">Tip:</strong> Include
            high-resolution sources for better avatar fidelity.
          </div>
        </ModalBody>
        <ModalFooter className="bg-gray-50">
          <Button
            variant="outline"
            onClick={handleCloseModal}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcessVideo}
            loading={isProcessing}
            disabled={!videoUrl.trim() || isProcessing}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <Sparkles className="h-4 w-4" />{" "}
            {isProcessing ? "Processing…" : "Create avatar"}
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
