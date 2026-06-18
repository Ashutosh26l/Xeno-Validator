// src/services/storageService.js
// Supabase Storage helpers — upload buffers and generate signed download URLs.
// Per spec §15.

import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";

const BUCKET = env.supabaseStorageBucket;

/**
 * Upload a file buffer to Supabase Storage.
 *
 * @param {string} storagePath — path within the bucket, e.g. "uploads/<id>/clean.csv"
 * @param {Buffer} buffer
 * @param {string} contentType — MIME type, e.g. "text/csv"
 * @returns {string} the storagePath on success
 */
export async function uploadFile(storagePath, buffer, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

/**
 * Generate a signed URL valid for 1 hour.
 *
 * @param {string} storagePath
 * @returns {string} signed URL
 */
export async function getSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600); // 60 minutes

  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

/**
 * Download a file from Supabase Storage and return as Buffer.
 *
 * @param {string} storagePath
 * @returns {Buffer}
 */
export async function downloadFile(storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(storagePath);

  if (error) throw new Error(`Storage download failed: ${error.message}`);

  // data is a Blob in some environments, convert to Buffer
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
