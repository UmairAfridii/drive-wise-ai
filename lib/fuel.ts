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

export interface FuelEntry {
  id?: string;
  uid: string;
  vehicleId: string;
  vehicleName: string;
  liters: number;
  cost: number;
  odometer: number;
  date: string;
}

const fuelCollection = collection(db, "fuel");

type NewFuelEntry = Omit<FuelEntry, "id">;

export async function getFuelEntries(uid: string): Promise<FuelEntry[]> {
  const q = query(
    fuelCollection,
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<FuelEntry, "id">),
  }));
}

export async function addFuelEntry(entry: NewFuelEntry) {
  await addDoc(fuelCollection, {
    uid: entry.uid,
    vehicleId: entry.vehicleId,
    vehicleName: entry.vehicleName,
    liters: entry.liters,
    cost: entry.cost,
    odometer: entry.odometer,
    date: entry.date,
    createdAt: serverTimestamp(),
  });
}

export async function updateFuelEntry(
  id: string,
  entry: Partial<FuelEntry>
) {
  const ref = doc(db, "fuel", id);
  const { id: _id, ...updates } = entry;

  await updateDoc(ref, updates);
}

export async function deleteFuelEntry(id: string) {
  const ref = doc(db, "fuel", id);

  await deleteDoc(ref);
}
