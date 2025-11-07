import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { PlasmicComponent } from "@plasmicapp/loader-react";
import { PLASMIC } from "../plasmic-init";

export default function PlasmicCatchAll() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        const data = await PLASMIC.maybeFetchComponentData(location.pathname);
        setPageData(data);
      } catch (error) {
        console.error("Error fetching Plasmic page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!pageData) {
    return null; // Let React Router handle 404
  }

  return (
    <PlasmicComponent
      component={location.pathname}
      componentProps={{}}
    />
  );
}
