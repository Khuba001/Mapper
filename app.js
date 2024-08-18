"use strict";

const form = document.querySelector(".form");
const inputDistance = document.querySelector(".input-distance");
const inputDuration = document.querySelector(".input-duration");
const inputCadence = document.querySelector(".input-cadence");
const inputElevation = document.querySelector(".input-elevation");
const formSelect = document.querySelector(".input-select");
const workoutContainer = document.querySelector(".workout-container");
const workoutElement = document.querySelector(".workout");
const removeAll = document.querySelector(".remove-all");
const inputID = document.querySelector(".input-id");

const workoutRemover = document.querySelector(".workout-delete");
const btnSort = document.querySelector(".btn-sort");
const sortList = document.querySelector(".sort-container");
const btnSortDistanceDesc = document.querySelector(".btn-sort-distance-desc");
const btnSortDate = document.querySelector(".btn-sort-date");
const btnSortDuration = document.querySelector(".btn-sort-duration");
const btnSortSpeed = document.querySelector(".btn-sort-velocity");
const btnZoom = document.querySelector(".btn-zoom");

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
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #markers = [];
  // Create bounds object
  #bounds = new L.LatLngBounds();
  #greenIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  constructor() {
    this.#getPostion();
    this.#getLocalStorage();
    form.addEventListener("submit", this.#newWorkout.bind(this));
    formSelect.addEventListener("change", this.#toggleElevatationField);
    workoutContainer.addEventListener("click", this.#moveToPopup.bind(this));
    workoutContainer.addEventListener("click", this.#removeWorkout.bind(this));
    workoutContainer.addEventListener("click", this.#editWorkout.bind(this));
    removeAll.addEventListener("click", this.#removeAll.bind(this));
    btnSort.addEventListener("click", this.#showSorts);
    btnSortDistanceDesc.addEventListener(
      "click",
      this.#sortWorkout.bind(this, "distance")
    );
    btnSortDate.addEventListener("click", this.#sortWorkout.bind(this, "date"));
    btnSortDuration.addEventListener(
      "click",
      this.#sortWorkout.bind(this, "duration")
    );
    // btnSortSpeed.addEventListener('click',this.#sortWorkout.bind(this, `${this.workout}`))

    btnZoom.addEventListener("click", this.#ZoomToMarkers.bind(this));
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

    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer(
      "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
      {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: "mapbox/dark-v10",
        tileSize: 512,
        zoomOffset: -1,
        accessToken:
          "pk.eyJ1IjoiYmxhY2tib3gxMSIsImEiOiJjbDF3OGxkYWIwMzcwM2pwOHQwMXQ2OGM0In0.6KQYul7J6Vbh4edRpmgIaA",
      }
    ).addTo(this.#map);

    this.#map.on("click", this.#showForm.bind(this));

    this.#workouts.forEach((workout) => this.#renderWorkoutMarker(workout));
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
    const id = inputID.value;
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

    // here we are checking if the workout is beign edited or not
    // check if workout with this id exists
    if (id) {
      // get index in #workouts array by workouts id
      const workoutIndex = this.#workouts.findIndex((work) => (work.id = id));
      // change old workouts value with the new one
      this.#workouts[workoutIndex] = workout;
      // delete old workout on the workouts container
      document.querySelector(`[data-id="${id}"]`).remove();
    } else this.#workouts.push(workout);

    this.#renderWorkoutMarker(workout);

    this.#renderWorkout(workout);

    this.#hideForm();

    this.#setLocalStorage();
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
    if (!this.#map) {
      console.error("Map is not initialized.");
      return;
    }

    this.#markers.push(
      L.marker(workout.coords, { icon: this.#greenIcon })
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
        .openPopup()
    );
    // push the markers to the bounds object
    this.#markers.forEach((marker) => this.#bounds.extend(marker.getLatLng()));
  }

  #renderWorkout(workout) {
    // create a html markup of the workout
    let markup =
      //  use tertiary operator to determine if its a running workout or cycling, add workout values
      workout.type === "running"
        ? `<div class="workout workout-running" data-id="${workout.id}">
            <p class="workout-text">
              Running on <span class="workout-date">${this.formatDate(
                workout
              )}</span>
            </p>
            <div class='workout-options'>
              <ion-icon class="icon workout-delete" name="close-outline"></ion-icon>
             <ion-icon class="icon workout-edit" name="create-outline"></ion-icon>
            </div>
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
                  ><span class="workout-value">${workout.pace.toFixed(2)}</span>
                  <span class="workout-unit">SPM</span>
                </p>
              </div>
            </div>
          </div>`
        : `          <div class="workout workout-cycling"  data-id="${
            workout.id
          }">
            <p class="workout-text">
              Cycling on <span class="workout-date">${this.formatDate(
                workout
              )}</span>
            </p>
            <div class='workout-options'>
             <ion-icon class="icon workout-delete" name="close-outline"></ion-icon>
             <ion-icon class="icon workout-edit" name="create-outline"></ion-icon>
            </div>
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
                  ><span class="workout-value">${workout.elevationGain.toFixed(
                    2
                  )}</span>
                  <span class="workout-unit">M</span>
                </p>
              </div>
            </div>
          </div>`;

    // add created html element to the workout container with the option 'beforeend'
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
  #moveToPopup(e) {
    // in this method we are using this keyword so its necessary to do .bind(this) on event listener
    // find parent element with .workout class
    const workoutEl = e.target.closest(".workout");
    // guard clause
    if (!workoutEl) return;
    // find an object that matches id with element that we clicked on
    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );
    // set users view on the pin
    this.#map.setView(workout.coords, this.#mapZoomLevel);
  }
  #hideForm() {
    // clear all the input fields of the form
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputID.value =
        "";

    // hide a form after creating a workout
    form.classList.add("hidden");
  }
  // removeworkout still to do: remove marker
  #removeWorkout(e) {
    // stop propagation, so moveToPopup dont activate
    e.stopPropagation();
    // if ❌ is clicked then do:
    if (e.target.classList.contains("workout-delete")) {
      // create a variable and put into it the workout element that clicked ❌ is located in
      const workoutEl = e.target.closest(".workout");
      // guard clause
      if (!workoutEl) return;

      const workout = this.#workouts.find(
        (workout) => workout.id == workoutEl.dataset.id
      );
      // update #workouts array with the ones that do not match the condition, and delete the one that matches it
      this.#workouts = this.#workouts.filter(
        (workout) => workout.id !== workoutEl.dataset.id
      );
      // remove the element from the DOM
      workoutEl.remove();

      // find the right marker, this will be nessecary for deleting it from the map
      const marker = this.#markers.find(
        (marker) =>
          marker._latlng.lat === workout.coords[0] &&
          marker._latlng.lng === workout.coords[1]
      );
      // remove the marker from the #markers array

      this.#markers = this.#markers.filter(
        (marker) =>
          marker._latlng.lat !== workout.coords[0] &&
          marker._latlng.lng !== workout.coords[1]
      );

      this.#map.removeLayer(marker);
    }
  }
  #editWorkout(e) {
    e.stopPropagation();
    console.log("siema");
    // find workout element that is clicked
    const workoutEl = e.target.closest(".workout");
    // guard clause
    if (!workoutEl || !e.target.classList.contains("workout-edit")) return;
    // find the workout object that we want to edit
    const workout = this.#workouts.find(
      (work) => workoutEl.dataset.id === work.id
    );
    // show form
    form.classList.toggle("hidden");

    // populate input fields of the form with data from the workout that is beign edited
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;
    formSelect.value = workout.type;
    if (workout.type === "running") {
      inputCadence.value = workout.cadence;
      inputElevation.value = "";
    }
    if (workout.type === "cycling") {
      inputElevation.value = workout.elevationGain;
      inputCadence.value = "";
    }

    // populate hidden id field with workouts id
    inputID.value = workout.id;
  }
  #removeAll() {
    // empty workouts array
    this.#workouts = [];
    // save every workout elemnt into an array
    const workoutEls = document.querySelectorAll(".workout");
    // guard clause
    if (!workoutEls) return;
    // remove every element from an array
    workoutEls.forEach((work) => work.remove());
    //
    // remove every marker from the map
    this.#markers.forEach((marker) => {
      this.#map.removeLayer(marker);
    });
    // remove markers from array
    this.#markers = [];
  }

  #showSorts() {
    sortList.classList.toggle("hidden");
    sortList.classList.toggle("active");
  }
  #renderSortedWorkouts() {
    const workoutsEls = document.querySelectorAll(".workout");
    workoutsEls.forEach((workout) => workout.remove());
    // render all the workouts again
    this.#workouts.forEach((workout) => this.#renderWorkout(workout));
  }

  #sortWorkout(property) {
    this.#workouts.sort((a, b) => b[property] - a[property]);
    // refresh and render sorted workouts
    // clear workouts containera
    this.#renderSortedWorkouts();
  }

  #ZoomToMarkers() {
    if (this.#workouts.length === 0) return;
    // set the view on the entire bounds, so all the markers
    this.#map.fitBounds(this.#bounds);
  }

  #setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  #getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;

    this.#workouts = data;

    this.#workouts = data.map((workout) => {
      workout.date = new Date(workout.date);
      return workout;
    });

    this.#workouts.forEach((workout) => this.#renderWorkout(workout));
  }
}

const app = new App();
