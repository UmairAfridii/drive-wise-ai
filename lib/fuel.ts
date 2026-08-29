import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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

async function assertFuelEntryOwnership(uid: string, id: string) {
  const snapshot = await getDoc(doc(db, "fuel", id));

  if (!snapshot.exists() || snapshot.data().uid !== uid) {
    throw new Error("Fuel log not found.");
  }
}

export async function updateFuelEntry(
  uid: string,
  id: string,
  entry: Partial<FuelEntry>
) {
  await assertFuelEntryOwnership(uid, id);
  const ref = doc(db, "fuel", id);
  const { id: _id, uid: _uid, ...updates } = entry;

  await updateDoc(ref, updates);
}

export async function deleteFuelEntry(uid: string, id: string) {
  await assertFuelEntryOwnership(uid, id);
  const ref = doc(db, "fuel", id);

  await deleteDoc(ref);
}
