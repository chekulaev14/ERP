"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

const defaultFallback = (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-4">
    <p className="text-foreground font-medium">Произошла ошибка</p>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90"
    >
      Обновить страницу
    </button>
  </div>
);

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? defaultFallback;
    }
    return this.props.children;
  }
}
