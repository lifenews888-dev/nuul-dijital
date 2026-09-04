import {
  Boxes,
  Cloud,
  DatabaseBackup,
  FileText,
  Palette,
  PencilRuler,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Software licensing catalogue.
 *
 * Deliberately free of prices: vendor price lists come from the distributor
 * under contract, so the pages route every enquiry to a quote form instead of
 * quoting numbers we cannot honour yet.
 */
export type SoftwareVendor = {
  slug: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  description: string;
  products: string[];
  editions?: string[];
  audience: string;
  featured?: boolean;
  accent?: "blue" | "cyan";
};

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
      "Photoshop, Illustrator, InDesign, Premiere Pro",
      "Acrobat Pro — PDF засварлалт",
      "Acrobat Sign — цахим гарын үсэг",
      "Acrobat AI Assistant",
      "Adobe Express",
      "Adobe Firefly — генератив AI",
      "Acrobat Studio",
    ],
    editions: ["For Teams", "For Enterprise"],
    audience: "Дизайн студи, зар сурталчилгааны агентлаг, хэвлэлийн газар, маркетингийн баг",
    featured: true,
    accent: "blue",
  },
  {
    slug: "microsoft",
    name: "Microsoft",
    icon: Boxes,
    tagline: "Байгууллагын өдөр тутмын ажлын орчин",
    description:
      "Microsoft 365, Office, Windows, Azure, Teams, SharePoint — ажлын байрны болон дэд бүтцийн бүрэн цогцолбор. CSP төлөвлөгөөний хүрээнд сарын болон жилийн захиалгаар.",
    products: [
      "Microsoft 365 (Business, Enterprise)",
      "Office аппликейшнууд",
      "Windows Server, Windows үйлдлийн систем",
      "Azure үүлэн үйлчилгээ",
      "Teams — видео хурал, харилцаа",
      "SharePoint, OneDrive",
      "Power BI — өгөгдлийн аналитик",
      "Project — төслийн удирдлага",
    ],
    editions: ["Business", "Enterprise"],
    audience: "Бүх төрлийн байгууллага — 1 хэрэглэгчээс 1000+ хүртэл",
    featured: true,
    accent: "cyan",
  },
  {
    slug: "autodesk",
    name: "Autodesk",
    icon: PencilRuler,
    tagline: "Зураг төсөл, барилга, үйлдвэрлэл",
    description:
      "AutoCAD, Revit болон бусад CAD/BIM шийдэл — архитектур, барилга, инженерийн салбарын стандарт.",
    products: ["AutoCAD", "Revit", "Civil 3D", "Inventor", "Fusion", "AEC Collection"],
    audience: "Барилга, архитектур, инженерийн компаниуд",
    featured: true,
    accent: "blue",
  },
  {
    slug: "kaspersky",
    name: "Kaspersky",
    icon: ShieldCheck,
    tagline: "Мэдээллийн аюулгүй байдал",
    description:
      "Эндпойнт хамгаалалт, XDR, SIEM, мобайл хамгаалалт болон аюулгүй байдлын өргөн цогцолбор.",
    products: [
      "Endpoint Security for Business",
      "EDR / XDR",
      "Mail Security",
      "Security Awareness Platform",
      "Password Manager",
      "Threat Intelligence",
    ],
    audience: "Банк, санхүү, төрийн байгууллага, дунд болон том ААН",
    accent: "cyan",
  },
  {
    slug: "acronis",
    name: "Acronis",
    icon: DatabaseBackup,
    tagline: "Нөөцлөлт ба сэргээлт",
    description:
      "Байгууллагын өгөгдлийн нөөцлөлт, сэргээлт, кибер хамгаалалт нэг платформ дээр.",
    products: ["Cyber Protect", "Cyber Backup", "Disaster Recovery", "DLP"],
    audience: "Дата төв, IT баг, хостинг үйлчилгээ үзүүлэгч",
    accent: "blue",
  },
  {
    slug: "pdf-xchange",
    name: "PDF-XChange",
    icon: FileText,
    tagline: "Хэмнэлттэй PDF шийдэл",
    description:
      "PDF засварлалт, хөрвүүлэлт, OCR — Acrobat-ын боломжийн үнэтэй хувилбар.",
    products: ["PDF-XChange Editor", "PDF-XChange PRO", "PDF-Tools"],
    audience: "Төсөв хязгаарлагдмал байгууллага, олон ажлын байр",
    accent: "cyan",
  },
];

export type SoftwareCategory = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  vendors: string[];
};

export const softwareCategories: SoftwareCategory[] = [
  {
    key: "creative",
    title: "Бүтээлч ажил",
    description: "График дизайн, видео засвар, зураг төсөл",
    icon: Palette,
    vendors: ["adobe", "autodesk"],
  },
  {
    key: "office",
    title: "Оффис ба хамтын ажиллагаа",
    description: "Баримт, хүснэгт, видео хурал, хуваалцах",
    icon: Boxes,
    vendors: ["microsoft"],
  },
  {
    key: "pdf",
    title: "PDF ба баримт бичиг",
    description: "Засварлалт, цахим гарын үсэг, архив",
    icon: FileText,
    vendors: ["adobe", "pdf-xchange"],
  },
  {
    key: "security",
    title: "Мэдээллийн аюулгүй байдал",
    description: "Антивирус, EDR, сүлжээний хамгаалалт",
    icon: ShieldCheck,
    vendors: ["kaspersky", "acronis"],
  },
  {
    key: "cloud",
    title: "Үүл ба дэд бүтэц",
    description: "Azure, сервер, виртуальчлал",
    icon: Cloud,
    vendors: ["microsoft"],
  },
  {
    key: "backup",
    title: "Нөөцлөлт ба сэргээлт",
    description: "Өгөгдлийн хамгаалалт, DR",
    icon: DatabaseBackup,
    vendors: ["acronis", "microsoft"],
  },
];

export const getSoftwareVendor = (slug: string) =>
  softwareVendors.find((v) => v.slug === slug);
