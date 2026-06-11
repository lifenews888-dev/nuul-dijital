export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  avatar: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Nuul Digital-ийн баг манай дижитал шилжилтийг хүлээлтээс давсан түвшинд хүргэсэн. Тэдний мэргэжлийн ур чадвар, хариуцлагатай хандлага гайхалтай.",
    author: "Б. Энхбаяр",
    role: "Гүйцэтгэх захирал",
    company: "Алтан Банк",
    rating: 5,
    avatar: "https://i.pravatar.cc/120?img=12",
  },
  {
    quote:
      "Онлайн борлуулалт маань хагас жилийн дотор хоёр дахин өслөө. Тэдний e-commerce шийдэл үнэхээр үр дүнтэй байсан.",
    author: "С. Оюунчимэг",
    role: "Маркетингийн захирал",
    company: "Gobi Cashmere",
    rating: 5,
    avatar: "https://i.pravatar.cc/120?img=45",
  },
  {
    quote:
      "AI чатбот маань харилцагчийн үйлчилгээний ачааллыг 80% бууруулсан. Хэрэглэгчид шуурхай хариулт авч сэтгэл хангалуун байна.",
    author: "Д. Тэмүүлэн",
    role: "Үйл ажиллагаа хариуцсан захирал",
    company: "MedAssist",
    rating: 5,
    avatar: "https://i.pravatar.cc/120?img=33",
  },
  {
    quote:
      "Тэдэнтэй ажиллах нь жинхэнэ түншлэл. Зөвхөн код бичээд зогсохгүй, бизнесийн зорилгод маань гүн анхаардаг.",
    author: "Г. Болормаа",
    role: "Үүсгэн байгуулагч",
    company: "EduMongolia",
    rating: 5,
    avatar: "https://i.pravatar.cc/120?img=20",
  },
];
