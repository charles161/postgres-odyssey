import { useEffect } from 'react';

interface DocumentMeta {
  title: string;
  description?: string;
}

export function useDocumentMeta({ title, description }: DocumentMeta) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | PostgreSQL Odyssey`;

    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      const prevDesc = metaDesc?.getAttribute('content') || '';
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      }

      return () => {
        document.title = prevTitle;
        if (metaDesc) metaDesc.setAttribute('content', prevDesc);
      };
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description]);
}
