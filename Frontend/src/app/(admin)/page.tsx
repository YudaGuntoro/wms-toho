import type { Metadata } from "next";
import ProductionDashboard from "@/production/ProductionDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "WMS-Toho Warehouse Management System",
  description: "Warehouse inventory, picking, and operation monitoring dashboard",
};

export default function WMSDemoHome() {
  return <ProductionDashboard />;
}
