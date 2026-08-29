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

export interface Vehicle {
  id?: string;
  uid: string;
  name: string;
  make: string;
  model: string;
  year?: number | "Year not set";
  plate: string;
  fuelType: "Petrol" | "Diesel" | "Hybrid" | "Electric";
  mileage: number;
  health?: number;
  efficiency?: string;
  status?: "Excellent" | "Good" | "Needs Service" | "Attention" | "Not assessed";
  color?: string;
  nextService?: string;
}

const vehiclesCollection = collection(db, "vehicles");

export async function getVehicles(uid: string): Promise<Vehicle[]> {
  const q = query(
    vehiclesCollection,
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<Vehicle, "id"> & { year?: unknown };
    const parsedYear = typeof data.year === "number" ? data.year : Number(data.year);

    return {
      id: doc.id,
      ...data,
      year: Number.isInteger(parsedYear) && parsedYear >= 1886 ? parsedYear : "Year not set",
    };
  });
}

export async function addVehicle(vehicle: Vehicle) {
  await addDoc(vehiclesCollection, {
    ...vehicle,
    createdAt: serverTimestamp(),
  });
}

async function assertVehicleOwnership(uid: string, id: string) {
  const snapshot = await getDoc(doc(db, "vehicles", id));

  if (!snapshot.exists() || snapshot.data().uid !== uid) {
    throw new Error("Vehicle not found.");
  }
}

export async function updateVehicle(
  uid: string,
  id: string,
  vehicle: Partial<Vehicle>
) {
  await assertVehicleOwnership(uid, id);
  const ref = doc(db, "vehicles", id);
  const { uid: _uid, id: _id, ...updates } = vehicle;

  await updateDoc(ref, updates);
}

export async function deleteVehicle(uid: string, id: string) {
  await assertVehicleOwnership(uid, id);
  const ref = doc(db, "vehicles", id);

  await deleteDoc(ref);
}
