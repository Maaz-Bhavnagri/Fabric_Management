import { google } from 'googleapis';
import { Readable } from 'stream';

// Ensure you replace these with your actual environment variables in production
// 'drive.file' only allows access to files the service account created.
// 'drive' is needed to write into folders shared by a real Google account.
const SCOPES = ['https://www.googleapis.com/auth/drive'];

/**
 * Extracts the folder ID from either a full Google Drive URL or a raw ID.
 * e.g. "https://drive.google.com/drive/u/1/folders/1IaBRNQ..." → "1IaBRNQ..."
 */
function extractFolderId(input: string): string {
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : input.trim()
}

export const getDriveService = () => {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh_token = process.env.GOOGLE_REFRESH_TOKEN;

  if (!client_id || !client_secret || !refresh_token) {
    throw new Error('Google Drive OAuth2 credentials (ID, Secret, or Refresh Token) are missing.');
  }

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/api/auth/google/callback'
  );

  oauth2Client.setCredentials({ refresh_token });

  return google.drive({ version: 'v3', auth: oauth2Client });
};

/**
 * Checks if a folder exists and gets its ID, otherwise creates it.
 */
export const getOrCreateFolder = async (folderName: string, parentFolderId?: string): Promise<string> => {
  const drive = getDriveService();
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  } else if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    query += ` and '${extractFolderId(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID)}' in parents`;
  }

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  // Create folder
  const fileMetadata: Record<string, unknown> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId];
  } else if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    fileMetadata.parents = [extractFolderId(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID)];
  }

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  return folder.data.id!;
};

/**
 * Uploads an image, smartly increments slug if duplicate exists.
 */
export const uploadImage = async (
  buffer: Buffer,
  mimeType: string,
  baseSlug: string, // e.g., 'cottonfloralblue_img'
  targetFolderName: 'Products' | 'Orders' | 'Customers' | 'Complaints' | 'Bills'
) => {
  const drive = getDriveService();
  
  // GOOGLE_DRIVE_ROOT_FOLDER_ID = your FabricStore folder ID (shared with service account)
  // Subfolders like Products, Customers, etc. are created inside it automatically.
  let folderId: string;
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
    ? extractFolderId(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID)
    : undefined;
  if (rootFolderId) {
    // Root is already known — just find/create the subfolder inside it
    folderId = await getOrCreateFolder(targetFolderName, rootFolderId);
  } else {
    // No env var set — create FabricStore root (only works if service account has Drive quota)
    const rootId = await getOrCreateFolder('FabricStore');
    folderId = await getOrCreateFolder(targetFolderName, rootId);
  }

  // Smart checking for next available integer (e.g., _001, _002)
  const existingFiles = await drive.files.list({
    q: `'${folderId}' in parents and name contains '${baseSlug}' and trashed=false`,
    fields: 'files(name)',
  });

  let nextIndex = 1;
  const existingNames = existingFiles.data.files?.map(f => f.name) || [];
  
  while (true) {
    const suffix = String(nextIndex).padStart(3, '0');
    const tentativeName = `${baseSlug}_${suffix}.jpg`; // Fixed to jpg for images
    if (!existingNames.includes(tentativeName)) {
      break;
    }
    nextIndex++;
  }

  const finalName = `${baseSlug}_${String(nextIndex).padStart(3, '0')}.jpg`;

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const fileMetadata = {
    name: finalName,
    parents: [folderId],
  };

  const media = {
    mimeType,
    body: stream,
  };

  const uploadResult = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
  });

  // Make the file publicly accessible
  if (uploadResult.data.id) {
    await drive.permissions.create({
      fileId: uploadResult.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  }

  return {
    fileId: uploadResult.data.id,
    webViewLink: uploadResult.data.webViewLink,
    webContentLink: uploadResult.data.webContentLink,
  };
};
