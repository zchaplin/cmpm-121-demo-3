import leaflet from "leaflet";
import luck from "./luck";
interface Cell {
  readonly i: number;
  readonly j: number;
}
const NEIGHBORHOOD_SIZE = 8;
const PIT_SPAWN_PROBABILITY = 0.1;
//const TILE_DEGREES = 1e-4;
export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private knownCells: Map<string, Cell> = new Map();

  constructor(tileWidth: number, tileVisibilityRadius: number) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
  }

  private getCanonicalCell(cell: Cell): Cell {
    const { i = cell.i, j = cell.j } = cell;
    const key = [i, j].toString();
    if (!this.knownCells.has(key)) {
      this.knownCells.set(key, { i, j });
    }
    return this.knownCells.get(key)!;
  }

  getCellForPoint(point: leaflet.LatLng): Cell {
    const i = Math.round(point.lat / 0.0001); // Adjust the conversion factor as needed
    const j = Math.round(point.lng / 0.0001);
    const cell: Cell = {
      i: i,
      j: j,
    };
    return this.getCanonicalCell(cell);
  }

  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    // Assuming a fixed step size for simplicity, adjust as needed
    const stepSize = 0.0001;

    // Calculate bounds based on the center of the cell
    const center = leaflet.latLng(cell.i * stepSize, cell.j * stepSize);
    const halfSize = stepSize / 2;

    const bounds = leaflet.latLngBounds(
      leaflet.latLng(center.lat - halfSize, center.lng - halfSize),
      leaflet.latLng(center.lat + halfSize, center.lng + halfSize),
    );

    return bounds;
  }

  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);

    for (
      let i = originCell.i - NEIGHBORHOOD_SIZE;
      i <= originCell.i + NEIGHBORHOOD_SIZE;
      i++
    ) {
      for (
        let j = originCell.j - NEIGHBORHOOD_SIZE;
        j <= originCell.j + NEIGHBORHOOD_SIZE;
        j++
      ) {
        if (luck([i, j].toString()) < PIT_SPAWN_PROBABILITY) {
          const newCell: Cell = this.getCanonicalCell({
            i: i,
            j: j,
          });
          resultCells.push(newCell);
        }
      }
    }

    return resultCells;
  }
}

// interface Geocoin {
//   mintingLocation: Cell;
//   serialNumber: number;
// }

// export class Geocache {
//   coins: Geocoin[];

//   constructor(cell: Cell) {
//     const numInitialCoins = Math.floor(
//       luck(["intialCoins", cell.i, cell.j].toString()) * 3
//     );
//     this.coins = [];
//     for (let i = 0; i < numInitialCoins; i++) {
//       this.coins.push({ mintingLocation: cell, serialNumber: i });
//     }
//   }
// }
