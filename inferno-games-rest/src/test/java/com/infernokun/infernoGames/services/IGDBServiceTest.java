package com.infernokun.infernoGames.services;

import com.infernokun.infernoGames.config.InfernoGamesConfig;
import com.infernokun.infernoGames.services.IGDBService.IGDBGameDto;
import com.infernokun.infernoGames.services.IGDBService.TwitchAuthResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("IGDBService Tests")
class IGDBServiceTest {

    @Mock private InfernoGamesConfig config;
    @Mock private SteamService steamService;
    @Mock private RestTemplate restTemplate;

    private IGDBService igdbService;

    private static final String ONE_GAME_JSON = """
            [{
              "id": 1234,
              "name": "Test Game",
              "summary": "A great game",
              "url": "https://igdb.com/games/test",
              "rating": 88.5,
              "rating_count": 250,
              "first_release_date": 1600000000,
              "cover": { "url": "//images.igdb.com/t_thumb/abc.jpg" },
              "genres": [ { "name": "Shooter" }, { "name": "Adventure" } ],
              "platforms": [ { "name": "PC" } ],
              "involved_companies": [
                { "company": { "name": "Dev Co" }, "developer": true, "publisher": false },
                { "company": { "name": "Pub Co" }, "developer": false, "publisher": true }
              ],
              "screenshots": [ { "url": "//images.igdb.com/t_thumb/ss.jpg" } ]
            }]
            """;

    @BeforeEach
    void setUp() {
        when(config.getIgdbClientId()).thenReturn("client-id");
        when(config.getIgdbClientSecret()).thenReturn("client-secret");
        igdbService = new IGDBService(config, steamService);
        // Replace the real RestTemplate (constructed internally) with our mock.
        ReflectionTestUtils.setField(igdbService, "restTemplate", restTemplate);
        // authenticate() posts to Twitch for a token.
        when(restTemplate.postForEntity(anyString(), any(), eq(TwitchAuthResponse.class)))
                .thenReturn(ResponseEntity.ok(new TwitchAuthResponse("token-abc", 3600L, "bearer")));
    }

    private void stubGamesResponse(String json) {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(json));
    }

    @Nested
    @DisplayName("searchGames / conversion")
    class SearchGames {

        @Test
        @DisplayName("parses and converts IGDB game data")
        void parsesGame() {
            stubGamesResponse(ONE_GAME_JSON);

            List<IGDBGameDto> results = igdbService.searchGames("test");

            assertThat(results).hasSize(1);
            IGDBGameDto dto = results.get(0);
            assertThat(dto.getIgdbId()).isEqualTo(1234L);
            assertThat(dto.getName()).isEqualTo("Test Game");
            assertThat(dto.getGenres()).containsExactly("Shooter", "Adventure");
            assertThat(dto.getPlatforms()).containsExactly("PC");
            assertThat(dto.getDeveloper()).isEqualTo("Dev Co");
            assertThat(dto.getPublisher()).isEqualTo("Pub Co");
            assertThat(dto.getReleaseYear()).isEqualTo(2020);
        }

        @Test
        @DisplayName("rewrites cover and screenshot URLs to full size https URLs")
        void rewritesUrls() {
            stubGamesResponse(ONE_GAME_JSON);

            IGDBGameDto dto = igdbService.searchGames("test").get(0);

            assertThat(dto.getCoverUrl()).isEqualTo("https://images.igdb.com/t_cover_big/abc.jpg");
            assertThat(dto.getScreenshotUrls())
                    .containsExactly("https://images.igdb.com/t_screenshot_big/ss.jpg");
        }

        @Test
        @DisplayName("returns an empty list on transport failure")
        void emptyOnFailure() {
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                    .thenThrow(new RuntimeException("network down"));

            assertThat(igdbService.searchGames("test")).isEmpty();
        }
    }

    @Nested
    @DisplayName("getGameById")
    class GetGameById {

        @Test
        @DisplayName("returns the game when present")
        void returnsGame() {
            stubGamesResponse(ONE_GAME_JSON);
            Optional<IGDBGameDto> result = igdbService.getGameById(1234L);
            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Test Game");
        }

        @Test
        @DisplayName("returns empty when IGDB returns no results")
        void emptyWhenNone() {
            stubGamesResponse("[]");
            assertThat(igdbService.getGameById(9999L)).isEmpty();
        }
    }

    @Nested
    @DisplayName("list endpoints")
    class ListEndpoints {

        @Test
        @DisplayName("getPopularGames delegates through the request pipeline")
        void popularGames() {
            stubGamesResponse(ONE_GAME_JSON);
            assertThat(igdbService.getPopularGames(5)).hasSize(1);
        }

        @Test
        @DisplayName("getUpcomingGames delegates through the request pipeline")
        void upcomingGames() {
            stubGamesResponse(ONE_GAME_JSON);
            assertThat(igdbService.getUpcomingGames(5)).hasSize(1);
        }
    }
}
