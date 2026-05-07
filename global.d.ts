import type {} from 'react';

type AFrameEntityProps = {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  key?: React.Key | null;
  ref?: React.Ref<HTMLElement>;
  [attr: string]: unknown;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': AFrameEntityProps;
      'a-entity': AFrameEntityProps;
      'a-camera': AFrameEntityProps;
      'a-image': AFrameEntityProps;
      'a-video': AFrameEntityProps;
      'a-sound': AFrameEntityProps;
      'a-assets': AFrameEntityProps;
      'a-asset-item': AFrameEntityProps;
      'a-light': AFrameEntityProps;
      'a-box': AFrameEntityProps;
      'a-plane': AFrameEntityProps;
    }
  }
}

export {};
