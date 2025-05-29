import { NextResponse } from 'next/server';
import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from '@azure/storage-blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const imageContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME_FOR_IMAGES!;
const videoContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME_FOR_VIDEOS!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const blobName = searchParams.get('blobName');
  const type = searchParams.get('type') || 'image'; // default to image

  if (!blobName) {
    return NextResponse.json({ error: 'Blob name is required' }, { status: 400 });
  }

  try {

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    // Determine content type
    let contentType = 'image/jpeg';
    if (type === 'video') {
      if (blobName.endsWith('.mp4')) contentType = 'video/mp4';
      else if (blobName.endsWith('.webm')) contentType = 'video/webm';
      else if (blobName.endsWith('.ogg')) contentType = 'video/ogg';
    } else {
      if (blobName.endsWith('.png')) contentType = 'image/png';
      else if (blobName.endsWith('.gif')) contentType = 'image/gif';
      else if (blobName.endsWith('.webp')) contentType = 'image/webp';
      else if (blobName.endsWith('.svg')) contentType = 'image/svg+xml';
    }

    const containerName = type === 'video' ? videoContainerName : imageContainerName;

    const sasOptions = {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('cwr'), // Allow Create, Write, Read
      startsOn: new Date(Date.now() - 5 * 60 * 1000),
      expiresOn: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour for videos
      protocol: SASProtocol.Https,
      contentType,
      cacheControl: 'no-cache',
      contentDisposition: 'inline',
    };

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    const encodedBlobName = encodeURIComponent(blobName).replace(/'/g, "%27");
    const sasURL = `https://${accountName}.blob.core.windows.net/${containerName}/${encodedBlobName}?${sasToken}`;

    return NextResponse.json({
      sasURL,
      contentType,
      expiresOn: sasOptions.expiresOn.toISOString(),
    });
  } catch (error) {
    console.error('SAS generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate SAS URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
