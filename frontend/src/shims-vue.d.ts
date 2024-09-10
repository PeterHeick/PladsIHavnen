/// <reference types="@types/google.maps" />

/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '../package.json' {
  export interface PackageJson {
    version: string;
    // Tilføj andre felter fra package.json, som du måtte have brug for
  }
  const value: PackageJson;
  export default value;
}
