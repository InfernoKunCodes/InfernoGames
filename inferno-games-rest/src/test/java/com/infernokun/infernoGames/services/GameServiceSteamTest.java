package com.infernokun.infernoGames.services;

import com.infernokun.infernoGames.models.Game;
import com.infernokun.infernoGames.models.enums.GamePlatform;
import com.infernokun.infernoGames.repositories.GameRepository;
import com.infernokun.infernoGames.services.SteamService.SteamGameInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("GameService Steam Integration Tests")
class GameServiceSteamTest {

    @Mock private GameRepository gameRepository;
    @Mock private IGDBService igdbService;
    @Mock private SteamService steamService;

    @InjectMocks private GameService gameService;

    private SteamGameInfo ownedGame;

    @BeforeEach
    void setUp() {
        ownedGame = SteamService.SteamGameInfo.builder()
                .appId("10").name("Half-Life 2").playtimeForever(600)
                .playtimeWindowsForever(600).playtimeDeckForever(0)
                .genres(new ArrayList<>()).build();
    }

    @Nested
    @DisplayName("Delegations")
    class Delegations {

        @Test
        @DisplayName("checkSteamOwnership delegates to SteamService")
        void checkOwnership() {
            when(steamService.isGameOwned("10")).thenReturn(true);
            assertThat(gameService.checkSteamOwnership("10")).isTrue();
        }

        @Test
        @DisplayName("getSteamGameInfo delegates to SteamService")
        void getGameInfo() {
            when(steamService.getGameInfo("10")).thenReturn(Optional.of(ownedGame));
            assertThat(gameService.getSteamGameInfo("10")).isPresent();
        }

        @Test
        @DisplayName("isSteamConfigured delegates to SteamService")
        void isConfigured() {
            when(steamService.isConfigured()).thenReturn(true);
            assertThat(gameService.isSteamConfigured()).isTrue();
        }

        @Test
        @DisplayName("searchSteamGames delegates to SteamService")
        void searchSteam() {
            when(steamService.searchOwnedGames("half")).thenReturn(List.of(ownedGame));
            assertThat(gameService.searchSteamGames("half")).hasSize(1);
        }

        @Test
        @DisplayName("getMostPlayedSteamGames delegates to SteamService")
        void mostPlayed() {
            when(steamService.getMostPlayedGames(5)).thenReturn(List.of(ownedGame));
            assertThat(gameService.getMostPlayedSteamGames(5)).hasSize(1);
        }

        @Test
        @DisplayName("refreshSteamCache delegates to SteamService")
        void refreshCache() {
            gameService.refreshSteamCache();
            verify(steamService).refreshOwnedGamesCache();
        }
    }

    @Nested
    @DisplayName("getSteamLibraryWithGenres")
    class LibraryWithGenres {

        @Test
        @DisplayName("marks backlog games and copies their genres")
        void mergesBacklogData() {
            when(steamService.getOwnedGames()).thenReturn(new ArrayList<>(List.of(ownedGame)));
            Game backlog = Game.builder().id(7L).title("Half-Life 2").steamAppId("10")
                    .genres(new ArrayList<>(List.of("Shooter"))).build();
            when(gameRepository.findAll()).thenReturn(List.of(backlog));

            List<SteamGameInfo> result = gameService.getSteamLibraryWithGenres();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).isInBacklog()).isTrue();
            assertThat(result.get(0).getBacklogGameId()).isEqualTo(7L);
            assertThat(result.get(0).getGenres()).containsExactly("Shooter");
        }

        @Test
        @DisplayName("leaves non-backlog games without genres when nothing cached")
        void nonBacklogNoGenres() {
            when(steamService.getOwnedGames()).thenReturn(new ArrayList<>(List.of(ownedGame)));
            when(gameRepository.findAll()).thenReturn(List.of());

            List<SteamGameInfo> result = gameService.getSteamLibraryWithGenres();

            assertThat(result.get(0).isInBacklog()).isFalse();
            assertThat(result.get(0).getGenres()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Genre cache")
    class GenreCache {

        @Test
        @DisplayName("cache starts empty and clears cleanly")
        void cacheLifecycle() {
            assertThat(gameService.getCachedGenreCount()).isZero();
            assertThat(gameService.getCachedSteamGenres()).isEmpty();
            gameService.clearIgdbGenreCache();
            assertThat(gameService.getCachedGenreCount()).isZero();
        }

        @Test
        @DisplayName("enrichment exits early when no games need lookup")
        void enrichmentNoLookupNeeded() {
            when(steamService.getOwnedGames()).thenReturn(List.of(ownedGame));
            Game backlog = Game.builder().id(7L).title("Half-Life 2").steamAppId("10").build();
            when(gameRepository.findAll()).thenReturn(List.of(backlog));

            gameService.enrichSteamLibraryGenresInBackground();

            verify(igdbService, never()).searchGames(anyString());
            assertThat(gameService.isEnrichmentInProgress()).isFalse();
        }
    }

    @Nested
    @DisplayName("syncGameSteamData")
    class SyncGameData {

        @Test
        @DisplayName("throws when game has no Steam App ID")
        void throwsWhenNoAppId() {
            Game g = Game.builder().id(1L).title("x").steamAppId(null).build();
            when(gameRepository.findById(1L)).thenReturn(Optional.of(g));
            assertThatThrownBy(() -> gameService.syncGameSteamData(1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("no Steam App ID");
        }

        @Test
        @DisplayName("throws when game not found in Steam library")
        void throwsWhenNotOwned() {
            Game g = Game.builder().id(1L).title("x").steamAppId("10").playtimeHours(0.0).build();
            when(gameRepository.findById(1L)).thenReturn(Optional.of(g));
            when(steamService.checkOwnership("10")).thenReturn(Optional.empty());
            assertThatThrownBy(() -> gameService.syncGameSteamData(1L))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("populates Steam data and saves when owned")
        void savesWhenOwned() {
            Game g = Game.builder().id(1L).title("x").steamAppId("10").playtimeHours(0.0).build();
            when(gameRepository.findById(1L)).thenReturn(Optional.of(g));
            when(steamService.checkOwnership("10")).thenReturn(Optional.of(ownedGame));
            when(gameRepository.save(any(Game.class))).thenAnswer(i -> i.getArgument(0));

            Game result = gameService.syncGameSteamData(1L);

            assertThat(result.getPlaytimeHours()).isEqualTo(10.0); // 600 min / 60
            assertThat(result.getSteamLastSynced()).isNotNull();
            verify(gameRepository).save(g);
        }
    }

    @Nested
    @DisplayName("migrateExistingSteamData")
    class Migrate {

        @Test
        @DisplayName("returns 0 when Steam not configured")
        void zeroWhenNotConfigured() {
            when(steamService.isConfigured()).thenReturn(false);
            assertThat(gameService.migrateExistingSteamData()).isZero();
        }

        @Test
        @DisplayName("populates unsynced Steam games and sets PC platform")
        void migratesUnsynced() {
            when(steamService.isConfigured()).thenReturn(true);
            Game g = Game.builder().id(1L).title("x").steamAppId("10")
                    .platform(null).steamLastSynced(null).playtimeHours(0.0).build();
            when(gameRepository.findAll()).thenReturn(List.of(g));
            when(steamService.checkOwnership("10")).thenReturn(Optional.of(ownedGame));

            int count = gameService.migrateExistingSteamData();

            assertThat(count).isEqualTo(1);
            assertThat(g.getPlatform()).isEqualTo(GamePlatform.PC);
            verify(gameRepository).save(g);
        }
    }
}
