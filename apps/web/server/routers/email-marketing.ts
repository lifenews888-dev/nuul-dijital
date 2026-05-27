import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { router, protectedProcedure, prisma } from "@/lib/trpc";
import {
  sendCampaign as sendCampaignLib,
  addSubscriber as addSubscriberLib,
  importSubscribersCSV,
} from "@/lib/email-marketing";

// ===================== LISTS =====================

const listsProcedures = {
  getLists: protectedProcedure.query(async ({ ctx }) => {
    return prisma.emailList.findMany({
      where: { userId: ctx.session.user.id },
      include: { _count: { select: { subscribers: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  createList: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Нэр оруулна уу"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.emailList.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description ?? null,
        },
      });
    }),

  deleteList: protectedProcedure
    .input(z.object({ listId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const list = await prisma.emailList.findUnique({
        where: { id: input.listId },
      });

      if (!list) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Жагсаалт олдсонгүй",
        });
      }

      if (list.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Энэ жагсаалтад хандах эрхгүй байна",
        });
      }

      await prisma.emailList.delete({ where: { id: input.listId } });
      return { success: true };
    }),
};

// ===================== SUBSCRIBERS =====================

const subscribersProcedures = {
  getSubscribers: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        status: z
          .enum(["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const list = await prisma.emailList.findUnique({
        where: { id: input.listId },
      });

      if (!list || list.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Энэ жагсаалтад хандах эрхгүй байна",
        });
      }

      const where: any = { listId: input.listId };
      if (input.status) where.status = input.status;
      if (input.search) {
        where.OR = [
          { email: { contains: input.search, mode: "insensitive" } },
          { name: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [subscribers, total] = await Promise.all([
        prisma.emailSubscriber.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { subscribedAt: "desc" },
        }),
        prisma.emailSubscriber.count({ where }),
      ]);

      return {
        subscribers,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  addSubscriber: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        email: z.string().email("Буруу имэйл формат"),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const list = await prisma.emailList.findUnique({
        where: { id: input.listId },
      });

      if (!list || list.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Энэ жагсаалтад хандах эрхгүй байна",
        });
      }

      return addSubscriberLib(input.listId, input.email, input.name);
    }),

  removeSubscriber: protectedProcedure
    .input(z.object({ subscriberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const subscriber = await prisma.emailSubscriber.findUnique({
        where: { id: input.subscriberId },
        include: { list: true },
      });

      if (!subscriber) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Захиалагч олдсонгүй",
        });
      }

      if (subscriber.list.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Энэ захиалагчийг устгах эрхгүй байна",
        });
      }

      await prisma.emailSubscriber.delete({
        where: { id: input.subscriberId },
      });
      return { success: true };
    }),

  importCSV: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        csvContent: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const list = await prisma.emailList.findUnique({
        where: { id: input.listId },
      });

      if (!list || list.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Энэ жагсаалтад хандах эрхгүй байна",
        });
      }

      return importSubscribersCSV(input.listId, input.csvContent);
    }),
};

// ===================== CAMPAIGNS =====================

