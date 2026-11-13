"use client";

import { Component, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/States";
import { reportClientError } from "@/lib/report-client-error";

/**
 * Keeps one broken widget (e.g. a chart fed unexpected market data) from taking down the whole page.
 * Shows a compact error with a retry button in its place and reports the crash to the server log.
 */
export class WidgetBoundary extends Component<{ name: string; children: ReactNode; fallback?: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[${this.props.name}]`, error);
    reportClientError(error, this.props.name);
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return <ErrorState compact message="نمایش این بخش با مشکل مواجه شد." onRetry={() => this.setState({ error: null })} />;
  }
}
