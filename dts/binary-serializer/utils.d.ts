/**
 * Take the exact bytes of a view as a standalone ArrayBuffer.
 *
 * pako may return a subarray of a larger chunk buffer, so reading `.buffer`
 * off its result can hand back trailing bytes that were never part of the
 * stream. Always go through here instead.
 */
export declare function toExactBuffer(view: Uint8Array): ArrayBuffer;
