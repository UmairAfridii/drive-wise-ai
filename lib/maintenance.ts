import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
  const q = query(maintenanceCollection, where("uid", "==", uid));

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

async function assertMaintenanceRecordOwnership(uid: string, id: string) {
  const snapshot = await getDoc(doc(db, "maintenance", id));

  if (!snapshot.exists() || snapshot.data().uid !== uid) {
    throw new Error("Maintenance record not found.");
  }
}

export async function updateMaintenanceRecord(
  uid: string,
  id: string,
  record: Partial<MaintenanceRecord>
) {
  await assertMaintenanceRecordOwnership(uid, id);
  const ref = doc(db, "maintenance", id);
  const { id: _id, uid: _uid, ...updates } = record;

  await updateDoc(ref, updates);
}

export async function deleteMaintenanceRecord(uid: string, id: string) {
  await assertMaintenanceRecordOwnership(uid, id);
  const ref = doc(db, "maintenance", id);

  await deleteDoc(ref);
}
