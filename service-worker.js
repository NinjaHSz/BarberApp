const CACHE_NAME = "barber-app-v4";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./js/main.js",
  "./js/core/state.js",
  "./js/core/config.js",
  "./js/api/supabase.js",
  "./js/api/sync.js",
  "./js/ui/render.js",
  "./js/ui/handlers.js",
  "./js/ui/navigation.js",
  "./js/ui/theme.js",
  "./js/ui/components/Header.js",
  "./js/ui/components/Sidebar.js",
  "./js/ui/components/MobileNav.js",
  "./js/ui/components/RecordRow.js",
  "./js/ui/components/Autocomplete.js",
  "./js/ui/components/ExpenseAutocomplete.js",
  "./js/ui/components/InlineAutocomplete.js",
  "./js/ui/components/PremiumSelector.js",
  "./js/ui/components/Dialogs.js",
  "./js/ui/pages/Dashboard.js",
  "./js/ui/pages/RecordsPage.js",
  "./js/ui/pages/ClientsPage.js",
  "./js/ui/pages/PlansPage.js",
  "./js/ui/pages/ExpensesPage.js",
  "./js/ui/pages/SetupPage.js",
  "./js/ui/pages/CardsPage.js",
  "./js/ui/pages/CardProfilePage.js",
  "./js/ui/pages/ClientProfilePage.js",
  "./js/ui/pages/ManagePage.js",
  "./js/ui/pages/index.js",
  "./js/ui/modals/EditModal.js",
  "./js/services/appointments.js",
  "./js/services/clients.js",
  "./js/services/stats.js",
  "./js/utils/dom.js",
  "./manifest.json",
  "./assets/logo.png",
  "./assets/logo.ico",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@700;800&display=swap",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return (
          response ||
          fetch(event.request).then((fetchResponse) => {
            // Option: cache new requests dynamically
            return fetchResponse;
          })
        );
      })
      .catch(() => {
        // Fallback or error handling
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
});
