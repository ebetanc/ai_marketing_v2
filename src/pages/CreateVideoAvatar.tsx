import React, { useState } from "react";
import { Video, Link, Sparkles, Upload, X } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { IconButton } from "../components/ui/IconButton";
import { useToast } from "../components/ui/Toast";
import { EmptyState } from "../components/ui/EmptyState";

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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
    <div className="space-y-6">
      <PageHeader
        title="Create Video (avatar)"
        description="Generate avatar videos from video links."
        icon={<Video className="h-5 w-5" />}
        actions={
          <Button onClick={() => setShowUrlModal(true)}>
            <Video className="h-4 w-4" />
            Create avatar
          </Button>
        }
      />

      {/* URL Input Modal */}
      <Modal
        isOpen={showUrlModal}
        onClose={handleCloseModal}
        labelledById="video-avatar-url-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2
                id="video-avatar-url-title"
                className="text-lg font-bold text-gray-900"
              >
                Enter video URL
              </h2>
              <p className="text-base text-gray-500">
                We'll create an avatar from your video.
              </p>
            </div>
          </div>

          <IconButton
            onClick={handleCloseModal}
            aria-label="Close dialog"
            disabled={isProcessing}
            variant="ghost"
          >
            <X className="h-5 w-5 text-gray-400" />
          </IconButton>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto">
          <div
            id="video-dropzone"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 rounded-xl p-4 transition-colors ${
              isDragging 
                ? "border-purple-500 bg-purple-50" 
                : "border-dashed border-gray-300"
            }`}
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
              <div className="text-base text-gray-500">
                <strong>Drag & Drop:</strong> Drop a video link from YouTube, Vimeo, or other platforms.
              </div>
            </div>
            {isDragging && (
              <div className="absolute inset-0 rounded-xl bg-purple-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                <span className="text-base font-medium text-purple-700">
                  Release to capture video URL
                </span>
              </div>
            )}
          </div>

          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <p className="text-base text-purple-800">
              <strong>Tip:</strong> Use YouTube, Vimeo, or direct video file URLs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
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
            variant="primary"
          >
            <Sparkles className="h-4 w-4" />
            {isProcessing ? "Processing…" : "Create avatar"}
          </Button>
        </div>
      </Modal>

      {/* Empty State */}
      <EmptyState
        icon={<Video className="h-8 w-8 text-white" />}
        title="Create video avatar"
        message={
          <div>
            <p className="mb-8">
              Transform any video into a personalized avatar for your content.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Link className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Video Input
                </h4>
                <p className="text-base text-gray-600">
                  Provide a video URL or upload
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-pink-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  AI Processing
                </h4>
                <p className="text-base text-gray-600">
                  Extract and enhance avatar
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Video className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Avatar Ready
                </h4>
                <p className="text-base text-gray-600">
                  Use in your content
                </p>
              </div>
            </div>
          </div>
        }
        variant="purple"
        actions={
          <Button onClick={() => setShowUrlModal(true)} size="lg">
            <Video className="h-4 w-4" />
            Create your first avatar
          </Button>
        }
      />
    </div>
  );
}