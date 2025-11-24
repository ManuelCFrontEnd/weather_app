const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherContent = document.getElementById('weather-content');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const forecastGrid = document.getElementById('forecast-grid');

// Weather codes mapping (WMO code)
const weatherCodes = {
    0: { desc: 'Clear sky', icon: 'fa-sun' },
    1: { desc: 'Mainly clear', icon: 'fa-cloud-sun' },
    2: { desc: 'Partly cloudy', icon: 'fa-cloud-sun' },
    3: { desc: 'Overcast', icon: 'fa-cloud' },
    45: { desc: 'Fog', icon: 'fa-smog' },
    48: { desc: 'Depositing rime fog', icon: 'fa-smog' },
    51: { desc: 'Light drizzle', icon: 'fa-cloud-rain' },
    53: { desc: 'Moderate drizzle', icon: 'fa-cloud-rain' },
    55: { desc: 'Dense drizzle', icon: 'fa-cloud-showers-heavy' },
    61: { desc: 'Slight rain', icon: 'fa-cloud-rain' },
    63: { desc: 'Moderate rain', icon: 'fa-cloud-rain' },
    65: { desc: 'Heavy rain', icon: 'fa-cloud-showers-heavy' },
    71: { desc: 'Slight snow', icon: 'fa-snowflake' },
    73: { desc: 'Moderate snow', icon: 'fa-snowflake' },
    75: { desc: 'Heavy snow', icon: 'fa-snowflake' },
    77: { desc: 'Snow grains', icon: 'fa-snowflake' },
    80: { desc: 'Slight rain showers', icon: 'fa-cloud-rain' },
    81: { desc: 'Moderate rain showers', icon: 'fa-cloud-rain' },
    82: { desc: 'Violent rain showers', icon: 'fa-cloud-showers-heavy' },
    95: { desc: 'Thunderstorm', icon: 'fa-bolt' },
    96: { desc: 'Thunderstorm with hail', icon: 'fa-bolt' },
    99: { desc: 'Thunderstorm with heavy hail', icon: 'fa-bolt' }
};

searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    showLoading();

    try {
        const locationData = await getCoordinates(city);
        if (!locationData) {
            showError();
            return;
        }

        const { name, latitude, longitude, country } = locationData;
        const weatherData = await getWeatherData(latitude, longitude);

        updateUI(name, country, weatherData);
        showContent();
    } catch (error) {
        console.error(error);
        showError();
    }
}

async function getCoordinates(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) return null;
    return data.results[0];
}

async function getWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const response = await fetch(url);
    return await response.json();
}

function updateUI(city, country, data) {
    // Current Weather
    document.getElementById('city-name').textContent = `${city}, ${country}`;

    const date = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    document.getElementById('current-date').textContent = date.toLocaleDateString('en-US', options);

    const current = data.current;
    document.getElementById('temperature').textContent = Math.round(current.temperature_2m);
    document.getElementById('wind-speed').textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;

    // Visibility is in meters, convert to km
    const visibilityKm = (current.visibility / 1000).toFixed(1);
    document.getElementById('visibility').textContent = `${visibilityKm} km`;

    const code = current.weather_code;
    const weatherInfo = weatherCodes[code] || { desc: 'Unknown', icon: 'fa-question' };
    document.getElementById('weather-desc').textContent = weatherInfo.desc;

    // Forecast
    forecastGrid.innerHTML = '';
    const daily = data.daily;

    // Display next 7 days (skipping today which is index 0 usually, but let's show 7 days starting from today or tomorrow depending on preference. Let's show next 7 days including today for a full week view)
    for (let i = 0; i < 7; i++) {
        const dateStr = daily.time[i];
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const weatherCode = daily.weather_code[i];
        const info = weatherCodes[weatherCode] || { desc: 'Unknown', icon: 'fa-question' };

        const dayDate = new Date(dateStr);
        const dayName = i === 0 ? 'Today' : dayDate.toLocaleDateString('en-US', { weekday: 'short' });

        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <div class="forecast-icon"><i class="fa-solid ${info.icon}"></i></div>
            <div class="forecast-temp">
                ${maxTemp}° <span class="min-temp">${minTemp}°</span>
            </div>
        `;
        forecastGrid.appendChild(item);
    }
}

function showLoading() {
    weatherContent.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
}

function showContent() {
    loadingSpinner.classList.add('hidden');
    errorMessage.classList.add('hidden');
    weatherContent.classList.remove('hidden');
}

function showError() {
    loadingSpinner.classList.add('hidden');
    weatherContent.classList.add('hidden');
    errorMessage.classList.remove('hidden');
}
