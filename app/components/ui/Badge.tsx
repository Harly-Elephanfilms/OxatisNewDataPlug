import { ReactNode } from "react";

type BadgeVariant = "green" | "red" | "yellow" | "blue" | "gray" | "purple";

const variants: Record<BadgeVariant, string> = {
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-700",
  purple: "bg-purple-100 text-purple-800",
};

export function Badge({
  children,
  variant = "gray",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
