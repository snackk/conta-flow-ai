import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase.js';

const MAX_SIZE_BYTES = 8 * 1024 * 1024;

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-80);
}

/**
 * Uploads an image to Storage under task-uploads/{ownerUid}/ and returns its
 * public download URL, ready to be embedded as Markdown (`![alt](url)`).
 */
export async function uploadTaskImage(file, ownerUid) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Só é possível enviar imagens.');
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('A imagem não pode exceder 8MB.');
  }

  const path = `task-uploads/${ownerUid}/${Date.now()}-${sanitizeFileName(file.name || 'imagem')}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
