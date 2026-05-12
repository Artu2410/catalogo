import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "correo@ejemplo.com" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        const usersFilePath = path.join(process.cwd(), "data", "users.json");
        try {
          const fileContents = await fs.readFile(usersFilePath, "utf8");
          const users = JSON.parse(fileContents);
          
          const user = users.find(u => u.email === credentials.email);
          if (user) {
            const isValid = await bcrypt.compare(credentials.password, user.password);
            if (isValid) {
              return { id: user.id, name: user.name, email: user.email, role: user.role };
            }
          }
          return null;
        } catch (error) {
          console.error("Error reading users", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: "kareh-secret-key-for-development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
