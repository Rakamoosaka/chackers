import { BarChart3, Crown, Eye, Puzzle, Settings, User } from "lucide-react";
import { AuthStatus } from "@/features/auth/auth-status";

const navItems = [
  { label: "Play", href: "/", icon: Crown },
  { label: "Puzzle", href: "/puzzle", icon: Puzzle },
  { label: "Leaderboard", href: "/leaderboard", icon: BarChart3 },
  { label: "Watch", href: "/watch", icon: Eye },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Pro", href: "/pro", icon: Crown },
  { label: "Setup", href: "/setup", icon: Settings },
];

export function AppNav({ current = "Play" }: { current?: string }) {
  return (
    <nav className="app-nav" aria-label="Primary navigation">
      <div className="brand">
        <strong>Chackers</strong>
        <span>Competitive checkers</span>
      </div>
      <div className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <a
              aria-current={item.label === current ? "page" : undefined}
              className="nav-item"
              href={item.href}
              key={item.label}
            >
              <Icon aria-hidden="true" size={18} />
              {item.label}
            </a>
          );
        })}
      </div>
      <div className="sidebar-auth">
        <AuthStatus />
      </div>
    </nav>
  );
}
