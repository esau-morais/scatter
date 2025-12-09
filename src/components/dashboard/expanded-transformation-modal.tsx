"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X as Close, Copy, History, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PlatformBadge,
  type PlatformType,
  platformConfig,
} from "@/components/ui/platform-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Transformation } from "@/db/schema";
import { useTRPC } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
  formatRelativeTime,
  getCharacterCount,
  getCharLimitStatus,
} from "./transform-output-utils";

interface ExpandedTransformationModalProps {
  transformation: Transformation;
  onClose: () => void;
  onRegenerate?: (id: string) => void;
  onUpdateContent?: (id: string, content: string) => Promise<void>;
  onUpdateTransformation: (transformation: Transformation) => void;
}

export const getDraftKey = (id: string) => `scatter_draft_${id}`;

export function ExpandedTransformationModal({
  transformation,
  onClose,
  onRegenerate,
  onUpdateContent,
  onUpdateTransformation,
}: ExpandedTransformationModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("view");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const platform = transformation.platform as PlatformType;
  const config = platformConfig[platform];

  const { data: versionHistory, isLoading: isLoadingHistory } = useQuery(
    trpc.transformations.getVersionHistory.queryOptions(
      {
        transformationId: transformation.id,
      },
      {
        enabled: activeTab === "history",
      },
    ),
  );

  const restoreVersionMutation = useMutation(
    trpc.transformations.restoreVersion.mutationOptions({
      onSuccess: (updatedTransformation) => {
        onUpdateTransformation(updatedTransformation);
        setEditContent(updatedTransformation.content);
        setActiveTab("view");
        toast.success("Version restored!", {
          description: "Content has been restored to the selected version",
        });
        queryClient.invalidateQueries(
          trpc.transformations.getVersionHistory.queryOptions({
            transformationId: updatedTransformation.id,
          }),
        );
      },
      onError: () => {
        toast.error("Failed to restore version", {
          description: "Please try again",
        });
      },
    }),
  );

  useEffect(() => {
    if (activeTab !== "edit") return;

    const timeoutId = setTimeout(() => {
      const draftKey = getDraftKey(transformation.id);
      if (editContent !== transformation.content) {
        localStorage.setItem(draftKey, editContent);
      } else {
        localStorage.removeItem(draftKey);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [editContent, transformation, activeTab]);

  useEffect(() => {
    const draftKey = getDraftKey(transformation.id);
    const savedDraft = localStorage.getItem(draftKey);
    setEditContent(savedDraft || transformation.content);
  }, [transformation]);

  const handleSaveEdit = async () => {
    if (!onUpdateContent) return;

    setIsSaving(true);
    try {
      await onUpdateContent(transformation.id, editContent);
      const draftKey = getDraftKey(transformation.id);
      localStorage.removeItem(draftKey);
      toast.success("Content updated!", {
        description: "Your changes have been saved",
      });
      onUpdateTransformation({
        ...transformation,
        content: editContent,
        editedAt: new Date(),
      });
      queryClient.invalidateQueries(
        trpc.transformations.getVersionHistory.queryOptions({
          transformationId: transformation.id,
        }),
      );
      setActiveTab("view");
    } catch (_error) {
      toast.error("Failed to save changes", {
        description: "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    const draftKey = getDraftKey(transformation.id);
    localStorage.removeItem(draftKey);
    setEditContent(transformation.content);
    setActiveTab("view");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transformation.content);
    toast.success(`${config.name} content copied!`, {
      description: "Ready to paste and post",
    });
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(transformation.id);
      onClose();
    }
  };

  const handleRestoreVersion = (versionNumber: number) => {
    restoreVersionMutation.mutate({
      transformationId: transformation.id,
      versionNumber,
    });
  };

  const editCharCount = getCharacterCount(editContent);
  const currentCharCount = getCharacterCount(transformation.content);
  const editLimitStatus = getCharLimitStatus(editCharCount, config.maxChars);
  const currentLimitStatus = getCharLimitStatus(
    currentCharCount,
    config.maxChars,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-center bg-background/80 backdrop-blur-sm p-4"
      onMouseDown={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
          <div className="flex items-center gap-3">
            <PlatformBadge platform={platform} />
            <h3 className="font-semibold">{config.name}</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
          >
            <Close className="size-4" />
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="px-4 pt-2 shrink-0">
            <TabsList>
              <TabsTrigger value="view">View</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-1.5 size-3.5" />
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="view"
            className="flex flex-col flex-1 min-h-0 overflow-hidden m-0"
          >
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 shrink-0">
              <span
                className={cn(
                  "text-xs tabular-nums",
                  currentLimitStatus.isOverLimit
                    ? "text-destructive font-medium"
                    : currentLimitStatus.isNearLimit
                      ? "text-warning font-medium"
                      : "text-muted-foreground",
                )}
              >
                {currentCharCount}/{config.maxChars} characters
              </span>
              {transformation.editedAt && (
                <Badge
                  variant="outline"
                  className="text-xs border-primary/50 text-primary"
                >
                  Edited
                </Badge>
              )}
            </div>
            <div className="overflow-auto flex-1 min-h-0 p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {transformation.content}
              </pre>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border p-4 shrink-0">
              {onRegenerate && (
                <Button variant="outline" size="sm" onClick={handleRegenerate}>
                  <RefreshCw className="mr-2 size-4" />
                  Regenerate
                </Button>
              )}
              <Button size="sm" onClick={handleCopy}>
                <Copy className="mr-2 size-4" />
                Copy Content
              </Button>
            </div>
          </TabsContent>

          <TabsContent
            value="edit"
            className="flex flex-col flex-1 min-h-0 overflow-hidden m-0"
          >
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 shrink-0">
              <span
                className={cn(
                  "text-xs tabular-nums",
                  editLimitStatus.isOverLimit
                    ? "text-destructive font-medium"
                    : editLimitStatus.isNearLimit
                      ? "text-warning font-medium"
                      : "text-muted-foreground",
                )}
              >
                {editCharCount}/{config.maxChars} characters
              </span>
            </div>
            <div className="overflow-auto flex-1 min-h-0 p-6">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm resize-none"
                placeholder="Edit your content..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border p-4 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={
                  isSaving ||
                  !onUpdateContent ||
                  editContent === transformation.content ||
                  editContent.trim() === ""
                }
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent
            value="history"
            className="flex flex-col flex-1 min-h-0 overflow-hidden m-0"
          >
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8">
                <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Loading version history...
                </p>
              </div>
            ) : !versionHistory || versionHistory.versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <History className="size-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  No Version History Yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Version history will appear here after you regenerate or edit
                  this content.
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-3 border-b border-border/50 shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {versionHistory.versions.length}{" "}
                    {versionHistory.versions.length === 1
                      ? "version"
                      : "versions"}{" "}
                    saved
                  </p>
                </div>
                <div className="overflow-auto flex-1 min-h-0 p-4">
                  <div className="space-y-2">
                    {versionHistory.versions.map((version) => {
                      const contentMatches =
                        version.content === versionHistory.current.content;
                      const isCurrent = contentMatches
                        ? versionHistory.versions
                            .filter(
                              (v) =>
                                v.content === versionHistory.current.content,
                            )
                            .every(
                              (v) => v.versionNumber <= version.versionNumber,
                            )
                        : false;
                      return (
                        <motion.div
                          key={version.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "rounded-lg border p-3 transition-colors hover:bg-secondary/50",
                            isCurrent && "border-primary/50 bg-primary/5",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">
                                  v{version.versionNumber}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    version.source === "ai_generated"
                                      ? "border-chart-2/50 text-chart-2"
                                      : "border-chart-1/50 text-chart-1",
                                  )}
                                >
                                  {version.source === "ai_generated"
                                    ? "AI"
                                    : "Manual"}
                                </Badge>
                                {isCurrent && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-primary/50 text-primary"
                                  >
                                    Current
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {formatRelativeTime(
                                    new Date(version.createdAt),
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {version.content.slice(0, 100)}
                                {version.content.length > 100 && "..."}
                              </p>
                            </div>
                            {!isCurrent && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleRestoreVersion(version.versionNumber)
                                }
                                disabled={restoreVersionMutation.isPending}
                              >
                                Restore
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
