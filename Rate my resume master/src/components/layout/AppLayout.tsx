import * as React from "react";
import { Link, useLocation } from "wouter";
import { FileText, History } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return React.createElement(
    "div",
    { className: "min-h-[100dvh] flex flex-col bg-background" },
    React.createElement(
      "header",
      { className: "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" },
      React.createElement(
        "div",
        { className: "container mx-auto flex h-16 items-center justify-between px-4 md:px-8" },
        React.createElement(
          Link,
          { href: "/", className: "flex items-center gap-2 transition-opacity hover:opacity-80" },
          React.createElement(
            "div",
            { className: "flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground" },
            React.createElement(FileText, { className: "h-5 w-5" })
          ),
          React.createElement(
            "span",
            { className: "font-bold text-lg tracking-tight" },
            "Rate My Resume"
          )
        ),
        React.createElement(
          "nav",
          { className: "flex items-center gap-6 text-sm font-medium" },
          React.createElement(
            Link,
            {
              href: "/",
              className: cn(
                "transition-colors hover:text-foreground/80",
                location === "/" ? "text-foreground" : "text-foreground/60"
              ),
            },
            "Analyze"
          ),
          React.createElement(
            Link,
            {
              href: "/history",
              className: cn(
                "flex items-center gap-2 transition-colors hover:text-foreground/80",
                location.startsWith("/history") ? "text-foreground" : "text-foreground/60"
              ),
            },
            React.createElement(History, { className: "h-4 w-4" }),
            " History"
          )
        )
      )
    ),
    React.createElement("main", { className: "flex-1 flex flex-col" }, children),
    React.createElement(
      "footer",
      { className: "border-t py-6 md:py-0" },
      React.createElement(
        "div",
        { className: "container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 md:px-8" },
        React.createElement(
          "p",
          { className: "text-sm text-muted-foreground" },
          "Rate My Resume - Developed by HRITHIK MAJUMDAR SHIBU"
        )
      )
    )
  );
}
