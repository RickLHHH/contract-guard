"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  FileDown,
  ZoomIn,
  ZoomOut,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

// 批注定位信息
interface AnnotationPosition {
  startOffset: number;
  endOffset: number;
  page: number;
  selectedText: string;
}

export default function ContractReviewPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  const contentRef = useRef<HTMLDivElement>(null);

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("review");
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [newComment, setNewComment] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);
  const [textSelection, setTextSelection] = useState<{ text: string; start: number; end: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showClauseView, setShowClauseView] = useState(false);

  useEffect(() => {
    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contract/${contractId}`);
      if (!response.ok) throw new Error("获取合同失败");
      const data = await response.json();
      setContract(data.contract);
    } catch (error) {
      console.error("获取合同失败:", error);
      toast.error("加载合同失败");
    } finally {
      setLoading(false);
    }
  };

  // 开始AI分析
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "分析失败");
      }

      toast.success("AI 分析完成");
      fetchContract();
    } catch (error) {
      console.error("分析错误:", error);
      toast.error(error instanceof Error ? error.message : "分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  // 添加批注
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
          authorId: "user-1",
          selectedText: textSelection?.text || "",
          startOffset: textSelection?.start || 0,
          endOffset: textSelection?.end || 0,
          page: 1,
        }),
      });

      if (!response.ok) throw new Error("添加批注失败");

      toast.success("批注已添加");
      setNewComment("");
      setTextSelection(null);
      fetchContract();
    } catch (error) {
      console.error("添加批注失败:", error);
      toast.error("添加批注失败");
    }
  };

  // 解决批注
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
      console.error("解决批注失败:", error);
      toast.error("更新失败");
    }
  };

  // 下载原文件
  const handleDownload = () => {
    if (contract?.originalFile) {
      window.open(`/api/files/${contract.originalFile}?download=true`, '_blank');
    } else {
      toast.error("没有可下载的文件");
    }
  };

  // 文本选择处理
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString();
      // 计算在原文中的位置
      const fullText = contract?.parsedText || "";
      const selectedText = selection.toString();
      const start = fullText.indexOf(selectedText);
      
      if (start !== -1) {
        setTextSelection({
          text: selectedText,
          start,
          end: start + selectedText.length,
        });
      }
    }
  };

  // 搜索高亮
  const getHighlightedContent = (text: string) => {
    if (!searchQuery) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        `<mark key=${i} class="bg-yellow-200 px-1 rounded">${part}</mark>`
      ) : part
    ).join('');
  };

  // 获取风险等级徽章
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

  // 将原文按条款分割渲染
  const renderContractContent = () => {
    if (!contract?.parsedText) return null;

    const text = contract.parsedText;
    
    // 如果启用了条款视图，尝试按条款分割
    if (showClauseView) {
      const clauseRegex = /(第[一二三四五六七八九十百千零\d]+条[、.\s]*[^\n]*)(?:\n|$)/g;
      const clauses: Array<{ title: string; content: string; index: number }> = [];
      
      let match;
      let lastIndex = 0;
      while ((match = clauseRegex.exec(text)) !== null) {
        if (lastIndex < match.index) {
          clauses.push({
            title: "前言",
            content: text.substring(lastIndex, match.index),
            index: lastIndex,
          });
        }
        
        const clauseTitle = match[1];
        const nextMatchIndex = text.search(new RegExp(`第[一二三四五六七八九十百千零\d]+条`, `g`));
        const content = nextMatchIndex > match.index 
          ? text.substring(match.index + match[0].length, nextMatchIndex)
          : text.substring(match.index + match[0].length);
        
        clauses.push({
          title: clauseTitle,
          content,
          index: match.index,
        });
        
        lastIndex = match.index + match[0].length + content.length;
      }

      return (
        <div className="space-y-6">
          {clauses.map((clause, i) => (
            <div 
              key={i} 
              className={cn(
                "p-4 rounded-lg border transition-colors",
                selectedAnnotation?.selectedText?.includes(clause.title) 
                  ? "bg-yellow-50 border-yellow-300" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}
              onClick={() => setHighlightedText(clause.title)}
            >
              <h3 className="font-semibold text-gray-900 mb-2">{clause.title}</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {clause.content}
              </p>
            </div>
          ))}
        </div>
      );
    }

    // 普通文本视图
    return (
      <div 
        className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800"
        style={{ fontSize: `${zoomLevel}%` }}
        onMouseUp={handleTextSelection}
        dangerouslySetInnerHTML={{
          __html: getHighlightedContent(text).replace(/\n/g, '<br/>')
        }}
      />
    );
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
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-muted-foreground text-lg">合同不存在或已被删除</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push("/contracts")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回合同列表
          </Button>
        </div>
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold truncate">{contract.title}</h1>
              {getRiskBadge(contract.riskLevel)}
              {getStatusBadge(contract.status)}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {CONTRACT_TYPE_LABELS[contract.type]}
              {contract.counterparty && contract.counterparty !== "模板待填" && contract.counterparty !== "待补充" && (
                <> · {contract.counterparty}</>
              )}
              {contract.amount ? ` · ¥${contract.amount.toLocaleString()}` : ""}
              {contract.metadata && (
                <>
                  {' · '}
                  {(contract.metadata as any).wordCount || contract.parsedText?.length || 0} 字
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!aiReview && contract.status !== 'APPROVED' && (
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
            <Button variant="outline" size="sm" onClick={handleDownload}>
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
        <div className="w-5/12 border-r bg-white flex flex-col h-full">
          {/* 工具栏 */}
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 w-12 text-center">{zoomLevel}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-2" />
              <Button
                variant={showClauseView ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowClauseView(!showClauseView)}
              >
                条款视图
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索..."
                  className="w-40 pl-8 h-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 文档内容 */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 max-w-3xl mx-auto min-h-0">
                {contract.parsedText ? (
                  <div className="prose prose-slate max-w-none">
                    {renderContractContent()}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>暂无合同文本</p>
                    <p className="text-sm mt-2">该合同可能未上传文件或解析失败</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* 选中文本提示 */}
          {textSelection && (
            <div className="p-3 border-t bg-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-xs text-gray-500 mb-1">已选择文本:</p>
                  <p className="text-sm truncate">{textSelection.text}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setTextSelection(null)}
                  >
                    取消
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setActiveTab("review")}
                  >
                    添加批注
                  </Button>
                </div>
              </div>
            </div>
          )}
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
                        placeholder={textSelection ? "针对选中内容添加批注..." : "添加批注..."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="mb-2"
                        rows={3}
                      />
                      <div className="flex justify-between items-center">
                        {textSelection && (
                          <p className="text-xs text-gray-500 truncate flex-1 mr-4">
                            关联文本: {textSelection.text.substring(0, 50)}
                            {textSelection.text.length > 50 && "..."}
                          </p>
                        )}
                        <Button 
                          size="sm" 
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                        >
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
                        "cursor-pointer transition-all",
                        selectedAnnotation?.id === annotation.id
                          ? "ring-2 ring-primary shadow-md"
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
                            </div>
                            {annotation.selectedText && (
                              <div className="bg-slate-100 p-2 rounded text-xs mb-2 line-clamp-2 border-l-2 border-blue-400">
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
                      <p className="text-sm mt-1">
                        {contract.parsedText 
                          ? "选中合同文本可快速添加批注" 
                          : "上传合同文件后可添加批注"}
                      </p>
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
                            <span className={cn(
                              "text-2xl font-bold",
                              aiReview.riskScore >= 80 ? "text-green-500" :
                              aiReview.riskScore >= 60 ? "text-yellow-500" :
                              "text-red-500"
                            )}>
                              {aiReview.riskScore}分
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Progress value={aiReview.riskScore} className="mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {aiReview.overallRisk === "high"
                              ? "🔴 高风险：存在重大法律或商业风险，建议重点审查"
                              : aiReview.overallRisk === "medium"
                              ? "🟡 中风险：存在一定风险，建议关注"
                              : "🟢 低风险：基本合规，风险可控"}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Key Risks */}
                      {keyRisks.map((risk, index) => (
                        <Card key={index} className="border-l-4 border-l-red-400">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getSeverityBadge(risk.severity)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-500">
                                    {risk.location || risk.category}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">
                                  {risk.explanation}
                                </p>
                                {risk.clause && risk.clause !== '未指定' && (
                                  <div className="bg-gray-50 p-2 rounded text-xs mb-2 text-gray-600 border-l-2 border-gray-300">
                                    "{risk.clause}"
                                  </div>
                                )}
                                <div className="bg-green-50 p-2 rounded text-sm border border-green-100">
                                  <span className="text-green-700 font-medium">
                                    修改建议：
                                  </span>
                                  {risk.suggestion}
                                </div>
                                {risk.law && (
                                  <p className="text-xs text-gray-500 mt-2">
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
                        <Card className="bg-slate-50 border-dashed">
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
                      {contract.parsedText ? (
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
                      ) : (
                        <p className="text-sm mt-2">上传合同文件后可进行 AI 分析</p>
                      )}
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
                            user: contract.creator?.name,
                          },
                          {
                            step: "AI 审查",
                            status: aiReview ? "completed" : "pending",
                            time: aiReview ? formatDate(aiReview.createdAt) : "-",
                            user: aiReview ? "AI 助手" : undefined,
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
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
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
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{item.step}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.user && `${item.user} · `}{item.time}
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

        {/* Right: AI Suggestions & Quick Actions */}
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
                      <p className={cn(
                        "text-4xl font-bold",
                        aiReview.riskScore >= 80 ? "text-green-600" :
                        aiReview.riskScore >= 60 ? "text-yellow-600" :
                        "text-red-600"
                      )}>
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
                    <FileDown className="w-4 h-4 mr-2" />
                    生成审查报告
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载原文件
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
                    <p>{contract.creator?.name || "未知"}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">提交时间</p>
                    <p>{formatDate(contract.createdAt)}</p>
                  </div>
                  {contract.metadata && (
                    <>
                      <div className="text-sm">
                        <p className="text-muted-foreground">字数统计</p>
                        <p>{(contract.metadata as any).wordCount || contract.parsedText?.length || 0} 字</p>
                      </div>
                      {(contract.metadata as any).pageCount && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">页数</p>
                          <p>{(contract.metadata as any).pageCount} 页</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">AI 尚未分析</p>
                {contract.parsedText && (
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
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
