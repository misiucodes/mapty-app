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

let map, mapEvent;

////////////////////////////////////////////////////////////////////
// APP ARCHITECTURE

// Parent Classes //

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
  }
  
  /*Methods*/
  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
      alert("Could not get your location");
    });
  }
  
  _loadMap(position) {
    const {latitude} = position.coords;
    const {longitude} = position.coords;
    const coords = [latitude, longitude];
    
    // Display Leaflet map
    this.#map = L.map('map').setView(coords, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // Get inputs from form
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    let workout;

    // Helper function - check if positive values
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // Helper function - check if valid inputs
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));

    let {lat, lng} = this.#mapEvent.latlng;
    
    e.preventDefault();

    // Logic to check if valid inputs
    if (type === 'running') {
      const cadence = +inputCadence.value;

      if(
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('All inputs must be positive numbers!');

        workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !allPositive(distance, duration) ||
        !validInputs(distance, duration, elevation)
      )
        return alert('All inputs must be positive numbers!');

        workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);
    console.log(workout);

    this.renderWorkoutMarker(workout);

    // Clear input fields
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
  }

  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
     .addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoFocus: false,
        closeOnclick: false,
        className: `${workout.type}-popup`,
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
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
};

/*Child Classes*/

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
};

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
};

  
////////////////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE 

/* PARENT CLASSES*/

// class App {
//   #map;
//   #mapEvent;
//   #workouts = [];
  
//   constructor() {

//     // Get user's current geo coordinates and load map
//     this._getPosition();

//     // Event handler - listen for form submits to add new workout
//     form.addEventListener('submit', this._newWorkout.bind(this)); 

//     // Event handler - listen for form toggle btwn running + cycling field
//     inputType.addEventListener('change', this._toggleElevationField);
//   }

//   // Methods
  
//   //note: need to bind callback functions to the this keyword otherwise it will act as a regular function and return undefined
//   _getPosition() {
//     if (navigator.geolocation) 
//     navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
//       alert('Could not get your location');
//     });
//   }
  
//   _loadMap(position) {
//     const {latitude} = position.coords;
//     const {longitude} = position.coords;
//     const coords = [latitude, longitude];
    
//     // Parameter is the HTML element id, value in setView is zoom level
//     this.#map = L.map('map').setView(coords, 13);
    
//     L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
//       attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//     }).addTo(this.#map);
  
//     // Leaflet Event Listener - handling clicks on map
//     this.#map.on('click', this._showForm.bind(this));
//   }
  
//   _showForm(mapE) {
//     this.#mapEvent = mapE;
//     form.classList.remove('hidden');
//     inputDistance.focus(); // enables blinking cursor in distance field
//   }
  
//   _toggleElevationField() {
//     inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
//     inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
//   }
  
//   _newWorkout(e) {
//     // Helper function - will loop over array of inputs to check if valid number
//     const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    
//     // Helper function - testing for positive numbers 
//     const allPositive = (...inputs) => inputs.every(inp => inp > 0); 

//     e.preventDefault();

//     // Get data from form
//     const type = inputType.value;
//     const distance = +inputDistance.value; // + converts to number
//     const duration = +inputDuration.value;
//     const {lat, lng} = this.#mapEvent.latlng;
//     let workout;
    
//     // If workout running, create running object 
//     if (type === 'running') {
//       const cadence = +inputCadence.value;
//       // Check if data is valid
//       if(
//         !validInputs(distance, duration, cadence) || 
//         !allPositive(distance, duration, cadence)
//       )
//         return alert('Inputs have to be positive numbers!'); 

//         workout = new Running([lat, lng], distance, duration, cadence);
//     }

//     // If workout cycling, create cycling object
//     if (type === 'cycling') {
//       const elevation = +inputElevation.value;
//       // Check if data is valid
//       if (
//         !validInputs(distance, duration, elevation) || 
//         !allPositive(distance, duration)
//         ) 
//         return alert ('Inputs have to be positive numbers!');
      
//         workout = new Cycling([lat, lng], distance, duration, elevation);
//     }
      
//     // Add new object to workout array
//     this.#workouts.push(workout); 
//     console.log(workout);

//     // Render workout on map as marker
//     this.renderWorkoutMarker(workout);

//     // Render workout on list
    
//     // Hide form & clear input fields
//     inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
//   }

//   renderWorkoutMarker(workout) {
//     L.marker(workout.coords)
//     .addTo(this.#map)
//     // Pass in object to customize popup style from Leaflet library
//     .bindPopup(
//       L.popup({
//         maxWidth: 250,
//         minWidth: 100,
//         autoClose: false,
//         closeOnClick: false,
//         className: `${workout.type}-popup`,
//       })
//     )
//     .setPopupContent('workout') // need to fix error
//     .openPopup();
//   }
// };

// const app = new App();

// class Workout {
//   date = new Date();
//   id = (Date.now() + '').slice(-10);

//   constructor(coords, distance, duration) {
//     this.coords = coords; // [lat, lng]
//     this.distance = distance; // in km
//     this.duration = duration; // in mins
//   }
// };

// /* CHILD CLASSES*/

// class Running extends Workout {
//   type = 'running';
//   constructor(coords, distance, duration, cadence) {
//     super(coords, distance, duration);
//     this.cadence = cadence;
//     this.calcPace();
//   }
  
//   /*Methods*/
//   calcPace() {
//     this.pace = this.duration / this.distance; // mins/km
//     return this.pace;
//   }
// };

// class Cycling extends Workout {
//   type = 'cycling';
//   constructor(coords, distance, duration, elevation) {
//     super(coords, distance, duration);
//     this.elevation = elevation;
//     this.calcSpeed();
//   }

//   /*Methods*/
//   calcSpeed() {
//     this.speed = this.distance / (this.duration / 60); // km/hr
//     return this.speed;
//   }
// };






