import { useState } from "react";
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { DriverProfile } from "@/services/driver-data";

interface DocumentsProps {
  driver: DriverProfile | null;
  isLoading: boolean;
}

export function Documents({ driver, isLoading }: DocumentsProps) {
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpload = async (docType: string) => {
    setUploadingDoc(docType);

    // Simulate file picker and upload
    try {
      // Create a fake file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,.jpg,.jpeg,.png";

      input.onchange = async () => {
        if (input.files?.[0]) {
          const file = input.files[0];

          // Simulate upload delay
          await new Promise((resolve) => setTimeout(resolve, 2000));

          toast({
            title: "Document Uploaded",
            description: `${docType} has been uploaded successfully.`,
          });
        }
        setUploadingDoc(null);
      };

      input.oncancel = () => {
        setUploadingDoc(null);
      };

      input.click();
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
      setUploadingDoc(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Valid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Expiring":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "Missing":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Valid":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            Valid
          </Badge>
        );
      case "Expiring":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            Expiring
          </Badge>
        );
      case "Missing":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            Missing
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpiringSoon = (dateString?: string) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    const daysDiff = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
    );
    return daysDiff <= 30; // Expiring within 30 days
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!driver) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-text-secondary">
            No driver selected
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents & Compliance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {driver.docs.map((doc) => (
            <div
              key={doc.type}
              className="flex items-center justify-between p-4 border border-border rounded-lg bg-surface-secondary"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(doc.status)}
                <div>
                  <div className="font-medium text-text-primary">
                    {doc.type}
                  </div>
                  {doc.expiresAt && (
                    <div
                      className={`text-sm ${
                        isExpiringSoon(doc.expiresAt)
                          ? "text-yellow-600"
                          : "text-text-secondary"
                      }`}
                    >
                      Expires: {formatDate(doc.expiresAt)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(doc.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpload(doc.type)}
                  disabled={uploadingDoc === doc.type}
                  className="flex items-center gap-2"
                >
                  {uploadingDoc === doc.type ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {doc.status === "Missing" ? "Upload" : "Update"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
