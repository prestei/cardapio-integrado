import { logger } from '../lib/logger.js';

interface AutocompleteSuggestion {
  placeId: string;
  description: string;
}

interface GeocodeResult {
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string | null;
}

interface GooglePlacesAutocompleteResponse {
  predictions?: Array<{ place_id: string; description: string }>;
  status: string;
}

interface GoogleGeocodeResponse {
  results?: Array<{
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
  }>;
  status: string;
}

/**
 * Helper de geolocalização — nunca deve impedir o checkout. Se
 * GOOGLE_MAPS_API_KEY não estiver configurado, ou a chamada falhar, retorna
 * respostas vazias/nulas em vez de lançar erro.
 */
export const geoService = {
  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_MAPS_API_KEY);
  },

  async autocomplete(query: string): Promise<AutocompleteSuggestion[]> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return [];

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.set('input', query);
      url.searchParams.set('language', 'pt-BR');
      url.searchParams.set('components', 'country:br');
      url.searchParams.set('key', apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        logger.warn({ status: response.status }, 'Falha ao consultar Google Places Autocomplete');
        return [];
      }

      const data = (await response.json()) as GooglePlacesAutocompleteResponse;
      if (data.status !== 'OK' || !data.predictions) return [];

      return data.predictions.map((p) => ({ placeId: p.place_id, description: p.description }));
    } catch (error) {
      logger.warn({ err: error }, 'Erro ao consultar Google Places Autocomplete');
      return [];
    }
  },

  async geocode(address: string): Promise<GeocodeResult> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const empty: GeocodeResult = { latitude: null, longitude: null, formattedAddress: null };
    if (!apiKey) return empty;

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', address);
      url.searchParams.set('language', 'pt-BR');
      url.searchParams.set('region', 'br');
      url.searchParams.set('key', apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        logger.warn({ status: response.status }, 'Falha ao consultar Google Geocoding');
        return empty;
      }

      const data = (await response.json()) as GoogleGeocodeResponse;
      const first = data.results?.[0];
      if (data.status !== 'OK' || !first) return empty;

      return {
        latitude: first.geometry.location.lat,
        longitude: first.geometry.location.lng,
        formattedAddress: first.formatted_address,
      };
    } catch (error) {
      logger.warn({ err: error }, 'Erro ao consultar Google Geocoding');
      return empty;
    }
  },
};
