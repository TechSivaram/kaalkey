declare module "jpeg-js" {
  interface DecodeOptions {
    useTArray?: boolean;
    formatAsRGBA?: boolean;
    tolerantDecoding?: boolean;
    maxResolutionInMP?: number;
    maxMemoryUsageInMB?: number;
  }
  interface DecodedImage {
    width: number;
    height: number;
    data: Uint8Array;
  }
  const jpeg: { decode(data: Uint8Array, options?: DecodeOptions): DecodedImage };
  export default jpeg;
}
