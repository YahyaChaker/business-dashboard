import fs from 'fs';
import path from 'path';

// Only import Microsoft Graph client libraries in production
let Client, TokenCredentialAuthenticationProvider, ClientSecretCredential;
if (process.env.NODE_ENV === 'production') {
  const graphSdk = require('@microsoft/microsoft-graph-client');
  Client = graphSdk.Client;
  TokenCredentialAuthenticationProvider = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials').TokenCredentialAuthenticationProvider;
  ClientSecretCredential = require('@azure/identity').ClientSecretCredential;
}

// Initialize Microsoft Graph client if in production
let graphClient;
if (process.env.NODE_ENV === 'production') {
  try {
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID,
      process.env.AZURE_CLIENT_ID,
      process.env.AZURE_CLIENT_SECRET
    );
    
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });
    
    graphClient = Client.initWithMiddleware({
      authProvider
    });
  } catch (error) {
    console.error('Failed to initialize Microsoft Graph client:', error);
  }
}

/**
 * Uploads a file to the appropriate storage based on environment
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - Name to save the file as
 * @param {string} folder - Folder path within storage
 * @returns {Promise<string>} - URL or path to the uploaded file
 */
export async function uploadFile(fileBuffer, fileName, folder = 'excel') {
  console.log(`Uploading file ${fileName} to ${folder} in ${process.env.NODE_ENV} environment`);
  
  if (process.env.NODE_ENV === 'production') {
    return uploadToOneDrive(fileBuffer, fileName, folder);
  } else {
    return uploadToLocal(fileBuffer, fileName, folder);
  }
}

/**
 * Uploads a file to OneDrive
 */
async function uploadToOneDrive(fileBuffer, fileName, folder) {
  // This function should only be called in production
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('uploadToOneDrive called in non-production environment');
  }

  try {
    // Check if the folder exists in OneDrive
    const oneDriveFolderPath = process.env.ONEDRIVE_FOLDER_PATH || '/business-dashboard';
    const folderPath = `${oneDriveFolderPath}/${folder}`;
    
    try {
      // Check if folder exists
      await graphClient
        .api(`/me/drive/root:${folderPath}`)
        .get();
    } catch (error) {
      // Folder doesn't exist, create it
      await graphClient
        .api('/me/drive/root/children')
        .post({
          name: folder,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        });
    }
    
    // Upload the file
    const uploadResponse = await graphClient
      .api(`/me/drive/root:${folderPath}/${fileName}:/content`)
      .put(fileBuffer);
      
    // Get a shared link to the file
    const shareResponse = await graphClient
      .api(`/me/drive/items/${uploadResponse.id}/createLink`)
      .post({
        type: 'view',
        scope: 'anonymous'
      });
      
    return shareResponse.link.webUrl;
  } catch (error) {
    console.error('OneDrive upload error:', error);
    throw error;
  }
}

/**
 * Uploads a file to local filesystem
 */
function uploadToLocal(fileBuffer, fileName, folder) {
  console.log('Uploading to local filesystem');
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const folderPath = path.join(publicDir, folder);
    
    // Ensure directory exists
    if (!fs.existsSync(folderPath)) {
      console.log(`Creating directory: ${folderPath}`);
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    const filePath = path.join(folderPath, fileName);
    console.log(`Writing file to: ${filePath}`);
    fs.writeFileSync(filePath, fileBuffer);
    
    // Return the path relative to public directory
    const relativePath = `/${folder}/${fileName}`;
    console.log(`File uploaded successfully, returning path: ${relativePath}`);
    return relativePath;
  } catch (error) {
    console.error('Local upload error:', error);
    throw error;
  }
}
