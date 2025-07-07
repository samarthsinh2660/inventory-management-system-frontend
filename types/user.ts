export enum UserRole {
    MASTER = 'master',
    EMPLOYEE = 'employee'
}


export interface UsersState {
    list: User[];
    loading: boolean;
    error: string | null;
  }
  
export interface SignInData {
  username: string;
  password: string;
}

export interface CreateUserData {
    name: string; 
    username: string; 
    email: string; 
    password: string; 
    role: UserRole 
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    role?: UserRole;
    username?: string; 
    password?: string; 
}

export interface UpdateProfileData {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    username?: string;
  }

export interface TokenData {
    id: number;
    is_master: boolean;
    email?: string;
    username?: string;
    name?: string;
    iat?: number;
    exp?: number;
  }
  
  // User interface aligned with backend
  export interface User {
    id: number;
    username: string;
    name: string;
    email?: string;
    role: UserRole;
    created_at?: string;
  }

  
export interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    loading: boolean;
    error: string | null;
}

export interface IfMasterProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }

  export interface AuthGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }

  export interface CreateUserModalProps {
    isVisible: boolean;
    onClose: () => void;
  }

  export interface HandleSubmitProps {
    name: string; 
    username: string; 
    password: string; 
    email?: string; 
    role: UserRole 
  }

  export type FieldToShow = 'name' | 'email' | 'password' | 'username' | 'role';
  export interface EditProfileFormProps {
    user: User;
    isOwnProfile?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
    fieldsToShow?: Array<FieldToShow>;
  }

  export interface EditUserModalProps {
    isVisible: boolean;
    onClose: () => void;
    user: User;
    onSuccess?: () => void;
  }
  