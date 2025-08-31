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
  useDocumentTitle("Create Video (avatar) — Lighting");
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


    </PageContainer>
  );
}
