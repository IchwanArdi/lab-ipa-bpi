import { UserRole } from '@/types/database';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      role: UserRole;
      profileImage: string | null;
    };
  }

  interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    profileImage: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    role: UserRole;
    profileImage: string | null;
  }
}
