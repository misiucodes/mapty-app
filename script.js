'use strict';

// ELEMENTS ////////////////////////////////
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
  #mapEvent;
  
  constructor() {
    // Get user's current geo coordinates and load map
    this._getPosition();

    // Event handler - listen for form submits to add new workout
    form.addEventListener('submit', this._newWorkout.bind(this)); 

    // Event handler - listen for form toggle btwn running + cycling field
    inputType.addEventListener('change', this._toggleElevationField);
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
    this.#map = L.map('map').setView(coords, 13);
    
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
  
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  
  _newWorkout(e) {
    e.preventDefault();
  
    // Clear input fields
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
  
    // Display marker
    const {lat, lng} = this.#mapEvent.latlng;
    
    L.marker([lat, lng])
    .addTo(this.#map)
    // Pass in object to customize popup style from Leaflet library
    .bindPopup(L.popup({
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: 'running-popup',
      })
    )
    .setPopupContent('Workout')
    .openPopup();
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
};

/* CHILD CLASSES*/

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  
  /*Methods*/
  calcPace() {
    this.pace = this.duration / this.distance; // mins/km
    return this.pace;
  }
};

class Cycling extends Workout {
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
  }

  /*Methods*/
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); // km/hr
    return this.speed;
  }
};


