"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Modal } from "@/components/ui/modal";
import { TrashBinIcon } from "@/icons";
import StockMovementService, {
  StockMovement,
  StockMovementPayload,
  StockMovementType,
} from "@/services/StockMovementService";
import LocationService, { Location } from "@/services/LocationService";
import PartService, { Part } from "@/services/PartService";
import DatePicker from "@/components/form/date-picker";

const inputClass =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:border-[#184F8F] focus:ring-2 focus:ring-[#184F8F]/10 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-300";
const dropdownClass =
  "absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-950";

type AutocompleteOption = {
  label?: string;
  value: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

function currentLocalDateTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function toLocalDateTimeValue(date: Date) {
  const nextDate = new Date(date);
  nextDate.setMinutes(nextDate.getMinutes() - nextDate.getTimezoneOffset());
  return nextDate.toISOString().slice(0, 16);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function buildQrPayload(item: StockMovement) {
  return JSON.stringify({
    id: item.id,
    location: item.location,
    part_name: item.part_name,
    part_number: item.part_number,
    quantity: item.quantity,
    timestamp: item.timestamp,
    type: "STOCK_IN",
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function printQrLabels(items: StockMovement[]) {
  if (!items.length) return;

  const labels = await Promise.all(
    items.map(async (item) => ({
      item,
      qrDataUrl: await QRCode.toDataURL(buildQrPayload(item), {
        color: {
          dark: "#111111",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
        margin: 1,
        width: 116,
      }),
    }))
  );
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Stock In QR Labels</title>
        <style>
          @page { size: A4; margin: 8mm; }
          * { box-sizing: border-box; }
          body { color: #222; font-family: Arial, Helvetica, sans-serif; margin: 0; }
          .sheet {
            display: grid;
            gap: 3mm;
            grid-template-columns: repeat(2, 1fr);
            width: 100%;
          }
          .label {
            align-items: center;
            border: 1px solid #333;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 23mm;
            min-height: 28mm;
            padding: 2.5mm 2.5mm 2.5mm 3.5mm;
            page-break-inside: avoid;
            width: 100%;
          }
          .title {
            font-size: 12.5pt;
            font-weight: 800;
            letter-spacing: 0;
            line-height: 1.1;
            margin: 0 0 2mm;
            overflow-wrap: anywhere;
          }
          .line {
            font-size: 8.5pt;
            line-height: 1.3;
            margin: 0;
            overflow-wrap: anywhere;
          }
          .line b { font-weight: 700; }
          .qr {
            height: 21mm;
            justify-self: end;
            width: 21mm;
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          ${labels
            .map(
              ({ item, qrDataUrl }) => `
                <div class="label">
                  <div>
                    <p class="title">${escapeHtml(item.part_name)}</p>
                    <p class="line"><b>Part Number / Lot:</b> ${escapeHtml(item.part_number)}</p>
                    <p class="line"><b>Location:</b> ${escapeHtml(item.location)}</p>
                  </div>
                  <img class="qr" src="${qrDataUrl}" alt="QR ${escapeHtml(item.part_number)}" />
                </div>
              `
            )
            .join("")}
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function AutocompleteInput({
  onChange,
  onSelect,
  options,
  placeholder,
  required,
  value,
}: {
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  options: AutocompleteOption[];
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const keyword = value.trim().toLowerCase();
  const visibleOptions = useMemo(() => {
    const filteredOptions = keyword
      ? options.filter((option) =>
          `${option.value} ${option.label ?? ""}`.toLowerCase().includes(keyword)
        )
      : options;

    return filteredOptions.slice(0, 8);
  }, [keyword, options]);

  function selectOption(optionValue: string) {
    onSelect?.(optionValue);
    onChange(optionValue);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <input
        className={inputClass}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        value={value}
      />
      {isOpen && visibleOptions.length > 0 ? (
        <div className={dropdownClass}>
          {visibleOptions.map((option) => (
            <button
              className="flex w-full flex-col px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-[#184F8F] dark:text-slate-200 dark:hover:bg-blue-500/10"
              key={`${option.value}-${option.label ?? ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option.value)}
              type="button"
            >
              <span className="truncate font-medium">{option.value}</span>
              {option.label ? (
                <span className="mt-0.5 truncate text-xs text-slate-400">{option.label}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function QrModal({
  item,
  onClose,
}: {
  item: StockMovement | null;
  onClose: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function generateQr() {
      if (!item) {
        setQrDataUrl("");
        return;
      }

      const dataUrl = await QRCode.toDataURL(buildQrPayload(item), {
        color: {
          dark: "#184F8F",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
        margin: 2,
        width: 280,
      });

      if (isMounted) {
        setQrDataUrl(dataUrl);
      }
    }

    void generateQr();

    return () => {
      isMounted = false;
    };
  }, [item]);

  const downloadQr = () => {
    if (!item || !qrDataUrl) {
      return;
    }

    const link = document.createElement("a");
    link.download = `QR-${item.part_number}-${item.id}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const printQr = () => {
    if (!item) {
      return;
    }

    void printQrLabels([item]);
  };

  return (
    <Modal isOpen={Boolean(item)} onClose={onClose} className="max-w-[440px] p-0">
      {item ? (
        <div className="overflow-hidden rounded-[inherit] bg-white dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 pr-16 dark:border-slate-800 dark:bg-slate-950/50">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#184F8F] dark:text-blue-300">Stock In QR</p>
            <h3 className="mt-2 break-words text-xl font-black leading-snug text-slate-950 dark:text-white">{item.part_number}</h3>
            <p className="mt-1 break-words text-sm font-medium text-slate-500 dark:text-slate-300">{item.part_name}</p>
          </div>

          <div className="px-6 py-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
              {qrDataUrl ? (
                <Image alt={`QR ${item.part_number}`} className="mx-auto size-[260px]" height={260} src={qrDataUrl} width={260} />
              ) : (
                <div className="py-28 text-sm text-slate-400">Generating QR...</div>
              )}
            </div>

            <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-700">
              <div className="flex items-start justify-between gap-4 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Location</span>
                <span className="break-words text-right font-bold text-slate-900 dark:text-white">{item.location}</span>
              </div>
              <div className="flex items-start justify-between gap-4 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Qty</span>
                <span className="font-bold text-slate-900 dark:text-white">{item.quantity.toLocaleString("en-US")}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="h-11 rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" onClick={downloadQr} type="button">
                Download
              </button>
              <button className="h-11 rounded-md bg-[#184F8F] px-4 text-sm font-bold text-white transition hover:bg-[#123D70]" onClick={printQr} type="button">
                Print
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

type StockMovementPageProps = {
  type: StockMovementType;
};

export default function StockMovementPage({ type }: StockMovementPageProps) {
  const title = type === "IN" ? "Stock In" : "Stock Out";
  const [items, setItems] = useState<StockMovement[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [qrItem, setQrItem] = useState<StockMovement | null>(null);
  const [selectedQrIds, setSelectedQrIds] = useState<number[]>([]);
  const [form, setForm] = useState<StockMovementPayload>({
    part_number: "",
    part_name: "",
    location: "",
    quantity: 1,
    customer_name: "",
    timestamp: currentLocalDateTime(),
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await StockMovementService.getMovements({
        limit: 50,
        page: 1,
        search,
        type,
      });
      setItems(result.data);
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : `Failed to load ${title}.` });
    } finally {
      setLoading(false);
    }
  }, [search, title, type]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSelectedQrIds((current) => current.filter((id) => items.some((item) => item.id === id)));
  }, [items]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMasterData() {
      try {
        const [partsResult, locationsResult] = await Promise.all([
          PartService.getParts({ limit: 100 }, { signal: controller.signal }),
          LocationService.getLocations({ limit: 100 }, { signal: controller.signal }),
        ]);

        setParts(partsResult.data);
        setLocations(locationsResult.data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    void loadMasterData();

    return () => controller.abort();
  }, []);

  const selectedQrItems = useMemo(
    () => items.filter((item) => selectedQrIds.includes(item.id)),
    [items, selectedQrIds]
  );
  const allQrItemsSelected = type === "IN" && items.length > 0 && selectedQrIds.length === items.length;
  const partNumberOptions = useMemo(
    () =>
      parts.map((part) => ({
        label: `${part.part_name} - ${part.location}`,
        value: part.part_number,
      })),
    [parts]
  );
  const partNameOptions = useMemo(
    () =>
      parts.map((part) => ({
        label: `${part.part_number} - ${part.location}`,
        value: part.part_name,
      })),
    [parts]
  );
  const locationOptions = useMemo(() => {
    const values = new Set<string>();

    locations.forEach((location) => {
      values.add(location.location_code);
    });
    parts.forEach((part) => {
      values.add(part.location);
    });

    return Array.from(values)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((location) => ({ value: location }));
  }, [locations, parts]);

  function applyPart(part: Part) {
    setForm((current) => ({
      ...current,
      location: part.location || current.location,
      part_name: part.part_name,
      part_number: part.part_number,
    }));
  }

  function changePartNumber(value: string) {
    const matchedPart = parts.find((part) => part.part_number.toLowerCase() === value.trim().toLowerCase());

    if (matchedPart) {
      applyPart(matchedPart);
      return;
    }

    setForm((current) => ({ ...current, part_number: value }));
  }

  function changePartName(value: string) {
    const matchedPart = parts.find((part) => part.part_name.toLowerCase() === value.trim().toLowerCase());

    if (matchedPart) {
      applyPart(matchedPart);
      return;
    }

    setForm((current) => ({ ...current, part_name: value }));
  }

  function toggleQrSelection(id: number) {
    setSelectedQrIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  }

  function toggleAllQrSelection() {
    setSelectedQrIds(allQrItemsSelected ? [] : items.map((item) => item.id));
  }

  function printSelectedQr() {
    if (!selectedQrItems.length) {
      setMessage({ kind: "error", text: "Select at least one stock in record to print QR." });
      return;
    }

    void printQrLabels(selectedQrItems);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const result = await StockMovementService.createMovement(type, form);
      setMessage({ kind: "ok", text: `${title} recorded successfully.` });
      if (type === "IN") {
        setQrItem(result.data);
      }
      setForm({
        part_number: "",
        part_name: "",
        location: "",
        quantity: 1,
        customer_name: "",
        timestamp: currentLocalDateTime(),
      });
      await load();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : `Failed to save ${title}.` });
    } finally {
      setSaving(false);
    }
  }

  async function deleteMovement(item: StockMovement) {
    const confirmed = window.confirm(
      type === "IN"
        ? `Delete stock in "${item.part_number}" at ${item.location}? If stock out already exists, delete will be rejected.`
        : `Delete stock out "${item.part_number}" at ${item.location}?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setMessage(null);
    try {
      await StockMovementService.deleteMovement(item.id);
      setSelectedQrIds((current) => current.filter((id) => id !== item.id));
      setMessage({ kind: "ok", text: `${title} deleted successfully.` });
      await load();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : `Failed to delete ${title}.` });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#184F8F]">Warehouse Operation</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Record part movement with Part / Lot Number, Part Name, Location, Quantity, and TimeStamp.
        </p>
      </div>

      {message ? (
        <div className={`rounded-md border px-4 py-3 text-sm font-medium ${message.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {message.text}
        </div>
      ) : null}

      <form className={`grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 md:grid-cols-2 ${type === "OUT" ? "xl:grid-cols-[1fr_1.2fr_1fr_1fr_120px_210px_auto]" : "xl:grid-cols-[1fr_1.2fr_1fr_120px_210px_auto]"}`} onSubmit={(event) => void submit(event)}>
        <AutocompleteInput onChange={changePartNumber} options={partNumberOptions} placeholder="Part / Lot Number" required value={form.part_number} />
        <AutocompleteInput onChange={changePartName} options={partNameOptions} placeholder="Part Name" required value={form.part_name} />
        <AutocompleteInput onChange={(value) => setForm((current) => ({ ...current, location: value }))} options={locationOptions} placeholder="Location" required value={form.location} />
        {type === "OUT" ? (
          <input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))} placeholder="Customer Name (optional)" value={form.customer_name ?? ""} />
        ) : null}
        <input className={inputClass} min={1} onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))} placeholder="Qty" required type="number" value={form.quantity} />
        <DatePicker
          key={form.timestamp}
          className="rounded-md border-slate-200 bg-white text-slate-800 placeholder:text-slate-500 focus:border-[#184F8F] focus:ring-2 focus:ring-[#184F8F]/10 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-50"
          dateFormat="Y-m-d H:i"
          defaultDate={form.timestamp}
          enableTime
          id={`${type.toLowerCase()}-timestamp`}
          onChange={([date]) => {
            if (date) {
              setForm((current) => ({ ...current, timestamp: toLocalDateTimeValue(date) }));
            }
          }}
          placeholder="TimeStamp"
          required
        />
        <button className="h-11 w-full rounded-md bg-[#184F8F] px-5 text-sm font-bold text-white transition hover:bg-[#123D70] disabled:bg-[#0F335C] disabled:opacity-80" disabled={saving} type="submit">
          {saving ? "Saving..." : "Save"}
        </button>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">{title} History</h2>
            <p className="mt-1 text-xs text-slate-400">Latest 50 records</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {type === "IN" ? (
              <button
                className="h-10 w-full min-w-[150px] whitespace-nowrap rounded-md border border-[#184F8F]/30 px-5 text-sm font-bold text-[#184F8F] transition hover:bg-[#184F8F]/5 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                disabled={!selectedQrItems.length}
                onClick={printSelectedQr}
                type="button"
              >
                Print Selected ({selectedQrItems.length})
              </button>
            ) : null}
            <input className={`${inputClass} md:max-w-sm`} onChange={(event) => setSearch(event.target.value)} placeholder="Search part or location" value={search} />
          </div>
        </div>
        <div className="space-y-3 p-4 md:hidden">
          {type === "IN" && items.length ? (
            <label className="flex h-10 items-center gap-3 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <input
                aria-label="Select all QR labels"
                checked={allQrItemsSelected}
                className="size-4 rounded border-slate-300 accent-[#184F8F]"
                onChange={toggleAllQrSelection}
                type="checkbox"
              />
              Select all QR labels
            </label>
          ) : null}
          {items.map((item) => (
            <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-black text-slate-900 dark:text-white">{item.part_number}</p>
                  <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">{item.part_name}</p>
                </div>
                {type === "IN" ? (
                  <input
                    aria-label={`Select QR ${item.part_number}`}
                    checked={selectedQrIds.includes(item.id)}
                    className="mt-1 size-4 shrink-0 rounded border-slate-300 accent-[#184F8F]"
                    onChange={() => toggleQrSelection(item.id)}
                    type="checkbox"
                  />
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-800">
                  <p className="font-bold uppercase text-slate-400">Location</p>
                  <p className="mt-1 break-words font-semibold text-slate-700 dark:text-slate-200">{item.location}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-2 text-right dark:bg-slate-800">
                  <p className="font-bold uppercase text-slate-400">Qty</p>
                  <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{item.quantity.toLocaleString("en-US")}</p>
                </div>
                {type === "OUT" ? (
                  <div className="col-span-2 rounded-md bg-slate-50 p-2 dark:bg-slate-800">
                    <p className="font-bold uppercase text-slate-400">Customer</p>
                    <p className="mt-1 break-words font-semibold text-slate-700 dark:text-slate-200">{item.customer_name || "-"}</p>
                  </div>
                ) : null}
                <div className="col-span-2 rounded-md bg-slate-50 p-2 dark:bg-slate-800">
                  <p className="font-bold uppercase text-slate-400">TimeStamp</p>
                  <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{formatDate(item.timestamp)}</p>
                </div>
              </div>
              <div className={`mt-3 grid gap-2 ${type === "IN" ? "grid-cols-2" : "grid-cols-1"}`}>
                {type === "IN" ? (
                  <button className="h-10 w-full rounded-md border border-[#184F8F]/20 text-xs font-bold text-[#184F8F] hover:bg-[#184F8F]/5" onClick={() => setQrItem(item)} type="button">
                    QR
                  </button>
                ) : null}
                <button
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-rose-200 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  disabled={deletingId === item.id}
                  onClick={() => void deleteMovement(item)}
                  type="button"
                >
                  <TrashBinIcon className="h-3.5 w-3.5 shrink-0 fill-current" />
                  {deletingId === item.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
          {!loading && !items.length ? <p className="py-8 text-center text-sm text-slate-400">No {title.toLowerCase()} records found.</p> : null}
          {loading ? <p className="py-8 text-center text-sm text-slate-400">Loading...</p> : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className={`w-full text-left text-sm ${type === "IN" ? "min-w-[1120px]" : "min-w-[940px]"}`}>
            <thead className="bg-[#184F8F] text-xs uppercase text-white">
              <tr>
                {type === "IN" ? (
                  <th className="rounded-tl-md px-5 py-3 text-center">
                    <input
                      aria-label="Select all QR labels"
                      checked={allQrItemsSelected}
                      className="size-4 rounded border-white/50 accent-white"
                      onChange={toggleAllQrSelection}
                      type="checkbox"
                    />
                  </th>
                ) : null}
                <th className={`${type === "OUT" ? "rounded-tl-md" : ""} px-5 py-3`}>Part / Lot Number</th>
                <th className="px-4 py-3">Part Name</th>
                <th className="px-4 py-3">Location</th>
                {type === "OUT" ? <th className="px-4 py-3">Customer Name</th> : null}
                <th className="px-4 py-3 text-right">Qty</th>
                <th className={`${type === "OUT" ? "rounded-tr-md" : ""} px-5 py-3`}>TimeStamp</th>
                {type === "IN" ? <th className="px-5 py-3 text-center">QR</th> : null}
                <th className="rounded-tr-md px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => (
                <tr key={item.id}>
                  {type === "IN" ? (
                    <td className="px-5 py-4 text-center">
                      <input
                        aria-label={`Select QR ${item.part_number}`}
                        checked={selectedQrIds.includes(item.id)}
                        className="size-4 rounded border-slate-300 accent-[#184F8F]"
                        onChange={() => toggleQrSelection(item.id)}
                        type="checkbox"
                      />
                    </td>
                  ) : null}
                  <td className="px-5 py-4 font-bold text-slate-800 dark:text-white">{item.part_number}</td>
                  <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{item.part_name}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{item.location}</td>
                  {type === "OUT" ? <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{item.customer_name || "-"}</td> : null}
                  <td className="px-4 py-4 text-right font-bold text-slate-800 dark:text-white">{item.quantity.toLocaleString("en-US")}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(item.timestamp)}</td>
                  {type === "IN" ? (
                    <td className="px-5 py-4 text-center">
                      <button className="rounded-md border border-[#184F8F]/20 px-3 py-1.5 text-xs font-bold text-[#184F8F] hover:bg-[#184F8F]/5" onClick={() => setQrItem(item)} type="button">
                        QR
                      </button>
                    </td>
                  ) : null}
                  <td className="px-5 py-4 text-center">
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-rose-200 p-0 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      disabled={deletingId === item.id}
                      onClick={() => void deleteMovement(item)}
                      title="Delete"
                      type="button"
                    >
                      <TrashBinIcon className="h-3.5 w-3.5 shrink-0 fill-current" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !items.length ? <p className="px-5 py-12 text-center text-sm text-slate-400">No {title.toLowerCase()} records found.</p> : null}
          {loading ? <p className="px-5 py-12 text-center text-sm text-slate-400">Loading...</p> : null}
        </div>
      </section>

      {type === "IN" ? <QrModal item={qrItem} onClose={() => setQrItem(null)} /> : null}
    </div>
  );
}
