import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";
import { Board } from "./board.ts";
// import { Geocache } from "./board.ts";

interface Cell {
  readonly i: number;
  readonly j: number;
}
const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0535,
});

const CURRENT_LOCATION = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0535,
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;

const mapContainer = document.querySelector<HTMLElement>("#map")!;
const northB = document.querySelector<HTMLElement>("#north")!;
const southB = document.querySelector<HTMLElement>("#south")!;
const westB = document.querySelector<HTMLElement>("#west")!;
const eastB = document.querySelector<HTMLElement>("#east")!;

function updateMapLocation(location: leaflet.LatLng): void {
  const newLatLng = leaflet.latLng(location.lat, location.lng);
  map.setView(newLatLng, GAMEPLAY_ZOOM_LEVEL);
  const nearCells: Cell[] = board.getCellsNearPoint(location);
  for (const pit of currentPopups) {
    map.removeLayer(pit);
  }
  currentPopups = [];
  for (const cell of nearCells) {
    makePit(cell.i, cell.j);
  }
}

northB.addEventListener("click", () => {
  CURRENT_LOCATION.lat += TILE_DEGREES;
  updateMapLocation(CURRENT_LOCATION);
});

southB.addEventListener("click", () => {
  CURRENT_LOCATION.lat -= TILE_DEGREES;
  updateMapLocation(CURRENT_LOCATION);
});

westB.addEventListener("click", () => {
  CURRENT_LOCATION.lng -= TILE_DEGREES;
  updateMapLocation(CURRENT_LOCATION);
});

eastB.addEventListener("click", () => {
  CURRENT_LOCATION.lng += TILE_DEGREES;
  updateMapLocation(CURRENT_LOCATION);
});

const map = leaflet.map(mapContainer, {
  center: MERRILL_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});
interface Coin {
  x: number;
  y: number;
  index: number;
}
let purse: Coin[] = [];
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const playerMarker = leaflet.marker(MERRILL_CLASSROOM);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No coins yet...";
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);
let currentPopups: leaflet.Layer[] = [];
function makePit(i: number, j: number) {
  const bounds = leaflet.latLngBounds([
    [i * TILE_DEGREES, j * TILE_DEGREES],
    [(i + 1) * TILE_DEGREES, (j + 1) * TILE_DEGREES],
  ]);
  console.log(bounds);
  const pit = leaflet.rectangle(bounds) as leaflet.Layer;
  let cache: Coin[] = [];
  let value = 3;
  currentPopups.push(pit);
  for (let l = 0; l < 3; l++) {
    const coin: Coin = { x: i, y: j, index: l };
    cache.push(coin);
  }
  pit.bindPopup(() => {
    const container = document.createElement("div");
    container.innerHTML = `
                <div>There is a pit here at "${i},${j}". It has value <span id="value">${value}</span>.</div>
                <div>Here are the current coins here:<div>
                <div>${printCoins(cache)}
                <button id="poke">poke</button>
                <button id="place">place</button>`;
    const poke = container.querySelector<HTMLButtonElement>("#poke")!;
    function update() {
      container.innerHTML = `
                <div>There is a pit here at "${i},${j}". It has value <span id="value">${value}</span>.</div>
                <div>Here are the current coins here:<div>
                <div>${printCoins(cache)}
                <button id="poke">poke</button>
                <button id="place">place</button>`;
      pit.closePopup();
      setTimeout(() => {
        pit.openPopup();
      }, 0);
    }
    poke.addEventListener("click", () => {
      if (value > 0) {
        const tmpCoin: Coin = {
          x: i,
          y: j,
          index: 0,
        };
        purse.push(tmpCoin);
        update();
        value--;
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          value.toString();
        points++;
        statusPanel.innerHTML = `${printCoins(purse)}`;
      }
    });
    const place = container.querySelector<HTMLButtonElement>("#place")!;

    place.addEventListener("click", () => {
      if (points > 0) {
        value++;
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          value.toString();
        points--;
        cache.push(purse.pop()!);
        update();
        console.log(printCoins(cache));
        statusPanel.innerHTML = `${printCoins(purse)}`;
      }
    });
    return container;
  });
  pit.addTo(map);
}

function printCoins(purse: Coin[]) {
  let output = "";
  for (const coin of purse) {
    output +=
      "X: " + coin.x + ", Y: " + coin.y + " index: " + coin.index + "<div>";
  }
  return output;
}
updateMapLocation(CURRENT_LOCATION);
