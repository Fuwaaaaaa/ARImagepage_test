import type {} from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-entity': any;
      'a-camera': any;
      'a-image': any;
      'a-assets': any;
      'a-asset-item': any;
      'a-light': any;
      'a-box': any;
      'a-plane': any;
    }
  }
}

export {};
