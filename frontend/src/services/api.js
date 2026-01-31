import { Account, Databases, Storage, ID, Query } from 'react-native-appwrite';
import { client, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from '../lib/appwrite';
import * as FileSystem from 'expo-file-system/legacy';

const APPWRITE_DATABASE_ID = '696f686b002b4e939f6e';
const APPWRITE_DOCUMENTS_COLLECTION_ID = 'documents';
const APPWRITE_BUCKET_ID = '696f68c300002c339409';

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const STATIC_CATEGORIES = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'appliances', name: 'Appliances' },
  { id: 'furniture', name: 'Furniture' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'documents', name: 'Documents' },
];

export const pingAppwrite = async () => {
  try {
    const res = await fetch(`${APPWRITE_ENDPOINT}/ping`, {
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error) {
    throw new Error('Connection failed');
  }
};

const mapDocument = (doc) => ({
  id: doc.$id,
  title: doc.title,
  categoryId: doc.categoryId,
  categoryName:
    STATIC_CATEGORIES.find((c) => c.id === doc.categoryId)?.name || 'Uncategorized',
  store: doc.store,
  uploadDate: doc.uploadDate || doc.$createdAt,
  expirationDate: doc.expirationDate,
  notes: doc.notes,
  imageUrl: doc.imageUrl || null,
});

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return imagePath;
};

const uploadImageIfNeeded = async (imageAsset) => {
  if (!imageAsset) return null;

  const fileName = imageAsset.fileName || imageAsset.filename || 'document.jpg';
  const mimeType = imageAsset.mimeType || imageAsset.type || 'image/jpeg';

  const info = await FileSystem.getInfoAsync(imageAsset.uri, { size: true });
  const size = info?.size ?? 0;

  const file = {
    uri: imageAsset.uri,
    name: fileName,
    type: mimeType,
    size,
  };

  const uploaded = await storage.createFile(
    APPWRITE_BUCKET_ID,
    ID.unique(),
    file
  );

  const imageUrl = `${client.config.endpoint}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${uploaded.$id}/view?project=${client.config.project}`;

  return { fileId: uploaded.$id, imageUrl };
};

export const authAPI = {
  register: async ({ name, email, password }) => {
    try {
      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('rate limit')) {
        await new Promise((r) => setTimeout(r, 1500));
        await account.createEmailPasswordSession(email, password);
      } else if (msg.includes('session is active')) {

      } else {
        throw err;
      }
    }

    return {
      data: {
        token: 'appwrite-session',
      },
    };
  },

  login: async ({ email, password }) => {
    try {
      await account.createEmailPasswordSession(email, password);
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('rate limit')) {
        await new Promise((r) => setTimeout(r, 1500));
        await account.createEmailPasswordSession(email, password);
      } else if (msg.includes('session is active')) {
      } else {
        throw err;
      }
    }

    return {
      data: {
        token: 'appwrite-session',
      },
    };
  },

  getMe: async () => {
    const me = await account.get();
    return {
      data: {
        user: {
          id: me.$id,
          name: me.name,
          email: me.email,
          registrationDate: me.$createdAt,
        },
      },
    };
  },
};

export const documentsAPI = {
  getAll: async () => {
    const user = await account.get();
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_DOCUMENTS_COLLECTION_ID,
      [
        Query.equal('userId', user.$id),
        Query.orderDesc('$createdAt')
      ]
    );

    return {
      data: {
        documents: res.documents.map(mapDocument),
      },
    };
  },

  getById: async (id) => {
    const user = await account.get();
    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_DOCUMENTS_COLLECTION_ID,
      id
    );

    if (doc.userId !== user.$id) {
      throw new Error('Access denied');
    }

    return {
      data: {
        document: mapDocument(doc),
      },
    };
  },

  create: async (data) => {
    const user = await account.get();
    let imageMeta = null;
    if (data.image) {
      imageMeta = await uploadImageIfNeeded(data.image);
    }

    const created = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_DOCUMENTS_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        title: data.title,
        categoryId: data.categoryId,
        store: data.store || '',
        expirationDate: data.expirationDate || '',
        notes: data.notes || '',
        imageUrl: imageMeta?.imageUrl || '',
        imageFileId: imageMeta?.fileId || '',
      }
    );

    return {
      data: {
        document: mapDocument(created),
      },
    };
  },

  update: async (id, data) => {
    const user = await account.get();
    const existingDoc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_DOCUMENTS_COLLECTION_ID,
      id
    );

    if (existingDoc.userId !== user.$id) {
      throw new Error('Access denied');
    }

    let imageFields = {};

    if (data.imageChanged) {
      if (data.image) {
        const imageMeta = await uploadImageIfNeeded(data.image);
        imageFields = {
          imageUrl: imageMeta?.imageUrl || '',
          imageFileId: imageMeta?.fileId || '',
        };
      } else if (data.deleteImage) {
        imageFields = {
          imageUrl: '',
          imageFileId: '',
        };
      }
    }

    const updated = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_DOCUMENTS_COLLECTION_ID,
      id,
      {
        title: data.title,
        categoryId: data.categoryId,
        store: data.store || '',
        expirationDate: data.expirationDate || '',
        notes: data.notes || '',
        ...imageFields,
      }
    );

    return {
      data: {
        document: mapDocument(updated),
      },
    };
  },

  delete: async (id) => {
    const user = await account.get();
    const existingDoc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_DOCUMENTS_COLLECTION_ID,
      id
    );

    if (existingDoc.userId !== user.$id) {
      throw new Error('Access denied');
    }

    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_DOCUMENTS_COLLECTION_ID,
      id
    );
    return { data: { success: true } };
  },

  download: async () => {
    return { data: { message: 'Use imageUrl to open/download the file.' } };
  },
};

export const categoriesAPI = {
  getAll: async () => {
    return Promise.resolve({
      data: {
        categories: STATIC_CATEGORIES,
      },
    });
  },
};

export const userAPI = {
  getProfile: async () => {
    const me = await account.get();
    return {
      data: {
        user: {
          id: me.$id,
          name: me.name,
          email: me.email,
          registrationDate: me.$createdAt,
        },
      },
    };
  },

  updateProfile: async ({ name, email }) => {
    await account.updateName(name);
    const me = await account.get();
    return {
      data: {
        user: {
          id: me.$id,
          name,
          email: me.email,
          registrationDate: me.$createdAt,
        },
      },
    };
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    await account.updatePassword(newPassword, currentPassword);
    return { data: { success: true } };
  },
};

export const notificationsAPI = {
  getAll: async () => ({
    data: {
      notifications: [],
    },
  }),
  markAsRead: async () => ({ data: { success: true } }),
  markAllAsRead: async () => ({ data: { success: true } }),
  delete: async () => ({ data: { success: true } }),
};

export default {
  client,
  account,
  databases,
  storage,
};
