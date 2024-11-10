import * as React from "react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  className?: string;
}

export const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(
  ({ active, onClick, icon, label, className, 'aria-current': ariaCurrent, ...props }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg w-full transition-colors",
          "text-sm font-medium",
          active ? "bg-[#2E2F2E] text-white" : "text-gray-400 hover:text-white hover:bg-[#2E2F2E]/50",
          className
        )}
        aria-current={ariaCurrent}
        role="tab"
        aria-selected={active}
        {...props}
      >
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span>{label}</span>
      </button>
    );
  }
);

NavItem.displayName = "NavItem";