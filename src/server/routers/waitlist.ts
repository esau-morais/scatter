import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { z } from "zod/v4";
import { waitlist } from "@/db/schema";
import { WaitlistWelcome } from "@/emails/waitlist-welcome";
import { publicProcedure, router } from "../trpc";

const resend = new Resend(process.env.RESEND_API_KEY);

export const waitlistRouter = router({
  join: publicProcedure
    .input(z.object({ email: z.email() }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim();

      const [existing] = await ctx.db
        .select()
        .from(waitlist)
        .where(eq(waitlist.email, email))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "already_joined",
        });
      }

      await ctx.db.insert(waitlist).values({ email });

      await resend.emails.send({
        from: "Scatter <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to Scatter Waitlist",
        react: WaitlistWelcome({ email }),
      });

      return { success: true };
    }),
});
