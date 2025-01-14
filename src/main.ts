import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import "./leafletWorkaround";
import { Board } from "./board.ts";

interface Cell {
  readonly i: number;
  readonly j: number;
  coins: Coin[];
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
const reloadB = document.querySelector<HTMLElement>("#reload")!;
reloadB.addEventListener("click", () => {
  location.reload();
});

function updateMapLocation(location: leaflet.LatLng): void {
  const newLatLng = leaflet.latLng(location.lat, location.lng);
  map.setView(newLatLng, GAMEPLAY_ZOOM_LEVEL);

  // Update the playerMarker position
  playerMarker.setLatLng(newLatLng);

  // Draw the polyline with the new location
  const latLngs: leaflet.LatLng[] = (movementPath.getLatLngs() ||
    []) as leaflet.LatLng[];
  latLngs.push(newLatLng);
  movementPath.setLatLngs(latLngs);

  const nearCells: Cell[] = board.getCellsNearPoint(location);

  for (const pit of currentPopups) {
    map.removeLayer(pit);
  }
  currentPopups = [];
  for (const cell of nearCells) {
    makePit(cell);
  }
  previousLocation = location;
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

const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No coins yet...";
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);
let currentPopups: leaflet.Layer[] = [];
function makePit(cell: Cell) {
  const bounds = leaflet.latLngBounds([
    [cell.i * TILE_DEGREES, cell.j * TILE_DEGREES],
    [(cell.i + 1) * TILE_DEGREES, (cell.j + 1) * TILE_DEGREES],
  ]);
  const pit = leaflet.rectangle(bounds) as leaflet.Layer;
  currentPopups.push(pit);
  pit.bindPopup(() => {
    const container = document.createElement("div");
    container.innerHTML = `
                <div>There is a pit here at "${cell.i},${
                  cell.j
                }". It has value <span id="value">${
                  cell.coins.length
                }</span>.</div>
                <div>Here are the current coins here:<div>
                <div>${printCoins(cell.coins)}
                <button id="poke">poke</button>
                <button id="place">place</button>`;
    const poke = container.querySelector<HTMLButtonElement>("#poke")!;
    function update() {
      container.innerHTML = `
                <div>There is a pit here at "${cell.i},${
                  cell.j
                }". It has value <span id="value">${
                  cell.coins.length
                }</span>.</div>
                <div>Here are the current coins here:<div>
                <div>${printCoins(cell.coins)}
                <button id="poke">poke</button>
                <button id="place">place</button>`;
      pit.closePopup();
      setTimeout(() => {
        pit.openPopup();
      }, 0);
    }
    poke.addEventListener("click", () => {
      if (cell.coins.length > 0) {
        purse.push(cell.coins.pop()!);
        update();
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          cell.coins.length.toString();
        statusPanel.innerHTML = `${printCoins(purse)}`;
      }
    });
    const place = container.querySelector<HTMLButtonElement>("#place")!;

    place.addEventListener("click", () => {
      if (purse.length > 0) {
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          cell.coins.length.toString();
        let x: Coin = purse.pop()!;
        cell.coins.push(x!);
        update();
        statusPanel.innerHTML = `${printCoins(purse)}`;
      }
    });
    return container;
  });
  pit.addTo(map);
}

function printCoins(coins: Coin[]) {
  let output = "";
  if (coins.length > 0) {
    for (const coin of coins) {
      output +=
        "X: " + coin.x + ", Y: " + coin.y + " index: " + coin.index + "<div>";
    }
  }
  return output;
}
const locateButton = document.querySelector<HTMLButtonElement>("#locate")!;
const movementPath = leaflet.polyline([], { color: "blue" }).addTo(map);
let previousLocation: leaflet.LatLng | null = null;
function startLocationUpdates() {
  if (navigator.geolocation) {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    function success(position: GeolocationPosition) {
      const userLocation = leaflet.latLng(
        position.coords.latitude,
        position.coords.longitude,
      );
      // Check if the user has moved by at least 0.0001 degrees
      if (
        previousLocation &&
        userLocation.distanceTo(previousLocation) < 0.0001
      ) {
        // If not moved enough, skip the update
        return;
      }

      CURRENT_LOCATION.lat = userLocation.lat;
      CURRENT_LOCATION.lng = userLocation.lng;
      updateMapLocation(CURRENT_LOCATION);
      // Update the Polyline with the new location
      const latLngs: leaflet.LatLng[] = (movementPath.getLatLngs() ||
        []) as leaflet.LatLng[];
      latLngs.push(userLocation);
      movementPath.setLatLngs(latLngs);

      updateMapLocation(CURRENT_LOCATION);

      // Update the previous location for the next comparison
      previousLocation = userLocation;
    }

    function error(error: GeolocationPositionError) {
      console.error("Error getting user location:", error.message);
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(success, error, options);

    // Start continuous updates every second
    setInterval(() => {
      navigator.geolocation.getCurrentPosition(success, error, options);
    }, 1000);
  } else {
    console.error("Geolocation is not supported by this browser");
  }
}

// Add an event listener for the locate button
locateButton.addEventListener("click", startLocationUpdates);
