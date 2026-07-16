package com.infernokun.infernoGames.services;

import com.infernokun.infernoGames.models.Game;
import com.infernokun.infernoGames.models.enums.GamePlatform;
import com.infernokun.infernoGames.repositories.GameRepository;
import com.infernokun.infernoGames.services.SteamService.SteamGameInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SteamSyncScheduler Tests")
class SteamSyncSchedulerTest {

    @Mock private SteamService steamService;
    @Mock private GameRepository gameRepository;
    @Mock private GameService gameService;

    @InjectMocks private SteamSyncScheduler scheduler;

    private Game steamGame(String appId) {
        return Game.builder().id(1L).title("Steam Game").steamAppId(appId)
                .platform(GamePlatform.PC).playtimeHours(0.0).build();
    }

    private SteamGameInfo info(int playtimeMinutes) {
        return SteamGameInfo.builder().appId("10").name("Steam Game")
                .playtimeForever(playtimeMinutes).rtimeLastPlayed(0).build();
    }

    @Nested
    @DisplayName("syncSteamPlaytime")
    class SyncPlaytime {

        @Test
        @DisplayName("skips work when Steam is not configured")
        void skipsWhenNotConfigured() {
            when(steamService.isConfigured()).thenReturn(false);
            scheduler.syncSteamPlaytime();
            verify(steamService, never()).refreshOwnedGamesCache();
            verify(gameRepository, never()).findAll();
        }

        @Test
        @DisplayName("updates and saves games with changed Steam data")
        void updatesChangedGames() {
            when(steamService.isConfigured()).thenReturn(true);
            when(gameRepository.findAll()).thenReturn(List.of(steamGame("10")));
            when(steamService.checkOwnership("10")).thenReturn(Optional.of(info(120)));

            scheduler.syncSteamPlaytime();

            verify(steamService).refreshOwnedGamesCache();
            verify(gameRepository).save(any(Game.class));
        }

        @Test
        @DisplayName("ignores games without a Steam App ID")
        void ignoresGamesWithoutAppId() {
            when(steamService.isConfigured()).thenReturn(true);
            Game noSteam = Game.builder().id(2L).title("No Steam").steamAppId(null).build();
            when(gameRepository.findAll()).thenReturn(List.of(noSteam));

            scheduler.syncSteamPlaytime();

            verify(gameRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("syncSingleGame")
    class SyncSingle {

        @Test
        @DisplayName("returns false when not configured")
        void falseWhenNotConfigured() {
            when(steamService.isConfigured()).thenReturn(false);
            assertThat(scheduler.syncSingleGame(1L)).isFalse();
        }

        @Test
        @DisplayName("returns false when game not found")
        void falseWhenGameMissing() {
            when(steamService.isConfigured()).thenReturn(true);
            when(gameRepository.findById(1L)).thenReturn(Optional.empty());
            assertThat(scheduler.syncSingleGame(1L)).isFalse();
        }

        @Test
        @DisplayName("returns false when game has no Steam App ID")
        void falseWhenNoAppId() {
            when(steamService.isConfigured()).thenReturn(true);
            Game g = Game.builder().id(1L).title("x").steamAppId(null).build();
            when(gameRepository.findById(1L)).thenReturn(Optional.of(g));
            assertThat(scheduler.syncSingleGame(1L)).isFalse();
        }

        @Test
        @DisplayName("returns false when game not in Steam library")
        void falseWhenNotOwned() {
            when(steamService.isConfigured()).thenReturn(true);
            when(gameRepository.findById(1L)).thenReturn(Optional.of(steamGame("10")));
            when(steamService.checkOwnership("10")).thenReturn(Optional.empty());
            assertThat(scheduler.syncSingleGame(1L)).isFalse();
        }

        @Test
        @DisplayName("syncs and saves when game is owned")
        void savesWhenOwned() {
            when(steamService.isConfigured()).thenReturn(true);
            when(gameRepository.findById(1L)).thenReturn(Optional.of(steamGame("10")));
            when(steamService.checkOwnership("10")).thenReturn(Optional.of(info(300)));

            assertThat(scheduler.syncSingleGame(1L)).isTrue();
            verify(gameRepository).save(any(Game.class));
        }
    }

    @Nested
    @DisplayName("validateSteamPlatforms")
    class ValidatePlatforms {

        @Test
        @DisplayName("returns 0 when not configured")
        void zeroWhenNotConfigured() {
            when(steamService.isConfigured()).thenReturn(false);
            assertThat(scheduler.validateSteamPlatforms()).isZero();
        }

        @Test
        @DisplayName("sets PC platform for owned non-PC Steam games")
        void setsPlatform() {
            when(steamService.isConfigured()).thenReturn(true);
            Game g = Game.builder().id(1L).title("x").steamAppId("10")
                    .platform(GamePlatform.OTHER).build();
            when(gameRepository.findAll()).thenReturn(List.of(g));
            when(steamService.isGameOwned("10")).thenReturn(true);

            int updated = scheduler.validateSteamPlatforms();

            assertThat(updated).isEqualTo(1);
            assertThat(g.getPlatform()).isEqualTo(GamePlatform.PC);
            verify(gameRepository).save(g);
        }
    }

    @Nested
    @DisplayName("genre enrichment")
    class GenreEnrichment {

        @Test
        @DisplayName("enrichSteamGenres delegates to gameService when configured")
        void enrichWhenConfigured() {
            when(steamService.isConfigured()).thenReturn(true);
            scheduler.enrichSteamGenres();
            verify(gameService).enrichSteamLibraryGenresInBackground();
        }

        @Test
        @DisplayName("enrichSteamGenres does nothing when not configured")
        void enrichWhenNotConfigured() {
            when(steamService.isConfigured()).thenReturn(false);
            scheduler.enrichSteamGenres();
            verify(gameService, never()).enrichSteamLibraryGenresInBackground();
        }

        @Test
        @DisplayName("triggerGenreEnrichment always delegates")
        void triggerAlwaysDelegates() {
            scheduler.triggerGenreEnrichment();
            verify(gameService).enrichSteamLibraryGenresInBackground();
        }
    }
}
