import { NextResponse } from 'next/server';
import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol
} from '@azure/storage-blob';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const imageContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME_FOR_IMAGES!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const blobName = searchParams.get('blobName');
  if (!blobName) {
    return NextResponse.json(
      { error: 'Blob name is required' },
      { status: 400 }
    );
  }

  try {
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    // Determine content type based on file extension
    let contentType = 'image/jpeg'; // Default for .jpg/.jpeg
    if (blobName.endsWith('.png')) {
      contentType = 'image/png';
    } else if (blobName.endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (blobName.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (blobName.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    }

    const sasOptions = {
      containerName: imageContainerName,
      blobName: blobName,
      permissions: BlobSASPermissions.parse('r'), // Read-only permission
      startsOn: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now (longer expiry for images)
      protocol: SASProtocol.Https,
      contentType,
      cacheControl: 'public, max-age=86400', // Cache for 24 hours
      contentDisposition: 'inline',
      headers: {
        'x-ms-blob-content-type': contentType,
        'Access-Control-Allow-Origin': '*'
      }
    };

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    const encodedBlobName = encodeURIComponent(blobName).replace(/'/g, "%27");
    const sasURL = `https://${accountName}.blob.core.windows.net/${imageContainerName}/${encodedBlobName}?${sasToken}`;

    return NextResponse.json({ 
      sasURL,
      contentType,
      expiresOn: sasOptions.expiresOn.toISOString() 
    });
  } catch (error) {
    console.error('SAS generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SAS URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}