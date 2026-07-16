package com.infernokun.infernoGames.services;

import com.infernokun.infernoGames.config.InfernoGamesConfig;
import com.infernokun.infernoGames.services.SteamService.SteamGameInfo;
import com.infernokun.infernoGames.services.SteamService.SteamLibraryStats;
import com.infernokun.infernoGames.services.SteamService.SteamPlaytimeInfo;
import com.infernokun.infernoGames.services.SteamService.SteamUserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SteamService Tests")
class SteamServiceTest {

    @Mock
    private InfernoGamesConfig config;

    private SteamService steamService;

    @BeforeEach
    void setUp() {
        steamService = new SteamService(config);
    }

    /** Populate the private owned-games cache and mark it valid so getters skip the network. */
    @SuppressWarnings("unchecked")
    private void seedCache(SteamGameInfo... games) {
        try {
            Field cacheField = SteamService.class.getDeclaredField("ownedGamesCache");
            cacheField.setAccessible(true);
            Map<String, SteamGameInfo> cache = (Map<String, SteamGameInfo>) cacheField.get(steamService);
            cache.clear();
            for (SteamGameInfo g : games) {
                cache.put(g.getAppId(), g);
            }
            Field initialized = SteamService.class.getDeclaredField("cacheInitialized");
            initialized.setAccessible(true);
            initialized.setBoolean(steamService, true);
            Field lastUpdated = SteamService.class.getDeclaredField("cacheLastUpdated");
            lastUpdated.setAccessible(true);
            lastUpdated.setLong(steamService, System.currentTimeMillis());
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }

    private SteamGameInfo game(String appId, String name, int playtimeMinutes) {
        return SteamGameInfo.builder()
                .appId(appId)
                .name(name)
                .playtimeForever(playtimeMinutes)
                .playtimeWindowsForever(playtimeMinutes)
                .playtimeLinuxForever(0)
                .playtimeDeckForever(0)
                .genres(new java.util.ArrayList<>())
                .build();
    }

    @Nested
    @DisplayName("Configuration")
    class Configuration {

        @Test
        @DisplayName("isConfigured returns false when credentials missing")
        void notConfiguredWhenMissing() {
            when(config.getSteamClientId()).thenReturn(null);
            when(config.getSteamClientSecret()).thenReturn(null);
            assertThat(steamService.isConfigured()).isFalse();
        }

        @Test
        @DisplayName("isConfigured returns false when credentials empty")
        void notConfiguredWhenEmpty() {
            when(config.getSteamClientId()).thenReturn("");
            when(config.getSteamClientSecret()).thenReturn("");
            assertThat(steamService.isConfigured()).isFalse();
        }

        @Test
        @DisplayName("isConfigured returns true when both credentials present")
        void configuredWhenPresent() {
            when(config.getSteamClientId()).thenReturn("steam-id");
            when(config.getSteamClientSecret()).thenReturn("steam-secret");
            assertThat(steamService.isConfigured()).isTrue();
        }

        @Test
        @DisplayName("getUserProfile returns empty when not configured")
        void userProfileEmptyWhenNotConfigured() {
            when(config.getSteamClientId()).thenReturn(null);
            assertThat(steamService.getUserProfile()).isEmpty();
        }

        @Test
        @DisplayName("getRecentlyPlayedGames returns empty list when not configured")
        void recentlyPlayedEmptyWhenNotConfigured() {
            when(config.getSteamClientId()).thenReturn(null);
            assertThat(steamService.getRecentlyPlayedGames(5)).isEmpty();
        }
    }

    @Nested
    @DisplayName("Owned games queries")
    class OwnedGamesQueries {

        @Test
        @DisplayName("checkOwnership returns empty for null or blank appId")
        void checkOwnershipNullBlank() {
            assertThat(steamService.checkOwnership(null)).isEmpty();
            assertThat(steamService.checkOwnership("")).isEmpty();
        }

        @Test
        @DisplayName("checkOwnership returns the cached game when owned")
        void checkOwnershipOwned() {
            seedCache(game("10", "Half-Life", 600));
            Optional<SteamGameInfo> result = steamService.checkOwnership("10");
            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Half-Life");
        }

        @Test
        @DisplayName("isGameOwned reflects cache membership")
        void isGameOwned() {
            seedCache(game("10", "Half-Life", 600));
            assertThat(steamService.isGameOwned("10")).isTrue();
            assertThat(steamService.isGameOwned("99")).isFalse();
        }

        @Test
        @DisplayName("searchOwnedGames filters by name case-insensitively and sorts")
        void searchOwnedGames() {
            seedCache(game("1", "Portal", 100), game("2", "Portal 2", 200), game("3", "Doom", 50));
            List<SteamGameInfo> results = steamService.searchOwnedGames("portal");
            assertThat(results).extracting(SteamGameInfo::getName)
                    .containsExactly("Portal", "Portal 2");
        }

        @Test
        @DisplayName("getMostPlayedGames returns only played games sorted descending and limited")
        void getMostPlayedGames() {
            seedCache(game("1", "A", 300), game("2", "B", 0), game("3", "C", 600));
            List<SteamGameInfo> results = steamService.getMostPlayedGames(1);
            assertThat(results).hasSize(1);
            assertThat(results.get(0).getName()).isEqualTo("C");
        }

        @Test
        @DisplayName("getPlaytimeInfo maps minutes to hours")
        void getPlaytimeInfo() {
            seedCache(game("1", "A", 120));
            Optional<SteamPlaytimeInfo> info = steamService.getPlaytimeInfo("1");
            assertThat(info).isPresent();
            assertThat(info.get().getPlaytimeForeverMinutes()).isEqualTo(120);
            assertThat(info.get().getPlaytimeForeverHours()).isEqualTo(2.0);
        }
    }

    @Nested
    @DisplayName("Library statistics")
    class LibraryStatistics {

        @Test
        @DisplayName("getLibraryStats aggregates totals and percentages")
        void getLibraryStats() {
            seedCache(game("1", "Played", 120), game("2", "Unplayed", 0));
            SteamLibraryStats stats = steamService.getLibraryStats();
            assertThat(stats.getTotalGames()).isEqualTo(2);
            assertThat(stats.getPlayedGames()).isEqualTo(1);
            assertThat(stats.getUnplayedGames()).isEqualTo(1);
            assertThat(stats.getTotalPlaytimeMinutes()).isEqualTo(120);
            assertThat(stats.getTotalPlaytimeHours()).isEqualTo(2.0);
            assertThat(stats.getPlayedPercentage()).isEqualTo(50.0);
        }

        @Test
        @DisplayName("getLibraryStats handles an empty library")
        void getLibraryStatsEmpty() {
            seedCache();
            SteamLibraryStats stats = steamService.getLibraryStats();
            assertThat(stats.getTotalGames()).isZero();
            assertThat(stats.getPlayedPercentage()).isZero();
        }
    }

    @Nested
    @DisplayName("URL builders")
    class UrlBuilders {

        @Test
        @DisplayName("buildIconUrl returns null for missing hash")
        void buildIconUrlNull() {
            assertThat(steamService.buildIconUrl("10", null)).isNull();
            assertThat(steamService.buildIconUrl("10", "")).isNull();
        }

        @Test
        @DisplayName("buildIconUrl composes the media URL")
        void buildIconUrl() {
            assertThat(steamService.buildIconUrl("10", "abc"))
                    .isEqualTo("https://media.steampowered.com/steamcommunity/public/images/apps/10/abc.jpg");
        }

        @Test
        @DisplayName("buildHeaderImageUrl composes the CDN URL")
        void buildHeaderImageUrl() {
            assertThat(steamService.buildHeaderImageUrl("10"))
                    .isEqualTo("https://cdn.cloudflare.steamstatic.com/steam/apps/10/header.jpg");
        }
    }

    @Nested
    @DisplayName("DTO helpers")
    class DtoHelpers {

        @Test
        @DisplayName("SteamGameInfo playtime hours and last played conversion")
        void gameInfoHelpers() {
            SteamGameInfo info = SteamGameInfo.builder()
                    .appId("1").playtimeForever(90).rtimeLastPlayed(0).build();
            assertThat(info.getPlaytimeForeverHours()).isEqualTo(1.5);
            assertThat(info.getLastPlayedDateTime()).isNull();

            SteamGameInfo played = SteamGameInfo.builder()
                    .appId("2").playtimeForever(0).rtimeLastPlayed(1_600_000_000L).build();
            assertThat(played.getLastPlayedDateTime()).isNotNull();
        }

        @Test
        @DisplayName("SteamUserProfile persona state string mapping")
        void personaStateString() {
            assertThat(profileWithState(0).getPersonaStateString()).isEqualTo("Offline");
            assertThat(profileWithState(1).getPersonaStateString()).isEqualTo("Online");
            assertThat(profileWithState(2).getPersonaStateString()).isEqualTo("Busy");
            assertThat(profileWithState(3).getPersonaStateString()).isEqualTo("Away");
            assertThat(profileWithState(4).getPersonaStateString()).isEqualTo("Snooze");
            assertThat(profileWithState(5).getPersonaStateString()).isEqualTo("Looking to Trade");
            assertThat(profileWithState(6).getPersonaStateString()).isEqualTo("Looking to Play");
        }

        @Test
        @DisplayName("SteamUserProfile timestamp conversions")
        void profileTimestamps() {
            SteamUserProfile noTimes = SteamUserProfile.builder().lastLogoff(0).timeCreated(0).build();
            assertThat(noTimes.getLastLogoffDateTime()).isNull();
            assertThat(noTimes.getAccountCreatedDateTime()).isNull();

            SteamUserProfile withTimes = SteamUserProfile.builder()
                    .lastLogoff(1_600_000_000L).timeCreated(1_500_000_000L).build();
            assertThat(withTimes.getLastLogoffDateTime()).isNotNull();
            assertThat(withTimes.getAccountCreatedDateTime()).isNotNull();
        }

        private SteamUserProfile profileWithState(int state) {
            return SteamUserProfile.builder().personaState(state).build();
        }
    }
}
