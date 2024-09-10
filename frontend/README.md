# frontend

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Telefon debug
Start google chrome
chrome://inspect/#devices

### OBS
Når URL'en ændres skal der ændres i .env og i src/config.ts
Gå ind i Udviklerværktøj under Lager / Cache Storage og slet cachen

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### Overordnet Skitse af Applikationen

    Hovedstruktur:
        App.vue: Dette er hovedkomponenten, hvor Vue-applikation er indlejret.
        main.ts: Entry point til applikationen. Den initialiserer Vue-instansen og mount’er applikationen til DOM.
        router/index.ts: Konfigurerer ruterne i applikationen. Håndterer navigation mellem forskellige views.

    Vuex Store:
        State Management: Vuex bruges til at holde styr på applikationens state, såsom markers og harbors.
        Actions, Mutations, Getters: Disse bruges til at hente data fra backend, opdatere state og tilgå data i state.

    Services:
        markerService.ts: Håndterer HTTP-anmodninger relateret til markers, såsom at oprette, hente eller slette markers fra backend.
        indexedDBService.ts: Håndterer offline lagring af data i IndexedDB, så applikationen kan fungere, selv når der ikke er netværksforbindelse.

    Kortintegration:
        Google Maps API: Applikationen integrerer Google Maps, hvor brugere kan placere markører. Denne integration er sandsynligvis håndteret i en Vue-komponent og understøttet af shims-google-maps.d.ts.

    Service Worker:
        registerServiceWorker.ts: Håndterer caching af applikationen og offline funktionalitet, sikrer at applikationen fungerer, selv når brugeren mister internetforbindelsen.

### Gennemgang af Placering af Markør (Hvordan Information Flyder)

    Nu vil jeg forklare, hvordan processen med at placere en markør fungerer i applikationen. Vi vil se på, hvordan data flyder fra, at en bruger placerer en markør på kortet, til en HTTP-anmodning bliver sendt til backend for at gemme markøren.

    Bruger Interagerer med Kortet:
        Komponent: Det hele starter i en Vue-komponent (f.eks. MapView.vue), hvor kortet er indlejret.
        Bruger Handling: Brugeren klikker på et punkt på kortet for at placere en markør.
        Event Handling: Dette klik genererer et event, som håndteres af en metode som placeMarker.

    Oprettelse af Markør i State:
        Vuex Store: placeMarker-metoden kalder en Vuex action (f.eks. addMarker), som opretter en markør i applikationens state.
        Mutation: Denne action bruger en mutation (f.eks. SET_MARKERS) til at opdatere state med den nye markør.
        UI Opdatering: Fordi Vuex store er reaktiv, vil kortet i Vue-komponenten automatisk blive opdateret for at vise den nye markør.

    HTTP Anmodning til Backend:
        Service Kald: Inden eller efter markøren gemmes i state, kalder addMarker-actionen markerService.ts, som sender en HTTP POST-anmodning til backend.
        Payload: Anmodningen inkluderer data såsom lat, lng, type, og name, som er nødvendige for at gemme markøren i databasen.
        Respons Handling: Hvis backend’en svarer med en succesfuld respons, kan Vuex store blive opdateret med den nøjagtige data fra backend, f.eks. det genererede ID for markøren.

    Offline Håndtering via Service Worker:
        Service Worker: Hvis applikationen er offline, håndterer service worker’en anmodningen ved at gemme den i en kø, så den kan sendes senere.
        IndexedDB: indexedDBService.ts kan bruges til midlertidigt at gemme markøren lokalt, indtil forbindelsen genoprettes.
        Synkronisering: Når forbindelsen er genoprettet, synkroniserer service worker’en de ventende anmodninger med backend.

    Backend Gemmer Markøren:
        Database Operation: Backend’en modtager POST-anmodningen og gemmer markøren i databasen.
        PostGIS: Hvis du bruger PostGIS, vil markørens lat og lng blive gemt som en geografisk GEOMETRY eller GEOGRAPHY type i databasen.
        Respons til Frontend: Backend’en sender en respons tilbage til applikationen, som bekræfter, at markøren er gemt.

## Google maps noter
### Example code
      https://developers.google.com/maps/documentation/javascript/add-google-map
### AdvancedMarkerElement
      https://developers.google.com/maps/documentation/javascript/reference/advanced-markers
### controls
      https://developers.google.com/maps/documentation/javascript/controls
        {
          zoomControl: boolean,
          mapTypeControl: boolean,
          scaleControl: boolean,
          streetViewControl: boolean,
          rotateControl: boolean,
          fullscreenControl: boolean
        }
### MapOptions
  https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions


  