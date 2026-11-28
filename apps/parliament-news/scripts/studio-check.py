"""Студийн хуудсуудыг НЭВТЭРСЭН төлөвт шалгана.

`scripts/browser-check.mjs` нь нийтийн талыг барина; студи нь нэвтрэлт
шаарддаг тул тэндээс хүрэхгүй. Энэ скрипт түр SUPER гишүүн үүсгээд,
нэвтэрч, хуудсуудыг уншаад, төгсгөлд гишүүнээ устгана.

Ажиллуулах:  pnpm check:studio     (dev эсвэл prod сервер :3014 дээр)

Нууц үг нь ажиллуулалт тус бүрт САНАМСАРГҮЙ үүсэж, хаана ч
хэвлэгдэхгүй: `MEMBER_PASSWORD`-ээр seed рүү дамжина.
"""
import json
import os
import secrets
import subprocess
import sys
import urllib.request
import urllib.error
import http.cookiejar
from urllib.parse import urlencode

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ORIGIN = "http://127.0.0.1:3014"
DB = r"c:\Users\User\nuul dijital\packages\db-news"
PW = secrets.token_urlsafe(14)
SUPER = "p4-super@parlamentnews.local"

ok_n = fail_n = 0


def ok(m):
    global ok_n
    ok_n += 1
    print("  ok   " + m)


def bad(m, d=""):
    global fail_n
    fail_n += 1
    print("  FAIL " + m + ((" — " + str(d)[:140]) if d else ""))


def has(m, hay, needle):
    ok(m) if needle in hay else bad(m, "«%s» олдсонгүй" % needle)


def psql(sql):
    r = subprocess.run(
        ["docker", "exec", "-e", "PGCLIENTENCODING=UTF8", "parlamentnews-pg", "psql",
         "-U", "parlament", "-d", "parlamentnews", "-q", "-t", "-A", "-c", sql],
        capture_output=True, encoding="utf-8", errors="replace")
    return r.stdout.strip()


def seed(email, role):
    env = dict(os.environ, MEMBER_EMAIL=email, MEMBER_PASSWORD=PW, MEMBER_ROLE=role)
    if subprocess.run(["pnpm", "db:seed:member"], cwd=DB, env=env,
                      capture_output=True, shell=True).returncode:
        print("SEED FAILED", email)
        sys.exit(1)


def cleanup():
    psql("DELETE FROM pn_activity WHERE \"userId\" IN (SELECT id FROM pn_users WHERE email='%s');" % SUPER)
    psql("DELETE FROM pn_tenant_members WHERE \"userId\" IN (SELECT id FROM pn_users WHERE email='%s');" % SUPER)
    psql("DELETE FROM pn_users WHERE email='%s';" % SUPER)
    print("cleanup: түр хэрэглэгч устав")


class S:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.o = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def get(self, path):
        try:
            with self.o.open(ORIGIN + path) as r:
                return r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            return e.read().decode("utf-8", "replace")

    def login(self, email):
        csrf = json.loads(self.get("/api/auth/csrf"))["csrfToken"]
        self.o.open(urllib.request.Request(
            ORIGIN + "/api/auth/callback/credentials",
            data=urlencode({"csrfToken": csrf, "email": email,
                            "password": PW, "json": "true"}).encode())).read()


