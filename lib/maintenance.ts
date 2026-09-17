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
  deleteField,
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

  return snapshot.docs
    .filter((doc) => doc.data().isUpcoming !== true)
    .map((doc) => ({
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

export type ServicePriority = 'Low' | 'Medium' | 'High';

export interface UpcomingServiceRecord {
  id?: string;
  uid: string;
  vehicleId: string;
  vehicleName: string;
  service: string;
  targetMileage?: number;
  targetDate?: string;
  priority: ServicePriority;
  notes?: string;
}

export async function getUpcomingServices(
  uid: string
): Promise<UpcomingServiceRecord[]> {
  // Querying the existing allowed 'maintenance' collection to avoid Firestore permission/index errors
  const q = query(maintenanceCollection, where("uid", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .filter((doc) => doc.data().isUpcoming === true)
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<UpcomingServiceRecord, "id">),
    }));
}

export async function addUpcomingService(
  record: Omit<UpcomingServiceRecord, "id">
) {
  const cleanRecord = Object.fromEntries(
    Object.entries(record).filter(([_, v]) => v !== undefined)
  );

  await addDoc(maintenanceCollection, {
    ...cleanRecord,
    isUpcoming: true,
    createdAt: serverTimestamp(),
  });
}

export async function updateUpcomingService(
  uid: string,
  id: string,
  record: Partial<UpcomingServiceRecord>
) {
  await assertMaintenanceRecordOwnership(uid, id);
  const ref = doc(db, "maintenance", id);
  const { id: _id, uid: _uid, ...updates } = record;

  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).map(([k, v]) => [k, v === undefined ? deleteField() : v])
  );

  await updateDoc(ref, cleanUpdates);
}

export async function deleteUpcomingService(uid: string, id: string) {
  await assertMaintenanceRecordOwnership(uid, id);
  const ref = doc(db, "maintenance", id);
  await deleteDoc(ref);
}

export async function convertUpcomingToCompleted(
  uid: string,
  id: string,
  completedRecord: Omit<MaintenanceRecord, "id">
) {
  await assertMaintenanceRecordOwnership(uid, id);
  const ref = doc(db, "maintenance", id);

  await updateDoc(ref, {
    ...completedRecord,
    isUpcoming: deleteField(),
    targetDate: deleteField(),
    targetMileage: deleteField(),
    priority: deleteField(),
  });
}
