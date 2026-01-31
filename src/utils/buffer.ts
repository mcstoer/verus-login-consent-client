import {BufferWriter, encodingLength} from 'verus-typescript-primitives';

interface BufferSerializable {
  toBuffer(): Buffer;
  getByteLength(): number;
}

/**
 * Serializes an array of objects with toBuffer() methods into a single Buffer.
 * Writes the array length followed by each item's buffer representation.
 *
 * @param items - Array of objects that implement toBuffer() and getByteLength()
 * @returns A Buffer containing the serialized data
 */
export function serializeToBuffer(items: BufferSerializable[]): Buffer {
  const length = getSerializedLength(items);
  const writer = new BufferWriter(Buffer.alloc(length));

  writer.writeCompactSize(items.length);

  for (const item of items) {
    writer.writeSlice(item.toBuffer());
  }

  return writer.buffer;
}

function getSerializedLength(items: BufferSerializable[]): number {
  let length = encodingLength(items.length);

  for (const item of items) {
    length += item.getByteLength();
  }

  return length;
}
