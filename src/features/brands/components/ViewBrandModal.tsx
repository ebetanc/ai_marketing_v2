import {
  Building2,
  Calendar,
  Globe,
  Target,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import React from "react";
import { useAsyncCallback } from "@/hooks/useAsync";
import type { CompanyUI } from "@/features/companies";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconButton } from "@/components/ui/IconButton";
import { Modal, ModalBody } from "@/components/ui/Modal";
import { ModalBrandHeader } from "@/components/ui/ModalBrandHeader";
import { useToast } from "@/components/ui/Toast";

interface ViewBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: CompanyUI | null;
  onDelete?: () => void;
}

export function ViewBrandModal({
  isOpen,
  onClose,
  brand,
  onDelete,
}: ViewBrandModalProps) {
  const { call: runDelete, loading: deleting } = useAsyncCallback(async () => {
    if (!brand?.id) return;
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", brand.id);
    if (error) {
      console.error("Error deleting brand:", error);
      push({
        title: "Delete failed",
        message: `Failed to delete brand: ${error.message}`,
        variant: "error",
      });
      return;
    }
    onDelete?.();
    push({ title: "Deleted", message: "Brand removed", variant: "success" });
    onClose();
  });
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const { push } = useToast();
  if (!brand) return null;
  const handleDelete = () => void runDelete();
  const titleId = "view-brand-title";
  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledById={titleId} size="md">
      <div className="w-full max-h-[90vh] flex flex-col overflow-hidden">
        <ModalBrandHeader
          titleId={titleId}
          title={brand.name}
          onClose={onClose}
          icon={<Building2 className="h-6 w-6 text-white" />}
        />
        <ModalBody className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Building2 className="h-5 w-5 mr-2 text-brand-600" /> Basics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-base font-medium text-gray-900">
                  Brand name
                </p>
                <p className="text-gray-700">
                  {brand.brand_name || brand.name}
                </p>
              </div>
              {brand.website && (
                <div>
                  <p className="text-base font-medium text-gray-900">Website</p>
                  <a
                    href={
                      /^(https?:\/\/)/i.test(brand.website)
                        ? brand.website
                        : `https://${brand.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${brand.website} in a new tab`}
                    className="text-brand-600 hover:text-brand-800 flex items-center"
                  >
                    <Globe className="h-4 w-4 mr-1" /> {brand.website}
                  </a>
                </div>
              )}
              <div>
                <p className="text-base font-medium text-gray-900">Created</p>
                <p className="text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />{" "}
                  {formatDate(brand.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>
          {brand.brand_tone && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Zap className="h-5 w-5 mr-2 text-brand-600" /> Brand tone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {brand.brand_tone}
                </p>
              </CardContent>
            </Card>
          )}
          {brand.target_audience &&
            typeof brand.target_audience === "string" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Target className="h-5 w-5 mr-2 text-brand-600" /> Target
                    audience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {brand.target_audience}
                  </p>
                </CardContent>
              </Card>
            )}
          {brand.key_offer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Building2 className="h-5 w-5 mr-2 text-brand-600" /> Key
                  offer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {brand.key_offer}
                </p>
              </CardContent>
            </Card>
          )}
          {brand.additional_information && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2 text-brand-600" /> Additional
                  info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {brand.additional_information}
                </p>
              </CardContent>
            </Card>
          )}
          {brand.brand_voice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Zap className="h-5 w-5 mr-2 text-brand-600" /> Brand voice &
                  tone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-base font-medium text-gray-900">
                    Brand tone
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {brand.brand_voice?.tone ||
                      brand.brand_tone ||
                      "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900">
                    Key offer / style
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {brand.brand_voice?.style ||
                      brand.key_offer ||
                      "Not specified"}
                  </p>
                </div>
                {brand.brand_voice?.keywords &&
                  brand.brand_voice.keywords.length > 0 && (
                    <div>
                      <p className="text-base font-medium text-gray-900 mb-2">
                        Keywords
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {brand.brand_voice.keywords.map(
                          (keyword: string, i: number) => (
                            <Badge key={i} variant="secondary">
                              {keyword}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
        </ModalBody>
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0 flex-wrap gap-3">
          <p className="text-xs text-gray-500">
            Created {formatDate(brand.created_at)}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={deleting}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              loading={deleting}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />{" "}
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            handleDelete();
          }}
          title="Delete brand"
          message={`Delete "${brand.brand_name || brand.name}"? This can’t be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={deleting}
        />
      </div>
    </Modal>
  );
}
