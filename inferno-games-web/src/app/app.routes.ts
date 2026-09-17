import { Routes } from '@angular/router';

// Every route is lazy: each feature component becomes its own chunk instead of
// riding along in the initial bundle. Order matters, the literal `games/*` paths
// must stay ahead of `games/:id` or they get captured by the param route.
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    title: 'Dashboard | Inferno Games',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'games',
    title: 'Games | Inferno Games',
    loadComponent: () =>
      import('./components/games/list/games-list.component').then((m) => m.GamesListComponent),
  },
  {
    path: 'games/new',
    title: 'Add Game | Inferno Games',
    loadComponent: () =>
      import('./components/games/form/game-form.component').then((m) => m.GameFormComponent),
  },
  {
    path: 'games/search',
    title: 'Search IGDB | Inferno Games',
    loadComponent: () =>
      import('./components/igdb/search/igdb-search.component').then((m) => m.IgdbSearchComponent),
  },
  {
    path: 'games/:id',
    title: 'Game | Inferno Games',
    loadComponent: () =>
      import('./components/games/detail/game-detail.component').then((m) => m.GameDetailComponent),
  },
  {
    path: 'games/:id/edit',
    title: 'Edit Game | Inferno Games',
    loadComponent: () =>
      import('./components/games/form/game-form.component').then((m) => m.GameFormComponent),
  },
  {
    path: 'steam/library',
    title: 'Steam Library | Inferno Games',
    loadComponent: () =>
      import('./components/steam/library/steam-library.component').then(
        (m) => m.SteamLibraryComponent
      ),
  },
  {
    path: 'steam/stats',
    title: 'Steam Stats | Inferno Games',
    loadComponent: () =>
      import('./components/steam/stats/steam-stats.component').then((m) => m.SteamStatsComponent),
  },
  { path: '**', redirectTo: '/dashboard' },
];
