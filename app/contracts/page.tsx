"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Filter,
  ChevronDown,
  Shield,
  Bell,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Contract } from "@/types";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  RISK_LEVEL_COLORS,
  USER_ROLE_LABELS,
} from "@/constants/rules";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import { UploadContractDialog } from "@/components/upload-contract-dialog";

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filter, setFilter] = useState<{
    status?: string;
    type?: string;
    riskLevel?: string;
  }>({});

  useEffect(() => {
    fetchContracts();
  }, [filter]);

  const fetchContracts = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append("status", filter.status);
      if (filter.type) params.append("type", filter.type);
      if (filter.riskLevel) params.append("riskLevel", filter.riskLevel);

      const response = await fetch(`/api/contract?${params}`);
      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (error) {
      console.error("Failed to fetch contracts:", error);
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
            <h1 className="text-2xl font-bold">合同列表</h1>
            <p className="text-muted-foreground">
              管理所有合同文件，共 {contracts.length} 份
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            上传合同
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索合同标题、对方主体..."
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    状态
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilter({ ...filter, status: undefined })}>
                    全部状态
                  </DropdownMenuItem>
                  {Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => setFilter({ ...filter, status: value })}
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    类型
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilter({ ...filter, type: undefined })}>
                    全部类型
                  </DropdownMenuItem>
                  {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => setFilter({ ...filter, type: value })}
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    风险等级
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilter({ ...filter, riskLevel: undefined })}>
                    全部等级
                  </DropdownMenuItem>
                  {Object.entries(RISK_LEVEL_COLORS).map(([value, config]) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => setFilter({ ...filter, riskLevel: value })}
                    >
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>合同信息</TableHead>
                  <TableHead>对方主体</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>风险等级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交人</TableHead>
                  <TableHead>更新时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow
                    key={contract.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{contract.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {CONTRACT_TYPE_LABELS[contract.type]}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{contract.counterparty}</TableCell>
                    <TableCell>
                      {contract.amount
                        ? formatCurrency(contract.amount)
                        : "-"}
                    </TableCell>
                    <TableCell>{getRiskBadge(contract.riskLevel)}</TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={contract.creator?.avatar} />
                          <AvatarFallback className="text-xs">
                            {getInitials(contract.creator?.name || "未知")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{contract.creator?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(contract.updatedAt)}</TableCell>
                  </TableRow>
                ))}
                {contracts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">暂无合同数据</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setUploadOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        上传第一份合同
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <UploadContractDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={fetchContracts}
      />
    </div>
  );
}
