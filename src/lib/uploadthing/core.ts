import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const f = createUploadthing();

// FileRouter for your app - customize file types and sizes here
export const ourFileRouter = {
  // Media uploader for video/audio files - 512MB max
  mediaUploader: f({
    video: { maxFileSize: '512MB', maxFileCount: 1 },
    audio: { maxFileSize: '512MB', maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // Verify authentication
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Unauthorized');
      }

      // Return metadata to be stored with the file
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for user:', metadata.userId);
      console.log('File URL:', file.ufsUrl);

      // Return the file info to client
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        key: file.key,
        name: file.name,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
