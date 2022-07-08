'use strict';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// GEOLOCATION /////////

// Accepts 2 call back functions, success or else

if (navigator.geolocation) 
navigator.geolocation.getCurrentPosition(
  function(position) {
    const {latitude} = position.coords;
    const {longitude} = position.coords;
    const coords = [latitude, longitude];

    // Parameter is the HTML element id, value in setView is zoom level
    const map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker(coords)
    .addTo(map)
    .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
    .openPopup();

    // Event Listener from Leaflet Library
    map.on('click', function(mapEvent) {
      console.log(mapEvent);
      const {lat, lng} = mapEvent.latlng;

      L.marker([lat, lng])
      .addTo(map)
      // Pass in object to customize popup style Leaflet css library
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
}, 
  function() {
    alert('Could not get your location');
  }
);