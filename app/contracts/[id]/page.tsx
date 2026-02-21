"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  Shield,
  FileText,
  Clock,
  User,
  MoreVertical,
  Bot,
  Eye,
  EyeOff,
  ChevronRight,
  RefreshCw,
  Download,
  History,
  GitCompare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Contract, Annotation, RiskItem, AIReview } from "@/types";
import {
  RISK_LEVEL_COLORS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  USER_ROLE_LABELS,
  RISK_BADGES,
} from "@/constants/rules";
import { formatDate, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ContractReviewPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("review");
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [newComment, setNewComment] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);

  useEffect(() => {
    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contract/${contractId}`);
      const data = await response.json();
      setContract(data.contract);
    } catch (error) {
      console.error("Failed to fetch contract:", error);
      toast.error("加载合同失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!contract?.parsedText) {
      toast.error("合同文本为空");
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch("/api/contract/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          text: contract.parsedText,
          useAI: true,
        }),
      });

      if (!response.ok) throw new Error("分析失败");

      toast.success("AI 分析完成");
      fetchContract();
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/contract/${contractId}/annotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          type: "MANUAL_COMMENT",
          visibility: "INTERNAL",
          authorId: "user-1", // Current user
        }),
      });

      if (!response.ok) throw new Error("添加批注失败");

      toast.success("批注已添加");
      setNewComment("");
      fetchContract();
    } catch (error) {
      console.error("Add comment error:", error);
      toast.error("添加批注失败");
    }
  };

  const handleResolveAnnotation = async (annotationId: string) => {
    try {
      const response = await fetch(`/api/contract/${contractId}/annotate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annotationId,
          status: "RESOLVED",
        }),
      });

      if (!response.ok) throw new Error("更新失败");

      toast.success("批注已解决");
      fetchContract();
    } catch (error) {
      console.error("Resolve error:", error);
      toast.error("更新失败");
    }
  };

  const getRiskBadge = (level: string) => {
    const config = RISK_LEVEL_COLORS[level as keyof typeof RISK_LEVEL_COLORS];
    return (
      <Badge style={{ backgroundColor: config?.color }} className="text-white">
        {config?.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      DRAFT: "secondary",
      AI_REVIEWING: "default",
      LEGAL_REVIEW: "default",
      APPROVING: "outline",
      APPROVED: "secondary",
      REJECTED: "destructive",
      ARCHIVED: "secondary",
    };
    return (
      <Badge variant={variants[status] as "default" | "secondary" | "destructive" | "outline"}>
        {CONTRACT_STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const config = RISK_BADGES[severity as keyof typeof RISK_BADGES];
    return (
      <Badge variant={config?.variant || "default"}>
        {config?.label}
      </Badge>
    );
  };

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case "AI_SUGGESTION":
        return <Bot className="w-4 h-4 text-blue-500" />;
      case "MANUAL_COMMENT":
        return <MessageSquare className="w-4 h-4 text-orange-500" />;
      case "REVISION":
        return <FileText className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">合同不存在</p>
      </div>
    );
  }

  const aiReview = contract.aiReview;
  const keyRisks: RiskItem[] = aiReview?.keyRisks || [];

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="flex h-14 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/contracts")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">{contract.title}</h1>
              {getRiskBadge(contract.riskLevel)}
              {getStatusBadge(contract.status)}
            </div>
            <p className="text-xs text-muted-foreground">
              {CONTRACT_TYPE_LABELS[contract.type]} · {contract.counterparty}
              {contract.amount && ` · ¥${contract.amount.toLocaleString()}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!aiReview && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4 mr-2" />
                )}
                AI 审查
              </Button>
            )}
            <Button variant="outline" size="sm">
              <History className="w-4 h-4 mr-2" />
              版本
            </Button>
            <Button variant="outline" size="sm">
              <GitCompare className="w-4 h-4 mr-2" />
              对比
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              下载
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>提交审批</DropdownMenuItem>
                <DropdownMenuItem>驳回修改</DropdownMenuItem>
                <DropdownMenuItem>归档</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Three-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document Preview */}
        <div className="w-5/12 border-r bg-white flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="text-sm font-medium">合同正文</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                第 1/1 页
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-slate max-w-none">
              {contract.parsedText ? (
                <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {contract.parsedText.split("\n").map((line, i) => (
                    <div
                      key={i}
                      className={cn(
                        "py-1 px-2 -mx-2 rounded transition-colors",
                        highlightedText && line.includes(highlightedText)
                          ? "bg-yellow-100"
                          : "hover:bg-slate-50"
                      )}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>暂无合同文本</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Center: Annotations */}
        <div className="w-4/12 border-r bg-slate-50 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="bg-white border-b">
              <TabsList className="w-full justify-start rounded-none h-12 px-4">
                <TabsTrigger value="review" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  批注
                  {contract.annotations && contract.annotations.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {contract.annotations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="risks" className="gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  风险
                  {keyRisks.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {keyRisks.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="workflow" className="gap-2">
                  <Clock className="w-4 h-4" />
                  流程
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="review" className="flex-1 m-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="p-4 space-y-4">
                  {/* Add Comment Input */}
                  <Card>
                    <CardContent className="p-4">
                      <Textarea
                        placeholder="添加批注..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="mb-2"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button size="sm" onClick={handleAddComment}>
                          <Send className="w-4 h-4 mr-2" />
                          发送
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Annotations List */}
                  {contract.annotations?.map((annotation) => (
                    <Card
                      key={annotation.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedAnnotation?.id === annotation.id
                          ? "ring-2 ring-primary"
                          : "hover:shadow-md"
                      )}
                      onClick={() => {
                        setSelectedAnnotation(annotation);
                        setHighlightedText(annotation.selectedText || null);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getAnnotationIcon(annotation.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={annotation.author?.avatar} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(annotation.author?.name || "AI")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {annotation.author?.name || "AI 助手"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(annotation.createdAt)}
                              </span>
                              {annotation.visibility === "INTERNAL" && (
                                <Badge variant="outline" className="text-xs">
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  内部
                                </Badge>
                              )}
                              {annotation.visibility === "EXTERNAL" && (
                                <Badge variant="outline" className="text-xs">
                                  <Eye className="w-3 h-3 mr-1" />
                                  外部可见
                                </Badge>
                              )}
                            </div>
                            {annotation.selectedText && (
                              <div className="bg-slate-100 p-2 rounded text-xs mb-2 line-clamp-2">
                                "{annotation.selectedText}"
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">
                              {annotation.content}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                              {annotation.status === "OPEN" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResolveAnnotation(annotation.id);
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  解决
                                </Button>
                              ) : (
                                <Badge variant="secondary">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  已解决
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {!contract.annotations?.length && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>暂无批注</p>
                      <p className="text-sm">点击 AI 审查按钮开始分析</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="risks" className="flex-1 m-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="p-4 space-y-4">
                  {aiReview ? (
                    <>
                      {/* Risk Summary */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            风险评估
                            <span className="text-2xl font-bold text-primary">
                              {aiReview.riskScore}分
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Progress value={aiReview.riskScore} className="mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {aiReview.overallRisk === "high"
                              ? "🔴 高风险：建议重点审查"
                              : aiReview.overallRisk === "medium"
                              ? "🟡 中风险：建议关注"
                              : "🟢 低风险：基本合规"}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Key Risks */}
                      {keyRisks.map((risk, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getSeverityBadge(risk.severity)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm mb-1">
                                  {risk.category}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {risk.explanation}
                                </p>
                                <div className="bg-green-50 p-2 rounded text-sm">
                                  <span className="text-green-700 font-medium">
                                    建议：
                                  </span>
                                  {risk.suggestion}
                                </div>
                                {risk.law && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    相关法规：{risk.law}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Missing Clauses */}
                      {aiReview.missingClauses &&
                        Array.isArray(aiReview.missingClauses) &&
                        aiReview.missingClauses.length > 0 && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">
                                建议补充条款
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {aiReview.missingClauses.map((clause, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    {clause}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                      {/* AI Thinking */}
                      {aiReview.thinking && (
                        <Card className="bg-slate-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Bot className="w-4 h-4" />
                              AI 分析思路
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {aiReview.thinking}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>暂无 AI 分析结果</p>
                      <Button
                        className="mt-4"
                        onClick={handleAnalyze}
                        disabled={analyzing}
                      >
                        {analyzing ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Bot className="w-4 h-4 mr-2" />
                        )}
                        开始 AI 审查
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="workflow" className="flex-1 m-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="p-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">审批流程</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          {
                            step: "合同上传",
                            status: "completed",
                            time: formatDate(contract.createdAt),
                          },
                          {
                            step: "AI 审查",
                            status: aiReview ? "completed" : "pending",
                            time: aiReview ? formatDate(aiReview.createdAt) : "-",
                          },
                          {
                            step: "法务审查",
                            status:
                              contract.status === "LEGAL_REVIEW" ||
                              contract.status === "APPROVING" ||
                              contract.status === "APPROVED"
                                ? "completed"
                                : "pending",
                            time: "-",
                          },
                          {
                            step: "审批通过",
                            status:
                              contract.status === "APPROVED"
                                ? "completed"
                                : "pending",
                            time: contract.completedAt
                              ? formatDate(contract.completedAt)
                              : "-",
                          },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                item.status === "completed"
                                  ? "bg-green-500 text-white"
                                  : "bg-slate-200 text-slate-500"
                              )}
                            >
                              {item.status === "completed" ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Clock className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{item.step}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: AI Suggestions */}
        <div className="w-3/12 bg-white flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              AI 建议
            </h3>
          </div>
          <ScrollArea className="flex-1 p-4">
            {aiReview ? (
              <div className="space-y-4">
                {/* Risk Score Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        综合评分
                      </p>
                      <p className="text-4xl font-bold text-primary">
                        {aiReview.riskScore}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        / 100 分
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">高风险</span>
                    <span className="font-medium text-red-500">
                      {keyRisks.filter((r) => r.severity === "high").length} 项
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">中风险</span>
                    <span className="font-medium text-orange-500">
                      {keyRisks.filter((r) => r.severity === "medium").length}{" "}
                      项
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">低风险</span>
                    <span className="font-medium text-green-500">
                      {keyRisks.filter((r) => r.severity === "low").length} 项
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">快速操作</h4>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    生成审查报告
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    导出修改建议
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    委托审查
                  </Button>
                </div>

                <Separator />

                {/* Quick Stats */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">合同信息</h4>
                  <div className="text-sm">
                    <p className="text-muted-foreground">合同类型</p>
                    <p>{CONTRACT_TYPE_LABELS[contract.type]}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">提交人</p>
                    <p>{contract.creator?.name}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">提交时间</p>
                    <p>{formatDate(contract.createdAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">AI 尚未分析</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bot className="w-4 h-4 mr-2" />
                  )}
                  开始分析
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
