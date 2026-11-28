import { permanentRedirect } from "next/navigation";

/**
 * `/video` — видео хэсгийн БОГИНО хаяг.
 *
 * Хуудсыг хоёр дахин зурахгүй, 308-аар `/c/video` руу явуулна. Ижил
 * жагсаалтыг хоёр хаягаар үйлчилбэл Google хоёуланг нь индекслээд аль нь
 * жинхэнэ болохыг таах бөгөөд хоёулангийнх нь байр суурь буурна.
 */
export default function VideoShortcut() {
  permanentRedirect("/c/video");
}
