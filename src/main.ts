import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";
import { Board } from "./board.ts";
interface Cell {
  readonly i: number;
  readonly j: number;
}
const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0535,
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const PIT_SPAWN_PROBABILITY = 0.1;

const mapContainer = document.querySelector<HTMLElement>("#map")!;

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

function makePit(i: number, j: number) {
  console.log(i, j);
  const bounds = leaflet.latLngBounds([
    [i * TILE_DEGREES, j * TILE_DEGREES],
    [(i + 1) * TILE_DEGREES, (j + 1) * TILE_DEGREES],
  ]);

  const pit = leaflet.rectangle(bounds) as leaflet.Layer;

  pit.bindPopup(() => {
    let value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
    const container = document.createElement("div");
    container.innerHTML = `
                <div>There is a pit here at "${i},${j}". It has value <span id="value">${value}</span>.</div>
                <button id="poke">poke</button>
                <button id="place">place</button>`;
    const poke = container.querySelector<HTMLButtonElement>("#poke")!;
    poke.addEventListener("click", () => {
      const tmpCoin: Coin = {
        x: i,
        y: j,
        index: 0,
      };
      purse.push(tmpCoin);
      value--;
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        value.toString();
      points++;
      let holdCoins = "";
      for (const coin of purse) {
        holdCoins += coin.x + "," + coin.y + ": " + coin.index + " --- ";
      }
      statusPanel.innerHTML = `${holdCoins}`;
    });
    const place = container.querySelector<HTMLButtonElement>("#place")!;
    place.addEventListener("click", () => {
      value++;
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        value.toString();
      points--;
      purse.pop();
      let holdCoins = "";
      for (const coin of purse) {
        holdCoins += coin.x + "," + coin.y + ": " + coin.index + " --- ";
      }
      statusPanel.innerHTML = `${holdCoins}`;
    });
    return container;
  });
  pit.addTo(map);
}

for (let i = -NEIGHBORHOOD_SIZE; i <= NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j <= NEIGHBORHOOD_SIZE; j++) {
    if (luck([i, j].toString()) < PIT_SPAWN_PROBABILITY) {
      const point = leaflet.latLng({
        lat: MERRILL_CLASSROOM.lat + i * TILE_DEGREES,
        lng: MERRILL_CLASSROOM.lng + j * TILE_DEGREES,
      });
      const cell: Cell = board.getCellForPoint(point);
      makePit(cell.i, cell.j);
    }
  }
}
