import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

export interface MaintenanceRecord {
  id?: string;
  uid: string;
  vehicleId: string;
  vehicleName: string;
  service: string;
  cost: number;
  mileage: number;
  date: string;
  nextServiceMileage: number;
  notes: string;
}

const maintenanceCollection = collection(db, "maintenance");

type NewMaintenanceRecord = Omit<MaintenanceRecord, "id">;

export async function getMaintenanceRecords(
  uid: string
): Promise<MaintenanceRecord[]> {
  const q = query(
    maintenanceCollection,
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<MaintenanceRecord, "id">),
  }));
}

export async function addMaintenanceRecord(
  record: NewMaintenanceRecord
) {
  await addDoc(maintenanceCollection, {
    ...record,
    createdAt: serverTimestamp(),
  });
}

export async function updateMaintenanceRecord(
  id: string,
  record: Partial<MaintenanceRecord>
) {
  const ref = doc(db, "maintenance", id);
  const { id: _id, ...updates } = record;

  await updateDoc(ref, updates);
}

export async function deleteMaintenanceRecord(id: string) {
  const ref = doc(db, "maintenance", id);

  await deleteDoc(ref);
}