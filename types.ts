
export interface Material {
  name: string;
  quantity: number;
  dimensions: string;
}

export interface CuttingList {
  houseName: string;
  description: string;
  materials: Material[];
}

export interface ImageView {
  label: string;
  url: string;
}

export interface EditPreferences {
  primaryColor: string;
  secondaryColor: string;
  roofMaterial: string;
  featureHighlights: string;
}
