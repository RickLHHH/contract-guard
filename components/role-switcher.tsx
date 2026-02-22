"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserRole } from "@prisma/client";

const TEST_USERS = [
  { id: "user-1", email: "business@contractguard.com", name: "张业务", role: UserRole.BUSINESS_USER, department: "采购部" },
  { id: "user-2", email: "legal@contractguard.com", name: "李法务", role: UserRole.LEGAL_SPECIALIST, department: "法务部" },
  { id: "user-3", email: "director@contractguard.com", name: "王总监", role: UserRole.LEGAL_DIRECTOR, department: "法务部" },
  { id: "user-4", email: "finance@contractguard.com", name: "赵财务", role: UserRole.FINANCE, department: "财务部" },
  { id: "user-5", email: "admin@contractguard.com", name: "系统管理员", role: UserRole.ADMIN, department: "IT部" },
];

interface RoleSwitcherProps {
  currentUser?: { id: string; name: string; role: UserRole } | null;
  onSwitch: (user: typeof TEST_USERS[0]) => void;
}

export function RoleSwitcher({ currentUser, onSwitch }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false);

  const handleSwitch = (user: typeof TEST_USERS[0]) => {
    onSwitch(user);
    setOpen(false);
    // 刷新页面以应用新角色
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="w-4 h-4" />
          切换角色
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>切换测试角色</DialogTitle>
          <DialogDescription>
            选择不同的用户角色来测试不同权限的功能
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {TEST_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSwitch(user)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                currentUser?.id === user.id
                  ? "bg-blue-50 border-blue-300"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">{user.department}</p>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {user.role}
                </span>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