def main():
    seed(SUPER, "SUPER")
    su = S()
    su.login(SUPER)

    # Нэвтэрсэн эсэхийг ЭХЛЭЭД шалгана. Production build дээр cookie нь
    # `__Secure-` угтвартай, `secure` тугтай гардаг (`lib/auth.ts`) тул
    # локал `http://` дээр хөтөч ч, энэ скрипт ч түүнийг хадгалахгүй.
    # Тэр тохиолдолд 18 ойлгомжгүй уналт гаргахын оронд нэг тодорхой
    # мөр хэвлэнэ: энэ бол бүтээгдэхүүний алдаа БИШ.
    session = json.loads(su.get("/api/auth/session") or "{}")
    if not session.get("user"):
        print("")
        print('Нэвтэрч чадсангүй.')
        print("Энэ скрипт нь DEV сервер дээр ажиллана: production build нь")
        print("cookie-г `__Secure-` угтвартай, зөвхөн https-ээр явуулдаг.")
        print("  pnpm dev  (эсвэл npx next dev -p 3014) дээр дахин ажиллуулна уу.")
        sys.exit(2)

    print("\n== Тохиргооны хуудас ==")
    p = su.get("/studio/settings")
    has("хуудас нээгдэнэ", p, "Нэгдсэн хуралдаан")

    print("\n== Шинэ самбарууд ==")
    has("баннерын самбар", p, "Сурталчилгааны баннер")
    has("баннерын заавар", p, "Таны зар энд байрлана")
    # Байршлын сонголтууд нь МӨР байхад л зурагдана — хоосон үед товч нь л байна
    has("баннер нэмэх товч", p, "Баннер нэмэх")
    has("толгойн самбар", p, "Толгой, лого ба цэс")
    has("лого — цайвар", p, "Цайвар дэвсгэрт")
    has("лого — бараан", p, "Бараан дэвсгэрт")
    has("цэсний мөрүүд", p, "Цэсний мөрүүд")
    has("цэсний байрлал", p, "Зөвхөн бургер цэсэнд")

    print("\n== Хуучин самбарууд хэвээр ==")
    for name in ["Өнөөдөр хэлэлцэх асуудал", "Урсдаг мөрийн зар", "Валютын ханш",
                 "Зарын үнийн санал", "Ангилал ба дэд ангилал", "RSS мэдээний суваг"]:
        has(name, p, name)

    print("\n== Засварлагч ==")
    e = su.get("/studio/news/new")
    has("шинэ мэдээ нээгдэнэ", e, "Үндсэн мэдээлэл")
    # Зургийн талбай одоо ХААЛТТАЙ БИШ: ноорог автоматаар үүснэ
    if "Эхлээд мэдээгээ хадгална уу" in e:
        bad("зургийн талбай нээлттэй", "хуучин хаалтын мессеж үлдсэн")
    else:
        ok("зургийн талбай нээлттэй")
    has("автоматаар ноорог", e, "ноорог автоматаар үүснэ")
    has("сторины тохиргоо", e, "Стори болгох")


    def wrong_login(email):
        """Санаатай БУРУУ нууц үгээр нэвтрэхийг оролдоно; алдааны мөр буцаана."""
        s = S()
        csrf = json.loads(s.get("/api/auth/csrf"))["csrfToken"]
        body = urlencode({"csrfToken": csrf, "email": email,
                          "password": "buruu-nuuts-ug-123", "json": "true"}).encode()
        try:
            with s.o.open(urllib.request.Request(
                    ORIGIN + "/api/auth/callback/credentials", data=body)) as r:
                return r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            return e.read().decode("utf-8", "replace")

    print("\n== Хурдны хязгаар ==")
    victim = "rate-%s@parlamentnews.local" % secrets.token_hex(4)
    blocked_at = None
    for attempt in range(1, 14):
        body = wrong_login(victim)
        if "%D0%A5%D1%8D%D1%82" in body or "Хэт олон" in body:
            blocked_at = attempt
            break
    if blocked_at == 11:
        ok("нэвтрэлт 11 дэх буруу оролдлогод хаагдав (хязгаар 10)")
    elif blocked_at:
        bad("нэвтрэлтийн хязгаар", "%d дахь оролдлогод хаагдав, 11 байх ёстой" % blocked_at)
    else:
        bad("нэвтрэлтийн хязгаар", "13 оролдлогод хаагдсангүй")

    # Амжилттай нэвтрэлт нь тоолуурыг цэвэрлэх ёстой — үгүй бол нэг
    # оффисын багийнхан өдрийн ажлаараа бие биеэ хаана.
    for _ in range(4):
        wrong_login(SUPER)
    s2 = S()
    s2.login(SUPER)
    if json.loads(s2.get("/api/auth/session") or "{}").get("user"):
        ok("амжилттай нэвтрэлт тоолуурыг цэвэрлэв")
    else:
        bad("амжилттай нэвтрэлт", "буруу оролдлогын дараа нэвтэрч чадсангүй")

    print("\n== Нийтийн тал ==")
    anon = S()
    ads = anon.get("/ads")
    has("зарын хуудас", ads, "Сурталчилгаа байршуулах")
    has("байршлын хэмжээ", ads, "1200 × 300 px")
    home = anon.get("/")
    has("нүүрэнд зарын талбай", home, "Таны зар энд байрлана")


try:
    main()
finally:
    cleanup()

print("\n%d ok, %d fail" % (ok_n, fail_n))
sys.exit(1 if fail_n else 0)
