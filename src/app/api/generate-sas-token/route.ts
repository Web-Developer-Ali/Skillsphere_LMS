import { NextResponse } from 'next/server';
import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol
} from '@azure/storage-blob';

// Retrieve environment variables
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME_FOR_IMAGES!;

// Ensure required environment variables are available
if (!accountName || !accountKey || !containerName) {
  throw new Error('Missing required Azure Storage configuration in environment variables.');
}

// Handle GET requests
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const blobName = searchParams.get('blobName');

  // Validate the blobName parameter
  if (!blobName) {
    return NextResponse.json(
      { error: 'Blob name is required.' },
      { status: 400 }
    );
  }

  try {
    // Create a shared key credential using the account name and key
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    // Define the SAS token parameters
    const permissions = BlobSASPermissions.parse('r'); // Read permission
    const startsOn = new Date(new Date().getTime() - 5 * 60 * 1000); // Start 5 minutes earlier to account for clock skew
    const expiresOn = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hour from now

    const sasOptions = {
      containerName,
      blobName,
      permissions,
      startsOn,
      expiresOn,
      protocol: SASProtocol.Https,
      version: '2022-11-02', // Specify the service version
      resource: 'b' // 'b' for blob
    };

    // Generate the SAS token
    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();

    // Construct the SAS URL
    const sasURL = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
        // Return the SAS URL in the response
    return NextResponse.json({ sasURL });
  } catch (error) {
    console.error('Error generating SAS URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate SAS URL.' },
      { status: 500 }
    );
  }
}
