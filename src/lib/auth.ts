import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      console.log('New user created:', user.email)
      
      // Create default lists for new user
      try {
        await db.taskList.createMany({
          data: [
            {
              name: 'Today',
              description: 'Tasks for today',
              color: '#3b82f6',
              isDefault: true,
              order: 0,
              userId: user.id,
            },
            {
              name: 'Upcoming',
              description: 'Future tasks',
              color: '#10b981',
              isDefault: true,
              order: 1,
              userId: user.id,
            },
            {
              name: 'Personal',
              description: 'Personal tasks and goals',
              color: '#8b5cf6',
              isDefault: false,
              order: 2,
              userId: user.id,
            },
          ],
        })
        console.log('Default lists created for user:', user.email)
      } catch (error) {
        console.error('Error creating default lists:', error)
      }
    },
  },
}