import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react-markdown' {
  import { ComponentType } from 'react';
  
  export interface ReactMarkdownProps {
    children?: string;
    components?: {
      [key: string]: ComponentType<any>;
    };
    className?: string;
  }
  
  const ReactMarkdown: ComponentType<ReactMarkdownProps>;
  export default ReactMarkdown;
}
