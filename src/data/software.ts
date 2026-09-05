import {
  BrainCircuit,
  Boxes,
  DatabaseBackup,
  FileLock2,
  FileText,
  Fingerprint,
  HardDrive,
  Layers,
  Palette,
  PencilRuler,
  Radar,
  Router,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  TabletSmartphone,
  UserCog,
  type LucideIcon,
} from "lucide-react";

/**
 * Software licensing catalogue — 17 manufacturers across 61 product categories.
 *
 * Deliberately free of prices: vendor price lists arrive with the distributor
 * agreement, so every path ends at the quote form rather than at a number we
 * cannot yet honour.
 *
 * Product names are the ones each vendor publishes. For TrendAI, Ideco and
 * Axidian the entries describe the capability areas rather than exact SKUs —
 * reconcile those against the distributor portal once the agreement is signed.
 * Until then no page claims partner status and no vendor logos are used.
 */

export type VendorFocus = "creative" | "productivity" | "security" | "infrastructure";
export type CategoryGroup = "application" | "security" | "infrastructure" | "other" | "home";

export type SoftwareVendor = {
  slug: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  description: string;
  products: string[];
  editions?: string[];
  audience: string;
  focus: VendorFocus;
  featured: boolean;
  /** Display order on the index page; lower sorts first. */
  priority: number;
  accent?: "blue" | "cyan";
  /** Set from the admin once a vendor is managed in the database. */
  image?: string;
  gallery?: string[];
  videoUrl?: string;
  priceMnt?: number;
  priceNote?: string;
};

export type SoftwareCategory = {
  slug: string;
  title: string;
  /** One or two sentences of its own, so each category page carries real content. */
  description: string;
  group: CategoryGroup;
  vendors: string[];
};

export const FOCUS_LABELS: Record<VendorFocus, string> = {
  creative: "Бүтээлч ажил",
  productivity: "Оффис ба бүтээмж",
  security: "Мэдээллийн аюулгүй байдал",
  infrastructure: "Дэд бүтэц",
};

export const GROUP_LABELS: Record<CategoryGroup, string> = {
  application: "Хэрэглээний программ хангамж",
  security: "Мэдээллийн аюулгүй байдал",
  infrastructure: "Дэд бүтэц",
  other: "Бусад",
  home: "Гэрийн хэрэглээ",
};

export const GROUP_ORDER: CategoryGroup[] = [
  "application",
  "security",
  "infrastructure",
  "other",
  "home",
];

// ---------------------------------------------------------------------------
// Vendors — 17
// ---------------------------------------------------------------------------

