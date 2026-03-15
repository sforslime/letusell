if (
  typeof window === "undefined" &&
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_UNIVERSITY_ID
) {
  throw new Error("NEXT_PUBLIC_UNIVERSITY_ID is required but not set.");
}

export const siteConfig = {
  name: "LetuSell",
  description: "Order food from your favourite campus vendors.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  universityId: process.env.NEXT_PUBLIC_UNIVERSITY_ID ?? "",
  universityName: process.env.NEXT_PUBLIC_UNIVERSITY_NAME ?? "Campus",
  universitySlug: process.env.NEXT_PUBLIC_UNIVERSITY_SLUG ?? "campus",
  categories: [
    { label: "All", value: "all" },
    { label: "Local Dishes", value: "local_food" },
    { label: "Fast Food", value: "fast_food" },
    { label: "Snacks", value: "snacks" },
    { label: "Drinks", value: "drinks" },
    { label: "Pastries", value: "pastries" },
  ] as const,
};

export type VendorCategory = (typeof siteConfig.categories)[number]["value"];
