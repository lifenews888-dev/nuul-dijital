import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ===================== CLEANUP =====================
  // Delete in correct order to respect foreign keys
  console.log("🧹 Cleaning up old seed data...");
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.serviceQuote.deleteMany();
  await prisma.service.deleteMany();
  await prisma.chatBotSession.deleteMany();
  await prisma.chatBot.deleteMany();
  await prisma.cRMLead.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.emailSubscriber.deleteMany();
  await prisma.emailCampaign.deleteMany();
  await prisma.emailList.deleteMany();
  await prisma.resellerClient.deleteMany();
  await prisma.resellerWithdrawal.deleteMany();
  await prisma.blogPost.deleteMany();
  console.log("  ✅ Old data cleaned\n");

  // ===================== 1. USERS (8 + existing) =====================
  console.log("👤 Seeding users...");
  const adminPwd = await bcrypt.hash("Admin1234!", 12);
  const demoPwd = await bcrypt.hash("Demo1234!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nuul.digital" },
    update: { name: "Nuul Admin", role: "ADMIN" },
    create: {
      email: "admin@nuul.digital",
      name: "Nuul Admin",
      password: adminPwd,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const batbayar = await prisma.user.upsert({
    where: { email: "batbayar@gmail.com" },
    update: { name: "Батбаяр Дорж", role: "CLIENT" },
    create: {
      email: "batbayar@gmail.com",
      name: "Батбаяр Дорж",
      password: demoPwd,
      role: "CLIENT",
      phone: "99112233",
      emailVerified: new Date(),
    },
  });

  const nomin = await prisma.user.upsert({
    where: { email: "nomin@gmail.com" },
    update: { name: "Номин Гантулга", role: "CLIENT" },
    create: {
      email: "nomin@gmail.com",
      name: "Номин Гантулга",
      password: demoPwd,
      role: "CLIENT",
      phone: "88223344",
      emailVerified: new Date(),
    },
  });

  const enkh = await prisma.user.upsert({
    where: { email: "enkh@gmail.com" },
    update: { name: "Энхбаяр Сүрэн", role: "CLIENT" },
    create: {
      email: "enkh@gmail.com",
      name: "Энхбаяр Сүрэн",
      password: demoPwd,
      role: "CLIENT",
      phone: "95334455",
      emailVerified: new Date(),
    },
  });

  const naraa = await prisma.user.upsert({
    where: { email: "naraa@gmail.com" },
    update: { name: "Нарантуяа Батгэрэл", role: "CLIENT" },
    create: {
      email: "naraa@gmail.com",
      name: "Нарантуяа Батгэрэл",
      password: demoPwd,
      role: "CLIENT",
      phone: "80445566",
      emailVerified: new Date(),
    },
  });

  const mergen = await prisma.user.upsert({
    where: { email: "mergen@gmail.com" },
    update: { name: "Мэргэн Цэрэндорж", role: "CLIENT" },
    create: {
      email: "mergen@gmail.com",
      name: "Мэргэн Цэрэндорж",
      password: demoPwd,
      role: "CLIENT",
      phone: "91556677",
      emailVerified: new Date(),
    },
  });

  const reseller1 = await prisma.user.upsert({
    where: { email: "reseller1@gmail.com" },
    update: { name: "Дорж Баатар", role: "RESELLER" },
    create: {
      email: "reseller1@gmail.com",
      name: "Дорж Баатар",
      password: demoPwd,
      role: "RESELLER",
      phone: "99667788",
      emailVerified: new Date(),
    },
  });

  const reseller2 = await prisma.user.upsert({
    where: { email: "reseller2@gmail.com" },
    update: { name: "Оюунцэцэг Намжил", role: "RESELLER" },
    create: {
      email: "reseller2@gmail.com",
      name: "Оюунцэцэг Намжил",
      password: demoPwd,
      role: "RESELLER",
      phone: "88778899",
      emailVerified: new Date(),
    },
  });

  // Upsert existing user without changing password
  await prisma.user.upsert({
    where: { email: "munkhbat25@gmail.com" },
    update: {},
    create: {
      email: "munkhbat25@gmail.com",
      name: "Мөнхбат",
      password: demoPwd,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  console.log("  ✅ 8 users created (+ munkhbat25 ensured)");

  // ===================== 2. HOSTING PLANS (3) =====================
  console.log("📦 Seeding hosting plans...");

  const starterPlan = await prisma.hostingPlan.upsert({
    where: { slug: "starter" },
    update: {
      price: 99000,
      priceYearly: 990000,
      storage: 10,
      bandwidth: 100,
      websites: 1,
      emails: 5,
    },
    create: {
      name: "Starter",
      slug: "starter",
      type: "STARTER",
      description: "Жижиг бизнес, хувь хүнд тохиромжтой анхан шатны багц",
      price: 99000,
      priceYearly: 990000,
      storage: 10,
      bandwidth: 100,
      websites: 1,
      emails: 5,
      features: [
        "1 вэбсайт хостинг",
        "10GB SSD хадгалалт",
        "100GB сарын трафик",
        "Үнэгүй SSL сертификат",
        "5 имэйл хаяг",
        "Өдөр тутмын нөөцлөлт",
        "Дэмжлэг 9:00–18:00",
      ],
      isActive: true,
    },
  });

  const businessPlan = await prisma.hostingPlan.upsert({
    where: { slug: "business" },
    update: {
      price: 249000,
      priceYearly: 2490000,
      storage: 50,
      bandwidth: 500,
      websites: 5,
      emails: 99,
    },
    create: {
      name: "Business",
      slug: "business",
      type: "BUSINESS",
      description: "Дунд болон том бизнест зориулсан дэвшилтэт багц",
      price: 249000,
      priceYearly: 2490000,
      storage: 50,
      bandwidth: 500,
      websites: 5,
      emails: 99,
      features: [
        "5 вэбсайт хостинг",
        "50GB NVMe хадгалалт",
        "500GB сарын трафик",
        "Үнэгүй SSL + Wildcard",
        "99 имэйл хаяг",
        "CRM + имэйл маркетинг",
        "AI чатбот (Facebook + Web)",
        "QPay / SocialPay интеграц",
        "AI дэмжлэг 24/7",
        "Автомат нөөцлөлт + CDN",
      ],
      isActive: true,
    },
  });

  const enterprisePlan = await prisma.hostingPlan.upsert({
    where: { slug: "enterprise" },
    update: {
      price: 490000,
      storage: 200,
      bandwidth: 2000,
      websites: 99,
      emails: 99,
    },
    create: {
      name: "Enterprise",
      slug: "enterprise",
      type: "ENTERPRISE",
      description: "Томоохон байгууллага, корпорацид зориулсан бүрэн багц",
      price: 490000,
      storage: 200,
      bandwidth: 2000,
      websites: 99,
      emails: 99,
      features: [
        "99 вэбсайт хостинг",
        "200GB NVMe хадгалалт",
        "2TB сарын трафик",
        "Wildcard SSL + DDoS хамгаалалт",
        "Хязгааргүй имэйл хаяг",
        "ERP / Odoo интеграц",
        "Call center + Callpro",
        "Dedicated менежер",
        "White-label брэндинг",
        "SLA 99.9% uptime баталгаа",
        "Захиалгат API интеграц",
        "Priority дэмжлэг 24/7",
      ],
      isActive: true,
    },
  });

  // VPS Plans
  await prisma.hostingPlan.upsert({
    where: { slug: "vps-basic" },
    update: {
      price: 199000,
      storage: 80,
      bandwidth: 2000,
      websites: 5,
      emails: 10,
    },
    create: {
      name: "VPS Basic",
      slug: "vps-basic",
      type: "VPS_BASIC",
      description: "Эхлэл шатны виртуал сервер",
      price: 199000,
      storage: 80,
      bandwidth: 2000,
      websites: 5,
      emails: 10,
      features: [
        "2 vCPU",
        "4GB RAM",
        "80GB SSD",
        "Ubuntu/CentOS",
        "Root access",
        "99.9% uptime",
        "Snapshot backup",
      ],
      isActive: true,
    },
  });

  await prisma.hostingPlan.upsert({
    where: { slug: "vps-pro" },
    update: {
      price: 399000,
      storage: 160,
      bandwidth: 4000,
      websites: 20,
      emails: 50,
    },
    create: {
      name: "VPS Pro",
      slug: "vps-pro",
      type: "VPS_PRO",
      description: "Дунд болон том төслүүдэд зориулсан",
      price: 399000,
      storage: 160,
      bandwidth: 4000,
      websites: 20,
      emails: 50,
      features: [
        "4 vCPU",
        "8GB RAM",
        "160GB SSD",
        "Ubuntu/CentOS/Windows",
        "Root access",
        "99.99% uptime",
        "Auto backup",
        "DDoS хамгаалалт",
      ],
      isActive: true,
    },
  });

  await prisma.hostingPlan.upsert({
    where: { slug: "vps-cloud" },
    update: {
      price: 799000,
      storage: 320,
      bandwidth: 0,
      websites: 99,
      emails: 99,
    },
    create: {
      name: "Cloud Server",
      slug: "vps-cloud",
      type: "VPS_CLOUD",
      description: "Томоохон байгууллагад зориулсан cloud сервер",
      price: 799000,
      storage: 320,
      bandwidth: 0,
      websites: 99,
      emails: 99,
      features: [
        "8 vCPU",
        "16GB RAM",
        "320GB NVMe",
        "Бүх OS",
        "Dedicated IP",
        "99.99% uptime",
        "Auto scaling",
        "Load balancer",
        "24/7 дэмжлэг",
      ],
      isActive: true,
    },
  });

  console.log("  ✅ 6 hosting + VPS plans created");

  // ===================== 3. DOMAINS (8) =====================
  console.log("🌐 Seeding domains...");
  const now = new Date();

  const domainData = [
    {
      name: "miniishop.mn",
      tld: ".mn",
      userId: batbayar.id,
      status: "ACTIVE" as const,
      price: 165000,
      expiresAt: new Date(now.getFullYear() + 1, 5, 15),
    },
    {
      name: "batbayar.com",
      tld: ".com",
      userId: batbayar.id,
      status: "ACTIVE" as const,
      price: 62500,
      expiresAt: new Date(now.getFullYear() + 1, 2, 10),
    },
    {
      name: "nomindesign.mn",
      tld: ".mn",
      userId: nomin.id,
      status: "ACTIVE" as const,
      price: 165000,
      expiresAt: new Date(now.getFullYear() + 1, 8, 20),
    },
    {
      name: "enkhtech.mn",
      tld: ".mn",
      userId: enkh.id,
      status: "PENDING" as const,
      price: 165000,
      expiresAt: null,
    },
    {
      name: "naraabeauty.com",
      tld: ".com",
      userId: naraa.id,
      status: "ACTIVE" as const,
      price: 62500,
      expiresAt: new Date(now.getFullYear() + 1, 11, 1),
    },
    {
      name: "mergengroup.mn",
      tld: ".mn",
      userId: mergen.id,
      status: "EXPIRED" as const,
      price: 165000,
      expiresAt: new Date(now.getFullYear() - 1, 1, 28),
    },
    {
      name: "oldsite.com",
      tld: ".com",
      userId: batbayar.id,
      status: "EXPIRED" as const,
      price: 62500,
      expiresAt: new Date(now.getFullYear() - 1, 6, 15),
    },
    {
      name: "startuplab.mn",
      tld: ".mn",
      userId: enkh.id,
      status: "ACTIVE" as const,
      price: 165000,
      expiresAt: new Date(now.getFullYear() + 2, 0, 10),
    },
  ];

  const domains: Record<string, any> = {};
  for (const d of domainData) {
    domains[d.name] = await prisma.domain.upsert({
      where: { name: d.name },
      update: { status: d.status, userId: d.userId },
      create: d,
    });
  }

  console.log("  ✅ 8 domains created");

  // ===================== 4. SUBSCRIPTIONS (5) =====================
  console.log("📋 Seeding subscriptions...");

  const sub1 = await prisma.subscription.create({
    data: {
      userId: batbayar.id,
      planId: businessPlan.id,
      status: "ACTIVE",
      startAt: new Date(now.getFullYear(), 0, 1),
      endAt: new Date(now.getFullYear() + 1, 0, 1),
    },
  });

  const sub2 = await prisma.subscription.create({
    data: {
      userId: nomin.id,
      planId: starterPlan.id,
      status: "ACTIVE",
      startAt: new Date(now.getFullYear(), 2, 15),
      endAt: new Date(now.getFullYear() + 1, 2, 15),
    },
  });

  const sub3 = await prisma.subscription.create({
    data: {
      userId: enkh.id,
      planId: starterPlan.id,
      status: "ACTIVE",
      startAt: new Date(now.getFullYear(), 1, 1),
      endAt: new Date(now.getFullYear() + 1, 1, 1),
    },
  });

  const sub4 = await prisma.subscription.create({
    data: {
      userId: naraa.id,
      planId: businessPlan.id,
      status: "ACTIVE",
      startAt: new Date(now.getFullYear(), 3, 1),
      endAt: new Date(now.getFullYear() + 1, 3, 1),
    },
  });

  const sub5 = await prisma.subscription.create({
    data: {
      userId: mergen.id,
      planId: enterprisePlan.id,
      status: "CANCELLED",
      startAt: new Date(now.getFullYear() - 1, 6, 1),
      endAt: new Date(now.getFullYear(), 6, 1),
    },
  });

  console.log("  ✅ 5 subscriptions created");

  // ===================== 5. ORDERS (12+) & PAYMENTS =====================
  console.log("🛒 Seeding orders & payments...");

  // Helper to create order + payment
  async function createPaidOrder(data: {
    userId: string;
    type: any;
    amount: number;
    domainId?: string;
    subscriptionId?: string;
    method: "QPAY" | "SOCIALPAY";
    txId: string;
    daysAgo: number;
  }) {
    const order = await prisma.order.create({
      data: {
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        status: "PAID",
        domainId: data.domainId,
        subscriptionId: data.subscriptionId,
      },
    });
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: data.method,
        transactionId: data.txId,
        amount: data.amount,
        status: "COMPLETED",
        paidAt: new Date(now.getTime() - data.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
    return order;
  }

  // Domain orders (PAID)
  await createPaidOrder({
    userId: batbayar.id,
    type: "DOMAIN",
    amount: 165000,
    domainId: domains["miniishop.mn"].id,
    method: "QPAY",
    txId: "QPAY-TXN-240101",
    daysAgo: 90,
  });

  await createPaidOrder({
    userId: batbayar.id,
    type: "DOMAIN",
    amount: 62500,
    domainId: domains["batbayar.com"].id,
    method: "SOCIALPAY",
    txId: "SP-TXN-240102",
    daysAgo: 75,
  });

  await createPaidOrder({
    userId: nomin.id,
    type: "DOMAIN",
    amount: 165000,
    domainId: domains["nomindesign.mn"].id,
    method: "QPAY",
    txId: "QPAY-TXN-240103",
    daysAgo: 60,
  });

  await createPaidOrder({
    userId: naraa.id,
    type: "DOMAIN",
    amount: 62500,
    domainId: domains["naraabeauty.com"].id,
    method: "SOCIALPAY",
    txId: "SP-TXN-240104",
    daysAgo: 45,
  });

  await createPaidOrder({
    userId: enkh.id,
    type: "DOMAIN",
    amount: 165000,
    domainId: domains["startuplab.mn"].id,
    method: "QPAY",
    txId: "QPAY-TXN-240105",
    daysAgo: 30,
  });

  // Hosting orders (PAID)
  await createPaidOrder({
    userId: batbayar.id,
    type: "HOSTING",
    amount: 2490000,
    subscriptionId: sub1.id,
    method: "QPAY",
    txId: "QPAY-TXN-240201",
    daysAgo: 85,
  });

  await createPaidOrder({
    userId: nomin.id,
    type: "HOSTING",
    amount: 990000,
    subscriptionId: sub2.id,
    method: "SOCIALPAY",
    txId: "SP-TXN-240202",
    daysAgo: 55,
  });

  await createPaidOrder({
    userId: enkh.id,
    type: "HOSTING",
    amount: 990000,
    subscriptionId: sub3.id,
    method: "QPAY",
    txId: "QPAY-TXN-240203",
    daysAgo: 70,
  });

  await createPaidOrder({
    userId: naraa.id,
    type: "HOSTING",
    amount: 2490000,
    subscriptionId: sub4.id,
    method: "QPAY",
    txId: "QPAY-TXN-240204",
    daysAgo: 20,
  });

  // Pending orders (no payment)
  await prisma.order.create({
    data: {
      userId: enkh.id,
      type: "DOMAIN",
      amount: 165000,
      domainId: domains["enkhtech.mn"].id,
      status: "PENDING",
    },
  });

  await prisma.order.create({
    data: {
      userId: mergen.id,
      type: "DOMAIN_AND_HOSTING",
      amount: 655000,
      status: "PENDING",
    },
  });

  // Failed order with failed payment
  const failedOrder = await prisma.order.create({
    data: {
      userId: mergen.id,
      type: "HOSTING",
      amount: 490000,
      status: "FAILED",
    },
  });
  await prisma.payment.create({
    data: {
      orderId: failedOrder.id,
      method: "SOCIALPAY",
      transactionId: "SP-TXN-FAIL-001",
      amount: 490000,
      status: "FAILED",
    },
  });

  console.log("  ✅ 12 orders created (9 paid, 2 pending, 1 failed)");
  console.log("  ✅ 10 payments created (9 completed, 1 failed)");

  // ===================== 6. SERVICE CATEGORIES (6) =====================
  console.log("🏷️ Seeding service categories...");

  const catWebsite = await prisma.serviceCategory.upsert({
    where: { slug: "website" },
    update: {},
    create: {
      name: "Вэбсайт хөгжүүлэлт",
      slug: "website",
      description: "Мэргэжлийн вэбсайт бүтээх үйлчилгээ",
      icon: "🌐",
      order: 1,
    },
  });

  const catChatbot = await prisma.serviceCategory.upsert({
    where: { slug: "chatbot" },
    update: {},
    create: {
      name: "AI Чатбот",
      slug: "chatbot",
      description: "Хиймэл оюун ухаант чатбот шийдэл",
      icon: "🤖",
      order: 2,
    },
  });

  const catManychat = await prisma.serviceCategory.upsert({
    where: { slug: "manychat" },
    update: {},
    create: {
      name: "ManyChat автоматжуулалт",
      slug: "manychat",
      description: "ManyChat мессенжер маркетинг тохиргоо",
      icon: "💬",
      order: 3,
    },
  });

  const catMarketing = await prisma.serviceCategory.upsert({
    where: { slug: "marketing" },
    update: {},
    create: {
      name: "Дижитал маркетинг",
      slug: "marketing",
      description: "Онлайн маркетинг, зар сурталчилгаа",
      icon: "📈",
      order: 4,
    },
  });

  const catAutomation = await prisma.serviceCategory.upsert({
    where: { slug: "automation" },
    update: {},
    create: {
      name: "Бизнес автоматжуулалт",
      slug: "automation",
      description: "Бизнесийн процесс автоматжуулах шийдэл",
      icon: "⚙️",
      order: 5,
    },
  });

  const catDesign = await prisma.serviceCategory.upsert({
    where: { slug: "design" },
    update: {},
    create: {
      name: "Дизайн",
      slug: "design",
      description: "Лого, брэндинг, график дизайн",
      icon: "🎨",
      order: 6,
    },
  });

  console.log("  ✅ 6 service categories created");

  // ===================== 7. SERVICES (15) =====================
  console.log("🛠️ Seeding services...");

  const servicesData = [
    // Website
    {
      categoryId: catWebsite.id,
      name: "Нэг хуудаст вэбсайт (Landing page)",
      description:
        "Танай бизнесийг танилцуулах гоёмсог, хурдан ачаалалтай нэг хуудаст вэбсайт. SEO оновчтой, мобайл responsive дизайн.",
      features: ["Responsive дизайн", "SEO тохиргоо", "Холбоо барих форм", "Google Analytics", "1 жилийн хостинг"],
      priceFrom: 500000,
      priceTo: 1500000,
      deliveryDays: 7,
      isActive: true,
      isFeatured: true,
      order: 1,
    },
    {
      categoryId: catWebsite.id,
      name: "Корпорэйт вэбсайт",
      description:
        "Олон хуудаст, мэдээллийн удирдлагын системтэй (CMS) байгууллагын вэбсайт. Блог, мэдээ, багийн танилцуулга хэсэгтэй.",
      features: ["CMS удирдлага", "Блог систем", "Олон хэл дэмжих", "Админ самбар", "SEO + Analytics"],
      priceFrom: 2000000,
      priceTo: 5000000,
      deliveryDays: 21,
      isActive: true,
      isFeatured: true,
      order: 2,
    },
    {
      categoryId: catWebsite.id,
      name: "И-коммерс дэлгүүр",
      description:
        "Бүрэн ажилладаг онлайн дэлгүүр. Бүтээгдэхүүн удирдлага, сагс, төлбөр (QPay/SocialPay), захиалга хяналт.",
      features: [
        "Бүтээгдэхүүн каталог",
        "Сагс + Checkout",
        "QPay/SocialPay интеграц",
        "Захиалгын удирдлага",
        "Хүргэлтийн систем",
      ],
      priceFrom: 3000000,
      priceTo: 8000000,
      deliveryDays: 30,
      isActive: true,
      isFeatured: true,
      order: 3,
    },
    // Chatbot
    {
      categoryId: catChatbot.id,
      name: "Facebook Messenger чатбот",
      description:
        "Facebook хуудсандаа автомат хариулагч бот суулгана. Түгээмэл асуултуудад автомат хариулт, захиалга хүлээн авах боломж.",
      features: ["Автомат хариулт", "Цэс + товчлуур", "Захиалга хүлээн авах", "Хэрэглэгчийн мэдээлэл цуглуулах"],
      priceFrom: 300000,
      priceTo: 800000,
      deliveryDays: 5,
      isActive: true,
      isFeatured: false,
      order: 4,
    },
    {
      categoryId: catChatbot.id,
      name: "AI дэмжлэгийн бот",
      description:
        "GPT-4 суурьтай ухаалаг тусламжийн бот. Танай бизнесийн мэдээллээр сургагдсан, хэрэглэгчдэд 24/7 тусалдаг.",
      features: ["GPT-4 интеграц", "Мэдлэгийн сан", "24/7 автомат хариулт", "Хүний оператор руу шилжүүлэх"],
      priceFrom: 800000,
      priceTo: 2000000,
      deliveryDays: 10,
      isActive: true,
      isFeatured: true,
      order: 5,
    },
    // ManyChat
    {
      categoryId: catManychat.id,
      name: "ManyChat суурь тохиргоо",
      description:
        "ManyChat платформд Messenger ботыг тохируулж өгнө. Тавтай морил мессеж, автомат хариулт, шүүлтүүр.",
      features: ["Welcome flow", "Keyword автомат хариулт", "Хэрэглэгчийн tag", "Үндсэн 3 flow"],
      price: 250000,
      deliveryDays: 3,
      isActive: true,
      order: 6,
    },
    {
      categoryId: catManychat.id,
      name: "ManyChat дэвшилтэт автоматжуулалт",
      description:
        "Борлуулалт, урамшуулал, сонирхлын бүлэг бүрт тусгай flow-тэй бүрэн ManyChat систем.",
      features: [
        "Борлуулалтын funnel",
        "Урамшууллын flow",
        "Сегментчилсэн broadcast",
        "A/B тест",
        "Shopify/WooCommerce интеграц",
      ],
      priceFrom: 500000,
      priceTo: 1200000,
      deliveryDays: 7,
      isActive: true,
      isFeatured: false,
      order: 7,
    },
    // Marketing
    {
      categoryId: catMarketing.id,
      name: "Facebook/Instagram зар сурталчилгаа",
      description:
        "Мэргэжлийн зар сурталчилгааны менежмент. Зорилтот бүлэг тодорхойлох, зар бэлтгэх, оновчлох.",
      features: [
        "Зар бэлтгэл + креатив",
        "Зорилтот бүлэг тохируулга",
        "A/B тестинг",
        "Долоо хоног тутмын тайлан",
        "Ретаргетинг",
      ],
      priceFrom: 300000,
      priceTo: 1500000,
      priceLabel: "/сар",
      deliveryDays: 3,
      isActive: true,
      isFeatured: true,
      order: 8,
    },
    {
      categoryId: catMarketing.id,
      name: "SEO оновчлол",
      description:
        "Google хайлтын үр дүнд таны вэбсайтыг эхний хуудсанд гаргахад чиглэсэн SEO стратеги, контент оновчлол.",
      features: ["Keyword судалгаа", "On-page SEO", "Техник SEO аудит", "Контент стратеги", "Сарын тайлан"],
      priceFrom: 200000,
      priceTo: 800000,
      priceLabel: "/сар",
      deliveryDays: 30,
      isActive: true,
      order: 9,
    },
    {
      categoryId: catMarketing.id,
      name: "Имэйл маркетинг тохиргоо",
      description:
        "Имэйл маркетингийн систем бүрдүүлж, автомат имэйл дараалал тохируулж өгнө.",
      features: ["Имэйл загвар дизайн", "Автомат дараалал (3 flow)", "Жагсаалт импорт", "A/B тест тохиргоо"],
      price: 350000,
      deliveryDays: 5,
      isActive: true,
      order: 10,
    },
    // Automation
    {
      categoryId: catAutomation.id,
      name: "CRM систем нэвтрүүлэлт",
      description:
        "Харилцагчийн мэдээллийн сан, борлуулалтын pipeline, даалгаврын удирдлагын CRM систем тохируулж өгнө.",
      features: ["Харилцагч бүртгэл", "Pipeline удирдлага", "Даалгавар + сануулга", "Тайлан + dashboard"],
      priceFrom: 500000,
      priceTo: 2000000,
      deliveryDays: 14,
      isActive: true,
      order: 11,
    },
    {
      categoryId: catAutomation.id,
      name: "Zapier / Make.com интеграц",
      description:
        "Бизнесийн хэрэглэж буй апп-уудыг хооронд нь холбож, ажлын урсгалыг автоматжуулна.",
      features: ["5 автоматжуулалт", "Аpp холболт", "Алдааны мониторинг", "Баримт бичиг"],
      priceFrom: 200000,
      priceTo: 600000,
      deliveryDays: 5,
      isActive: true,
      isComingSoon: false,
      order: 12,
    },
    {
      categoryId: catAutomation.id,
      name: "AI агент хөгжүүлэлт",
      description:
        "Танай бизнесийн тусгай хэрэгцээнд зориулсан AI агент бүтээнэ. Дата боловсруулалт, шийдвэр гаргалт, автоматжуулалт.",
      features: ["Custom AI модел", "API интеграц", "Дата pipeline", "Мониторинг dashboard"],
      priceFrom: 2000000,
      priceTo: 10000000,
      deliveryDays: 30,
      isActive: true,
      isComingSoon: true,
      order: 13,
    },
    // Design
    {
      categoryId: catDesign.id,
      name: "Лого + Брэнд дизайн",
      description:
        "Мэргэжлийн лого, өнгөний палитр, фонт, брэндийн удирдамж бүхий брэнд иж бүрдэл.",
      features: ["3 лого санал", "Өнгө + Фонт гарын авлага", "Бизнес карт дизайн", "Брэнд удирдамж PDF"],
      priceFrom: 300000,
      priceTo: 1000000,
      deliveryDays: 10,
      isActive: true,
      isFeatured: false,
      order: 14,
    },
    {
      categoryId: catDesign.id,
      name: "UI/UX дизайн",
      description:
        "Хэрэглэгчийн туршлагад суурилсан аппликейшн болон вэбсайтын интерфейс дизайн. Figma файлаар хүлээлгэж өгнө.",
      features: ["Wireframe", "UI дизайн (Figma)", "Prototype", "Дизайн систем", "Хэрэглэгчийн судалгаа"],
      priceFrom: 1000000,
      priceTo: 4000000,
      deliveryDays: 14,
      isActive: true,
      isComingSoon: false,
      order: 15,
    },
  ];

  for (const s of servicesData) {
    await prisma.service.create({ data: s });
  }

  console.log("  ✅ 15 services created");

  // ===================== 8. SERVICE QUOTES (4) =====================
  console.log("📝 Seeding service quotes...");

  // We need service IDs — get the first few services
  const allServices = await prisma.service.findMany({ take: 5, orderBy: { order: "asc" } });

  const quotesData = [
    {
      serviceId: allServices[0]!.id,
      userId: batbayar.id,
      name: "Батбаяр Дорж",
      email: "batbayar@gmail.com",
      phone: "99112233",
      company: "МиниШоп ХХК",
      projectType: "Landing page",
      description: "Бидний онлайн дэлгүүрийн шинэ landing page хэрэгтэй байна. Бүтээгдэхүүний каталог, үнийн мэдээлэл, холбоо барих хуудастай.",
      budget: "500,000 - 1,000,000₮",
      deadline: "2 долоо хоног",
      status: "PENDING" as const,
    },
    {
      serviceId: allServices[2]!.id,
      userId: nomin.id,
      name: "Номин Гантулга",
      email: "nomin@gmail.com",
      phone: "88223344",
      company: "Номин Дизайн",
      projectType: "E-commerce",
      description: "Гар урлалын бүтээгдэхүүн зардаг онлайн дэлгүүр хийлгэмээр байна. QPay төлбөрийн систем, 100+ бүтээгдэхүүнтэй.",
      budget: "3,000,000 - 5,000,000₮",
      deadline: "1 сар",
      status: "REVIEWING" as const,
    },
    {
      serviceId: allServices[3]!.id,
      userId: enkh.id,
      name: "Энхбаяр Сүрэн",
      email: "enkh@gmail.com",
      phone: "95334455",
      company: "Startup Lab ХХК",
      projectType: "Messenger чатбот",
      description: "Манай кофе шопын Facebook хуудсанд автомат захиалга хүлээн авдаг чатбот хэрэгтэй. Цэс харуулах, захиалга бүртгэх, хүргэлтийн хаяг авах.",
      budget: "500,000₮ хүртэл",
      deadline: "1 долоо хоног",
      status: "QUOTED" as const,
      agreedPrice: 450000,
    },
    {
      serviceId: allServices[4]!.id,
      userId: naraa.id,
      name: "Нарантуяа Батгэрэл",
      email: "naraa@gmail.com",
      phone: "80445566",
      company: "Нараа Beauty",
      projectType: "AI тусламжийн бот",
      description: "Гоо сайхны бүтээгдэхүүний талаар зөвлөгөө өгдөг AI бот хэрэгтэй. Арьс арчилгааны зөвлөгөө, бүтээгдэхүүн санал болгох.",
      budget: "1,000,000 - 2,000,000₮",
      deadline: "2 долоо хоног",
      status: "IN_PROGRESS" as const,
      agreedPrice: 1500000,
      isPaid: true,
    },
  ];

  for (const q of quotesData) {
    await prisma.serviceQuote.create({ data: q });
  }

  console.log("  ✅ 4 service quotes created");

  // ===================== 9. BLOG CATEGORIES (5) =====================
  console.log("📂 Seeding blog categories...");

  const blogCatDomain = await prisma.blogCategory.upsert({
    where: { slug: "domain" },
    update: {},
    create: { name: "Домэйн", slug: "domain", color: "#3B82F6" },
  });

  const blogCatWebsite = await prisma.blogCategory.upsert({
    where: { slug: "website" },
    update: {},
    create: { name: "Вэбсайт", slug: "website", color: "#10B981" },
  });

  const blogCatAI = await prisma.blogCategory.upsert({
    where: { slug: "ai" },
    update: {},
    create: { name: "AI", slug: "ai", color: "#8B5CF6" },
  });

  const blogCatMarketing = await prisma.blogCategory.upsert({
    where: { slug: "marketing" },
    update: {},
    create: { name: "Маркетинг", slug: "marketing", color: "#F59E0B" },
  });

  const blogCatAdvice = await prisma.blogCategory.upsert({
    where: { slug: "advice" },
    update: {},
    create: { name: "Зөвлөгөө", slug: "advice", color: "#EF4444" },
  });

  console.log("  ✅ 5 blog categories created");

  // ===================== 10. BLOG POSTS (5) =====================
  console.log("📰 Seeding blog posts...");

  await prisma.blogPost.upsert({
    where: { slug: "mn-domain-songolt" },
    update: {},
    create: {
      title: ".mn домэйн нэрээ хэрхэн сонгох вэ?",
      slug: "mn-domain-songolt",
      excerpt: "Монголд бизнес эрхлэгчдэд зориулсан домэйн нэр сонгох зөвлөмж.",
      content: `<h2>Домэйн нэр гэж юу вэ?</h2>
<p>Домэйн нэр бол таны вэбсайтын хаяг юм. Жишээ нь: <strong>nuul.digital</strong>. Энэ нь хэрэглэгчид таны сайт руу шууд хандах боломж олгодог. Сайн домэйн нэр нь богино, санахад хялбар, таны брэндтэй уялдсан байх ёстой.</p>
<h2>Яагаад .mn домэйн сонгох хэрэгтэй вэ?</h2>
<p>Монгол зах зээлд чиглэсэн бизнес эрхэлж байгаа бол .mn домэйн нь хэрэглэгчдэд итгэл төрүүлдэг. Google хайлтын үр дүнд мөн Монголын хэрэглэгчдэд илүү өндөр байрлалд гарч ирдэг. Мөн .mn домэйн нь таны бизнесийг олон улсын зах зээлд Монгол гэдгийг тодорхой харуулдаг.</p>
<h2>Домэйн нэр сонгох зөвлөмж</h2>
<p>Нэгдүгээрт, аль болох богино байх хэрэгтэй — 6-12 тэмдэгт хамгийн тохиромжтой. Хоёрдугаарт, тоо болон зураас ашиглахаас зайлсхийгээрэй. Гуравдугаарт, брэнд нэрээ шууд ашиглах нь хамгийн сайн. Дөрөвдүгээрт, .mn болон .com хоёуланг нь бүртгүүлэхийг зөвлөж байна.</p>`,
      coverImage: "/images/blog/domain-guide.jpg",
      authorId: admin.id,
      categoryId: blogCatDomain.id,
      tags: ["домэйн", ".mn", "зөвлөмж", "бизнес"],
      status: "PUBLISHED",
      featured: true,
      viewCount: 1245,
      publishedAt: new Date(now.getFullYear(), now.getMonth() - 2, 10),
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "website-2024-trend" },
    update: {},
    create: {
      title: "2024 оны вэбсайт дизайны чиг хандлага",
      slug: "website-2024-trend",
      excerpt: "Орчин үеийн вэбсайт хийхэд анхаарах гол чиг хандлагууд.",
      content: `<h2>Минимализм давамгайлсаар</h2>
<p>2024 онд вэбсайтын дизайнд цэвэрхэн, энгийн загвар давамгайлж байна. Хэрэглэгчид мэдээлэл олоход хялбар, хурдан ачаалалтай сайтыг илүүд үзэж байна. Их хэмжээний цагаан орон зай (whitespace) ашиглаж, гол мессежээ тодорхой дамжуулах нь чухал.</p>
<h2>AI интеграц</h2>
<p>Хиймэл оюун ухаан вэбсайтуудад улам бүр нэвтэрч байна. AI чатбот, хэрэглэгчийн зан үйлд суурилсан контент санал болгох, автомат орчуулга зэрэг технологиуд стандарт болж байна. nuul.digital-д бид AI чатботыг бүх багцад санал болгож байгаа.</p>
<h2>Мобайл тэргүүлсэн дизайн</h2>
<p>Монголын интернэт хэрэглэгчдийн 85%-аас дээш нь гар утсаараа вэб үзэж байна. Тиймээс мобайл төхөөрөмжид зориулж дизайнлаад, дараа нь компьютерийн хувилбарт тохируулах нь илүү зөв арга юм. Google-ийн mobile-first indexing бодлого ч үүнийг баталж байна.</p>`,
      coverImage: "/images/blog/web-trends.jpg",
      authorId: admin.id,
      categoryId: blogCatWebsite.id,
      tags: ["вэбсайт", "дизайн", "чиг хандлага", "2024"],
      status: "PUBLISHED",
      featured: true,
      viewCount: 890,
      publishedAt: new Date(now.getFullYear(), now.getMonth() - 1, 22),
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "ai-chatbot-business" },
    update: {},
    create: {
      title: "AI чатбот таны бизнест хэрхэн тусалдаг вэ?",
      slug: "ai-chatbot-business",
      excerpt: "AI чатботын бизнесийн давуу тал, хэрэглээний жишээнүүд.",
      content: `<h2>AI чатбот гэж юу вэ?</h2>
<p>AI чатбот бол хиймэл оюун ухаан ашиглан хэрэглэгчтэй яриа өрнүүлдэг программ юм. Энгийн "Сайн байна уу" гэсэн мэндчилгээнээс эхлээд бүтээгдэхүүний зөвлөгөө, захиалга хүлээн авах хүртэл олон төрлийн ажил гүйцэтгэдэг. GPT-4 зэрэг дэвшилтэт хэлний модель ашиглан байгалийн хэлээр яриа өрнүүлэх чадвартай.</p>
<h2>Бизнесийн давуу талууд</h2>
<p>Нэгдүгээрт, 24/7 тасралтгүй ажилладаг — шөнийн цагаар ч хэрэглэгчдийн асуултанд хариулна. Хоёрдугаарт, нэг дор олон хэрэглэгчтэй харилцах боломжтой. Гуравдугаарт, хүний алдаа гаргахгүй, тууштай мэдээлэл өгдөг. Дөрөвдүгээрт, үйлчилгээний зардлыг 60% хүртэл бууруулж чаддаг.</p>
<h2>Монголын бизнесүүдэд</h2>
<p>Монголд Facebook Messenger хамгийн түгээмэл мессенжер апп учраас Messenger чатбот маш үр дүнтэй. Манай судалгаагаар Messenger чатбот суулгасан бизнесүүд борлуулалтаа дунджаар 35%-аар нэмэгдүүлсэн байна. nuul.digital-ийн Business болон Enterprise багцад AI чатбот бүрэн багтсан.</p>`,
      coverImage: "/images/blog/ai-chatbot.jpg",
      authorId: admin.id,
      categoryId: blogCatAI.id,
      tags: ["AI", "чатбот", "бизнес", "автоматжуулалт"],
      status: "PUBLISHED",
      featured: false,
      viewCount: 673,
      publishedAt: new Date(now.getFullYear(), now.getMonth() - 1, 5),
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "facebook-ads-mongolia" },
    update: {},
    create: {
      title: "Facebook зар сурталчилгааны үндсэн алхмууд",
      slug: "facebook-ads-mongolia",
      excerpt: "Монголын зах зээлд Facebook зар хэрхэн үр дүнтэй ажиллуулах тухай.",
      content: `<h2>Facebook зар яагаад чухал вэ?</h2>
<p>Монголын 2.5 сая гаруй хүн Facebook ашигладаг бөгөөд энэ нь хүн амын 70% гаруйд хүрч байна. Facebook зар нь зорилтот бүлгээ маш нарийн тодорхойлж, шууд хүрч чаддаг хамгийн үр дүнтэй дижитал маркетингийн хэрэгсэл юм.</p>
<h2>Эхлэх алхмууд</h2>
<p>Эхлээд бизнесийн зорилгоо тодорхойлно — брэнд таниулах уу, борлуулалт нэмэгдүүлэх үү, вэбсайт руу урсгал чиглүүлэх үү? Дараа нь зорилтот бүлгээ сонгоно — нас, хүйс, байршил, сонирхол зэргээр шүүнэ. Facebook Pixel суулгаж, вэбсайтын хэрэглэгчдийг ретаргетинг хийх боломж бүрдүүлнэ.</p>
<h2>Зардлын удирдлага</h2>
<p>Эхлэхдээ өдрийн 5,000-10,000₮-ийн төсвөөр эхлэхийг зөвлөж байна. Аль зар илүү сайн ажиллаж байгааг A/B тестээр шалгаад, сайн ажиллаж байгаа зарт илүү төсөв хуваарилна. Долоо хоног тутам тайлан шалгаж, оновчлол хийх нь амжилтын түлхүүр юм.</p>`,
      coverImage: "/images/blog/facebook-ads.jpg",
      authorId: admin.id,
      categoryId: blogCatMarketing.id,
      tags: ["Facebook", "зар", "маркетинг", "сурталчилгаа"],
      status: "PUBLISHED",
      featured: false,
      viewCount: 512,
      publishedAt: new Date(now.getFullYear(), now.getMonth(), 1),
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "ssl-certificate-guide" },
    update: {},
    create: {
      title: "SSL сертификат: Яагаад заавал хэрэгтэй вэ?",
      slug: "ssl-certificate-guide",
      excerpt: "SSL сертификатын ач холбогдол, суулгах арга замууд.",
      content: `<h2>SSL сертификат гэж юу вэ?</h2>
<p>SSL (Secure Sockets Layer) сертификат нь таны вэбсайт болон хэрэглэгчийн хооронд дамжих мэдээллийг шифрлэдэг аюулгүй байдлын технологи юм. SSL суулгасан сайтын хаяг https:// гэж эхэлдэг бөгөөд хөтөч дээр цоожны тэмдэг харагддаг.</p>
<h2>Яагаад чухал вэ?</h2>
<p>Нэгдүгээрт, хэрэглэгчдийн хувийн мэдээлэл, нууц үг, төлбөрийн мэдээллийг хамгаалдаг. Хоёрдугаарт, Google хайлтын үр дүнд SSL-тэй сайтуудыг илүү өндөр байрлалд гаргадаг. Гуравдугаарт, хэрэглэгчдэд итгэл төрүүлдөг — "Энэ сайт аюулгүй биш" гэсэн сануулга нь хэрэглэгчдийг цочирдуулдаг.</p>
<h2>nuul.digital дээр SSL</h2>
<p>nuul.digital-ийн бүх хостинг багцад үнэгүй SSL сертификат багтсан. Let's Encrypt ашиглан автоматаар суулгагдаж, автоматаар шинэчлэгддэг тул та ямар нэг нэмэлт ажил хийх шаардлагагүй. Энэ нийтлэлийг хянан нийтэлсний дараа хүргэх болно.</p>`,
      coverImage: "/images/blog/ssl-guide.jpg",
      authorId: admin.id,
      categoryId: blogCatAdvice.id,
      tags: ["SSL", "аюулгүй байдал", "вэбсайт", "зөвлөгөө"],
      status: "DRAFT",
      featured: false,
      viewCount: 0,
    },
  });

  console.log("  ✅ 5 blog posts created (4 published, 1 draft)");

  // ===================== 11. CRM LEADS (7) =====================
  console.log("📊 Seeding CRM leads...");

  const leadsData = [
    {
      userId: batbayar.id,
      name: "Голомт Банк",
      email: "contact@golomtbank.com",
      phone: "77118800",
      company: "Голомт Банк",
      stage: "NEW" as const,
      value: 15000000,
      notes: "Корпорэйт вэбсайтын шинэчлэл хийлгэх сонирхолтой.",
    },
    {
      userId: batbayar.id,
      name: "Дэлгэрэх ХХК",
      email: "info@delgerekh.mn",
      phone: "70112233",
      company: "Дэлгэрэх ХХК",
      stage: "CONTACTED" as const,
      value: 3500000,
      notes: "E-commerce сайт хийлгэхийг хүсэж байна. Уулзалт товлосон.",
    },
    {
      userId: batbayar.id,
      name: "СГС Групп",
      email: "marketing@sgs.mn",
      phone: "77223344",
      company: "СГС Групп",
      stage: "PROPOSAL" as const,
      value: 8500000,
      notes: "CRM + AI чатбот нэвтрүүлэлт. Санал илгээсэн, хариу хүлээж байна.",
    },
    {
      userId: batbayar.id,
      name: "Монос Групп",
      email: "digital@monos.mn",
      phone: "77334455",
      company: "Монос Групп",
      stage: "NEGOTIATION" as const,
      value: 12000000,
      notes: "Дижитал маркетинг + вэбсайт. Үнийн хэлэлцээр явагдаж байна.",
    },
    {
      userId: batbayar.id,
      name: "Тэнгэр Системс ХХК",
      email: "ceo@tenger.mn",
      phone: "88445566",
      company: "Тэнгэр Системс ХХК",
      stage: "CLOSED_WON" as const,
      value: 4100000,
      notes: "Вэбсайт + Facebook чатбот. Гэрээ байгуулсан, ажил эхэлсэн.",
    },
    {
      userId: batbayar.id,
      name: "Номин Холдинг",
      email: "it@nomin.mn",
      phone: "77556677",
      company: "Номин Холдинг",
      stage: "CLOSED_WON" as const,
      value: 6500000,
      notes: "Имэйл маркетинг + ManyChat автоматжуулалт. Амжилттай хүлээлгэж өгсөн.",
    },
    {
      userId: batbayar.id,
      name: "Ард Санхүүгийн Нэгдэл",
      email: "digital@ard.mn",
      phone: "77667788",
      company: "Ард Санхүүгийн Нэгдэл",
      stage: "NEW" as const,
      value: 20000000,
      notes: "Full digital transformation хийх сонирхолтой. Дахин холбоо барих.",
    },
  ];

  for (const lead of leadsData) {
    await prisma.cRMLead.create({ data: lead });
  }

  console.log("  ✅ 7 CRM leads created for batbayar");

  // ===================== 12. SUPPORT TICKETS (4) =====================
  console.log("🎫 Seeding support tickets...");

  const ticketsData = [
    {
      userId: batbayar.id,
      subject: "SSL сертификат шинэчлэх",
      message:
        "Манай miniishop.mn домэйний SSL сертификат дуусах гэж байна. Шинэчлэхэд тусална уу? Сайт руу ороход аюулгүй бус гэж харагдаж эхэлсэн.",
      status: "RESOLVED" as const,
      priority: "HIGH" as const,
      aiResolved: true,
    },
    {
      userId: batbayar.id,
      subject: "DNS тохиргоо тусламж",
      message:
        "batbayar.com домэйний DNS тохиргоог өөрчлөх хэрэгтэй байна. A record болон CNAME record нэмж өгнө үү? Шинэ серверийн IP: 195.201.xx.xx",
      status: "IN_PROGRESS" as const,
      priority: "MEDIUM" as const,
      aiResolved: false,
    },
    {
      userId: nomin.id,
      subject: "QPay интеграцын алдаа",
      message:
        "Манай дэлгүүрийн QPay төлбөр хүлээн авч чадахгүй байна. Callback URL-ийн тохиргоо зөв эсэхийг шалгаж өгнө үү? Алдааны код: QPAY_CALLBACK_FAILED",
      status: "OPEN" as const,
      priority: "URGENT" as const,
      aiResolved: false,
    },
    {
      userId: enkh.id,
      subject: "Имэйл хаяг нэмэх",
      message:
        "Starter багцанд 5 имэйл хаяг багтдаг гэсэн. Одоогоор 3 хаяг үүсгэсэн, дараагийн 2 хаягаа хэрхэн нэмэх вэ? info@startuplab.mn болон hello@startuplab.mn нэммээр байна.",
      status: "RESOLVED" as const,
      priority: "LOW" as const,
      aiResolved: true,
    },
  ];

  for (const ticket of ticketsData) {
    await prisma.ticket.create({ data: ticket });
  }

  console.log("  ✅ 4 support tickets created");

  // ===================== 13. CHATBOTS (2) =====================
  console.log("🤖 Seeding chatbots...");

  await prisma.chatBot.create({
    data: {
      userId: batbayar.id,
      name: "МиниШоп борлуулалтын бот",
      platform: "FACEBOOK",
      flowJson: JSON.stringify({
        nodes: [
          { id: "start", type: "trigger", data: { label: "Эхлэх" } },
          {
            id: "greet",
            type: "message",
            data: { text: "Сайн байна уу! МиниШоп-д тавтай морилно уу 🎉 Бид танд хэрхэн туслах вэ?" },
          },
          {
            id: "menu",
            type: "menu",
            data: {
              options: ["🛍️ Бүтээгдэхүүн үзэх", "💰 Үнэ мэдэх", "📦 Захиалга шалгах", "📞 Холбоо барих"],
            },
          },
          {
            id: "products",
            type: "message",
            data: { text: "Манай бүтээгдэхүүнүүдийг энд үзнэ үү: miniishop.mn/products" },
          },
          {
            id: "contact",
            type: "message",
            data: { text: "Утас: 99112233\nИмэйл: info@miniishop.mn\nАжлын цаг: 9:00-18:00" },
          },
        ],
        edges: [
          { source: "start", target: "greet" },
          { source: "greet", target: "menu" },
          { source: "menu", target: "products", label: "Бүтээгдэхүүн" },
          { source: "menu", target: "contact", label: "Холбоо барих" },
        ],
      }),
      isActive: true,
    },
  });

  await prisma.chatBot.create({
    data: {
      userId: batbayar.id,
      name: "Вэбсайт AI тусламж",
      platform: "WEB",
      flowJson: JSON.stringify({
        nodes: [
          { id: "start", type: "trigger", data: { label: "Эхлэх" } },
          {
            id: "greet",
            type: "message",
            data: { text: "Тавтай морилно уу! Би таны AI туслах. Асуултаа бичнэ үү 😊" },
          },
          {
            id: "ai",
            type: "ai_response",
            data: {
              model: "gpt-4",
              systemPrompt:
                "Та МиниШоп онлайн дэлгүүрийн тусламжийн бот. Монгол хэлээр хариулна. Эелдэг, тусархуу байна.",
            },
          },
          {
            id: "handoff",
            type: "human_handoff",
            data: { message: "Уучлаарай, би энэ асуултанд хариулж чадахгүй байна. Хүний оператор руу шилжүүлж байна..." },
          },
        ],
        edges: [
          { source: "start", target: "greet" },
          { source: "greet", target: "ai" },
          { source: "ai", target: "handoff", label: "fallback" },
        ],
      }),
      isActive: true,
    },
  });

  console.log("  ✅ 2 chatbots created for batbayar");

  // ===================== 14. NOTIFICATIONS (5) =====================
  console.log("🔔 Seeding notifications...");

  const notificationsData = [
    {
      userId: admin.id,
      type: "SYSTEM" as const,
      title: "Шинэ хэрэглэгч бүртгүүлсэн",
      message: "Нарантуяа Батгэрэл (naraa@gmail.com) шинээр бүртгүүлсэн.",
      link: "/admin/users",
      isRead: true,
    },
    {
      userId: batbayar.id,
      type: "PAYMENT_SUCCESS" as const,
      title: "Төлбөр амжилттай",
      message: "Business багцын жилийн төлбөр 2,490,000₮ амжилттай төлөгдлөө.",
      link: "/dashboard/billing",
      isRead: true,
    },
    {
      userId: batbayar.id,
      type: "DOMAIN_EXPIRY" as const,
      title: "Домэйн дуусах сануулга",
      message: "miniishop.mn домэйн 30 хоногийн дараа дуусна. Сунгалт хийнэ үү.",
      link: "/dashboard/domains",
      isRead: false,
    },
    {
      userId: admin.id,
      type: "SUPPORT_REPLY" as const,
      title: "Шинэ тикет ирсэн",
      message: "Номин Г. (nomin@gmail.com) QPay интеграцын алдааны тикет үүсгэсэн.",
      link: "/admin/tickets",
      isRead: false,
    },
    {
      userId: batbayar.id,
      type: "COMMISSION_EARNED" as const,
      title: "Шинэ борлуулалт!",
      message: "Тэнгэр Системс ХХК-тай 4,100,000₮-ийн гэрээ байгуулагдлаа.",
      link: "/dashboard/crm",
      isRead: false,
    },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }

  console.log("  ✅ 5 notifications created");

  // ===================== 15. SITE SETTINGS (15+) =====================
  console.log("⚙️ Seeding site settings...");

  const settingsData = [
    // General
    { key: "site_name", value: "nuul.digital", type: "string", group: "general", label: "Сайтын нэр" },
    { key: "site_description", value: "Монголын #1 дижитал платформ — домэйн, хостинг, вэбсайт, AI чатбот", type: "string", group: "general", label: "Тайлбар" },
    { key: "site_logo", value: "/images/logo.svg", type: "string", group: "general", label: "Лого" },
    { key: "site_favicon", value: "/images/favicon.ico", type: "string", group: "general", label: "Favicon" },
    { key: "hero_video_url", value: "https://videos.pexels.com/video-files/3129957/3129957-uhd_3840_2160_25fps.mp4", type: "string", group: "general", label: "Нүүр хуудасны hero видео URL" },
    { key: "hero_headline", value: "Бизнесээ дижитал\nертөнцөд өсгөнө.", type: "string", group: "general", label: "Hero гарчиг (\\n мөр таслана)" },
    { key: "hero_subheadline", value: "Вэбсайт, чатбот, маркетинг, FB контент — бид хийж өгнө. Та бизнесээ өсгөнө.", type: "string", group: "general", label: "Hero дэд тайлбар" },
    { key: "hero_tag", value: "Маркетинг. Вэбсайт. Чатбот.", type: "string", group: "general", label: "Hero tag (баруун доод)" },
    // Contact
    { key: "contact_email", value: "info@nuul.digital", type: "string", group: "contact", label: "Холбоо барих имэйл" },
    { key: "contact_phone", value: "+976 7711-8800", type: "string", group: "contact", label: "Утасны дугаар" },
    { key: "contact_address", value: "Улаанбаатар хот, Сүхбаатар дүүрэг, Бага тойруу 15", type: "string", group: "contact", label: "Хаяг" },
    { key: "social_facebook", value: "https://facebook.com/nuul.digital", type: "string", group: "contact", label: "Facebook" },
    { key: "social_instagram", value: "https://instagram.com/nuul.digital", type: "string", group: "contact", label: "Instagram" },
    // Feature toggles
    { key: "feature_chatbot", value: "true", type: "boolean", group: "features", label: "AI чатбот идэвхжүүлэх" },
    { key: "feature_crm", value: "true", type: "boolean", group: "features", label: "CRM идэвхжүүлэх" },
    { key: "feature_email_marketing", value: "true", type: "boolean", group: "features", label: "Имэйл маркетинг идэвхжүүлэх" },
    { key: "feature_reseller", value: "true", type: "boolean", group: "features", label: "Reseller систем идэвхжүүлэх" },
    { key: "feature_website_builder", value: "false", type: "boolean", group: "features", label: "Вэбсайт builder (бета)" },
    // Pricing
    { key: "domain_price_mn", value: "165000", type: "number", group: "pricing", label: ".mn домэйн үнэ (MNT)" },
    { key: "domain_price_com", value: "62500", type: "number", group: "pricing", label: ".com домэйн үнэ (MNT)" },
    { key: "domain_price_org", value: "75000", type: "number", group: "pricing", label: ".org домэйн үнэ (MNT)" },
    { key: "currency", value: "MNT", type: "string", group: "pricing", label: "Валют" },
  ];

  for (const s of settingsData) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log("  ✅ 18 site settings created");

  // ===================== 16. RESELLER PROFILES (2) =====================
  console.log("🤝 Seeding reseller profiles...");

  await prisma.resellerProfile.upsert({
    where: { userId: reseller1.id },
    update: {},
    create: {
      userId: reseller1.id,
      companyName: "Дорж Дижитал ХХК",
      commissionRate: 0.2,
      totalEarned: 2450000,
      balance: 780000,
      status: "ACTIVE",
    },
  });

  await prisma.resellerProfile.upsert({
    where: { userId: reseller2.id },
    update: {},
    create: {
      userId: reseller2.id,
      companyName: "Оюу Медиа ХХК",
      commissionRate: 0.15,
      totalEarned: 1120000,
      balance: 350000,
      status: "ACTIVE",
    },
  });

  console.log("  ✅ 2 reseller profiles created");

  // ===================== 17. EMAIL LISTS (2) + SUBSCRIBERS (5) =====================
  console.log("📧 Seeding email lists & subscribers...");

  const emailList1 = await prisma.emailList.create({
    data: {
      userId: batbayar.id,
      name: "МиниШоп хэрэглэгчид",
      description: "Онлайн дэлгүүрийн бүртгэлтэй хэрэглэгчдийн жагсаалт",
    },
  });

  const emailList2 = await prisma.emailList.create({
    data: {
      userId: batbayar.id,
      name: "Мэдээллийн товхимол",
      description: "Долоо хоног бүрийн мэдээ, зөвлөгөөний захидал",
    },
  });

  const subscribersData = [
    { listId: emailList1.id, email: "customer1@example.com", name: "Болд Бат", tags: ["VIP", "repeat-buyer"] },
    { listId: emailList1.id, email: "customer2@example.com", name: "Сарнай Дорж", tags: ["new"] },
    { listId: emailList1.id, email: "customer3@example.com", name: "Тэмүүлэн Г.", tags: ["inactive"], status: "UNSUBSCRIBED" as const },
    { listId: emailList2.id, email: "reader1@example.com", name: "Ганбаатар О.", tags: ["tech"] },
    { listId: emailList2.id, email: "reader2@example.com", name: "Энхжин Б.", tags: ["marketing", "design"] },
  ];

  for (const sub of subscribersData) {
    await prisma.emailSubscriber.create({ data: sub });
  }

  console.log("  ✅ 2 email lists + 5 subscribers created");

  // ===================== NAV ITEMS =====================
  console.log("🧭 Seeding nav items...");
  const navItems = [
    { label: "Үйлчилгээ", labelEn: "Services", href: "/services", order: 1 },
    { label: "Домэйн", labelEn: "Domain", href: "/#domain", order: 2 },
    { label: "Үнэ", labelEn: "Pricing", href: "/#price", order: 3 },
    { label: "Блог", labelEn: "Blog", href: "/blog", order: 4 },
    { label: "Бидний тухай", labelEn: "About", href: "/about", order: 5 },
    { label: "Холбоо барих", labelEn: "Contact", href: "/contact", order: 6 },
  ];
  await prisma.navItem.deleteMany();
  for (const nav of navItems) {
    await prisma.navItem.create({ data: { ...nav, isActive: true } });
  }
  console.log("  ✅ 6 nav items created");

  // ===================== DONE =====================
  console.log("\n🎉 Demo seed complete!");
  console.log("   Users: 8 (+1 existing)");
  console.log("   Hosting Plans: 3");
  console.log("   Domains: 8");
  console.log("   Subscriptions: 5");
  console.log("   Orders: 12 | Payments: 10");
  console.log("   Service Categories: 6 | Services: 15");
  console.log("   Service Quotes: 4");
  console.log("   Blog Categories: 5 | Blog Posts: 5");
  console.log("   CRM Leads: 7");
  console.log("   Support Tickets: 4");
  console.log("   ChatBots: 2");
  console.log("   Notifications: 5");
  console.log("   Site Settings: 18");
  console.log("   Reseller Profiles: 2");
  console.log("   Email Lists: 2 | Subscribers: 5");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
