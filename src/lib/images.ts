import type { IssueCategory } from "@/types";

const CATEGORY_IMAGES: Record<IssueCategory, string[]> = {
  pothole: [
    "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
  ],
  water_leak: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop",
  ],
  streetlight: [
    "https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop",
  ],
  waste: [
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=800&h=600&fit=crop",
  ],
  infrastructure: [
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1558618047-f4e70abb4df2?w=800&h=600&fit=crop",
  ],
  other: [
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop",
  ],
};

export function getDefaultImage(category: IssueCategory, index = 0): string {
  const imgs = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.other;
  return imgs[index % imgs.length];
}

export function getDefaultImages(category: IssueCategory): string[] {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES.other;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
