import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import connectDB from './db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/database';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
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

        try {
          await connectDB();
          const user = await User.findOne({ username: credentials.username as string });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            username: user.username,
            name: user.name,
            role: user.role,
            profileImage: user.profileImage || null,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
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
        try {
          // Refresh profileImage from database on each request
          await connectDB();
          const userDoc = await User.findById(token.id as string);
          if (userDoc) {
            token.profileImage = userDoc.profileImage || null;
          }
        } catch (error) {
          console.error('Error refreshing user profile:', error);
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
  debug: process.env.NODE_ENV === 'development',
});
