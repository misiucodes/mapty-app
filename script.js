'use strict';

// ELEMENTS ////////////////////////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// let map, mapEvent; // assign empty variable to be reassigned in event listeners

////////////////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE 

/* PARENT CLASSES*/

class App {
  #map;
  #mapZoom = 13;
  #mapEvent;
  #workouts = [];
  
  constructor() {
    // Get user's current geo coordinates and load map
    this._getPosition();
    // Event handler - listen for form submits to add new workout
    form.addEventListener('submit', this._newWorkout.bind(this)); 
    // Event handler - listen for form toggle btwn running + cycling field
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  // Methods
  
  //note: need to bind callback functions to the this keyword otherwise it will act as a regular function and return undefined
  _getPosition() {
    if (navigator.geolocation) 
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
      alert('Could not get your location');
    });
  }
  
  _loadMap(position) {
    const {latitude} = position.coords;
    const {longitude} = position.coords;
    const coords = [latitude, longitude];
    
    // Parameter is the HTML element id, value in setView is zoom level
    this.#map = L.map('map').setView(coords, this.#mapZoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);
  
    // Leaflet Event Listener - handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }
  
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus(); // enables blinking cursor in distance field
  }

  _hideForm() {
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    form.style.display = 'none'; // ensures there's no animation first
    form.classList.add('hidden');
    setTimeout(() => form.style.display = 'grid', 1000); // set style back to grid after 1 sec so there's no transition 
  }
  
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  
  _newWorkout(e) {
    // Helper function - will loop over array of inputs to check if valid number
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    
    // Helper function - testing for positive numbers 
    const allPositive = (...inputs) => inputs.every(inp => inp > 0); 

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value; // + converts to number
    const duration = +inputDuration.value;
    const {lat, lng} = this.#mapEvent.latlng;
    let workout;
    
    // If workout running, create running object 
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if(
        !validInputs(distance, duration, cadence) || 
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!'); 

        workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) || 
        !allPositive(distance, duration)
        ) 
        return alert ('Inputs have to be positive numbers!');
      
        workout = new Cycling([lat, lng], distance, duration, elevation);
    }
      
    // Add new object to workout array
    this.#workouts.push(workout); 
    console.log(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkoutList(workout);
    
    // Hide form & clear input fields
    this._hideForm();
  }
  
  _renderWorkoutList(workout) {
    let html = `
      <li class="workout workout--${workout.name}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
      `;

      if (workout.type === 'running') {
        html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
      }

      if (workout.type === 'cycling') {
        html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
        `;
      }

      // Insert HTMl as a sibling element within the form
      form.insertAdjacentHTML('afterend', html);
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
    .addTo(this.#map)
    // Pass in object to customize popup style from Leaflet library
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      })
    )
    .setPopupContent(`${workout.description}`) 
    .openPopup();
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);
    if (!workoutEl) return; // guard clause to prevent clicks outside the container
    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
    // console.log(workout);

    // Leaflet method to zoom in to map marker
    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: {
        duration: 1,
      }
    });
  }
};

const app = new App();

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in mins
  }

  _setDescription() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
};

/* CHILD CLASSES*/

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  
  /*Methods*/
  calcPace() {
    this.pace = this.duration / this.distance; // mins/km
    return this.pace;
  }
};

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }

  /*Methods*/
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); // km/hr
    return this.speed;
  }
};


