import { BlobServiceClient, BlockBlobClient, ContainerClient } from "@azure/storage-blob";

// Retrieve environment variables
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME_FOR_IMAGES!; // Container for images
const videoContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME_FOR_VIDEOS!; // Container for videos
const DeleteTranscodedVideoFormContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME_FOR_TRANSCODED_VIDEOS!; // Container for videos
// Ensure required environment variables are available
if (!connectionString || !containerName || !videoContainerName) {
  throw new Error(
    "Missing required Azure Storage configuration in environment variables."
  );
}

// Initialize the BlobServiceClient and ContainerClients
let blobServiceClient: BlobServiceClient;
let imageContainerClient: ContainerClient;
let videoContainerClient: ContainerClient;
let transcodedvideoContainerClient: ContainerClient;

try {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  imageContainerClient = blobServiceClient.getContainerClient(containerName);
  videoContainerClient = blobServiceClient.getContainerClient(videoContainerName);
 transcodedvideoContainerClient = blobServiceClient.getContainerClient(DeleteTranscodedVideoFormContainerName);
} catch (error) {
  console.error("Error initializing Azure Blob Service Client:", error);
  throw new Error("Failed to initialize Azure Blob service client.");
}

/**
 * Uploads a file to Azure Blob Storage.
 * @param fileBuffer - The file buffer to upload.
 * @param blobName - The name of the blob.
 * @param video - Whether the file is a video.
 * @param metadata - Optional metadata to attach to the blob.
 * @returns The name of the uploaded blob.
 */
export async function uploadToAzure(
  fileBuffer: Buffer,
  blobName: string,
  video: boolean,
  metadata?: { [propertyName: string]: string }
): Promise<string> {
  // Select the appropriate container based on the file type
  const selectedContainer = video ? videoContainerClient : imageContainerClient;
  const blockBlobClient: BlockBlobClient = selectedContainer.getBlockBlobClient(blobName);

  try {
    if (metadata) {
      await blockBlobClient.uploadData(fileBuffer, {
        metadata: metadata,
      });
    } else {
      await blockBlobClient.uploadData(fileBuffer);
    }
  } catch (error) {
    console.error("Error uploading file to Azure Blob:", error);
    throw new Error("Failed to upload file to Azure Blob.");
  }

  return blobName;
}

/**
 * Deletes a blob or multiple blobs from Azure Blob Storage.
 * @param blobNames - The name(s) of the blob(s) to delete.
 * @param isVideo - Whether the blob(s) are videos.
 */
export async function deleteBlob(blobNames: string | string[], isVideo: boolean) {
  try {
    // Select the appropriate container based on the file type
    const selectedContainer = isVideo ? transcodedvideoContainerClient : imageContainerClient;
    if (isVideo) {
      if (!Array.isArray(blobNames)) {
        throw new Error("For video deletion, blobNames should be an array of strings.");
      }

      // Delete multiple video blobs
      for (const name of blobNames) {
        const blobClient = selectedContainer.getBlockBlobClient(name);
        await blobClient.deleteIfExists();
      }
    } else {
      if (typeof blobNames !== "string") {
        throw new Error("For single blob deletion, blobNames should be a string.");
      }

      // Delete a single image blob
      const blobClient = selectedContainer.getBlockBlobClient(blobNames);
      await blobClient.deleteIfExists();
      }
  } catch (error) {
    console.error("Error deleting blob:", error);
    throw new Error("Failed to delete blob(s) from Azure Storage");
  }
}