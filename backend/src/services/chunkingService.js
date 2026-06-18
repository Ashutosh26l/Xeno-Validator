// src/services/chunkingService.js
// Intelligent balanced chunking per spec §10.
// Avoids tiny last chunks by distributing remainder evenly.

import { env } from "../config/env.js";

/**
 * Splits rows into balanced chunks if they exceed CHUNK_SIZE.
 *
 * @param {object[]} rows — array of row objects
 * @returns {object[][]|null} — array of chunk arrays, or null if no chunking needed
 */
export function chunkRows(rows) {
  const total = rows.length;
  const chunkSize = env.chunkSize;

  if (total <= chunkSize) {
    return null; // no chunking needed
  }

  // Intelligent balancing: no tiny last chunk
  // Example: 10001 rows → 2 chunks of 5001 + 5000 (NOT 10000 + 1)
  const chunkCount = Math.ceil(total / chunkSize);
  const baseSize   = Math.floor(total / chunkCount);
  const remainder  = total % chunkCount;

  const chunks = [];
  let start = 0;

  for (let i = 0; i < chunkCount; i++) {
    // Distribute remainder rows one-by-one across first N chunks
    const size = baseSize + (i < remainder ? 1 : 0);
    chunks.push(rows.slice(start, start + size));
    start += size;
  }

  return chunks;
}
