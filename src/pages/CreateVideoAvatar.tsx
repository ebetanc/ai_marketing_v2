import React, { useState, useEffect, useCallback } from "react";
import { Video, Upload, X, Trash2, Loader2 } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../components/ui/Toast";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { uploadFileToSupabaseStorage } from "../lib/supabase";

interface UploadedImage {
  id: string; // Unique ID for React keys and internal tracking
  file: File;
  localUrl: string; // URL.createObjectURL for immediate preview
  supabaseUrl: string | null; // Public URL from Supabase after upload
  loading: boolean;
  error: string | null;
}

export function CreateVideoAvatar() {
  useDocumentTitle("Create Video (avatar) — Lighting");
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [videoScript, setVideoScript] = useState("");
  const { push } = useToast();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const uploadImage = useCallback(async (imageToUpload: File, tempId: string) => {
    setImages(prev => prev.map(img =>
      img.id === tempId ? { ...img, loading: true, error: null } : img
    ));
    try {
      // Using a subfolder 'video-avatars' within the 'images' bucket for organization
      const publicUrl = await uploadFileToSupabaseStorage(imageToUpload, "images", `video-avatars/${tempId}-${imageToUpload.name}`);
      setImages(prev => prev.map(img =>
        img.id === tempId ? { ...img, supabaseUrl: publicUrl, loading: false } : img
      ));
      push({ message: `Image "${imageToUpload.name}" uploaded!`, variant: "success" });
    } catch (err: any) {
      console.error("Upload error:", err);
      setImages(prev => prev.map(img =>
        img.id === tempId ? { ...img, loading: false, error: err.message || "Upload failed" } : img
      ));
      push({ message: `Failed to upload "${imageToUpload.name}": ${err.message || "Unknown error"}`, variant: "error" });
    }
  }, [push]);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const newImages: UploadedImage[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) {
        push({ message: `Skipping non-image file: ${file.name}`, variant: "warning" });
        continue;
      }
      const tempId = crypto.randomUUID(); // Generate a unique ID for tracking
      newImages.push({
        id: tempId,
        file,
        localUrl: URL.createObjectURL(file),
        supabaseUrl: null,
        loading: false, // Will be set to true when upload starts
        error: null,
      });
      // Start upload immediately
      uploadImage(file, tempId);
    }
    setImages(prev => [...prev, ...newImages]);
  }, [push, uploadImage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((e.target as HTMLElement).closest("#image-dropzone")) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    } else {
      push({
        title: "No files found",
        message: "Please drop image files.",
        variant: "warning",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = ""; // Reset input
  };

  const removeImage = (idToRemove: string) => {
    setImages(prev => {
      const copy = [...prev];
      const imageToRemove = prev.find(img => img.id === idToRemove);
      const indexToRemove = prev.findIndex(img => img.id === idToRemove);

      if (indexToRemove === -1) return prev; // Image not found

      const [removed] = copy.splice(indexToRemove, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      // TODO: If image is already on Supabase, consider adding logic to delete it from bucket too.
      return copy;
    });
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.localUrl) URL.revokeObjectURL(img.localUrl);
      });
    };
  }, [images]);

  return (
    <PageContainer>
      <PageHeader
        title="Create Video (avatar)"
        description="Turn existing video links into reusable AI avatars."
        icon={<Video className="h-5 w-5" />}
        actions={null}
      />

      <div className="max-w-4xl space-y-8">
        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-brand-600" />
              Upload Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              id="image-dropzone"
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging 
                  ? "border-brand-500 bg-brand-50" 
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop images here or click to upload
                  </p>
                  <p className="text-sm text-gray-600">
                    Support for PNG, JPG, JPEG, WebP files
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Upload images"
                />
              </div>
              {isDragging && (
                <div className="absolute inset-0 rounded-lg bg-brand-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                  <span className="text-lg font-medium text-brand-700">
                    Release to upload images
                  </span>
                </div>
              )}
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Uploaded Images ({images.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                    >
                      <img
                        src={img.supabaseUrl || img.localUrl}
                        alt={`Upload ${img.file.name}`}
                        className={`w-full h-24 object-cover ${img.loading ? 'opacity-50' : ''}`}
                      />
                      {img.loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      {img.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/70 text-white text-xs p-1 text-center">
                          Error: {img.error}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove image ${img.file.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Script Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-brand-600" />
              Video Script
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              label="Video Script"
              placeholder="Enter the script for your video avatar..."
              value={videoScript}
              onChange={(e) => setVideoScript(e.target.value)}
              rows={8}
              description="Write the dialogue or narration for your video avatar."
            />
          </CardContent>
        </Card>
      </div>

    </PageContainer>
  );
}
