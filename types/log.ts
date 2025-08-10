

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
    is_flag: boolean;
    username: string;
    product_name?: string;
    location_name?: string;
    entry_reference_id?: string;
}

export interface AuditLogsState {
    list: AuditLog[];
    selected: AuditLog | null;
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    filters: AuditLogFilters;
    meta: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      filters_applied?: Record<string, any>;
    };
}

// Comprehensive audit log filters matching backend API
export interface AuditLogFilters {
    search?: string;
    user_id?: number;
    location_id?: number;
    action?: AuditAction;
    is_flag?: boolean;
    reference_id?: string;
    category?: string;
    subcategory_id?: number;
    product_id?: number;
    date_from?: string;
    date_to?: string;
    days?: number;
    page?: number;
    limit?: number;
}

// Fetch all audit logs with optional filtering
export interface FetchAuditLogsParams extends AuditLogFilters {
    loadMore?: boolean;
}

export interface DeleteLogParams {
    id: number;
    revert?: boolean;
}

// Flag/unflag audit log parameters
export interface FlagLogParams {
    id: number;
    is_flag: boolean;
}

// API response for flag operation
export interface FlagLogResponse {
    success: boolean;
    data: AuditLog;
    message: string;
}

// API response structure matching backend
export interface AuditLogsApiResponse {
    success: boolean;
    message: string;
    data: AuditLog[];
    meta: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      filters_applied?: Record<string, any>;
    };
    timestamp: string;
}