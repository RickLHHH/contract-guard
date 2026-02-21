"use client";

import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Shield,
  Bell,
  ArrowLeft,
  User,
  Mail,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { USER_ROLE_LABELS } from "@/constants/rules";

// Mock team data
const teamMembers = [
  {
    id: "1",
    name: "张业务",
    email: "business@example.com",
    role: "BUSINESS_USER",
    department: "采购部",
    avatar: "",
  },
  {
    id: "2",
    name: "李法务",
    email: "legal@example.com",
    role: "LEGAL_SPECIALIST",
    department: "法务部",
    avatar: "",
  },
  {
    id: "3",
    name: "王总监",
    email: "director@example.com",
    role: "LEGAL_DIRECTOR",
    department: "法务部",
    avatar: "",
  },
  {
    id: "4",
    name: "赵财务",
    email: "finance@example.com",
    role: "FINANCE",
    department: "财务部",
    avatar: "",
  },
  {
    id: "5",
    name: "刘总",
    email: "ceo@example.com",
    role: "CEO",
    department: "管理层",
    avatar: "",
  },
];

export default function TeamPage() {
  const router = useRouter();

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      BUSINESS_USER: "bg-blue-500",
      LEGAL_SPECIALIST: "bg-purple-500",
      LEGAL_DIRECTOR: "bg-orange-500",
      FINANCE: "bg-green-500",
      CEO: "bg-red-500",
      ADMIN: "bg-slate-500",
    };
    return (
      <Badge className={`${colors[role] || "bg-gray-500"} text-white`}>
        {USER_ROLE_LABELS[role] || role}
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
              <Users className="w-6 h-6" />
              团队管理
            </h1>
            <p className="text-muted-foreground">管理团队成员和权限设置</p>
          </div>
          <Button>邀请成员</Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{teamMembers.length}</p>
              <p className="text-sm text-muted-foreground">团队成员</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">
                {teamMembers.filter((m) => m.role === "LEGAL_SPECIALIST" || m.role === "LEGAL_DIRECTOR").length}
              </p>
              <p className="text-sm text-muted-foreground">法务人员</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">
                {teamMembers.filter((m) => m.role === "BUSINESS_USER").length}
              </p>
              <p className="text-sm text-muted-foreground">业务人员</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">管理员</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="搜索团队成员..." className="pl-10" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {member.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {getRoleBadge(member.role)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {member.department}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      编辑权限
                    </Button>
                    <Button variant="outline" size="sm">
                      查看记录
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
