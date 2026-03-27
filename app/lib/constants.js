/* ═══ SHARED CONSTANTS ═══ */

export const ACCENT = '#9B8EC4';

export const TYPE_COLORS = { Niche: "#8B7A5E", Designer: "#5B7B9B", Arabic: "#B08060", Indie: "#7B9B78", Affordable: "#8B9B8B", Celebrity: "#A07898" };

export const FAMILY_COLORS = {
  Floral: "#D291BC", Woody: "#A18062", Oriental: "#D4915B", Fresh: "#7EC8A0",
  Citrus: "#E8D44D", Gourmand: "#CC8855", Fruity: "#E07B7B", Aromatic: "#73C27E",
  Leather: "#8B7355", Aquatic: "#6BB3D9", Smoky: "#8E8E8E", Green: "#73C27E",
  Musky: "#C4B7A6", Chypre: "#7A6B3C", Powdery: "#D8BFD8",
};

export const NOTE_COLORS = { top: "#7EC8A0", heart: "#D291BC", base: "#A18062" };
export const NOTE_LABELS = { top: "Top", heart: "Heart", base: "Base" };

export const ACCORD_COLORS = {
  sweet:"#E28B90", warm:"#D4915B", "warm spicy":"#C87941", woody:"#A18062", floral:"#D291BC",
  fruity:"#E07B7B", citrus:"#E8D44D", fresh:"#7EC8A0", musky:"#C4B7A6", powdery:"#D8BFD8",
  rose:"#E8ADAD", oud:"#6B4226", amber:"#DDAA44", vanilla:"#F5DEB3", coffee:"#6F4E37",
  leather:"#8B7355", tobacco:"#9B7653", boozy:"#BF9B30", gourmand:"#CC8855", coconut:"#F5E6D3",
  chocolate:"#7B3F00", smoky:"#8E8E8E", incense:"#B5651D", clean:"#87CEEB", aquatic:"#6BB3D9",
  green:"#73C27E", salty:"#7EC8E3", honey:"#EB9E3F", creamy:"#F5E6D3", earthy:"#9B7653",
  cherry:"#DC143C", patchouli:"#7A6B3C", sandalwood:"#C19A6B", tea:"#7EC8A0", iris:"#B19CD9",
  fig:"#9B7653", saffron:"#F4C430", cinnamon:"#D2691E", tuberose:"#F0D0E0", lavender:"#B19CD9",
  "white floral":"#F0D0E0", almond:"#EDDCB1", plum:"#8E4585", peach:"#FFDAB9", mango:"#F4BB44",
  jasmine:"#F8EBB0", orange:"#FFA500", bergamot:"#E8D44D", violet:"#8B7FC7", mint:"#98FF98",
  pepper:"#B5651D", cardamom:"#B5A642", ginger:"#D2A03D", "orange blossom":"#FFD580",
  magnolia:"#F0C0D0", lily:"#F5E6D3", orchid:"#DA70D6", marine:"#6BB3D9", musk:"#C4B7A6",
  cedar:"#A18062", vetiver:"#8B9E5B", tonka:"#C19A6B", benzoin:"#B5651D",
  balsamic:"#B5651D", animalic:"#8B7355", "skin scent":"#E8D5C4", dark:"#4A3728",
  resinous:"#B5651D", tropical:"#FFB347", berry:"#8B3A62", mineral:"#A9A9A9",
  "fresh spicy":"#90C87E", solar:"#F5D76E", aromatic:"#73C27E", ozonic:"#B0E0E6",
  aldehydic:"#E8D5C4", herbal:"#73C27E", juniper:"#6B8E5B", moss:"#6B8E5B",
  cotton:"#E8D5C4", caramel:"#C68E3F", toffee:"#C68E3F", marshmallow:"#F5E6D3",
  "cotton candy":"#FFB6C1", rum:"#BF9B30", spicy:"#C87941", talc:"#E8D5C4",
  apple:"#7EC87E", pineapple:"#F5D76E", camphor:"#B0E0E6", metallic:"#A9A9A9",
  "fresh":"#7EC8A0", "gourmand":"#CC8855",
};

export const RETAILERS = [
  { name: "FragranceNet", tag: "Best Price", url: "https://www.fragrancenet.com/search?q=Q&utm_source=thedrydown" },
  { name: "ScentSplit", tag: "Decants", url: "https://www.scentsplit.com/search?q=Q&ref=thedrydown" },
  { name: "Amazon", tag: "Fast Ship", url: "https://www.amazon.com/s?k=Q&tag=thedrydown-20" },
  { name: "Sephora", tag: "Rewards", url: "https://www.sephora.com/search?keyword=Q&utm_source=thedrydown" },
  { name: "Notino", tag: "Global", url: "https://www.notino.com/search/?q=Q&utm_source=thedrydown" },
];

export function slugify(name, brand) {
  return `${name}-${brand}`
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
