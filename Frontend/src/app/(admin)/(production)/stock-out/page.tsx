import type { Metadata } from "next";
import StockMovementPage from "@/warehouse/StockMovementPage";

export const metadata: Metadata = { title: "Stock Out | WMS-Toho" };

export default function Page() {
  return <StockMovementPage type="OUT" />;
}
