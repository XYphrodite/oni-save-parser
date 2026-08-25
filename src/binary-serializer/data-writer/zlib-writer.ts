import { deflate } from "pako";

import { DataWriter } from "./interfaces";

import { ArrayDataWriter } from "./array-writer";

import { toExactBuffer } from "../utils";

export class ZlibDataWriter extends ArrayDataWriter {
  getBytes(): ArrayBuffer {
    const bytes = super.getBytesView();
    return toExactBuffer(
      deflate(bytes, {
        windowBits: 15,
      })
    );
  }

  getBytesView(): Uint8Array {
    // Cannot make a nice efficient view here, since we deflate on-demand.
    return new Uint8Array(this.getBytes());
  }
}
