export const DEFAULT_MAP_REGION = {
  latitude: 27.7103,
  longitude: 85.3222,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

export function getGoogleMapsApiKey() {
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
}

export function canRenderNativeGoogleMap() {
  const flag = String(
    process.env.EXPO_PUBLIC_ENABLE_NATIVE_GOOGLE_MAPS ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_NATIVE_ENABLED ||
    '',
  ).trim().toLowerCase();

  if (['0', 'false', 'no', 'off'].includes(flag)) {
    return false;
  }

  return Boolean(getGoogleMapsApiKey());
}

export function normalizeCoordinate(value = {}) {
  const source = value?.coordinates || value?.location || value?.coords || value;
  const latitude = Number(source?.latitude ?? source?.lat);
  const longitude = Number(source?.longitude ?? source?.lng ?? source?.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

export function coordinateToRegion(coordinate, delta = 0.018) {
  const normalized = normalizeCoordinate(coordinate) || DEFAULT_MAP_REGION;
  return {
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

function getGoogleApiError(payload, fallback) {
  return payload?.error?.message || payload?.error_message || fallback;
}

function getAutocompleteLocation(options) {
  const normalized = normalizeCoordinate(options.location);
  if (normalized) {
    return normalized;
  }

  const [latitude, longitude] = String(options.location || '27.7103,85.3222')
    .split(',')
    .map((part) => Number(part.trim()));

  return normalizeCoordinate({ latitude, longitude }) || DEFAULT_MAP_REGION;
}

function isGooglePlacesConfigError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('api key') ||
    message.includes('not been used') ||
    message.includes('disabled') ||
    message.includes('legacy') ||
    message.includes('not enabled') ||
    message.includes('not authorized') ||
    message.includes('blocked') ||
    message.includes('requests to this api')
  );
}

function getOpenStreetMapSuggestion(result) {
  const displayName = result?.display_name || '';
  const parts = displayName
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const address = result?.address || {};
  const mainText =
    address.amenity ||
    address.shop ||
    address.tourism ||
    address.leisure ||
    address.office ||
    address.road ||
    address.suburb ||
    address.neighbourhood ||
    address.city_district ||
    address.city ||
    address.town ||
    address.village ||
    parts[0] ||
    displayName;
  const secondaryText = parts
    .filter((part) => part !== mainText)
    .slice(0, 3)
    .join(', ');
  const coordinates = normalizeCoordinate({
    latitude: result?.lat,
    longitude: result?.lon,
  });

  return {
    placeId: `osm:${result?.place_id || `${coordinates?.latitude || ''},${coordinates?.longitude || ''}`}`,
    description: displayName || mainText,
    formattedAddress: displayName || mainText,
    address: mainText,
    mainText,
    secondaryText,
    coordinates,
  };
}

async function fetchOpenStreetMapPredictions(input, options = {}) {
  const query = String(input || '').trim();

  if (query.length < 3) {
    return [];
  }

  const center = getAutocompleteLocation(options);
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(options.limit || 5),
    countrycodes: 'np',
    viewbox: [
      center.longitude - 0.45,
      center.latitude + 0.45,
      center.longitude + 0.45,
      center.latitude - 0.45,
    ].join(','),
    bounded: '0',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'ChitoMitho/1.0 location-search',
    },
  });

  if (!response.ok) {
    throw new Error('Could not load address suggestions.');
  }

  const results = await response.json();
  return (Array.isArray(results) ? results : [])
    .map(getOpenStreetMapSuggestion)
    .filter((suggestion) => suggestion.description && suggestion.coordinates);
}

async function fetchGooglePlacePredictions(input, options = {}) {
  const query = String(input || '').trim();
  const key = getGoogleMapsApiKey();

  if (!key || query.length < 3) {
    return [];
  }

  const center = getAutocompleteLocation(options);
  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': [
        'suggestions.placePrediction.placeId',
        'suggestions.placePrediction.text',
        'suggestions.placePrediction.structuredFormat',
      ].join(','),
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: options.includedRegionCodes || ['np'],
      locationBias: {
        circle: {
          center: {
            latitude: center.latitude,
            longitude: center.longitude,
          },
          radius: Number(options.radius || 55000),
        },
      },
    }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(getGoogleApiError(payload, 'Could not load address suggestions.'));
  }

  return (payload.suggestions || [])
    .map((suggestion) => suggestion.placePrediction)
    .filter(Boolean)
    .map((prediction) => {
      const description = prediction.text?.text || '';
      return {
        placeId: prediction.placeId,
        description,
        mainText: prediction.structuredFormat?.mainText?.text || description,
        secondaryText: prediction.structuredFormat?.secondaryText?.text || '',
      };
    });
}

export async function fetchPlacePredictions(input, options = {}) {
  try {
    const googleResults = await fetchGooglePlacePredictions(input, options);
    if (googleResults.length) {
      return googleResults;
    }
  } catch (error) {
    if (!isGooglePlacesConfigError(error)) {
      throw error;
    }
  }

  return fetchOpenStreetMapPredictions(input, options);
}

export async function fetchPlaceDetails(placeId) {
  const key = getGoogleMapsApiKey();
  const normalizedPlaceId = String(placeId || '').trim().replace(/^places\//, '');

  if (!key || !normalizedPlaceId || normalizedPlaceId.startsWith('osm:')) {
    return null;
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(normalizedPlaceId)}`, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
    },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(getGoogleApiError(payload, 'Could not load place details.'));
  }

  const coordinate = normalizeCoordinate(payload.location);
  const displayName = payload.displayName?.text || '';
  const formattedAddress = payload.formattedAddress || '';

  return {
    address: formattedAddress || displayName,
    formattedAddress,
    placeId: payload.id || normalizedPlaceId,
    coordinates: coordinate,
  };
}

export async function reverseGeocodeCoordinate(coordinate) {
  const key = getGoogleMapsApiKey();
  const normalized = normalizeCoordinate(coordinate);

  if (!key || !normalized) {
    return null;
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${normalized.latitude},${normalized.longitude}`);
  url.searchParams.set('key', key);

  const response = await fetch(url.toString());
  const payload = await response.json();

  if (payload.status !== 'OK' && payload.status !== 'ZERO_RESULTS') {
    throw new Error(payload.error_message || 'Could not resolve this map pin.');
  }

  const result = payload.results?.[0];
  if (!result) {
    return {
      address: `${normalized.latitude.toFixed(5)}, ${normalized.longitude.toFixed(5)}`,
      formattedAddress: '',
      placeId: '',
      coordinates: normalized,
    };
  }

  return {
    address: result.formatted_address || `${normalized.latitude.toFixed(5)}, ${normalized.longitude.toFixed(5)}`,
    formattedAddress: result.formatted_address || '',
    placeId: result.place_id || '',
    coordinates: normalized,
  };
}
