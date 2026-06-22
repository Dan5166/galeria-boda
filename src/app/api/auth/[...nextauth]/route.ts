import NextAuth, { type NextAuthOptions } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

export const authOptions: NextAuthOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Solo en el login inicial tenemos el id_token con los grupos
      if (account?.id_token) {
        const decoded = decodeJwt(account.id_token);
        const groups: string[] = decoded["cognito:groups"] || [];
        token.role = groups.includes("admins") ? "admin" : "guest";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role || "guest";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

// Decodifica el payload de un JWT sin verificar firma (solo lectura local)
function decodeJwt(token: string): any {
  const payload = token.split(".")[1];
  const decoded = Buffer.from(payload, "base64").toString("utf-8");
  return JSON.parse(decoded);
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
