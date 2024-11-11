import { db } from '../config';
import type { DocumentData, QueryConstraint } from 'firebase/firestore/lite';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore/lite';

export const firestoreClient = {
  async getDoc(path: string) {
    const docRef = doc(db, path);
    const snapshot = await getDoc(docRef);
    return snapshot.data();
  },

  async getDocs(collectionPath: string, ...queryConstraints: QueryConstraint[]) {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, ...queryConstraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addDoc(collectionPath: string, data: DocumentData) {
    const collectionRef = collection(db, collectionPath);
    const docRef = await addDoc(collectionRef, data);
    return docRef.id;
  },

  async updateDoc(path: string, data: Partial<DocumentData>) {
    const docRef = doc(db, path);
    await updateDoc(docRef, data);
  },

  async deleteDoc(path: string) {
    const docRef = doc(db, path);
    await deleteDoc(docRef);
  }
}; 