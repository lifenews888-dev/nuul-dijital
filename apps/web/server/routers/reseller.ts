import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, prisma } from "@/lib/trpc";

// ── Admin guard ───────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Админ эрх шаардлагатай",
    });
  }
  return next({ ctx });
});

// ── Reseller router ──────────────────────────────────────────────────

export const resellerRouter = router({
  // ── Get current user's reseller profile ──
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.resellerProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        _count: { select: { clients: true, withdrawals: true } },
      },
    });
    return profile;
  }),

  // ── Apply to become a reseller ──
  applyAsReseller: protectedProcedure
    .input(z.object({ companyName: z.string().min(2).max(200) }))
    .mutation(async ({ ctx, input }) => {
      // Check if already applied
      const existing = await prisma.resellerProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Та аль хэдийн хүсэлт илгээсэн байна",
        });
      }

      return prisma.resellerProfile.create({
        data: {
          userId: ctx.session.user.id,
          companyName: input.companyName,
          status: "PENDING",
        },
      });
    }),

  // ── Get referred clients ──
  getClients: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.resellerProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Reseller профайл олдсонгүй" });
    }

    const clients = await prisma.resellerClient.findMany({
      where: { resellerId: profile.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            _count: { select: { orders: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return clients.map((rc) => ({
      id: rc.id,
      clientId: rc.client.id,
      name: rc.client.name,
      email: rc.client.email,
      joinedAt: rc.createdAt,
      orderCount: rc.client._count.orders,
    }));
  }),

  // ── Get earnings summary ──
  getEarnings: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.resellerProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        withdrawals: true,
      },
    });

    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Reseller профайл олдсонгүй" });
    }

    const paidWithdrawals = profile.withdrawals
      .filter((w) => w.status === "PAID")
      .reduce((s, w) => s + w.amount, 0);

    const pendingWithdrawals = profile.withdrawals
      .filter((w) => w.status === "PENDING" || w.status === "PROCESSING")
      .reduce((s, w) => s + w.amount, 0);

    return {
      total: profile.totalEarned,
      pending: pendingWithdrawals,
      paid: paidWithdrawals,
      balance: profile.balance,
    };
  }),

  // ── Request withdrawal ──
  requestWithdrawal: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(10000),
        bankName: z.string().min(1),
        accountNo: z.string().min(4),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await prisma.resellerProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!profile || profile.status !== "ACTIVE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Reseller эрхгүй" });
      }

      if (input.amount > profile.balance) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Үлдэгдэл хүрэлцэхгүй байна. Боломжит: ₮${profile.balance.toLocaleString()}`,
        });
      }

      const [withdrawal] = await prisma.$transaction([
        prisma.resellerWithdrawal.create({
          data: {
            resellerId: profile.id,
            amount: input.amount,
            bankName: input.bankName,
            accountNo: input.accountNo,
            status: "PENDING",
          },
        }),
        prisma.resellerProfile.update({
          where: { id: profile.id },
          data: { balance: { decrement: input.amount } },
        }),
      ]);

      return withdrawal;
    }),

  // ── Get referral link ──
  getReferralLink: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.resellerProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Reseller профайл олдсонгүй" });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nuul.digital";
    return `${baseUrl}/ref/${profile.id}`;
  }),

  // ── Get withdrawal history ──
  getWithdrawalHistory: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.resellerProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Reseller профайл олдсонгүй" });
    }

    return prisma.resellerWithdrawal.findMany({
      where: { resellerId: profile.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ═══════════════════════════════════════════════════════════════════
  //  ADMIN ONLY
  // ═══════════════════════════════════════════════════════════════════

  // ── List pending reseller applications ──
  getPendingResellers: adminProcedure.query(async () => {
    return prisma.resellerProfile.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ── Approve a reseller ──
  approveReseller: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const profile = await prisma.resellerProfile.findUnique({
        where: { id: input.id },
      });

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reseller олдсонгүй" });
      }

      const [updatedProfile] = await prisma.$transaction([
        prisma.resellerProfile.update({
          where: { id: input.id },
          data: { status: "ACTIVE" },
        }),
        prisma.user.update({
          where: { id: profile.userId },
          data: { role: "RESELLER" },
        }),
      ]);

      return updatedProfile;
    }),

  // ── Reject a reseller ──
  rejectReseller: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.resellerProfile.update({
        where: { id: input.id },
        data: { status: "SUSPENDED" },
      });
    }),

  // ── List all active resellers ──
  getAllResellers: adminProcedure.query(async () => {
    return prisma.resellerProfile.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { clients: true } },
      },
      orderBy: { totalEarned: "desc" },
    });
  }),

  // ── Get all pending withdrawals ──
  getWithdrawals: adminProcedure.query(async () => {
    return prisma.resellerWithdrawal.findMany({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      include: {
        reseller: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ── Process withdrawal (PAID or REJECTED) ──
  processWithdrawal: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PAID", "REJECTED"]),
      })
    )
    .mutation(async ({ input }) => {
      const withdrawal = await prisma.resellerWithdrawal.findUnique({
        where: { id: input.id },
      });

      if (!withdrawal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Зарлага олдсонгүй" });
      }

      if (input.status === "REJECTED") {
        // Refund balance
        const [updated] = await prisma.$transaction([
          prisma.resellerWithdrawal.update({
            where: { id: input.id },
            data: { status: "REJECTED", processedAt: new Date() },
          }),
          prisma.resellerProfile.update({
            where: { id: withdrawal.resellerId },
            data: { balance: { increment: withdrawal.amount } },
          }),
        ]);
        return updated;
      }

      return prisma.resellerWithdrawal.update({
        where: { id: input.id },
        data: { status: "PAID", processedAt: new Date() },
      });
    }),
});
