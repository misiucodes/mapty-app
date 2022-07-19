'use strict';

// ELEMENTS ////////////////////////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnReset = document.querySelector('.btn__reset');
const modal = document.querySelector('.modal');
const modalError = document.querySelector('.modal__error');
const modalErrorInput = document.querySelector('.modal__error--input');
const overlay = document.querySelector('.overlay');
const btnCloseModal = document.querySelector('.close-modal');
const btnCloseModalError = document.querySelector('.close-modal-error');
const btnCloseModalErrorInput = document.querySelector('.close-modal-error-input')


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
    
    // Event handler - delete workout
    containerWorkouts.addEventListener('click', (e) => {
      const btnDelete = e.target.closest('.btn__delete');
      if (!btnDelete) this._moveToPopup(e);
      else {
        const selectedEl = e.target.closest('.workout');
        if (!selectedEl) return;
        this.deleteWorkout(selectedEl.dataset.id);
      }
    });

    containerWorkouts.addEventListener('click', function (e) {
        if (!e) return;
        this._editWorkout(e);
      }.bind(this)
    );

    // Event handler - reset button
    btnReset.addEventListener('click', this.reset.bind(this));
  }

  /* Methods*/
  _getPosition() {
    const closeModal = function () {
      modal.classList.add('hidden');
      overlay.classList.add('hidden');
    }

    const openModal = function () {
      modal.classList.remove('hidden');
      overlay.classList.remove('hidden');
    }

    if (navigator.geolocation) 
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), openModal);
    else closeModal;

    btnCloseModal.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
      }
    });
  }
  
  _loadMap(position) {
    const {latitude} = position.coords;
    const {longitude} = position.coords;
    const coords = [latitude, longitude];
    
    this.#map = L.map('map').setView(coords, this.#mapZoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);
  
    // Leaflet Event Listener - handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    // If data in local storage, render workout markers on map. Logic needs to live here because at this point map will be loaded
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
  
  _newWorkout(e) {
    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value; // + converts to number
    const duration = +inputDuration.value;
    const {lat, lng} = this.#mapEvent.latlng;
    let workout;

    const openModalError = function () {
      modalError.classList.remove('hidden');
      overlay.classList.remove('hidden');

      btnCloseModalError.addEventListener('click', closeModalError);
      overlay.addEventListener('click', closeModalError);
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modalError.classList.contains('hidden')) {
          closeModalError();
        }
      });
    }

    const closeModalError = function () {
      modalError.classList.add('hidden');
      overlay.classList.add('hidden');
    }
    
    // If workout running, create running object 
    if (type === 'running') {

      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        !this._validInputs(distance, duration, cadence) || 
        !this._allPositive(distance, duration, cadence)
      ) 
       return openModalError();
          
       workout = new Running([lat, lng], distance, duration, cadence);
      }
    

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (
        !this._validInputs(distance, duration, elevation) || 
        !this._allPositive(distance, duration)
        ) 
        return openModalError();
      
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

    // Listen for edit changes
    const workoutContainer = document.querySelector('.workout');
    workoutContainer.addEventListener('click', this._editWorkout.bind(this));

    // Set local storage to all workouts
    this._setLocalStorage();
  }
  
  _renderWorkoutList(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}
          <div class="workout__options">
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
            <span class="workout__value workout__value--pace" id="value-pace" data-type="pace">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value" data-type="cadence">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
      }

      if (workout.type === 'cycling') {
        html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value workout__value--speed" id="value-speed" data-type="speed">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value" data-type="elevation">${workout.elevation}</span>
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

  // Helper functions - check user input 
  _validInputs(...inputs) {
    return inputs.every(inp => Number.isFinite(inp));
  }

  _allPositive(...inputs) {
    return inputs.every(inp => inp > 0);
  }

  _editWorkout(e) {
    if (e.target.classList.contains('form__btn')) return;
    e.preventDefault();
    const currentEl = e.target.closest('.workout');
    const valueEl = e.target.closest('.workout__value');
    const valueElDataSet = valueEl?.dataset?.type;
    const speedEl = currentEl?.querySelector('#value-pace');
    const paceEl = currentEl?.querySelector('#value-speed');

    const openModalErrorInput = function () {
      modalErrorInput.classList.remove('hidden');
      overlay.classList.remove('hidden');

      btnCloseModalErrorInput.addEventListener('click', closeModalErrorInput);
      overlay.addEventListener('click', closeModalErrorInput);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modalErrorInput.classList.contains('hidden')) {
          closeModalErrorInput();
        }
      })
    }

    const closeModalErrorInput = function () {
      modalErrorInput.classList.add('hidden');
      overlay.classList.add('hidden');
    }

    if(!valueEl || !currentEl) return;
    if(valueElDataSet === 'pace' || valueElDataSet === 'speed')
      return openModalErrorInput();
      
    const html = `
      <form class="form-edit">
        <label></label>
        <input type="text" class="form-edit__number" />
      </form>
      `;

    if (valueEl.firstElementChild) return;
    valueEl.insertAdjacentHTML('afterbegin', html);

    const formEdit = document.querySelector('.form-edit');
    const userInputField = document.querySelector('.form-edit__number');
    userInputField.focus();

    formEdit.addEventListener('submit', function(e) {
      e.preventDefault();
      const userInputValue = userInputField.value;
      const currentElId = currentEl.dataset.id;

      if (
        !this._validInputs(+userInputValue) ||
        !this._allPositive(+userInputValue) 
      )
        return openModalErrorInput();
          
      this._updateWorkoutArr(currentElId, valueElDataSet, userInputValue);
        
      formEdit.remove();
        
      if(userInputField.value === '') return;
      valueEl.textContent = userInputValue;
        
      if(speedEl !== null) {
        const speedElData = speedEl.dataset.type;
        this._updateCalcUi(currentElId, speedElData, speedEl);
      }
        
      if(paceEl !== null) {
        const paceElData = paceEl.dataset.type;
        this._updateCalcUi(currentElId, paceElData, paceEl);
      }
        
      this._setLocalStorage();
      }.bind(this));
    }
    
    _updateCalcUi(dataId, dataType, el) {
      this.#workouts.forEach(workout => {
        if (workout.id === dataId) {
          if (dataType === 'speed') {
            if (!workout.calcSpeed) return;
            workout.calcSpeed();
            el.textContent = workout.speed.toFixed(1);
          }
          if (dataType === 'pace') {
            if (!workout.calcPace) return;
            workout.calcPace();
            el.textContent = workout.pace.toFixed(1);
          }
        }
      });
    }
  
    _updateWorkoutArr(dataId, dataType, number) {
      this.#workouts.forEach(workout => {
        if(workout.id === dataId) {
          if (dataType === 'duration') workout.duration = +number;
          if (dataType === 'cadence') workout.cadence = +number;
          if (dataType === 'distance') workout.distance = +number;
          if (dataType === 'elevation') workout.elevation = +number;
        }
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

  // For later - add modal pop up "are you sure you want to delete all your workouts?"
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


