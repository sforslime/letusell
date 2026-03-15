if (
  typeof window === "undefined" &&
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_UNIVERSITY_ID
) {
  throw new Error("NEXT_PUBLIC_UNIVERSITY_ID is required but not set.");
}

export const siteConfig = {
  name: "LetuSell",
  description: "Shop from your favourite campus brands — fashion, food, beauty, and more.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  universityId: process.env.NEXT_PUBLIC_UNIVERSITY_ID ?? "",
  universityName: process.env.NEXT_PUBLIC_UNIVERSITY_NAME ?? "Campus",
  universitySlug: process.env.NEXT_PUBLIC_UNIVERSITY_SLUG ?? "campus",
  categories: [
    { label: "All", value: "all" },
    { label: "Food & Drinks", value: "food_drinks" },
    { label: "Fashion", value: "fashion" },
    { label: "Beauty & Wellness", value: "beauty" },
    { label: "Accessories", value: "accessories" },
    { label: "Books & Stationery", value: "stationery" },
    { label: "Electronics & Tech", value: "electronics" },
    { label: "Services", value: "services" },
  ] as const,
};

export type VendorCategory = (typeof siteConfig.categories)[number]["value"];
