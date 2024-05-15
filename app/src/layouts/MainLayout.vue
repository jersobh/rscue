<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title> RSCUE </q-toolbar-title>
        <q-toggle v-model="track" color="green" label="Track me" left-label />
        <q-btn
          flat
          dense
          round
          icon="settings"
          aria-label="Settings"
          @click="toggleRightDrawer"
        />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>Alertas</q-item-label>
        <q-item
          v-for="alert in markers"
          :key="alert.uuid"
          clickable
          tag="a"
          @click="panTo(alert.uuid)"
        >
          <q-item-section v-if="alert.icon" avatar>
            <img :src="alert.icon" style="width: 48px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ alert.event_name }}</q-item-label>
            <q-item-label caption>{{ alert.description }}</q-item-label>
            <q-item-label caption>{{ alert.contact_number }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-drawer v-model="rightDrawerOpen" side="right" show-if-above bordered>
      <q-list>
        <q-item-label header>Configurações</q-item-label>
        <q-item>
          <q-item-section>
            <q-select
              filled
              v-model="currentMode"
              :options="options"
              label="Modo"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineEmits } from 'vue';
import { EventBus } from 'src/EventBus';

defineOptions({
  name: 'MainLayout',
});

// State variables
const track = ref(false);
const markers = ref([]);
const options = ref([
  { label: 'Resgate', value: 'rescue' },
  { label: 'SOS', value: 'help' },
]);
const currentMode = ref(options.value[0]);
const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);
const trackWebSocket = ref(null);

// Utility functions
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateUUID() {
  let uuid = localStorage.getItem('uuid');
  if (!uuid) {
    uuid = uuidv4();
    localStorage.setItem('uuid', uuid);
  }
  return uuid;
}

const uuid = getOrCreateUUID();

// Drawer toggle functions
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value;
}

// Event handling functions
function panTo(uuid) {
  EventBus.emit('panTo', uuid);
}

// Listen to alerts and update markers
function listenToAlerts() {
  const evtSource = new EventSource('http://192.168.68.103:3000/alerts/stream');
  evtSource.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.type === 'delete') {
      const index = markers.value.findIndex(
        (marker) => marker.uuid === data.uuid
      );
      if (index !== -1) markers.value.splice(index, 1);
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

// Initialize the alert listener on component mount
onMounted(() => {
  listenToAlerts();
});

// Watch for changes in the 'track' state and handle WebSocket connections
watch(track, (newVal) => {
  if (newVal) {
    trackWebSocket.value = new WebSocket('ws://192.168.68.103:3000/ws');
    trackWebSocket.value.onopen = () => {
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const locationData = JSON.stringify({
              uuid: uuid,
              type: currentMode.value.value,
              lat: latitude,
              lng: longitude,
              event_name: 'Doação de pix',
              description: 'Preciso de dinheiro para comprar mantimentos',
              tags: ['animal', 'resgate', 'pelotas'],
              contact_number: '+555330000000',
            });
            trackWebSocket.value.send(locationData);
          },
          (error) => {
            console.error('Geolocation error:', error);
          },
          {
            enableHighAccuracy: true,
          }
        );
      }
    };
  } else {
    if (trackWebSocket.value) {
      trackWebSocket.value.close();
      trackWebSocket.value = null;
    }
  }
});
</script>
