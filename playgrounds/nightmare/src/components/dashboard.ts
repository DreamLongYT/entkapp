// Unused component – imports from unused hooks
import { useStore, useStoreState } from "../hooks/use-store.js";
import { useAuth, useEvents } from "../hooks/use-service.js";
import type { GlobalConfig } from "../config/index.js";

export interface DashboardProps {
  config: GlobalConfig;
  storeName: string;
}

export class Dashboard {
  constructor(private props: DashboardProps) {}

  render(): string {
    const state = useStoreState(this.props.storeName);
    const auth = useAuth();
    const events = useEvents();
    return `<Dashboard store="${this.props.storeName}" state="${JSON.stringify(state)}" />`;
  }

  // Unused
  refresh(): void {
    const store = useStore(this.props.storeName);
    store?.setState({});
  }
}

// Unused
export type DashboardState = { loading: boolean; error: string | null };
export const DASHBOARD_VERSION = "1.0.0";
