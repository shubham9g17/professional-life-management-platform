import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extend the built-in session type to include user id
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }

  /**
   * Extend the built-in user type
   */
  interface User {
    id: string;
    email: string;
    name: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT type to include user id
   */
  interface JWT {
    id: string;
    email: string;
    name: string;
  }
}
