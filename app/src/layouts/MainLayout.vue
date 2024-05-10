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
          aria-label="Menu"
          @click="toggleRightDrawer"
        />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Alertas </q-item-label>
        <q-item clickable tag="a" v-for="alert in markers" :key="alert.id">
          <q-item-section v-if="alert.icon" avatar>
            <img style="width: 48px" :src="alert.icon" />
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
        <q-item-label header> Configurações </q-item-label>
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
import { ref, onMounted, onUnmounted, watch } from 'vue';

defineOptions({
  name: 'MainLayout',
});

const track = ref(false);
const markers = ref([]);
const options = ref([
  { label: 'Resgate', value: 'rescue' },
  { label: 'SOS', value: 'help' },
]);

const currentMode = ref(options.value[0]);

function listenToAlerts() {
  const evtSource = new EventSource('http://192.168.68.103:3000/alerts/stream');
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
      const existingIndex = markers.value.findIndex(
        (marker) => marker.id === data.id
      );

      const newMarker = {
        ...data,
        position: [data.lat, data.lng],
        icon: `icons/${data.type}.png`,
        showPopup: false,
      };

      if (existingIndex !== -1) {
        // Update the existing marker's position
        markers.value[existingIndex].position = [data.lat, data.lng];
        markers.value[existingIndex].icon = `icons/${data.type}.png`;
        // Optionally update other properties if they have changed
      } else {
        // Add new marker if it doesn't exist
        markers.value.push(newMarker);
      }
    }
  };

  onUnmounted(() => {
    evtSource.close();
  });
}

onMounted(async () => {
  listenToAlerts();
});

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateUUID() {
  const uuid = localStorage.getItem('uuid');
  if (uuid) {
    return uuid;
  }

  const newUUID = uuidv4();
  localStorage.setItem('uuid', newUUID);
  return newUUID;
}

const linksList = [
  {
    title: 'Docs',
    caption: 'quasar.dev',
    icon: 'school',
    link: 'https://quasar.dev',
  },
  {
    title: 'Github',
    caption: 'github.com/quasarframework',
    icon: 'code',
    link: 'https://github.com/quasarframework',
  },
  {
    title: 'Discord Chat Channel',
    caption: 'chat.quasar.dev',
    icon: 'chat',
    link: 'https://chat.quasar.dev',
  },
  {
    title: 'Forum',
    caption: 'forum.quasar.dev',
    icon: 'record_voice_over',
    link: 'https://forum.quasar.dev',
  },
  {
    title: 'Twitter',
    caption: '@quasarframework',
    icon: 'rss_feed',
    link: 'https://twitter.quasar.dev',
  },
  {
    title: 'Facebook',
    caption: '@QuasarFramework',
    icon: 'public',
    link: 'https://facebook.quasar.dev',
  },
  {
    title: 'Quasar Awesome',
    caption: 'Community Quasar projects',
    icon: 'favorite',
    link: 'https://awesome.quasar.dev',
  },
];

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value;
}

const userLocationMarker = ref(null);
const trackWebSocket = ref(null);

const uuid = getOrCreateUUID();
console.log(currentMode.value.value);
watch(track, (newVal) => {
  try {
    if (newVal) {
      // Initialize WebSocket and send location updates
      trackWebSocket.value = new WebSocket('ws://192.168.68.103:3000/ws');
      trackWebSocket.value.onopen = () => {
        if (navigator.geolocation) {
          navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const locationData = JSON.stringify({
                id: uuid,
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
  } catch (error) {
    alert(error);
    if (trackWebSocket.value) {
      trackWebSocket.value.close();
      trackWebSocket.value = null;
    }
  }
});
</script>
