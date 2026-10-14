import type { Metadata } from "next";
import ProductionDashboard from "@/production/ProductionDashboard";

export const metadata: Metadata = {
  title: "WMS-Toho Warehouse Management System",
  description: "Warehouse inventory, picking, and operation monitoring dashboard",
};

export default function WMSDemoHome() {
  return <ProductionDashboard />;
}
