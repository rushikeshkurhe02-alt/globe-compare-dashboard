import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export interface SavedComparison {
  id: string;
  name: string;
  countries: string[];
  createdAt: Date | null;
}

/**
 * Fetches all saved comparisons for a user, sorted newest first.
 */
export async function fetchUserSavedComparisons(userId: string): Promise<SavedComparison[]> {
  const collectionPath = `users/${userId}/comparisons`;

  try {
    let snapshot;
    try {
      const q = query(collection(db, 'users', userId, 'comparisons'), orderBy('createdAt', 'desc'));
      snapshot = await getDocs(q);
    } catch (orderErr) {
      console.warn('Query with orderBy failed, falling back to unordered getDocs:', orderErr);
      snapshot = await getDocs(collection(db, 'users', userId, 'comparisons'));
    }

    const comparisons = snapshot.docs.map((d) => {
      const data = d.data();
      const rawCreatedAt = data.createdAt;
      let date: Date | null = null;
      if (rawCreatedAt instanceof Timestamp) {
        date = rawCreatedAt.toDate();
      } else if (rawCreatedAt && typeof rawCreatedAt.toDate === 'function') {
        date = rawCreatedAt.toDate();
      } else if (rawCreatedAt && typeof rawCreatedAt === 'string') {
        date = new Date(rawCreatedAt);
      }

      return {
        id: d.id,
        name: data.name || 'Untitled Comparison',
        countries: Array.isArray(data.countries) ? data.countries : [],
        createdAt: date,
      };
    });

    // Ensure newest first sorting in memory
    return comparisons.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

/**
 * Saves a new country comparison for the authenticated user.
 */
export async function createSavedComparison(
  userId: string,
  name: string,
  countries: string[]
): Promise<string> {
  const collectionPath = `users/${userId}/comparisons`;

  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'comparisons'), {
      name: name.trim(),
      countries,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
  }
}

/**
 * Deletes a saved comparison.
 */
export async function deleteSavedComparison(userId: string, comparisonId: string): Promise<void> {
  const docPath = `users/${userId}/comparisons/${comparisonId}`;

  try {
    await deleteDoc(doc(db, 'users', userId, 'comparisons', comparisonId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
