import type { Metadata } from "next";
import StockMovementPage from "@/warehouse/StockMovementPage";

export const metadata: Metadata = { title: "Stock Out | Toho Technology Indonesia" };

export default function Page() {
  return <StockMovementPage type="OUT" />;
}
