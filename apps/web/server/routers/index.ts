import { router } from "@/lib/trpc";
import { domainRouter } from "./domain";
import { orderRouter } from "./order";
import { paymentRouter } from "./payment";
import { userRouter } from "./user";
import { analyticsRouter } from "./analytics";
import { crmRouter } from "./crm";
import { ticketRouter } from "./ticket";
import { adminRouter } from "./admin";
import { emailMarketingRouter } from "./email-marketing";
import { websiteRouter } from "./website";
import { notificationRouter } from "./notification";
import { resellerRouter } from "./reseller";
import { settingsRouter } from "./settings";
import { servicesRouter } from "./services";
import { blogRouter } from "./blog";
import { navRouter } from "./nav";
import { hostingRouter } from "./hosting";
import { marketingRouter } from "./marketing";
import { testimonialRouter } from "./testimonial";
import { portfolioRouter } from "./portfolio";

export const appRouter = router({
  domain: domainRouter,
  order: orderRouter,
  payment: paymentRouter,
  user: userRouter,
  analytics: analyticsRouter,
  crm: crmRouter,
  ticket: ticketRouter,
  admin: adminRouter,
  emailMarketing: emailMarketingRouter,
  website: websiteRouter,
  notification: notificationRouter,
  reseller: resellerRouter,
  settings: settingsRouter,
  services: servicesRouter,
  blog: blogRouter,
  nav: navRouter,
  hosting: hostingRouter,
  marketing: marketingRouter,
  testimonial: testimonialRouter,
  portfolio: portfolioRouter,
});

export type AppRouter = typeof appRouter;
