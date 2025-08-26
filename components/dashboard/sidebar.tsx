"use client"

import { useAuth } from "@/lib/auth/context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Map,
  FileText,
  Users,
  Settings,
  LogOut,
  Activity,
  Eye,
  Zap,
  MessageSquare,
  BarChart3,
  Clock,
} from "lucide-react"

const roleConfig = {
  HQ: {
    title: "HQ Command",
    badge: "COMMAND",
    badgeColor: "bg-accent",
    items: [
      { icon: Map, label: "Operational Picture", href: "/dashboard/cop" },
      { icon: BarChart3, label: "Decision Center", href: "/dashboard/decisions" },
      { icon: MessageSquare, label: "Analyst Q&A", href: "/dashboard/qa" },
      { icon: Activity, label: "Live Intelligence", href: "/dashboard/intel" },
      { icon: Clock, label: "Timeline", href: "/dashboard/timeline" },
      { icon: Users, label: "Personnel", href: "/dashboard/personnel" },
    ],
  },
  ANALYST_SOCMINT: {
    title: "SOCMINT Analyst",
    badge: "SOCMINT",
    badgeColor: "bg-chart-1",
    items: [
      { icon: FileText, label: "Submit Reports", href: "/dashboard/reports/submit" },
      { icon: Zap, label: "Fusion Workspace", href: "/dashboard/fusion" },
      { icon: Map, label: "Intelligence Map", href: "/dashboard/map" },
      { icon: Activity, label: "My Reports", href: "/dashboard/reports" },
      { icon: MessageSquare, label: "HQ Communications", href: "/dashboard/comms" },
    ],
  },
  ANALYST_SIGINT: {
    title: "SIGINT Analyst",
    badge: "SIGINT",
    badgeColor: "bg-chart-2",
    items: [
      { icon: FileText, label: "Submit Reports", href: "/dashboard/reports/submit" },
      { icon: Zap, label: "Fusion Workspace", href: "/dashboard/fusion" },
      { icon: Map, label: "Intelligence Map", href: "/dashboard/map" },
      { icon: Activity, label: "My Reports", href: "/dashboard/reports" },
      { icon: MessageSquare, label: "HQ Communications", href: "/dashboard/comms" },
    ],
  },
  ANALYST_HUMINT: {
    title: "HUMINT Analyst",
    badge: "HUMINT",
    badgeColor: "bg-chart-3",
    items: [
      { icon: FileText, label: "Submit Reports", href: "/dashboard/reports/submit" },
      { icon: Zap, label: "Fusion Workspace", href: "/dashboard/fusion" },
      { icon: Map, label: "Intelligence Map", href: "/dashboard/map" },
      { icon: Activity, label: "My Reports", href: "/dashboard/reports" },
      { icon: MessageSquare, label: "HQ Communications", href: "/dashboard/comms" },
    ],
  },
  OBSERVER: {
    title: "Observer",
    badge: "OBSERVER",
    badgeColor: "bg-muted",
    items: [
      { icon: Eye, label: "Intelligence View", href: "/dashboard/view" },
      { icon: Map, label: "Approved Events", href: "/dashboard/approved" },
      { icon: BarChart3, label: "Decision Log", href: "/dashboard/decisions/view" },
      { icon: Clock, label: "Timeline", href: "/dashboard/timeline/view" },
    ],
  },
}

export function Sidebar() {
  const { user, logout } = useAuth()

  if (!user) return null

  const config = roleConfig[user.role]

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <Shield className="h-8 w-8 text-sidebar-accent" />
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground">COP Platform</h1>
          <p className="text-sm text-sidebar-foreground/70">Intelligence Hub</p>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-bold text-sidebar-accent-foreground">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.username}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs ${config.badgeColor} text-white`}>{config.badge}</Badge>
              <Badge variant="outline" className="text-xs">
                {user.clearanceLevel}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <h2 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-4">
          {config.title}
        </h2>
        {config.items.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            asChild
          >
            <a href={item.href}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          </Button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
