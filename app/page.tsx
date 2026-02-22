"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  TrendingUp,
  Shield,
  Plus,
  Search,
  Bell,
  Settings,
  Users,
  BookOpen,
  BarChart3,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { DashboardStats, Contract } from "@/types";
import { RISK_LEVEL_COLORS, CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from "@/constants/rules";
import { formatDate, formatNumber, getInitials, timeAgo } from "@/lib/utils";
import { UploadContractDialog } from "@/components/upload-contract-dialog";
import { useUser } from "@/lib/user-context";
import { RoleSwitcher } from "@/components/role-switcher";

const RISK_COLORS = {
  A: "#ef4444",
  B: "#f97316",
  C: "#eab308",
  D: "#22c55e",
};

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const data = await response.json();
      setStats(data.stats);
      setRecentContracts(data.recentContracts || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    const config = RISK_LEVEL_COLORS[level as keyof typeof RISK_LEVEL_COLORS];
    return (
      <Badge
        style={{ backgroundColor: config?.color }}
        className="text-white"
      >
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
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ContractGuard</span>
          </div>
          <div className="flex items-center gap-4">
            <RoleSwitcher currentUser={user} onSwitch={(newUser) => {
              // 存储选中的用户到本地存储
              localStorage.setItem('test-user', JSON.stringify(newUser));
              setUser(newUser as any);
            }} />
            <Button variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{getInitials(user?.name || "用户")}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user?.name || "访客"}</p>
                <p className="text-xs text-gray-500">{user?.role || "未登录"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} title="退出登录">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)] p-4">
          <nav className="space-y-2">
            <Button variant="secondary" className="w-full justify-start gap-2">
              <BarChart3 className="w-4 h-4" />
              工作台
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => router.push("/contracts")}
            >
              <FileText className="w-4 h-4" />
              合同列表
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => router.push("/pending")}
            >
              <Clock className="w-4 h-4" />
              待审合同
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => router.push("/approved")}
            >
              <CheckCircle className="w-4 h-4" />
              已审合同
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => router.push("/knowledge")}
            >
              <BookOpen className="w-4 h-4" />
              知识库
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => router.push("/team")}
            >
              <Users className="w-4 h-4" />
              团队管理
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => router.push("/settings")}
            >
              <Settings className="w-4 h-4" />
              系统设置
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">工作台</h1>
              <p className="text-muted-foreground">欢迎回来，查看今天的合同审查任务</p>
            </div>
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              上传合同
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>总合同数</CardDescription>
                <CardTitle className="text-3xl">{formatNumber(stats?.totalContracts || 0)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  本月新增 {stats?.monthlyTrend?.[stats.monthlyTrend.length - 1]?.count || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>待审查</CardDescription>
                <CardTitle className="text-3xl">{formatNumber(stats?.pendingReview || 0)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  平均审查时间 {stats?.averageReviewTime || 0} 天
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>审批中</CardDescription>
                <CardTitle className="text-3xl">{formatNumber(stats?.pendingApproval || 0)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-muted-foreground">
                  <AlertCircle className="w-3 h-3 mr-1 text-orange-500" />
                  需要关注
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>本月通过</CardDescription>
                <CardTitle className="text-3xl">{formatNumber(stats?.approvedThisMonth || 0)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                  审批效率良好
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">风险分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "高风险", value: stats?.riskDistribution?.A || 0, color: RISK_COLORS.A },
                          { name: "中风险", value: stats?.riskDistribution?.B || 0, color: RISK_COLORS.B },
                          { name: "低风险", value: stats?.riskDistribution?.C || 0, color: RISK_COLORS.C },
                          { name: "极低风险", value: stats?.riskDistribution?.D || 0, color: RISK_COLORS.D },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                      >
                        {[
                          RISK_COLORS.A,
                          RISK_COLORS.B,
                          RISK_COLORS.C,
                          RISK_COLORS.D,
                        ].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-xs mt-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    高风险
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    中风险
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    低风险
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    极低风险
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="text-base">月度趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.monthlyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Contracts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近合同</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contract.creator?.avatar} />
                        <AvatarFallback>
                          {getInitials(contract.creator?.name || "未知")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{contract.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{contract.counterparty}</span>
                          <span>·</span>
                          <span>{CONTRACT_TYPE_LABELS[contract.type]}</span>
                          <span>·</span>
                          <span>{timeAgo(contract.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRiskBadge(contract.riskLevel)}
                      {getStatusBadge(contract.status)}
                      {contract.aiReview?.riskScore && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">评分</span>
                          <Progress
                            value={contract.aiReview.riskScore}
                            className="w-20"
                          />
                          <span className="text-sm font-medium">
                            {contract.aiReview.riskScore}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {recentContracts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无合同数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <UploadContractDialog open={uploadOpen} onOpenChange={setUploadOpen} onSuccess={fetchDashboardData} />
    </div>
  );
}
