'use strict';

// ELEMENTS ////////////////////////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
let inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnReset = document.querySelector('.btn__reset');
const btnForm = document.querySelector('.form__btn');

////////////////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE 

/* PARENT CLASSES*/

class App {
  #map;
  #mapZoom = 13;
  #mapEvent;
  #markers = [];
  #workouts = [];
  
  constructor() {
    // Get user's coordinates
    this._getPosition();
    // Event handler - get data from local storage
    this._getLocalStorage();
    // Event handler - listen for form submits to add new workout
    form.addEventListener('submit', this._newWorkout.bind(this)); 
    // Event handler - listen for form toggle btwn running + cycling field
    inputType.addEventListener('change', this._toggleElevationField);
    // Event handler - listen for clicks in workout container to delete/movetoPopup
    containerWorkouts.addEventListener('click', (e) => {
      const btnDelete = e.target.closest('.btn__delete');
      const btnEdit = e.target.closest('.btn__edit');
      const selectedEl = e.target.closest('.workout');

      if(btnDelete) this._deleteWorkout(selectedEl.dataset.id);
      if(btnEdit) this._editWorkout(selectedEl.dataset.id);
      else {
        this._moveToPopup(e);
      }
    });
    // Event handler - reset button
    btnReset.addEventListener('click', this.reset.bind(this));
  }

  /* Methods note: need to bind callback functions to the this keyword otherwise it will act as a regular function and return undefined*/
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

    // If data in local storage, render workout markers on map. Logic needs to live here because at this point, the map will be loaded
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
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

  _editWorkout(id, workCoords) {

    const editEl = document.querySelector(`[data-id="${id}"]`);
    this.#workoutCoords.latlng = workCoords;
    console.log(editCoords);
    let editType = 'Running';
    let editDuration = String(editEl.children[2].children[1].innerHTML);
    let editDistance = String(editEl.children[3].children[1].innerHTML);
    let editWorkout;
    
    // Reassign form field values into edit form
    inputType.value = editType;
    inputDistance.value = editDistance;
    inputDuration.value = editDuration;
    
  
    this._showForm();
    
    if (editType === 'Running') {
      let editCadence = String(editEl.children[4].children[1].innerHTML);
      inputCadence.value = editCadence;
      
      editWorkout = new Running(workoutCoords, editDistance, editDuration, editCadence);
      // this.#workouts.push(editWorkout);
      // this._renderWorkoutList(editWorkout);
      // this._renderWorkoutMarker(editWorkout);
    }
    editEl.remove();
  }
  
  _newWorkout(e) {
    // Helper function - loop over array of inputs to check if valid number
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    
    // Helper function - check for positive numbers 
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

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkoutList(workout);
    
    // Hide form & clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }
  
  _renderWorkoutList(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}
          <div class="workout__options">
            <span class="btn__edit"><i class="fa-solid fa-pen-to-square"></i></span>
            <span class="btn__delete"><i class="fa-solid fa-trash-can"></i></span>
          </div>
        </h2>
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
    let marker = 
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

    this.#markers.push(marker);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return; // guard clause to prevent clicks outside the container
    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

    // Leaflet method to zoom in to map marker
    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: {
        duration: 1,
      }
    });
  }

  _setLocalStorage() {
    // Local storage API from browser - takes in 2 parameters, name and string - can use JSON.stringify to pass in an object 
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // Guard clause - Check if there's any data in local storage
    if (!data) return;
    // If data exists, restore workouts array and display in list and map
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkoutList(work);
    });
  }

  deleteWorkout(id) {
    const domEl = document.querySelector(`[data-id="${id}"]`);
      this.#workouts.forEach((work, i) => {
        if(work.id === id) {
        this.#workouts.splice(i, 1);
        this.#markers[i].remove();
        this.#markers.splice(i, 1);
      }
    });
    this._setLocalStorage();
    domEl.remove();
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
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