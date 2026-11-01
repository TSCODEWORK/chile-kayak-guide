import mapData from './data/chile-map.json' with { type: 'json' };

export const CHILE_MAP = mapData;

export function projectLonLat(lon, lat, project = mapData.project) {
  return [
    (lon - project.lon0) * project.scaleX + project.pad,
    (project.lat0 - lat) * project.scaleY + project.pad
  ];
}
