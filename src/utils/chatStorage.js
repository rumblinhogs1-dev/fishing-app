import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export async function uploadChatImage(groupId, messageId, imageDataUrl) {
  if (!imageDataUrl || !imageDataUrl.startsWith('data:')) return null;
  const storageRef = ref(storage, `chats/${groupId}/${messageId}/photo.jpg`);
  const snapshot = await uploadString(storageRef, imageDataUrl, 'data_url');
  return getDownloadURL(snapshot.ref);
}
