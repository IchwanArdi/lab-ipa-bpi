import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { query } from './db';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/database';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const users = await query<any[]>('SELECT * FROM User WHERE username = ?', [credentials.username as string]);

        if (!users || users.length === 0) {
          return null;
        }

        const user = users[0];

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          profileImage: user.profileImage || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.profileImage = user.profileImage || null;
      } else if (token.id) {
        // Refresh profileImage from database on each request
        const users = await query<any[]>('SELECT profileImage FROM User WHERE id = ?', [token.id as string]);
        if (users && users.length > 0) {
          token.profileImage = users[0].profileImage || null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as UserRole;
        session.user.profileImage = token.profileImage as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});
