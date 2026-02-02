// Stubbed loader to keep legacy imports safe during migration to Leaflet.
// All mapping functionality has been migrated to Leaflet.
export const googleMapsLoader = {
  async importLibrary(_: string) {
    return {};
  },
};