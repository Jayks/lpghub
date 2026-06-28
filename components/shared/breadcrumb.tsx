import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb navigation bar rendered between TopBar and page content.
 * Items without href render as plain text (current page).
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 overflow-x-auto border-b border-slate-100 dark:border-slate-800/60"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0">
          {i > 0 && (
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[12rem]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
