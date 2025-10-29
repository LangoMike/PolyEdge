"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  Home,
  TrendingUp,
  BarChart3,
  Settings,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isPolling?: boolean;
}

export function MobileNav({ isPolling = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/", label: "Markets", icon: TrendingUp },
    { href: "/sports", label: "Sports", icon: TrendingUp },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden border-b bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-primary"></div>
            <h1 className="text-lg font-bold">PolyEdge</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Live indicator */}
            <div className="flex items-center space-x-1">
              <div className={cn(
                "h-2 w-2 rounded-full",
                isPolling ? "bg-green-500" : "bg-gray-400"
              )} />
              <span className="text-xs text-muted-foreground">
                {isPolling ? "Live" : "Paused"}
              </span>
            </div>
            
            {/* Search button */}
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="h-4 w-4" />
            </Button>
            
            {/* Menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-card border-l shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              
              <div className="mt-8 pt-6 border-t">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                    <Badge variant="secondary" className="ml-auto">3</Badge>
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
