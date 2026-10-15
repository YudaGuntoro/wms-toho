"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import RowActions from "@/components/common/RowActions";
import CreateButton from "@/components/common/CreateButton";
import { apiDelete, apiGet } from "@/lib/api";
import type { PicCard, ShiftMaster } from "./types";
import { formatDateTime } from "./ui";
import PicCardModal from "./PicCardModal";

export default function PicCardsPage() {
  const [items, setItems] = useState<PicCard[]>([]);
  const [shifts, setShifts] = useState<ShiftMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<PicCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PicCard | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    setEditingItem(null);
    setIsModalOpen(false);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardsResult, shiftsResult] = await Promise.all([
        apiGet<PicCard[]>("/api/production/pic-cards"),
        apiGet<ShiftMaster[]>("/api/production/shift-masters"),
      ]);
      setItems(cardsResult);
      setShifts(shiftsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function editCard(item: PicCard) {
    setEditingItem(item);
    setMessage(null);
    setIsModalOpen(true);
  }

  async function confirmDeleteCard() {
    if (!itemToDelete) {
      return;
    }

    setDeletingId(itemToDelete.id);
    setMessage(null);
    try {
      await apiDelete<boolean>(`/api/production/pic-cards/${itemToDelete.id}`);
      setMessage({ kind: "ok", text: "Staff list deleted successfully." });
      setItemToDelete(null);
      await load();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Failed to delete staff list." });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#184F8F]">Master Data</p><h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Staff List</h1><p className="mt-1 text-sm text-slate-500">Warehouse staff list available for job scanning.</p></div>
      {message ? (
        <div className={`rounded-md border px-4 py-3 text-sm font-medium ${message.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {message.text}
        </div>
      ) : null}
      {error ? <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
      <div className="flex justify-end rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CreateButton onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
          Create
        </CreateButton>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-3 p-4 md:hidden">
          {items.map((item) => (
            <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-black text-slate-900 dark:text-white">{item.full_name}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.employee_no}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${item.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
                  {item.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-800">
                  <p className="font-bold uppercase text-slate-400">Department</p>
                  <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{item.department}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-800">
                  <p className="font-bold uppercase text-slate-400">Last Scan</p>
                  <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{formatDateTime(item.last_scanned_at)}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <RowActions
                  onEdit={() => editCard(item)}
                  onDelete={() => setItemToDelete(item)}
                  deleteDisabled={deletingId === item.id}
                />
              </div>
            </article>
          ))}
          {!items.length && !error && !loading ? <p className="py-8 text-center text-sm text-slate-400">No staff list found.</p> : null}
          {loading ? <p className="py-8 text-center text-sm text-slate-400">Loading...</p> : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[#184F8F] text-xs uppercase text-white">
              <tr>
                <th className="rounded-tl-md px-5 py-3">Staff Name</th>
                <th className="px-4 py-3">Employee No</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Last Scan</th>
                <th className="px-5 py-3">Status</th>
                <th className="w-px whitespace-nowrap rounded-tr-md px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{item.full_name}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{item.employee_no}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{item.department}</td>
                  <td className="px-4 py-4 text-slate-500 dark:text-slate-300">{formatDateTime(item.last_scanned_at)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
                      {item.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="w-px whitespace-nowrap px-5 py-4 text-center">
                    <RowActions
                      onEdit={() => editCard(item)}
                      onDelete={() => setItemToDelete(item)}
                      deleteDisabled={deletingId === item.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && !error && !loading ? <p className="px-5 py-12 text-center text-sm text-slate-400">No staff list found.</p> : null}
          {loading ? <p className="px-5 py-12 text-center text-sm text-slate-400">Loading...</p> : null}
        </div>
      </div>
      <ConfirmModal
        confirmText="Delete"
        isDestructive
        isLoading={deletingId === itemToDelete?.id}
        isOpen={Boolean(itemToDelete)}
        message={itemToDelete ? `Delete staff list for "${itemToDelete.full_name}"?` : ""}
        onClose={() => {
          if (!deletingId) {
            setItemToDelete(null);
          }
        }}
        onConfirm={() => void confirmDeleteCard()}
        title="Delete Staff List"
      />
      <PicCardModal
        card={editingItem}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={() => void load()}
        shifts={shifts}
      />
    </div>
  );
}
