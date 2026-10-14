"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { TrashBinIcon } from "@/icons";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { PicCard, PicCardPayload, ShiftMaster } from "./types";
import { formatDateTime } from "./ui";

const inputClass =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:border-[#184F8F] focus:ring-2 focus:ring-[#184F8F]/10 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-300";

export default function PicCardsPage() {
  const [items, setItems] = useState<PicCard[]>([]);
  const [shifts, setShifts] = useState<ShiftMaster[]>([]);
  const [form, setForm] = useState<PicCardPayload>({
    card_uid: "",
    employee_no: "",
    full_name: "",
    department: "Warehouse",
    shift_id: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setForm((current) => ({
        ...current,
        shift_id: current.shift_id || shiftsResult[0]?.id || 0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await apiPost<PicCard>("/api/production/pic-cards", form);
      setMessage({ kind: "ok", text: "Staff card added successfully." });
      setForm({
        card_uid: "",
        employee_no: "",
        full_name: "",
        department: "Warehouse",
        shift_id: shifts[0]?.id || 0,
        is_active: true,
      });
      await load();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Failed to add staff card." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteCard(item: PicCard) {
    if (!window.confirm(`Delete staff card for "${item.full_name}"?`)) {
      return;
    }

    setDeletingId(item.id);
    setMessage(null);
    try {
      await apiDelete<boolean>(`/api/production/pic-cards/${item.id}`);
      setMessage({ kind: "ok", text: "Staff card deleted successfully." });
      await load();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Failed to delete staff card." });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#184F8F]">Master Data</p><h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Staff Cards</h1><p className="mt-1 text-sm text-slate-500">Warehouse staff cards available for job scanning.</p></div>
      {message ? (
        <div className={`rounded-md border px-4 py-3 text-sm font-medium ${message.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {message.text}
        </div>
      ) : null}
      {error ? <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.3fr_1fr_1fr_auto_auto]" onSubmit={(event) => void submit(event)}>
        <input
          className={inputClass}
          onChange={(event) => setForm((current) => ({ ...current, card_uid: event.target.value }))}
          placeholder="Card UID"
          required
          value={form.card_uid}
        />
        <input
          className={inputClass}
          onChange={(event) => setForm((current) => ({ ...current, employee_no: event.target.value }))}
          placeholder="Employee No"
          required
          value={form.employee_no}
        />
        <input
          className={inputClass}
          onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
          placeholder="Staff Name"
          required
          value={form.full_name}
        />
        <input
          className={inputClass}
          onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
          placeholder="Department"
          required
          value={form.department}
        />
        <select
          className={inputClass}
          onChange={(event) => setForm((current) => ({ ...current, shift_id: Number(event.target.value) }))}
          required
          value={form.shift_id}
        >
          <option value={0} disabled>Select Shift</option>
          {shifts.map((shift) => (
            <option key={shift.id} value={shift.id}>{shift.shift_name}</option>
          ))}
        </select>
        <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">
          <input
            checked={form.is_active}
            className="size-4 rounded border-slate-300 accent-[#184F8F]"
            onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
            type="checkbox"
          />
          Active
        </label>
        <button className="h-11 rounded-md bg-[#184F8F] px-5 text-sm font-bold text-white transition hover:bg-[#123D70] disabled:bg-[#0F335C] disabled:opacity-80" disabled={saving || !form.shift_id} type="submit">
          {saving ? "Saving..." : "Add"}
        </button>
      </form>

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
              <button
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-rose-200 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                disabled={deletingId === item.id}
                onClick={() => void deleteCard(item)}
                type="button"
              >
                <TrashBinIcon className="size-4 fill-current" />
                {deletingId === item.id ? "Deleting..." : "Delete"}
              </button>
            </article>
          ))}
          {!items.length && !error && !loading ? <p className="py-8 text-center text-sm text-slate-400">No staff cards found.</p> : null}
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
                <th className="rounded-tr-md px-5 py-3 text-center">Action</th>
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
                  <td className="px-5 py-4 text-center">
                    <button
                      className="inline-flex size-9 items-center justify-center rounded-md border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      disabled={deletingId === item.id}
                      onClick={() => void deleteCard(item)}
                      title="Delete"
                      type="button"
                    >
                      <TrashBinIcon className="size-4 fill-current" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && !error && !loading ? <p className="px-5 py-12 text-center text-sm text-slate-400">No staff cards found.</p> : null}
          {loading ? <p className="px-5 py-12 text-center text-sm text-slate-400">Loading...</p> : null}
        </div>
      </div>
    </div>
  );
}
