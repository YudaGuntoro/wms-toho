import type { Metadata } from "next";
import PartTable from "@/components/master-data/PartTable";

export const metadata: Metadata = { title: "Parts | WMS-Toho" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#184F8F]">Master Data</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Parts</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Core warehouse records with Part / Lot Number, Part Name, Location, and TimeStamp.
        </p>
      </div>
      <PartTable />
    </div>
  );
}
