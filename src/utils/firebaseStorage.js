import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export async function uploadCatchImage(userId, catchId, imageDataUrl) {
  if (!imageDataUrl || !imageDataUrl.startsWith('data:')) return null;
  const storageRef = ref(storage, `users/${userId}/catches/${catchId}/photo.jpg`);
  const snapshot = await uploadString(storageRef, imageDataUrl, 'data_url');
  return getDownloadURL(snapshot.ref);
}

export async function deleteCatchImage(userId, catchId) {
  const storageRef = ref(storage, `users/${userId}/catches/${catchId}/photo.jpg`);
  try {
    await deleteObject(storageRef);
  } catch (err) {
    if (err.code !== 'storage/object-not-found') throw err;
  }
}
