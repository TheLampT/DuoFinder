// lib/mockData.ts
// si el archivo exporta: export const mockProfiles = [...]
export { mockProfiles as profiles };
export type Profile = {
  id: string;
  name: string;
  imageUrl: string;
  bio?: string;
};

export const mockProfiles: Profile[] = [
  { id: "1", name: "Ada", imageUrl: "/ada.png" },
  { id: "2", name: "Linus", imageUrl: "/linus.png" },
];
