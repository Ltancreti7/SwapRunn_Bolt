import { useEffect } from "react";

interface PageMetaProps {
  title?: string;
  description?: string;
  canonical?: string;
}

export function PageMeta({ title, description, canonical }: PageMetaProps) {
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionMeta =
      document.querySelector<HTMLMetaElement>("meta[name=\"description\"]") ??
      (() => {
        const meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
        return meta;
      })();
    const previousDescription = descriptionMeta.getAttribute("content") ?? "";

    const canonicalLink =
      document.querySelector<HTMLLinkElement>("link[rel=\"canonical\"]") ??
      (() => {
        const link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
        return link;
      })();
    const previousCanonical = canonicalLink.getAttribute("href") ?? "";

    if (title) {
      document.title = title;
    }

    if (description) {
      descriptionMeta.setAttribute("content", description);
    } else {
      descriptionMeta.removeAttribute("content");
    }

    if (canonical) {
      canonicalLink.setAttribute("href", canonical);
    } else {
      canonicalLink.removeAttribute("href");
    }

    return () => {
      document.title = previousTitle;
      descriptionMeta.setAttribute("content", previousDescription);
      if (previousCanonical) {
        canonicalLink.setAttribute("href", previousCanonical);
      } else {
        canonicalLink.removeAttribute("href");
      }
    };
  }, [title, description, canonical]);

  return null;
}
