import type { Metadata } from "next";
import LocationTable from "@/components/master-data/LocationTable";

export const metadata: Metadata = { title: "Location | Toho Technology Indonesia" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#184F8F]">Master Data</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Location</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Maintain warehouse storage locations used for stock in, stock out, and item checking.
        </p>
      </div>
      <LocationTable />
    </div>
  );
}
