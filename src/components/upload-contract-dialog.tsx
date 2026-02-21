"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CONTRACT_TYPE_LABELS } from "@/constants/rules";

interface UploadContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UploadContractDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadContractDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      // Auto-fill title from filename
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setType("");
    setCounterparty("");
    setAmount("");
    setProgress(0);
    setUploading(false);
    setAnalyzing(false);
  };

  const handleSubmit = async () => {
    if (!file && !title) {
      toast.error("请上传文件或输入合同标题");
      return;
    }

    setUploading(true);

    try {
      // Step 1: Upload contract
      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("title", title);
      formData.append("type", type || "OTHERS");
      formData.append("counterparty", counterparty || "未知主体");
      if (amount) formData.append("amount", amount);

      const uploadResponse = await fetch("/api/contract", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("上传失败");
      }

      const uploadResult = await uploadResponse.json();
      const contractId = uploadResult.contract.id;

      setProgress(50);

      // Step 2: Analyze contract (if we have parsed text)
      if (uploadResult.contract.parsedText) {
        setAnalyzing(true);
        setProgress(75);

        const analyzeResponse = await fetch("/api/contract/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractId,
            text: uploadResult.contract.parsedText,
            useAI: true,
          }),
        });

        if (!analyzeResponse.ok) {
          throw new Error("分析失败");
        }

        setProgress(100);
      }

      toast.success("合同上传并分析成功！");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("上传失败，请重试");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>上传合同</DialogTitle>
          <DialogDescription>
            支持 PDF、Word 格式，AI 将自动分析合同风险
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300"}
              ${file ? "bg-green-50 border-green-300" : ""}
            `}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-8 h-8 text-green-500" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium">
                  {isDragActive ? "释放文件以上传" : "拖拽文件到此处或点击上传"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  支持 PDF、Word 格式，最大 20MB
                </p>
              </>
            )}
          </div>

          {/* Contract Info Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">合同标题</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入合同标题"
              />
            </div>

            <div>
              <Label htmlFor="type">合同类型</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="选择合同类型" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="counterparty">对方主体</Label>
              <Input
                id="counterparty"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="输入对方公司名称"
              />
            </div>

            <div>
              <Label htmlFor="amount">合同金额（元）</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="输入合同金额"
              />
            </div>
          </div>

          {/* Progress */}
          {(uploading || analyzing) && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                {analyzing ? "AI 正在分析合同风险..." : "正在上传..."}
                {analyzing && (
                  <Loader2 className="w-4 h-4 inline ml-2 animate-spin" />
                )}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={uploading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading || (!file && !title)}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              "上传并分析"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
