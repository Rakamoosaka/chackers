import { BarChart3, Crown, Eye, Puzzle, User, Users } from "lucide-react";

const navItems = [
  { label: "Play", icon: Crown, current: true },
  { label: "Puzzle", icon: Puzzle },
  { label: "Leaderboard", icon: BarChart3 },
  { label: "Watch", icon: Eye },
  { label: "Profile", icon: User },
  { label: "Pro", icon: Users },
];

export function AppNav() {
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
              aria-current={item.current ? "page" : undefined}
              className="nav-item"
              href="#"
              key={item.label}
            >
              <Icon aria-hidden="true" size={18} />
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
