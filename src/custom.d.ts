declare module "*.svg" {
  const content: any;
  export default content;
}

declare module "*.png" {
  const content: any;
  export default content;
}

declare const window: any


interface PixelTag {
  partnerId?: string;
  conversionId?: string;
  status?: string;
}

interface ExtensionTabData {
  insight_tags: PixelTag[];
  pixels: PixelTag[]
}

interface LinkedInTagParams {
  pid?: string;
  conversionId?: string;
  fmt?: string;
}

declare global {
    interface Window {
        _linkedin_pixel_data: { [key: number]: ExtensionTabData};
    }
}

interface WebRequest {
  url: string;
  tabId: number;
}
