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

export interface Vehicle {
  id?: string;
  uid: string;
  name: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  fuelType: "Petrol" | "Diesel" | "Hybrid" | "Electric";
  mileage: number;
  health: number;
  efficiency: string;
  status: "Excellent" | "Good" | "Needs Service" | "Attention";
  color: string;
  nextService: string;
}

const vehiclesCollection = collection(db, "vehicles");

export async function getVehicles(uid: string): Promise<Vehicle[]> {
  const q = query(
    vehiclesCollection,
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Vehicle, "id">),
  }));
}

export async function addVehicle(vehicle: Vehicle) {
  await addDoc(vehiclesCollection, {
    ...vehicle,
    createdAt: serverTimestamp(),
  });
}

export async function updateVehicle(
  id: string,
  vehicle: Partial<Vehicle>
) {
  const ref = doc(db, "vehicles", id);

  await updateDoc(ref, vehicle);
}

export async function deleteVehicle(id: string) {
  const ref = doc(db, "vehicles", id);

  await deleteDoc(ref);
}