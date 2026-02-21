"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Shield,
  Bell,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "@/constants/rules";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";

export default function ApprovedContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedContracts();
  }, []);

  const fetchApprovedContracts = async () => {
    try {
      const response = await fetch('/api/contract?status=APPROVED');
      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (error) {
      console.error("Failed to fetch approved contracts:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="flex h-16 items-center px-6 gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
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
              <AvatarFallback>法务</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              已审合同
            </h1>
            <p className="text-muted-foreground">
              已审批通过的合同列表，共 {contracts.length} 份
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{contracts.length}</p>
              <p className="text-sm text-muted-foreground">已通过</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">
                {contracts.filter(c => c.riskLevel === 'A').length}
              </p>
              <p className="text-sm text-muted-foreground">高风险</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">
                {contracts.filter(c => c.riskLevel === 'B' || c.riskLevel === 'C').length}
              </p>
              <p className="text-sm text-muted-foreground">中低风险</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-600">
                {contracts.filter(c => c.riskLevel === 'D').length}
              </p>
              <p className="text-sm text-muted-foreground">极低风险</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="搜索已审合同..." className="pl-10" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>合同信息</TableHead>
                  <TableHead>对方主体</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>风险等级</TableHead>
                  <TableHead>审批日期</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id} className="cursor-pointer hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-green-500" />
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
                      {contract.amount ? formatCurrency(contract.amount) : "-"}
                    </TableCell>
                    <TableCell>{getRiskBadge(contract.riskLevel)}</TableCell>
                    <TableCell>
                      {contract.completedAt ? formatDate(contract.completedAt) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/contracts/${contract.id}`)}>
                        查看详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {contracts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">暂无已审合同</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
