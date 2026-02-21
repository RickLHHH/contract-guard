"use client";

import { useMemo } from "react";
import { diff_match_patch } from "diff-match-patch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface VersionDiffProps {
  oldText: string;
  newText: string;
  oldVersion?: string;
  newVersion?: string;
}

type DiffType = -1 | 0 | 1;

export function VersionDiff({
  oldText,
  newText,
  oldVersion = "v1.0",
  newVersion = "v1.1",
}: VersionDiffProps) {
  const diffs = useMemo(() => {
    const dmp = new diff_match_patch();
    return dmp.diff_main(oldText, newText);
  }, [oldText, newText]);

  const renderDiff = () => {
    return diffs.map((diff, index) => {
      const [type, text] = diff as [DiffType, string];
      
      if (type === 0) {
        // Equal
        return (
          <span key={index} className="whitespace-pre-wrap">
            {text}
          </span>
        );
      } else if (type === -1) {
        // Deleted
        return (
          <span
            key={index}
            className="bg-red-100 text-red-800 line-through decoration-red-500 whitespace-pre-wrap"
          >
            {text}
          </span>
        );
      } else {
        // Inserted
        return (
          <span
            key={index}
            className="bg-green-100 text-green-800 underline decoration-green-500 whitespace-pre-wrap"
          >
            {text}
          </span>
        );
      }
    });
  };

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    
    diffs.forEach((diff) => {
      const [type, text] = diff as [DiffType, string];
      if (type === 1) added += text.length;
      if (type === -1) removed += text.length;
    });
    
    return { added, removed };
  }, [diffs]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>版本对比</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-red-600 bg-red-50">
              -{stats.removed} 字符
            </Badge>
            <Badge variant="outline" className="text-green-600 bg-green-50">
              +{stats.added} 字符
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex-1 p-2 bg-slate-50 rounded">
            <span className="font-medium">{oldVersion}</span>
            <span className="ml-2">(旧版本)</span>
          </div>
          <div className="flex-1 p-2 bg-slate-50 rounded">
            <span className="font-medium">{newVersion}</span>
            <span className="ml-2">(新版本)</span>
          </div>
        </div>
        <ScrollArea className="h-[400px] border rounded-lg p-4">
          <div className="font-mono text-sm leading-relaxed">
            {renderDiff()}
          </div>
        </ScrollArea>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
            <span className="text-muted-foreground">删除</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
            <span className="text-muted-foreground">新增</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-white border rounded" />
            <span className="text-muted-foreground">未变更</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple side-by-side diff view
export function SideBySideDiff({
  oldText,
  newText,
  oldVersion = "v1.0",
  newVersion = "v1.1",
}: VersionDiffProps) {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const maxLines = Math.max(oldLines.length, newLines.length);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">版本对比</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-0 border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-slate-100 p-3 border-b border-r font-medium">
            {oldVersion} (旧版本)
          </div>
          <div className="bg-slate-100 p-3 border-b font-medium">
            {newVersion} (新版本)
          </div>
          
          {/* Content */}
          <ScrollArea className="h-[400px]">
            <div className="font-mono text-sm">
              {oldLines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "px-3 py-1 border-b border-r",
                    newLines[i] !== line
                      ? "bg-red-50 text-red-800"
                      : "bg-white"
                  )}
                >
                  <span className="text-muted-foreground w-8 inline-block">
                    {i + 1}
                  </span>
                  {line || " "}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <ScrollArea className="h-[400px]">
            <div className="font-mono text-sm">
              {newLines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "px-3 py-1 border-b",
                    oldLines[i] !== line
                      ? "bg-green-50 text-green-800"
                      : "bg-white"
                  )}
                >
                  <span className="text-muted-foreground w-8 inline-block">
                    {i + 1}
                  </span>
                  {line || " "}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
