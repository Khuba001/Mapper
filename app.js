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
const workoutContainer = document.querySelector(".workout-container");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; //arr
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
}

class Running extends Workout {
  type = "running";
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
  type = "cycling";
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

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers");
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);
    console.log(workout);

    this.#renderWorkoutMarker(workout);

    this.#renderWorkout(workout);

    // clear all the input fields of the form
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        "";

    // hide a form after creating a workout
    form.classList.add("hidden");
  }

  #renderWorkoutMarker(workout) {
    // Helper function for formatting the popup string
    const formatString = () => {
      // return a string for displaying
      return `${
        // check workouts type
        workout.type === "running"
          ? // create a string depending on the workout type, use formatDate function that returns a date in a proper form
            `🏃‍♂️ Running on ${this.formatDate(workout)}`
          : `🚴‍♂️ Cycling on ${this.formatDate(workout)}`
      }`;
    };

    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(formatString())
      .openPopup();
  }

  #renderWorkout(workout) {
    // create a html markup of the workout
    let markup =
      //  use tertiary operator to determine if its a running workout or cycling, add workout values
      workout.type === "running"
        ? `<div class="workout workout-running">
            <p class="workout-text">
              Running on <span class="workout-date">${this.formatDate(
                workout
              )}</span>
            </p>
            <div class="workout-stats">
              <div class="workout-stats-container">
                <p class="workout-stat">
                  <span class="workout-icon">🏃‍♂️</span
                  ><span class="workout-value">${workout.distance}</span>
                  <span class="workout-unit">KM</span>
                </p>
              </div>
              <div class="workout-stat">
                <p class="workout-stat">
                  <span class="workout-icon">⏱</span
                  ><span class="workout-value">${workout.duration}</span>
                  <span class="workout-unit">MIN</span>
                </p>
              </div>
              <div class="workout-stat">
                <p class="workout-stat">
                  <span class="workout-icon">⚡</span
                  ><span class="workout-value">${workout.cadence}</span>
                  <span class="workout-unit">MIN/H</span>
                </p>
              </div>
              <div class="workout-stat">
                <p class="workout-stat">
                  <span class="workout-icon">🦶</span
                  ><span class="workout-value">${workout.pace}</span>
                  <span class="workout-unit">SPM</span>
                </p>
              </div>
            </div>
          </div>`
        : `          <div class="workout workout-cycling">
            <p class="workout-text">
              Cycling on <span class="workout-date">${this.formatDate(
                workout
              )}</span>
            </p>
            <div class="workout-stats">
              <div class="workout-stats-container">
                <p class="workout-stat">
                  <span class="workout-icon">🚴‍♂️</span
                  ><span class="workout-value">${workout.distance}</span>
                  <span class="workout-unit">KM</span>
                </p>
              </div>
              <div class="workout-stat">
                <p class="workout-stat">
                  <span class="workout-icon">⏱</span
                  ><span class="workout-value">${workout.duration}</span>
                  <span class="workout-unit">MIN</span>
                </p>
              </div>
              <div class="workout-stat">
                <p class="workout-stat">
                  <span class="workout-icon">⚡</span
                  ><span class="workout-value">${workout.speed}</span>
                  <span class="workout-unit">KM/H</span>
                </p>
              </div>
              <div class="workout-stat">
                <p class="workout-stat">
                  <span class="workout-icon">⛰</span
                  ><span class="workout-value">${workout.elevationGain}</span>
                  <span class="workout-unit">M</span>
                </p>
              </div>
            </div>
          </div>`;

    // add created html element to the workout container with to option 'beforeend'
    workoutContainer.insertAdjacentHTML("beforeend", markup);
  }
  // Helper function which formats the date for displaying
  formatDate(workout) {
    // get month, set the formatting to users locale and set the month displaying to full name
    // dont have to add +1 to the month because toLocaleDateString already returns proper month
    let month = workout.date.toLocaleDateString(navigator.language, {
      month: "long",
    });
    // create a day var
    let day = workout.date.getDate();
    // return the formatted string for displaying it in the workout
    return `${month} ${day}`;
  }
}

const app = new App();
formSelect.addEventListener("change", function () {});
