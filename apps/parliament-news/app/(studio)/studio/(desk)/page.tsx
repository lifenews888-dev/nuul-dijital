import { redirect } from "next/navigation";

/**
 * `/studio` нь өөрөө хуудас биш — редакцын гар нь мэдээний жагсаалтаас
 * эхэлнэ. Самбар (`dash`) нь 3c шатад нэмэгдэнэ.
 */
export default function StudioIndex() {
  redirect("/studio/news");
}
