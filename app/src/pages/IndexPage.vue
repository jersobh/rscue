<template>
  <MapContainer
    style="height: 100vh; width: 100%"
    :center="center"
    :zoom="zoom"
  >
    <OpenStreetMap />
    <Marker
      v-for="marker in markers"
      :key="marker.uuid"
      :position="marker.position"
      :icon="marker.icon"
      @click="togglePopup(marker.uuid)"
    >
      <Popup v-if="marker.showPopup">
        <div class="popup-content">
          {{ marker.description }}
          <div>
            <q-btn-group rounded>
              <q-btn
                color="primary"
                rounded
                icon-right="visibility"
                label="View"
              />
              <q-btn color="green" rounded icon-right="check" label="Answer" />
            </q-btn-group>
          </div>
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
import { EventBus } from 'src/EventBus';

const center = ref([-14.235, -51.9253]);
const zoom = ref(14);
const markers = ref([]);

// Toggle the popup visibility for a specific marker
function togglePopup(markerId) {
  const marker = markers.value.find((m) => m.uuid === markerId);
  if (marker) {
    panTo(marker);
    marker.showPopup = !marker.showPopup;
  }
}

// Pan the map to the specified marker
const handlePanTo = (markerId) => {
  const marker = markers.value.find((m) => m.uuid === markerId);
  panTo(marker);
};

// Center the map on the user's current location
function centerOnMe() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        center.value = [position.coords.latitude, position.coords.longitude];
      },
      () => {
        alert('Geolocation is not supported by this browser.');
      }
    );
  }
}

// Pan the map to the specified marker's position
function panTo(marker) {
  if (marker) {
    center.value = marker.position;
  }
}

// Listen for alerts and update markers accordingly
function listenToAlerts() {
  const evtSource = new EventSource('http://192.168.68.103:3000/alerts/stream');
  evtSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'delete') {
      const index = markers.value.findIndex(
        (marker) => marker.uuid === data.uuid
      );
      if (index !== -1) {
        markers.value.splice(index, 1);
      }
    } else if (data.type === 'deleteAll') {
      markers.value = [];
    } else {
      const existingIndex = markers.value.findIndex(
        (marker) => marker.uuid === data.uuid
      );
      const newMarker = {
        ...data,
        position: [data.lat, data.lng],
        icon: `icons/${data.type}.png`,
        showPopup: false,
      };

      if (existingIndex !== -1) {
        Object.assign(markers.value[existingIndex], newMarker);
      } else {
        markers.value.push(newMarker);
      }
    }
  };

  onUnmounted(() => {
    evtSource.close();
  });
}

onMounted(() => {
  listenToAlerts();
  EventBus.on('panTo', handlePanTo);
});
</script>

<style lang="scss">
@import 'leaflet/dist/leaflet.css';

.popup-content {
  font-size: 16px;
  color: #333;
  text-align: center;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
