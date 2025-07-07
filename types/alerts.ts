export interface StockAlert {
    id: number;
    product_id: number;
    product_name: string;
    location_name: string;
    current_stock: number;
    min_threshold: number;
    created_at: string;
    is_resolved: boolean;
    resolved_at: string | null;
  }
  
  export interface Notification {
    id: number;
    product_id: number;
    product_name: string;
    location_name: string;
    stock_alert_id: number;
    message: string;
    current_stock: number;
    min_threshold: number;
    is_read: boolean;
    created_at: string;
  }
  
  // API response interface
  export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    count?: number;
    total?: number;
    page?: number;
    limit?: number;
  }
  
  // Define the state shape
  export interface AlertState {
    alerts: StockAlert[];
    notifications: Notification[];
    loading: boolean;
    error: string | null;
    meta: {
      page: number;
      limit: number;
      total: number;
    };
  }

  export interface FetchAlertsParams {
    page?: number;
    limit?: number;
    resolved?: boolean;
  }