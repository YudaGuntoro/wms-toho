import type { Metadata } from "next";
import ItemCheckPage from "@/warehouse/ItemCheckPage";

export const metadata: Metadata = { title: "Item Check | Toho Technology Indonesia" };

export default function Page() {
  return <ItemCheckPage />;
}
