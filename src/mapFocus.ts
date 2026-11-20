export type MapPoint = { x: number; y: number };
/** Fit the player and destination with generous space for labels. */
export function mapFocus(player: MapPoint, destination?: MapPoint) {
  const target = destination ?? player;
  const width = Math.max(1000, Math.abs(player.x - target.x) + 420, (Math.abs(player.y - target.y) + 320) * 1.6);
  const height = width / 1.6;
  return { x: (player.x + target.x) / 2 - width / 2, y: (player.y + target.y) / 2 - height / 2, width, height };
}
