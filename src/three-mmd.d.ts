declare module "three/examples/jsm/loaders/MMDLoader.js" {
  import { Loader } from "three";

  export class MMDLoader extends Loader {
    load(
      url: string,
      onLoad?: (data: unknown) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (err: unknown) => void,
    ): void;
  }
}
