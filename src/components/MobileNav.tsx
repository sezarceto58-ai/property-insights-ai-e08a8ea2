/**
 * MobileNav — fixed bottom navigation bar shown on small screens only.
 * Mirrors the most important sidebar items for thumb-friendly mobile access.
 */
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Search, Heart, BadgeDollarSign,
  BarChart3, Building2, Briefcase, TrendingUp,
} from "lucide-react";
import { useUserRoles, getBestHomeRoute } from "@/hooks/useUserRoles";

interface NavItem { path: string; icon: React.ElementType; label: string; }

const buyerItems: NavItem[] = [
  { path: "/buyer",          icon: LayoutDashboard, label: "Home"      },
  { path: "/buyer/discover", icon: Search,           label: "Discover"  },
  { path: "/buyer/favorites",icon: Heart,            label: "Saved"     },
  { path: "/buyer/offers",   icon: BadgeDollarSign,  label: "Offers"    },
  { path: "/buyer/market-intelligence", icon: BarChart3, label: "Market" },
];

const sellerItems: NavItem[] = [
  { path: "/seller",          icon: LayoutDashboard, label: "Home"     },
  { path: "/seller/listings", icon: Building2,       label: "Listings" },
  { path: "/seller/offers",   icon: BadgeDollarSign, label: "Offers"   },
  { path: "/seller/analytics",icon: BarChart3,       label: "Analytics"},
  { path: "/seller/crm",      icon: BadgeDollarSign, label: "CRM"      },
];

const developerItems: NavItem[] = [
  { path: "/developer",              icon: LayoutDashboard, label: "Home"     },
  { path: "/developer/opportunities",icon: Briefcase,       label: "Deals"    },
  { path: "/developer/analyze",      icon: Search,          label: "Analyze"  },
  { path: "/developer/portfolio",    icon: TrendingUp,      label: "Portfolio"},
  { path: "/developer/market-intelligence", icon: BarChart3, label: "Market"  },
];

export default function MobileNav() {
  const location = useLocation();
  const { data: roles = [] } = useUserRoles();

  let items = buyerItems;
  if (location.pathname.startsWith("/seller"))    items = sellerItems;
  if (location.pathname.startsWith("/developer")) items = developerItems;

  return (
    <nav className="mobile-bottom-nav lg:hidden">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className={`text-[10px] font-medium leading-none ${isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
