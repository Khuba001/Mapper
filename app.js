"use strict";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const form = document.querySelector(".form");
const inputDistance = document.querySelector(".input-distance");
const inputDuration = document.querySelector(".input-duration");
const inputCadence = document.querySelector(".input-cadence");
const inputElevation = document.querySelector(".input-elevation");
const formSelect = document.querySelector(".input-select");
let mapEvent;
let map;

if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const { latitude, longitude } = position.coords;
      console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

      const coords = [latitude, longitude];

      map = L.map("map").setView(coords, 13);

      L.tileLayer("https://tile.openstreetmap.fr/hot//{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.on("click", function (mapE) {
        mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
      });
    },
    function () {
      alert("Could not get your position!");
    }
  );

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const { lat, lng } = mapEvent.latlng;

  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        classList: "running-popup",
      })
    )
    .setPopupContent("Workout")
    .openPopup();

  inputCadence.value =
    inputDistance.value =
    inputDuration.value =
    inputElevation.value =
      "";
});

formSelect.addEventListener("change", function () {
  if (formSelect.value === "running") {
    inputCadence.classList.remove("hidden");
    document.querySelector(".cadence-label").classList.remove("hidden");

    document.querySelector(".elevation-label").classList.add("hidden");
    inputElevation.classList.add("hidden");
  } else {
    inputCadence.classList.add("hidden");
    document.querySelector(".cadence-label").classList.add("hidden");

    document.querySelector(".elevation-label").classList.remove("hidden");
    inputElevation.classList.remove("hidden");
  }
});
