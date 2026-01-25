export { cn } from "./cn";

export function formatDate(date: Date | number | string | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "number" ? new Date(date) : new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: Date | number | string | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "number" ? new Date(date) : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return formatDate(date);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getExperimentStatusColor(state: string): string {
  const colors: Record<string, string> = {
    CREATED: "bg-gray-500",
    VALIDATED: "bg-blue-500",
    SCHEDULED: "bg-blue-600",
    LAUNCHED: "bg-indigo-500",
    EXECUTING: "bg-yellow-500",
    CANCELING: "bg-orange-500",
    CANCELED: "bg-gray-600",
    COMPLETED: "bg-green-500",
    FAILED: "bg-red-500",
  };
  return colors[state] || "bg-gray-500";
}

export function getJobStatusColor(state: string): string {
  const colors: Record<string, string> = {
    SUBMITTED: "bg-blue-500",
    QUEUED: "bg-yellow-500",
    ACTIVE: "bg-indigo-500",
    COMPLETE: "bg-green-500",
    CANCELED: "bg-gray-600",
    FAILED: "bg-red-500",
    SUSPENDED: "bg-orange-500",
    UNKNOWN: "bg-gray-500",
  };
  return colors[state] || "bg-gray-500";
}

export function isTerminalState(state: string): boolean {
  return ["COMPLETED", "FAILED", "CANCELED", "CANCELLED"].includes(state.toUpperCase());
}

export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "N/A";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(" ");
}
