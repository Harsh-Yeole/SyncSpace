import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Price } from "./supabase/supabase.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: Price) => {
  const priceString = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency || undefined,
    minimumFractionDigits: 0,
  }).format((price?.unitAmount || 0) / 100);
  return priceString;
};

export const toDateTime = (secs: number) => {
  const t = new Date("1970-01-01T00:30:00Z");
  t.setSeconds(secs);
  return t;
};

export const getURL = () => {
  let url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // url = url.includes("https") ? url : `http://${url}`;
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
};

export const postData = async ({
  url,
  data,
}: {
  url: string;
  data?: { price: Price };
}) => {
  console.log("posting,", url, data);
  const res: Response = await fetch(url, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    credentials: "same-origin",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    console.log("Error in postData", { url, data, res });
    throw Error(res.statusText);
  }
  return res.json();
};

export const getColorForAuthor = (authorName: string) => {
  if (authorName === "AI Co-Pilot") return "rgba(196, 181, 253, 0.4)"; // purple
  
  let hash = 0;
  for (let i = 0; i < authorName.length; i++) {
    hash = authorName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    "rgba(167, 243, 208, 0.4)", // emerald
    "rgba(253, 230, 138, 0.4)", // amber
    "rgba(191, 219, 254, 0.4)", // blue
    "rgba(254, 202, 202, 0.4)", // red
    "rgba(251, 207, 232, 0.4)", // pink
    "rgba(217, 249, 157, 0.4)", // lime
    "rgba(254, 215, 170, 0.4)", // orange
    "rgba(165, 243, 252, 0.4)", // cyan
  ];
  
  return colors[Math.abs(hash) % colors.length];
};