export const softwareVendors: SoftwareVendor[] = [
  {
    slug: "adobe",
    name: "Adobe",
    icon: Palette,
    tagline: "Бүтээлч ажлын дэлхийн стандарт",
    description:
      "Creative Cloud, Document Cloud, Adobe Express болон Acrobat Studio — дизайн, видео, PDF, цахим гарын үсгийн бүрэн шийдэл. Байгууллагын лицензийг Teams болон Enterprise хувилбараар.",
    products: [
      "Creative Cloud — 20+ бүтээлч аппликейшн",
      "Photoshop, Illustrator, InDesign",
      "Premiere Pro, After Effects",
      "Acrobat Pro — PDF засварлалт",
      "Acrobat Sign — цахим гарын үсэг",
      "Acrobat AI Assistant",
      "Adobe Express",
      "Adobe Firefly — генератив AI",
      "Acrobat Studio",
    ],
    editions: ["For Teams", "For Enterprise"],
    audience:
      "Дизайн студи, зар сурталчилгааны агентлаг, хэвлэлийн газар, маркетингийн баг, медиа компани",
    focus: "creative",
    featured: true,
    priority: 1,
    accent: "blue",
  },
  {
    slug: "microsoft",
    name: "Microsoft",
    icon: Boxes,
    tagline: "Байгууллагын өдөр тутмын ажлын орчин",
    description:
      "Microsoft 365, Office, Windows, Azure, Teams, SharePoint — ажлын байрны программаас үүлэн дэд бүтэц хүртэл. CSP төлөвлөгөөний хүрээнд сарын болон жилийн захиалгаар.",
    products: [
      "Microsoft 365 (Business, Enterprise)",
      "Office аппликейшнууд",
      "Windows үйлдлийн систем",
      "Windows Server",
      "Azure үүлэн үйлчилгээ",
      "Teams — видео хурал, харилцаа",
      "SharePoint, OneDrive",
      "Power BI — өгөгдлийн аналитик",
      "Microsoft Project",
      "Microsoft Defender",
      "Microsoft Sentinel (SIEM)",
      "Visual Studio",
    ],
    editions: ["Business", "Enterprise"],
    audience: "Бүх төрлийн байгууллага — 1 хэрэглэгчээс 1000+ хүртэл",
    focus: "productivity",
    featured: true,
    priority: 2,
    accent: "cyan",
  },
  {
    slug: "autodesk",
    name: "Autodesk",
    icon: PencilRuler,
    tagline: "Зураг төсөл, барилга, үйлдвэрлэл",
    description:
      "AutoCAD, Revit болон бусад CAD/BIM шийдэл — архитектур, барилга, инженерийн салбарын дэлхийн стандарт.",
    products: [
      "AutoCAD",
      "AutoCAD LT",
      "Revit",
      "Civil 3D",
      "Inventor",
      "Fusion",
      "3ds Max",
      "AEC Collection",
      "Product Design & Manufacturing Collection",
    ],
    audience: "Барилга, архитектур, инженер, үйлдвэрлэлийн компаниуд",
    focus: "creative",
    featured: true,
    priority: 3,
    accent: "blue",
  },
  {
    slug: "kaspersky",
    name: "Kaspersky",
    icon: ShieldCheck,
    tagline: "Аюулгүй байдлын өргөн цогцолбор",
    description:
      "Эндпойнт хамгаалалтаас XDR, SIEM, Threat Intelligence хүртэл — каталогийн 21 ангилалд хамрагдсан хамгийн өргөн хүрээтэй аюулгүй байдлын вендор.",
    products: [
      "Endpoint Security for Business",
      "Kaspersky EDR / XDR",
      "Security for Mail Server",
      "Automated Security Awareness Platform",
      "Password Manager",
      "Threat Intelligence",
      "Industrial CyberSecurity (ICS)",
      "Security for Virtualization",
      "Anti Targeted Attack (Sandbox)",
      "Security for Mobile",
    ],
    editions: ["Select", "Advanced", "Total"],
    audience: "Банк, санхүү, төрийн байгууллага, дунд болон том ААН",
    focus: "security",
    featured: true,
    priority: 4,
    accent: "cyan",
  },
  {
    slug: "acronis",
    name: "Acronis",
    icon: DatabaseBackup,
    tagline: "Нөөцлөлт, сэргээлт ба кибер хамгаалалт",
    description:
      "Өгөгдлийн нөөцлөлт, гамшгийн сэргээлт, DLP болон кибер хамгаалалтыг нэг платформ дээр нэгтгэсэн шийдэл.",
    products: [
      "Acronis Cyber Protect",
      "Acronis Cyber Backup",
      "Acronis Cyber Protect Cloud",
      "Disaster Recovery",
      "Advanced DLP",
    ],
    audience: "Дата төв, IT баг, хостинг болон MSP үйлчилгээ үзүүлэгч, дунд овъёрын ААН",
    focus: "infrastructure",
    featured: true,
    priority: 5,
    accent: "blue",
  },
  {
    slug: "commvault",
    name: "Commvault",
    icon: HardDrive,
    tagline: "Байгууллагын өгөгдлийн хамгаалалт",
    description:
      "Том хэмжээний өгөгдлийн нөөцлөлт, сэргээлт болон өгөгдлийн аюулгүй байдлын (DCAP, DAG, DSPM) шийдэл.",
    products: [
      "Commvault Cloud",
      "Backup & Recovery",
      "Disaster Recovery",
      "Threat Scan / Data Security",
      "Cloud болон hybrid орчны хамгаалалт",
    ],
    audience: "Дата төв, том ААН, олон салбартай байгууллага",
    focus: "infrastructure",
    featured: false,
    priority: 6,
    accent: "blue",
  },
  {
    slug: "crowdstrike",
    name: "CrowdStrike",
    icon: Radar,
    tagline: "Дэлхийн тэргүүлэгч XDR платформ",
    description:
      "Falcon платформ дээр суурилсан үүлэн суурьт XDR — эндпойнт, ажлын ачаалал, хэрэглэгчийн танилтыг нэг дор хамгаална.",
    products: [
      "Falcon — эндпойнт хамгаалалт (NGAV)",
      "Falcon EDR / XDR",
      "Falcon Identity Protection",
      "Falcon Cloud Security",
      "Threat Intelligence",
    ],
    audience: "Өндөр эрсдэлтэй салбар — банк, финтек, дата төв, олон улсын компани",
    focus: "security",
    featured: true,
    priority: 7,
    accent: "cyan",
  },
  {
    slug: "forcepoint",
    name: "Forcepoint",
    icon: FileLock2,
    tagline: "Мэдээлэл төвтэй аюулгүй байдал",
    description:
      "DLP, вэб болон үүлний аюулгүй байдал, өгөгдлийн ангилал, WAAP — мэдээллийн урсгалыг хянаж, алдагдлаас сэргийлэх шийдэл.",
    products: [
      "Forcepoint DLP",
      "Forcepoint ONE (SSE — CASB, SWG, ZTNA)",
      "Web Security",
      "Email Security",
      "Data Classification",
    ],
    audience: "Мэдээлэл хамгаалах өндөр шаардлагатай салбар — санхүү, эрүүл мэнд, төрийн байгууллага",
    focus: "security",
    featured: false,
    priority: 8,
    accent: "blue",
  },
  {
    slug: "qualys",
    name: "Qualys",
    icon: ScanSearch,
    tagline: "Эмзэг байдал ба комплаенсийн удирдлага",
    description:
      "Эмзэг байдлын илрүүлэлт, автомат нэвтрэлтийн туршилт, үүл болон контейнерийн аюулгүй байдал — үүлэн платформ дээр.",
    products: [
      "Qualys VMDR — эмзэг байдлын удирдлага",
      "Web Application Scanning",
      "Policy Compliance",
      "Container Security",
      "TotalCloud — үүлний аюулгүй байдал",
      "CyberSecurity Asset Management",
    ],
    audience: "Аудит, ISO/PCI комплаенсийн шаардлагатай байгууллага, IT аюулгүй байдлын баг",
    focus: "security",
    featured: false,
    priority: 9,
    accent: "cyan",
  },
  {
    slug: "trendai",
    name: "TrendAI",
    icon: BrainCircuit,
    tagline: "AI-д суурилсан аюулгүй байдлын платформ",
    description:
      "AI аюулгүй байдал, XDR, ASM, контейнер болон үүлний хамгаалалт, ICS/IoT — каталогийн 13 ангилалд хамрагдсан өргөн шийдэл.",
    products: [
      "AI Security",
      "XDR — өргөтгөсөн илрүүлэлт",
      "Attack Surface Management (ASM)",
      "Эндпойнт хамгаалалт (EPP/EDR)",
      "Үүл ба контейнерийн аюулгүй байдал",
      "Шуудангийн хамгаалалт",
      "Sandbox",
      "ICS / IoT аюулгүй байдал",
      "WAAP",
    ],
    audience: "Шинэ технологи нэвтрүүлэхэд нээлттэй дунд болон том ААН",
    focus: "security",
    featured: false,
    priority: 10,
    accent: "blue",
  },
  {
    slug: "soti",
    name: "SOTI",
    icon: TabletSmartphone,
    tagline: "Талбарын төхөөрөмжийн удирдлага",
    description:
      "Мобайл болон IoT төхөөрөмжийг алсаас удирдах, хянах, аюулгүй байлгах платформ — салбарын ажилтантай бизнест.",
    products: [
      "SOTI MobiControl — MDM/EMM",
      "SOTI XSight — онош, аналитик",
      "SOTI Connect — IoT төхөөрөмжийн удирдлага",
      "SOTI Snap — апп бүтээх",
    ],
    audience: "Логистик, жижиглэн худалдаа, агуулах, салбарын ажилтантай компани",
    focus: "infrastructure",
    featured: false,
    priority: 11,
    accent: "cyan",
  },
  {
    slug: "zimperium",
    name: "Zimperium",
    icon: ShieldAlert,
    tagline: "Мобайл төхөөрөмж ба аппын хамгаалалт",
    description:
      "Гар утасны түвшний аюулыг илрүүлэх, мобайл аппликейшныг халдлагаас хамгаалах тусгай шийдэл.",
    products: [
      "Mobile Threat Defense (MTD)",
      "Mobile Application Protection Suite (MAPS)",
      "Аппын кодын хамгаалалт, шифрлэлт",
    ],
    audience: "Мобайл апптай банк, финтек, эрүүл мэнд, төрийн үйлчилгээ",
    focus: "security",
    featured: false,
    priority: 12,
    accent: "cyan",
  },
  {
    slug: "axidian",
    name: "Axidian",
    icon: Fingerprint,
    tagline: "Хэрэглэгчийн танилт ба хандалтын удирдлага",
    description:
      "Олон хүчин зүйлийн танилт, биометр, онцгой эрхийн хандалтын удирдлага (PAM) болон ITDR.",
    products: [
      "Axidian Access — MFA, SSO",
      "Axidian Privilege — PAM",
      "Axidian CertiFix — PKI, гэрчилгээний удирдлага",
      "Биометр танилтын систем",
    ],
    audience: "Банк, санхүү, төрийн байгууллага — хандалтын хатуу хяналт шаардлагатай орчин",
    focus: "security",
    featured: false,
    priority: 13,
    accent: "blue",
  },
  {
    slug: "ideco",
    name: "Ideco",
    icon: Router,
    tagline: "Сүлжээний хамгаалалт ба хандалтын хяналт",
    description:
      "Дараа үеийн галт хана (NGFW/UTM), VPN, Zero Trust хандалт болон вэб аппын хамгаалалт.",
    products: [
      "Ideco NGFW / UTM — галт хана",
      "VPN — алсын аюулгүй хандалт",
      "Zero Trust хандалтын хяналт",
      "Вэб аппын галт хана (WAF)",
    ],
    audience: "Дунд овъёрын ААН, салбартай байгууллага, боловсролын байгууллага",
    focus: "security",
    featured: false,
    priority: 14,
    accent: "blue",
  },
  {
    slug: "admin-by-request",
    name: "Admin by Request",
    icon: UserCog,
    tagline: "Онцгой эрх ба алсын хандалт",
    description:
      "Хэрэглэгчид админ эрхийг зөвхөн хэрэгтэй үед, хяналттайгаар олгох шийдэл — эрсдэлийг бууруулж, IT багийн ачааллыг хөнгөвчилнө.",
    products: [
      "Endpoint Privilege Management (EPM)",
      "Secure Remote Access",
      "Аппликейшны хяналт (allowlist)",
    ],
    audience: "IT багтай дунд овъёрын ААН, олон ажлын байртай байгууллага",
    focus: "security",
    featured: false,
    priority: 15,
    accent: "cyan",
  },
  {
    slug: "zstack",
    name: "ZStack",
    icon: Layers,
    tagline: "Виртуальчлал ба хувийн үүл",
    description:
      "Сервер виртуальчлал болон хувийн үүлэн дэд бүтэц байгуулах платформ — VMware-ээс шилжих боломжит хувилбар.",
    products: [
      "ZStack Cloud — хувийн үүл (IaaS)",
      "Сервер виртуальчлал",
      "Хадгалалт ба сүлжээний виртуальчлал",
    ],
    audience: "Дата төв, өөрийн дэд бүтэцтэй ААН, төрийн байгууллага",
    focus: "infrastructure",
    featured: false,
    priority: 16,
    accent: "blue",
  },
  {
    slug: "pdf-xchange",
    name: "PDF-XChange",
    icon: FileText,
    tagline: "Хэмнэлттэй PDF шийдэл",
    description:
      "PDF засварлалт, хөрвүүлэлт, OCR болон маягтын ажил — Acrobat-ын боломжийн үнэтэй хувилбар.",
    products: [
      "PDF-XChange Editor",
      "PDF-XChange Editor Plus",
      "PDF-XChange PRO",
      "PDF-Tools",
      "PDF-XChange Standard — виртуал принтер",
    ],
    audience: "Төсөв хязгаарлагдмал байгууллага, олон ажлын байранд PDF засварлалт хэрэгтэй баг",
    focus: "productivity",
    featured: false,
    priority: 17,
    accent: "cyan",
  },
];

