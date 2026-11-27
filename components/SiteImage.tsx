"use client";

import Image, { type ImageLoader, type ImageProps } from "next/image";

/**
 * next/image pro web. Fotky z knihovny (/media/…) se nezmenšují přes /_next/image (ten na Cloudflare
 * čte jen statické soubory), ale přes vlastní adresu /media/…?w=, která drží omezený počet šířek.
 */
const mediaLoader: ImageLoader = ({ src, width }) => `${src}${src.includes("?") ? "&" : "?"}w=${width}`;

export function SiteImage(props: ImageProps) {
  const media = typeof props.src === "string" && props.src.startsWith("/media/");
  // eslint-disable-next-line jsx-a11y/alt-text -- alt přichází v props
  return <Image {...props} {...(media && { loader: mediaLoader })} />;
}
