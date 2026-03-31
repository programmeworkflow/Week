import { Sector } from "./mock-data";

export const sectorTitles: Record<Sector, string> = {
  tecnico: "Setor Técnico",
  comercial: "Comercial/Treinamentos",
  saude: "Saúde",
  financeiro: "Financeiro",
  psicossocial: "Psicossocial",
  diretoria: "Diretoria",
};

export const getSectorTitle = (sector?: string): string => {
  if (!sector || !(sector in sectorTitles)) return "MedWork";
  return sectorTitles[sector as Sector];
};

export const getBoardTitle = (sector?: string): string => {
  return `Quadro ${getSectorTitle(sector)}`;
};
