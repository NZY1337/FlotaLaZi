import { useEffect } from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";

// Helmet sets the title. With React 19 its <meta name="description"> never
// reaches the page, so the description is written straight into the one
// already in index.html (and put back when the page goes away).
const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) return;
    const previous = meta.content;
    meta.content = description;
    return () => { meta.content = previous; };
  }, [description]);

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
};

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

export default PageMeta;
