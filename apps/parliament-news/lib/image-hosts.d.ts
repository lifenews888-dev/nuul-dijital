/**
 * `image-hosts.js` нь CommonJS — `next.config.js` (мөн CJS) түүнийг шууд
 * `require` хийдэг. TypeScript талаас нь энгийн `import`-оор хэрэглэхийн
 * тулд төрлийг нь энд тодорхойлов. Хоёр тал нэг файлаас уншина.
 */
export declare const REMOTE_PATTERNS: ReadonlyArray<{
  protocol: string;
  hostname: string;
  pathname: string;
}>;

export declare const ALLOWED_HOST_SUFFIXES: readonly string[];
