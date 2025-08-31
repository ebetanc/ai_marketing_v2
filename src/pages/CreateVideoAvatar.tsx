import React, { useState } from "react";
import { Video, Upload, X, Trash2 } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../components/ui/Toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";

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

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      push({
        title: "No images found",
        message: "Please drop image files only.",
        variant: "warning",
      });
      return;
    }

    const newImages = imageFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
    push({
      title: "Images added",
      message: `Added ${imageFiles.length} image(s)`,
      variant: "success",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const newImages = Array.from(fileList).map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    
    setImages(prev => [...prev, ...newImages]);
    e.target.value = ""; // Reset input
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return copy;
    });
  };

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                    >
                      <img
                        src={img.url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove image ${index + 1}`}
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
