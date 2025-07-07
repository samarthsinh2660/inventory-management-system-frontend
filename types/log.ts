

export enum AuditAction {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete'
}

export interface AuditLog {
    id: number;
    entry_id: number;
    action: AuditAction;
    old_data: any | null;
    new_data: any | null;
    user_id: number;
    timestamp: string;
    reason: string | null;
    username: string;
  }

export interface AuditLogsState {
    list: AuditLog[];
    selected: AuditLog | null;
    loading: boolean;
    error: string | null;
    meta: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }

  // Fetch all audit logs with optional filtering
export interface FetchAuditLogsParams {
    entry_id?: number;
    action?: AuditAction;
    user_id?: number;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }

  export interface DeleteLogParams {
    id: number;
    revert?: boolean;
  }