import { getSiteSetting } from "./settings";
import { DEFAULT_LOGO_LIGHT, DEFAULT_LOGO_DARK } from "../components/site-chrome";

export type Logos = { light: string; dark: string };

/**
 * Сайтын лого — ГУРВАН газар хэрэглэгдэнэ: толгой, цэс, хөл.
 *
 * Тус бүр нь өөрөө тохиргоо уншвал нэг хуудсанд гурван уншилт болно; бас
 * гурван газар «хоосон бол анхны файл» дүрмийг давтах нь зөрөх эрсдэлтэй.
 */
export async function siteLogos(): Promise<Logos> {
  const header = await getSiteSetting("header");
  return {
    light: header.logoLight || DEFAULT_LOGO_LIGHT,
    dark: header.logoDark || DEFAULT_LOGO_DARK,
  };
}
