'use strict';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map, mapEvent; // assign empty variable to be reassigned in event listeners


// GEOLOCATION /////////

// Accepts 2 call back functions, success or else

if (navigator.geolocation) 
navigator.geolocation.getCurrentPosition(
  function(position) {
    const {latitude} = position.coords;
    const {longitude} = position.coords;
    const coords = [latitude, longitude];

    // Parameter is the HTML element id, value in setView is zoom level
    map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Leaflet Event Listener - handling clicks on map
    map.on('click', function(mapE) {
      // Show form on map click
      mapEvent = mapE;
      form.classList.remove('hidden');
      inputDistance.focus(); // enables blinking cursor in distance field
    });
  }, 
  function() {
      alert('Could not get your location');
    }
  );
  
  // Event Listener - handling popup marker upon form submit
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Clear input fields
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    // Display marker
    const {lat, lng} = mapEvent.latlng;
  
    L.marker([lat, lng])
    .addTo(map)
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
});

// Event Listener - handling switch from running to cycling
inputType.addEventListener('change', function() {
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});