const campaignsProcedures = {
  getCampaigns: protectedProcedure.query(async ({ ctx }) => {
    return prisma.emailCampaign.findMany({
      where: { userId: ctx.session.user.id },
      include: { list: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }),

  getCampaign: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: input.id },
        include: { list: { select: { id: true, name: true } } },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Кампанит ажил олдсонгүй",
        });
      }

      if (campaign.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Энэ кампанид хандах эрхгүй байна",
        });
      }

      return campaign;
    }),

  createCampaign: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Нэр оруулна уу"),
        subject: z.string().min(1, "Гарчиг оруулна уу"),
        previewText: z.string().optional(),
        htmlContent: z.string().min(1, "Агуулга оруулна уу"),
        listId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.listId) {
        const list = await prisma.emailList.findUnique({
          where: { id: input.listId },
        });
        if (!list || list.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Энэ жагсаалтад хандах эрхгүй байна",
          });
        }
      }

      return prisma.emailCampaign.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          subject: input.subject,
          previewText: input.previewText ?? null,
          htmlContent: input.htmlContent,
          listId: input.listId ?? null,
          status: "DRAFT",
        },
      });
    }),

  updateCampaign: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        subject: z.string().min(1).optional(),
        htmlContent: z.string().min(1).optional(),
        listId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: input.id },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Кампанит ажил олдсонгүй",
        });
      }

      if (campaign.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Энэ кампанид хандах эрхгүй байна",
        });
      }

      if (campaign.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Зөвхөн ноорог кампанийг засах боломжтой",
        });
      }

      return prisma.emailCampaign.update({
        where: { id: input.id },
        data: {
          name: input.name,
          subject: input.subject,
          htmlContent: input.htmlContent,
          listId: input.listId,
        },
      });
    }),

  deleteCampaign: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: input.id },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Кампанит ажил олдсонгүй",
        });
      }

      if (campaign.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Энэ кампанид хандах эрхгүй байна",
        });
      }

      if (campaign.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Зөвхөн ноорог кампанийг устгах боломжтой",
        });
      }

      await prisma.emailCampaign.delete({ where: { id: input.id } });
      return { success: true };
    }),

  sendCampaign: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: input.id },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Кампанит ажил олдсонгүй",
        });
      }

      if (campaign.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Энэ кампанид хандах эрхгүй байна",
        });
      }

      if (!campaign.listId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Кампанид жагсаалт холбоно уу",
        });
      }

      await sendCampaignLib(input.id);
      return { success: true };
    }),

  scheduleCampaign: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        scheduledAt: z.string().datetime(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: input.id },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Кампанит ажил олдсонгүй",
        });
      }

      if (campaign.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Энэ кампанид хандах эрхгүй байна",
        });
      }

      if (!campaign.listId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Кампанид жагсаалт холбоно уу",
        });
      }

      return prisma.emailCampaign.update({
        where: { id: input.id },
        data: {
          status: "SCHEDULED",
          scheduledAt: new Date(input.scheduledAt),
        },
      });
    }),

  sendTestEmail: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: input.id },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Кампанит ажил олдсонгүй",
        });
      }

      if (campaign.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Энэ кампанид хандах эрхгүй байна",
        });
      }

      const userEmail = ctx.session.user.email;
      if (!userEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Хэрэглэгчийн имэйл олдсонгүй",
        });
      }

      if (!process.env.RESEND_API_KEY) {
        console.log(
          `[email-marketing] (dry-run) Тест илгээх: ${userEmail} — ${campaign.subject}`
        );
        return { success: true, dryRun: true };
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL || "Nuul.digital <onboarding@resend.dev>",
        to: userEmail,
        subject: `[ТЕСТ] ${campaign.subject}`,
        html: campaign.htmlContent,
      });

      return { success: true };
    }),
};

// ===================== TEMPLATES =====================

const templatesProcedures = {
  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    return prisma.emailTemplate.findMany({
      where: {
        OR: [{ isPublic: true }, { userId: ctx.session.user.id }],
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  saveTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Нэр оруулна уу"),
        category: z.string().min(1, "Ангилал оруулна уу"),
        htmlContent: z.string().min(1, "Агуулга оруулна уу"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.emailTemplate.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          category: input.category,
          htmlContent: input.htmlContent,
          isPublic: false,
        },
      });
    }),
};

// ===================== STATS =====================

const statsProcedures = {
  getOverviewStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalLists, totalSubscribers, campaignsThisMonth, allCampaigns] =
      await Promise.all([
        prisma.emailList.count({ where: { userId } }),
        prisma.emailSubscriber.count({
          where: { list: { userId }, status: "ACTIVE" },
        }),
        prisma.emailCampaign.count({
          where: {
            userId,
            status: "SENT",
            sentAt: { gte: startOfMonth },
          },
        }),
        prisma.emailCampaign.findMany({
          where: { userId, status: "SENT", totalSent: { gt: 0 } },
          select: { totalSent: true, opened: true },
        }),
      ]);

    let avgOpenRate = 0;
    if (allCampaigns.length > 0) {
      const totalOpened = allCampaigns.reduce((s, c) => s + c.opened, 0);
      const totalSent = allCampaigns.reduce((s, c) => s + c.totalSent, 0);
      avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    }

    return {
      totalLists,
      totalSubscribers,
      campaignsThisMonth,
      avgOpenRate,
    };
  }),
};

// ===================== ROUTER =====================

export const emailMarketingRouter = router({
  ...listsProcedures,
  ...subscribersProcedures,
  ...campaignsProcedures,
  ...templatesProcedures,
  ...statsProcedures,
});
