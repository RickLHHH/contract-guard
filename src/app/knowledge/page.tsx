"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Plus,
  FileText,
  Filter,
  MoreVertical,
  ArrowLeft,
  Shield,
  Bell,
  Upload,
  Tag,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeDoc } from "@/types";
import { formatDate } from "@/lib/utils";

const DOC_TYPE_LABELS: Record<string, string> = {
  TEMPLATE: "合同模板",
  POLICY: "公司制度",
  PRECEDENT: "历史案例",
  CLAUSE_LIBRARY: "条款库",
};

const DOC_TYPE_COLORS: Record<string, string> = {
  TEMPLATE: "bg-blue-500",
  POLICY: "bg-purple-500",
  PRECEDENT: "bg-orange-500",
  CLAUSE_LIBRARY: "bg-green-500",
};

export default function KnowledgePage() {
  const router = useRouter();
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const response = await fetch("/api/knowledge");
      const data = await response.json();
      setDocs(data.docs || []);
    } catch (error) {
      console.error("Failed to fetch knowledge docs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeTab === "all" || doc.type === activeTab;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    return (
      <Badge
        className={`${DOC_TYPE_COLORS[type]} text-white`}
      >
        {DOC_TYPE_LABELS[type] || type}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="flex h-16 items-center px-6 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ContractGuard</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatar.png" />
              <AvatarFallback>法务</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              知识库
            </h1>
            <p className="text-muted-foreground">
              合同模板、公司制度、历史案例与条款库
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建文档
          </Button>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索知识库..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                筛选
              </Button>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                导入
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="TEMPLATE">合同模板</TabsTrigger>
            <TabsTrigger value="POLICY">公司制度</TabsTrigger>
            <TabsTrigger value="PRECEDENT">历史案例</TabsTrigger>
            <TabsTrigger value="CLAUSE_LIBRARY">条款库</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <Card
                  key={doc.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <h3 className="font-medium line-clamp-1">{doc.title}</h3>
                          {getTypeBadge(doc.type)}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>查看详情</DropdownMenuItem>
                          <DropdownMenuItem>编辑</DropdownMenuItem>
                          <DropdownMenuItem>删除</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {doc.content.slice(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(doc.updatedAt)}
                        </span>
                        {doc.metadata && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {Object.keys(doc.metadata).length} 标签
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredDocs.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无知识库文档</p>
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    创建第一份文档
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {docs.filter((d) => d.type === "TEMPLATE").length}
                  </p>
                  <p className="text-sm text-muted-foreground">合同模板</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {docs.filter((d) => d.type === "POLICY").length}
                  </p>
                  <p className="text-sm text-muted-foreground">公司制度</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {docs.filter((d) => d.type === "PRECEDENT").length}
                  </p>
                  <p className="text-sm text-muted-foreground">历史案例</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {docs.filter((d) => d.type === "CLAUSE_LIBRARY").length}
                  </p>
                  <p className="text-sm text-muted-foreground">条款库</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
