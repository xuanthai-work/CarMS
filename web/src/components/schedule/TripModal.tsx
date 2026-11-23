"use client";

import { useState } from "react";
import Modal from "@/components/common/Modal";
import TripForm from "@/components/schedule/TripForm";
import type { Trip, Vehicle, Driver } from "@/types";

type Prefill = { vehicleId?: string; date?: string };

type Props = {
  trip: Trip | null;
  prefill?: Prefill;
  vehicles: Vehicle[];
  drivers: Driver[];
  onClose: () => void;
};

export default function TripModal({ trip, prefill, vehicles, drivers, onClose }: Props) {
  const [footer, setFooter] = useState<React.ReactNode>(null);

  return (
    <Modal
      title={trip ? "Chuyến" : "Thêm chuyến"}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      fixedHeight
      footer={footer}
    >
      <TripForm
        trip={trip ?? undefined}
        prefill={prefill}
        vehicles={vehicles}
        drivers={drivers}
        onDone={onClose}
        renderFooter={setFooter}
      />
    </Modal>
  );
}