// ---------------------------------------------------------------------------
// Categories — 61
// ---------------------------------------------------------------------------

export const softwareCategories: SoftwareCategory[] = [
  // — application —
  {
    slug: "ai-document-processing",
    title: "AI дээр суурилсан баримт боловсруулалт",
    description:
      "Гэрээ, тайлан, нэхэмжлэх зэрэг баримтаас мэдээлэл автоматаар уншиж, хураангуйлж, боловсруулах хиймэл оюунд суурилсан хэрэгслүүд.",
    group: "application",
    vendors: ["adobe"],
  },
  {
    slug: "bpm",
    title: "Бизнес процессийн удирдлага (BPM)",
    description:
      "Байгууллагын дотоод урсгал — батлах, хянах, гарын үсэг зурах алхмуудыг цахимжуулж, дахин давтагдах ажлыг автоматжуулна.",
    group: "application",
    vendors: ["adobe", "microsoft"],
  },
  {
    slug: "cad",
    title: "CAD — зураг төслийн систем",
    description:
      "Барилга, архитектур, машин механизмын зураг төслийг 2D болон 3D-ээр боловсруулах мэргэжлийн систем.",
    group: "application",
    vendors: ["autodesk"],
  },
  {
    slug: "data-analytics",
    title: "Өгөгдлийн удирдлага, аналитик (ETL, MDM, BI)",
    description:
      "Өгөгдөл цуглуулах, цэвэрлэх, нэгтгэх болон дүрслэн харуулах — шийдвэр гаргалтад зориулсан аналитикийн бүрэн гинжин хэлхээ.",
    group: "application",
    vendors: ["microsoft"],
  },
  {
    slug: "enterprise-communication",
    title: "Байгууллагын харилцаа холбоо",
    description:
      "Ажилтнуудын чат, дуудлага, файл хуваалцах болон хамтын ажиллагааг нэг орчинд нэгтгэсэн шийдэл.",
    group: "application",
    vendors: ["microsoft"],
  },
  {
    slug: "ide",
    title: "Хөгжүүлэлтийн орчин (IDE)",
    description:
      "Программ хөгжүүлэгчдэд зориулсан код бичих, дибаг хийх, хувилбар удирдах мэргэжлийн орчин.",
    group: "application",
    vendors: ["microsoft"],
  },
  {
    slug: "iot",
    title: "Интернэт оф Тингс (IoT)",
    description:
      "Мэдрэгч, төхөөрөмжөөс өгөгдөл цуглуулж, алсаас удирдах платформ — үйлдвэрлэл, логистик, ухаалаг барилгад.",
    group: "application",
    vendors: ["microsoft", "soti"],
  },
  {
    slug: "office-applications",
    title: "Оффисын программууд",
    description:
      "Баримт, хүснэгт, презентац боловсруулах өдөр тутмын ажлын үндсэн хэрэглүүрүүд.",
    group: "application",
    vendors: ["microsoft"],
  },
  {
    slug: "project-management",
    title: "Төслийн удирдлага",
    description:
      "Ажлын төлөвлөгөө, нөөц, хугацаа, төсвийг хянах — олон оролцогчтой төслийг цэгцтэй авч явах хэрэгсэл.",
    group: "application",
    vendors: ["microsoft"],
  },
  {
    slug: "science-education",
    title: "Шинжлэх ухаан, боловсрол",
    description:
      "Сургалт, судалгаанд зориулсан программ хангамж болон боловсролын байгууллагад тусгайлан санал болгодог лицензийн хөтөлбөрүүд.",
    group: "application",
    vendors: ["microsoft"],
  },
  {
    slug: "creative-editors",
    title: "Видео, дуу, график засварлагч",
    description:
      "Зураг боловсруулах, видео монтаж, дуу засварлах мэргэжлийн хэрэглүүр — контент бүтээх багт.",
    group: "application",
    vendors: ["adobe"],
  },
  {
    slug: "video-conferencing",
    title: "Видео дуудлага, вэб хурал",
    description:
      "Алсын зайн хурал, вебинар, дэлгэц хуваалцах шийдэл — тархай байрлалтай багийн ажиллагаанд.",
    group: "application",
    vendors: ["microsoft"],
  },
  {
    slug: "pdf",
    title: "PDF-тэй ажиллах",
    description:
      "PDF үүсгэх, засварлах, хөрвүүлэх, OCR хийх болон цахим гарын үсэг зурах хэрэгслүүд.",
    group: "application",
    vendors: ["adobe", "pdf-xchange"],
  },

  // — security —
  {
    slug: "ai-security",
    title: "AI аюулгүй байдал",
    description:
      "Хиймэл оюуны загвар болон түүнд ашиглагдах өгөгдлийг халдлага, урвуулан ашиглалтаас хамгаалах шинэ үеийн шийдэл.",
    group: "security",
    vendors: ["trendai"],
  },
  {
    slug: "network-traffic-analysis",
    title: "Сүлжээний урсгалын шинжилгээ (NTA)",
    description:
      "Сүлжээгээр дамжих урсгалыг тасралтгүй хянаж, ердийн бус зан төлөв, далд халдлагыг илрүүлнэ.",
    group: "security",
    vendors: ["kaspersky", "trendai"],
  },
  {
    slug: "anti-fraud",
    title: "Анти-фрод — луйврын хяналт",
    description:
      "Онлайн гүйлгээ, хэрэглэгчийн үйлдлээс залилангийн шинжийг бодит цаг хугацаанд илрүүлэх систем — банк, финтекэд.",
    group: "security",
    vendors: ["kaspersky"],
  },
  {
    slug: "attack-surface-management",
    title: "Халдлагын гадаргуугийн удирдлага (ASM)",
    description:
      "Байгууллагын интернэтэд ил байгаа бүх хөрөнгийг илрүүлж, халдагчийн нүдээр эмзэг цэгүүдийг үнэлнэ.",
    group: "security",
    vendors: ["trendai"],
  },
  {
    slug: "security-awareness",
    title: "Аюулгүй байдлын мэдлэг олгох платформ",
    description:
      "Ажилтнуудыг фишинг болон нийгмийн инженерчлэлээс сэргийлэх сургалт — дадлагажуулах симуляцтай.",
    group: "security",
    vendors: ["kaspersky"],
  },
  {
    slug: "autopentest",
    title: "Автомат нэвтрэлтийн туршилт",
    description:
      "Халдагчийн аргаар системээ автоматаар туршиж, бодит эмзэг цэгийг гараар хийхээс хурдан илрүүлнэ.",
    group: "security",
    vendors: ["qualys"],
  },
  {
    slug: "biometric-auth",
    title: "Биометр танилтын систем",
    description:
      "Хурууны хээ, царайны танилтаар хэрэглэгчийг баталгаажуулах — нууц үгээс найдвартай нэвтрэлт.",
    group: "security",
    vendors: ["axidian"],
  },
  {
    slug: "cloud-security",
    title: "Үүл ба виртуал орчны хамгаалалт",
    description:
      "Үүлэн орчны тохиргоо, ажлын ачаалал, хандалтыг хянаж, буруу тохиргооноос үүдэх эрсдэлийг бууруулна.",
    group: "security",
    vendors: ["forcepoint", "kaspersky", "qualys", "trendai"],
  },
  {
    slug: "container-security",
    title: "Контейнерийн аюулгүй байдал",
    description:
      "Docker, Kubernetes орчны образ болон ажиллаж буй контейнерийн эмзэг байдлыг илрүүлж хянана.",
    group: "security",
    vendors: ["kaspersky", "qualys", "trendai"],
  },
  {
    slug: "dlp",
    title: "Мэдээлэл алдагдахаас сэргийлэх (DLP)",
    description:
      "Нууц баримт байгууллагаас гадагш гарахаас сэргийлэх — имэйл, USB, үүлэн сан дахь урсгалыг хянана.",
    group: "security",
    vendors: ["acronis", "forcepoint"],
  },
  {
    slug: "data-security",
    title: "Өгөгдлийн аюулгүй байдал (DCAP, DAG, DSPM)",
    description:
      "Ямар өгөгдөл хаана байгаа, хэн хандаж байгааг тодорхойлж, эмзэг мэдээллийн хандалтыг зохицуулна.",
    group: "security",
    vendors: ["commvault", "forcepoint", "qualys"],
  },
  {
    slug: "ddos-protection",
    title: "DDoS халдлагаас сэргийлэх",
    description:
      "Сүлжээг зориудаар ачаалалд оруулах халдлагыг шүүж, вэб үйлчилгээг тасралтгүй ажиллуулна.",
    group: "security",
    vendors: ["kaspersky"],
  },
  {
    slug: "devsecops",
    title: "DevSecOps",
    description:
      "Аюулгүй байдлын шалгалтыг хөгжүүлэлтийн урсгалд шингээж, код нийтлэгдэхээс өмнө эрсдэлийг илрүүлнэ.",
    group: "security",
    vendors: ["microsoft"],
  },
  {
    slug: "endpoint-protection",
    title: "Төгсгөлийн төхөөрөмжийн хамгаалалт (EPP, EDR)",
    description:
      "Компьютер, зөөврийн төхөөрөмж дэх хортой программыг илрүүлж, халдлагын дараах мөрдөн шалгалтыг боломжтой болгоно.",
    group: "security",
    vendors: ["kaspersky", "microsoft", "qualys", "trendai"],
  },
  {
    slug: "xdr",
    title: "Өргөтгөсөн илрүүлэлт, хариу арга хэмжээ (XDR)",
    description:
      "Эндпойнт, сүлжээ, үүл, шуудангийн дохиог нэг дор нэгтгэж, халдлагын бүтэн зургийг харуулна.",
    group: "security",
    vendors: ["crowdstrike", "kaspersky", "microsoft", "qualys", "trendai"],
  },
  {
    slug: "firewall",
    title: "Галт хана (NGFW/UTM)",
    description:
      "Сүлжээний хилийн хамгаалалт — урсгалыг шүүж, аппликейшны түвшинд бодлого хэрэгжүүлнэ.",
    group: "security",
    vendors: ["ideco"],
  },
  {
    slug: "itdr",
    title: "Танилтын аюулын илрүүлэлт (ITDR)",
    description:
      "Хэрэглэгчийн бүртгэл, эрхийн урвуулан ашиглалтыг илрүүлж, хулгайлагдсан данснаас үүдэх халдлагыг таслана.",
    group: "security",
    vendors: ["axidian"],
  },
  {
    slug: "ics-security",
    title: "Үйлдвэрлэлийн удирдлагын систем (ICS)",
    description:
      "Үйлдвэр, эрчим хүчний технологийн сүлжээг тусгайлан хамгаалах — ажиллагааг тасалдуулахгүй шийдэл.",
    group: "security",
    vendors: ["kaspersky", "trendai"],
  },
  {
    slug: "iot-security",
    title: "IoT аюулгүй байдал",
    description:
      "Сүлжээнд холбогдсон мэдрэгч, камер, ухаалаг төхөөрөмжийг илрүүлж, тэдгээрээр дамжих халдлагаас хамгаална.",
    group: "security",
    vendors: ["kaspersky", "trendai"],
  },
  {
    slug: "mail-security",
    title: "Шуудангийн серверийн хамгаалалт",
    description:
      "Фишинг, спам, хортой хавсралтыг ирэх шуудангаас шүүж, байгууллагын имэйлийг хамгаална.",
    group: "security",
    vendors: ["kaspersky", "trendai"],
  },
  {
    slug: "mdm-security",
    title: "Мобайл төхөөрөмжийн удирдлага (MDM)",
    description:
      "Ажилтны утас, таблет дээрх байгууллагын өгөгдлийг тусгаарлаж, алдагдсан төхөөрөмжийг алсаас цэвэрлэнэ.",
    group: "security",
    vendors: ["kaspersky", "microsoft", "trendai", "zimperium"],
  },
  {
    slug: "mfa",
    title: "Олон хүчин зүйлийн танилт (MFA)",
    description:
      "Нууц үгээс гадна нэмэлт баталгаажуулалт шаардаж, данс хулгайлагдах эрсдэлийг эрс бууруулна.",
    group: "security",
    vendors: ["axidian"],
  },
  {
    slug: "password-manager",
    title: "Нууц үгийн менежер",
    description:
      "Ажилтнуудын нууц үгийг шифрлэн хадгалж, багийн хооронд аюулгүй хуваалцах боломж олгоно.",
    group: "security",
    vendors: ["kaspersky"],
  },
  {
    slug: "pam",
    title: "Онцгой эрхийн хандалтын удирдлага (PAM)",
    description:
      "Админ эрхтэй хандалтыг бүртгэж, бичлэг хийж, зөвхөн шаардлагатай хугацаанд олгоно.",
    group: "security",
    vendors: ["axidian"],
  },
  {
    slug: "sandbox",
    title: "Sandbox — тусгаарлагдсан шинжилгээ",
    description:
      "Сэжигтэй файлыг тусгаарлагдсан орчинд ажиллуулж, бодит зан төлөвөөр нь аюултай эсэхийг тогтооно.",
    group: "security",
    vendors: ["kaspersky", "trendai"],
  },
  {
    slug: "sd-wan",
    title: "SD-WAN",
    description:
      "Салбар хоорондын сүлжээг программаар удирдаж, урсгалыг оновчлон, зардлыг бууруулна.",
    group: "security",
    vendors: ["kaspersky"],
  },
  {
    slug: "siem",
    title: "Аюулгүй байдлын үйл явдлын удирдлага (SIEM)",
    description:
      "Систем бүрийн лог мэдээллийг нэг дор цуглуулж, хамааралд нь дүн шинжилгээ хийн халдлагыг илрүүлнэ.",
    group: "security",
    vendors: ["kaspersky", "microsoft"],
  },
  {
    slug: "swg",
    title: "Аюулгүй вэб гарц (SWG)",
    description:
      "Ажилтнуудын интернэт хандалтыг шүүж, хортой болон зохисгүй сайтуудаас хамгаална.",
    group: "security",
    vendors: ["kaspersky"],
  },
  {
    slug: "threat-intelligence",
    title: "Аюулын хяналт ба Threat Intelligence",
    description:
      "Дэлхий дахины аюулын мэдээллийн санг ашиглан, өөрийн орчинд тохирох эрсдэлийг урьдчилан мэдэж ажиллана.",
    group: "security",
    vendors: ["kaspersky"],
  },
  {
    slug: "vpn-zero-trust",
    title: "VPN, Zero Trust хандалт",
    description:
      "Алсаас ажиллах ажилтанд аюулгүй холболт өгч, хэрэглэгч бүрийг тухай бүрд нь баталгаажуулна.",
    group: "security",
    vendors: ["ideco"],
  },
  {
    slug: "vulnerability-management",
    title: "Эмзэг байдлын удирдлага",
    description:
      "Систем дэх эмзэг цэгүүдийг тогтмол илрүүлж, эрсдэлийн түвшнээр эрэмбэлэн засварлах дарааллыг гаргана.",
    group: "security",
    vendors: ["kaspersky", "qualys"],
  },
  {
    slug: "waap",
    title: "Вэб аппын галт хана ба API хамгаалалт (WAAP)",
    description:
      "Вэб аппликейшн болон API руу чиглэсэн халдлагыг шүүж, бот болон урвуулан ашиглалтаас хамгаална.",
    group: "security",
    vendors: ["forcepoint", "ideco", "trendai"],
  },

  // — infrastructure —
  {
    slug: "cloud-platforms",
    title: "Үүлэн платформ",
    description:
      "Сервер, сан, сүлжээг үүлэн орчинд байршуулах — хэрэгцээгээрээ өргөтгөх боломжтой дэд бүтэц.",
    group: "infrastructure",
    vendors: ["microsoft"],
  },
  {
    slug: "container-platform",
    title: "Контейнер платформ",
    description:
      "Аппликейшныг контейнерээр багцалж, автоматаар байршуулах, өргөтгөх орчин.",
    group: "infrastructure",
    vendors: ["microsoft"],
  },
  {
    slug: "dbms",
    title: "Өгөгдлийн сангийн удирдлагын систем (DBMS)",
    description:
      "Байгууллагын өгөгдлийг найдвартай хадгалах, өндөр ачаалалд ажиллуулах мэргэжлийн өгөгдлийн сан.",
    group: "infrastructure",
    vendors: ["microsoft"],
  },
  {
    slug: "enterprise-backup",
    title: "Байгууллагын нөөцлөлт, сэргээлт",
    description:
      "Сервер, ажлын станц, үүлэн үйлчилгээний өгөгдлийг тогтмол нөөцөлж, гамшгийн үед хурдан сэргээнэ.",
    group: "infrastructure",
    vendors: ["acronis", "commvault", "microsoft"],
  },
  {
    slug: "mdm-infrastructure",
    title: "Мобайл төхөөрөмжийн удирдлага — дэд бүтэц",
    description:
      "Байгууллагын бүх төхөөрөмжийг нэг консолоос бүртгэж, тохируулж, шинэчлэлтийг төвлөрүүлнэ.",
    group: "infrastructure",
    vendors: ["microsoft", "soti"],
  },
  {
    slug: "it-monitoring",
    title: "IT дэд бүтцийн хяналт, удирдлага",
    description:
      "Сервер, сүлжээ, үйлчилгээний ажиллагааг тасралтгүй хянаж, доголдлыг эрт илрүүлнэ.",
    group: "infrastructure",
    vendors: ["microsoft"],
  },
  {
    slug: "operating-systems",
    title: "Үйлдлийн систем",
    description:
      "Ажлын станц болон серверийн үйлдлийн системийн лиценз — байгууллагын хэмжээнд төвлөрсөн удирдлагатай.",
    group: "infrastructure",
    vendors: ["microsoft"],
  },
  {
    slug: "remote-device-management",
    title: "Алсын төхөөрөмжийн удирдлага",
    description:
      "Ажилтны компьютерт алсаас холбогдож засвар үйлчилгээ хийх, эрхийг хяналттай олгох шийдэл.",
    group: "infrastructure",
    vendors: ["admin-by-request", "microsoft", "soti"],
  },
  {
    slug: "storage-systems",
    title: "Хадгалалтын систем (SDS)",
    description:
      "Программаар удирдагдах хадгалалт — тоног төхөөрөмжөөс хамааралгүйгээр багтаамжаа өргөтгөнө.",
    group: "infrastructure",
    vendors: ["microsoft"],
  },
  {
    slug: "virtualization-classic",
    title: "Виртуальчлал — сонгодог",
    description:
      "Нэг физик серверт олон виртуал машин ажиллуулж, тоног төхөөрөмжийн ашиглалтыг нэмэгдүүлнэ.",
    group: "infrastructure",
    vendors: ["microsoft", "zstack"],
  },
  {
    slug: "virtualization-private-cloud",
    title: "Виртуальчлал — хувийн үүл",
    description:
      "Өөрийн дата төв дээр үүлэн загварын өөрөө үйлчлэх дэд бүтэц байгуулах платформ.",
    group: "infrastructure",
    vendors: ["microsoft", "zstack"],
  },
  {
    slug: "virtualization-vdi",
    title: "Виртуальчлал — VDI",
    description:
      "Ажлын ширээг төвлөрсөн серверт байршуулж, ажилтан аль ч төхөөрөмжөөс аюулгүй хандана.",
    group: "infrastructure",
    vendors: ["microsoft"],
  },

  // — other —
  {
    slug: "macos-software",
    title: "Mac OS программ хангамж",
    description:
      "macOS орчинд ажиллах байгууллагын программ болон аюулгүй байдлын шийдлүүд.",
    group: "other",
    vendors: ["kaspersky", "microsoft"],
  },
  {
    slug: "mobile-apps",
    title: "Мобайл аппликейшн",
    description:
      "Гар утас, таблетад зориулсан байгууллагын лицензит аппликейшнууд.",
    group: "other",
    vendors: ["kaspersky"],
  },

  // — home —
  {
    slug: "home-accounting",
    title: "Бүртгэл бодох, баримт бүрдүүлэлт",
    description:
      "Жижиг бизнес болон хувь хүнд зориулсан бүртгэл, тайлан боловсруулах хэрэглүүр.",
    group: "home",
    vendors: ["microsoft"],
  },
  {
    slug: "games-entertainment",
    title: "Тоглоом, зугаа цэнгэл",
    description:
      "Гэрийн хэрэглээний тоглоом болон зугаа цэнгэлийн лицензит үйлчилгээ.",
    group: "home",
    vendors: ["microsoft"],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const getSoftwareVendor = (slug: string): SoftwareVendor | undefined =>
  softwareVendors.find((v) => v.slug === slug);

export const getSoftwareCategory = (slug: string): SoftwareCategory | undefined =>
  softwareCategories.find((c) => c.slug === slug);

export const sortedVendors = (): SoftwareVendor[] =>
  [...softwareVendors].sort((a, b) => a.priority - b.priority);

export const featuredVendors = (): SoftwareVendor[] =>
  sortedVendors().filter((v) => v.featured);

/** Categories a vendor appears in — drives the coverage badge and vendor page. */
export const categoriesForVendor = (slug: string): SoftwareCategory[] =>
  softwareCategories.filter((c) => c.vendors.includes(slug));

export const vendorCoverage = (slug: string): number => categoriesForVendor(slug).length;

export const categoriesByGroup = (): {
  group: CategoryGroup;
  label: string;
  items: SoftwareCategory[];
}[] =>
  GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: softwareCategories.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0);

export const vendorsByFocus = (): {
  focus: VendorFocus;
  label: string;
  items: SoftwareVendor[];
}[] =>
  (Object.keys(FOCUS_LABELS) as VendorFocus[])
    .map((focus) => ({
      focus,
      label: FOCUS_LABELS[focus],
      items: sortedVendors().filter((v) => v.focus === focus),
    }))
    .filter((g) => g.items.length > 0);

/** Free-text search over vendor names, their products, and category titles. */
export function searchCatalog(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { vendors: [] as SoftwareVendor[], categories: [] as SoftwareCategory[] };
  return {
    vendors: softwareVendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.tagline.toLowerCase().includes(q) ||
        v.products.some((p) => p.toLowerCase().includes(q))
    ),
    categories: softwareCategories.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    ),
  };
}

/**
 * Categories surfaced on the /software index — the full 61 live on /software/catalog.
 * These are real category slugs, so each card links to a page that exists.
 */
export const FEATURED_CATEGORY_SLUGS = [
  "creative-editors",
  "office-applications",
  "pdf",
  "endpoint-protection",
  "xdr",
  "enterprise-backup",
  "cloud-platforms",
  "mdm-security",
] as const;

export const featuredCategories = (): SoftwareCategory[] =>
  FEATURED_CATEGORY_SLUGS.map((slug) => getSoftwareCategory(slug)).filter(
    (c): c is SoftwareCategory => Boolean(c)
  );

export const CATALOG_STATS = {
  vendors: softwareVendors.length,
  categories: softwareCategories.length,
  groups: GROUP_ORDER.length,
};
