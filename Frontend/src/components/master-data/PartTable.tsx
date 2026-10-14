"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CreateButton from "@/components/common/CreateButton";
import DataTable, { DataTableColumn } from "@/components/common/DataTable";
import { useParts } from "@/hooks/useParts";
import PartService, { Part } from "@/services/PartService";
import { useToast } from "@/context/ToastContext";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { ConfirmModal } from "@/components/ui/modal";
import PartModal from "./PartModal";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return dateFormatter.format(date);
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const baseColumns: DataTableColumn<Part>[] = [
  {
    key: "part_number",
    header: "Part / Lot Number",
    sortable: true,
  },
  {
    key: "part_name",
    header: "Part Name",
    sortable: true,
  },
  {
    key: "location",
    header: "Location",
    sortable: true,
  },
  {
    key: "timestamp",
    header: "TimeStamp",
    render: (value) => (typeof value === "string" ? formatDate(value) : "-"),
  },
];

export default function PartTable() {
  const toast = useToast();
  const lastErrorRef = useRef<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data,
    error,
    isLoading,
    pagination,
    query,
    refetch,
    setLimit,
    setPage,
    setSearch,
  } = useParts({
    limit: 10,
    page: 1,
  });

  useEffect(() => {
    if (!error || lastErrorRef.current === error) {
      return;
    }

    lastErrorRef.current = error;
    toast.error({
      message: error,
      title: "Failed to load parts",
    });
  }, [error, toast]);

  const handleCreate = () => {
    setSelectedPart(null);
    setIsModalOpen(true);
  };

  const handleUpdate = useCallback((part: Part) => {
    setSelectedPart(part);
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((part: Part) => {
    setPartToDelete(part);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
    }
  };

  const confirmDelete = async () => {
    if (!partToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await PartService.deletePart(partToDelete.id);
      toast.success({
        title: "Success",
        message: "Part deleted successfully",
      });
      refetch();
      setIsDeleteModalOpen(false);
      setPartToDelete(null);
    } catch (error: unknown) {
      toast.error({
        title: "Error",
        message: getErrorMessage(error, "Failed to delete part"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<DataTableColumn<Part>[]>(
    () => [
      ...baseColumns,
      {
        key: "action",
        header: "Action",
        align: "center",
        render: (_, row) => (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleUpdate(row)}
              className="inline-flex items-center justify-center rounded-md p-1 text-orange-500 transition-colors hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
              title="Edit"
              type="button"
            >
              <PencilIcon className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={() => handleDeleteClick(row)}
              className="inline-flex items-center justify-center rounded-md p-1 text-rose-500 transition-colors hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
              title="Delete"
              type="button"
            >
              <TrashBinIcon className="h-4 w-4 fill-current" />
            </button>
          </div>
        ),
      },
    ],
    [handleDeleteClick, handleUpdate]
  );

  return (
    <>
      <DataTable
        actions={
          <div className="flex items-center gap-3">
            <CreateButton onClick={handleCreate} />
          </div>
        }
        columns={columns}
        data={data}
        emptyMessage="No parts found"
        error={error}
        isLoading={isLoading}
        minWidth="760px"
        onLimitChange={setLimit}
        onPageChange={setPage}
        onSearchChange={setSearch}
        pagination={pagination}
        rowKey="id"
        searchPlaceholder="Search part / lot number, name, or location"
        searchValue={query.search}
      />

      <PartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
        part={selectedPart}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Part"
        message={`Are you sure you want to delete part "${partToDelete?.part_name}"?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
}
