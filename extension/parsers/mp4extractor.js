// parsers/mp4extractor.js
// Minimal ISO-BMFF (fragmented MP4) box walker. We don't need a full parser -
// just enough to find a top-level box by fourcc and return its payload bytes.
// For Elisa's DASH segments, 'mdat' sits as a sibling of 'moof' at the top
// level (not nested), so a single-pass linear scan is sufficient.

const USubMp4Extractor = {
  findBox(buffer, fourcc) {
    const view = new DataView(buffer);
    let offset = 0;

    while (offset + 8 <= buffer.byteLength) {
      let size = view.getUint32(offset);
      const type = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7)
      );

      let headerSize = 8;

      if (size === 1) {
        // 64-bit extended size in the next 8 bytes
        const high = view.getUint32(offset + 8);
        const low = view.getUint32(offset + 12);
        size = high * 4294967296 + low;
        headerSize = 16;
      } else if (size === 0) {
        // Box extends to the end of the buffer
        size = buffer.byteLength - offset;
      }

      if (size < headerSize) break; // malformed box, bail out safely

      if (type === fourcc) {
        return buffer.slice(offset + headerSize, offset + size);
      }

      offset += size;
    }

    return null; // not found (e.g. init segment has no mdat)
  }
};
