import { initPlasmicLoader } from "@plasmicapp/loader-react";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "jMBUBJxKv692NrSbkE8x4A", // your Project ID
      token: "rdzCcXuEkRPJ09Gdo8xDjmpVL3gr1o6E6f4748917bQg3", // your Public API Token
    },
  ],
  preview: true,
});
