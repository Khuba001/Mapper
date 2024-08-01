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

class Workout {
  date = new Date();
  id = (Date().now + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; //arr
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this.#getPostion();
    form.addEventListener("submit", this.#newWorkout.bind(this));
    formSelect.addEventListener("change", this.#toggleElevatationField);
  }

  #getPostion() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert("Could not get your position!");
        }
      );
  }
  #loadMap(position) {
    const { latitude, longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.fr/hot//{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this.#showForm.bind(this));
  }

  #showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  #toggleElevatationField() {
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
  }

  #newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);
    e.preventDefault();

    const type = formSelect.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // check type && valdiate

    if (type === "running") {
      const cadence = +inputCadence.value;

      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers");

      const workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers");
      const workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);

    L.marker([lat, lng])
      .addTo(this.#map)
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
  }
}

const app = new App();
formSelect.addEventListener("change", function () {});
