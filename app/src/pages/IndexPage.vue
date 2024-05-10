<template>
  <MapContainer style="height: 100vh" :center="center" :zoom="zoom">
    <OpenStreetMap />
    <Marker
      v-for="marker in markers"
      :key="marker.id"
      :position="marker.position"
      :icon="marker.icon"
      @click="togglePopup(marker.id)"
    >
      <Popup v-if="marker.showPopup">
        <div class="popup-content">
          {{ marker.description }}
        </div>
      </Popup>
    </Marker>
  </MapContainer>
  <q-page-sticky
    @click="centerOnMe"
    position="bottom-right"
    style="z-index: 9999"
    :offset="[18, 18]"
  >
    <q-btn fab icon="my_location" color="primary" />
  </q-page-sticky>
</template>

<script setup>
import { MapContainer, OpenStreetMap, Marker, Popup } from 'vue3-leaflet';
import { ref, onMounted, onUnmounted } from 'vue';

const center = ref([-14.235, -51.9253]);
const zoom = ref(4);
const markers = ref([]);

function togglePopup(markerId) {
  const marker = markers.value.find((m) => m.id === markerId);
  if (marker) {
    marker.showPopup = !marker.showPopup;
  }
}

async function fetchMarkers() {
  try {
    const response = await fetch('http://localhost:3000/alerts');
    const data = await response.json();
    markers.value = data.map((marker) => ({
      ...marker,
      position: [marker.lat, marker.lng],
      icon: `/src/assets/${marker.type}.png`,
      showPopup: false,
    }));
  } catch (error) {
    console.error('Failed to fetch markers:', error);
  }
}

function centerOnMe() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        center.value = currentLocation;
      },
      () => {
        alert('Geolocation is not supported by this browser.');
      }
    );
  }
}

function listenToAlerts() {
  const evtSource = new EventSource('http://localhost:3000/alerts/stream');
  evtSource.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.type === 'delete') {
      const index = markers.value.findIndex((marker) => marker.id === data.id);
      if (index !== -1) {
        markers.value.splice(index, 1);
      }
    } else if (data.type === 'deleteAll') {
      markers.value = [];
    } else {
      markers.value.push({
        ...data,
        position: [data.lat, data.lng],
        icon: `/src/assets/${data.type}.png`,
        showPopup: false,
      });
    }
  };

  onUnmounted(() => {
    evtSource.close();
  });
}

onMounted(async () => {
  fetchMarkers();
  listenToAlerts();
});
</script>

<style lang="scss">
@import 'leaflet/dist/leaflet.css';

.popup-content {
  font-size: 16px;
  color: #333;
}
</style>
