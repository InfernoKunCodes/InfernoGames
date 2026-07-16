package com.infernokun.infernoGames.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("InfernoGamesUtils Tests")
class InfernoGamesUtilsTest {

    @Nested
    @DisplayName("formatDateTime")
    class FormatDateTime {

        @Test
        @DisplayName("returns null for null input")
        void nullReturnsNull() {
            assertThat(InfernoGamesUtils.formatDateTime(null)).isNull();
        }

        @Test
        @DisplayName("formats using yyyy-MM-dd HH:mm:ss")
        void formatsCorrectly() {
            LocalDateTime dt = LocalDateTime.of(2024, 1, 2, 3, 4, 5);
            assertThat(InfernoGamesUtils.formatDateTime(dt)).isEqualTo("2024-01-02 03:04:05");
        }
    }

    @Nested
    @DisplayName("createEtag")
    class CreateEtag {

        @Test
        @DisplayName("produces a stable value for identical input")
        void stableForSameInput() {
            byte[] data = "hello".getBytes(StandardCharsets.UTF_8);
            assertThat(InfernoGamesUtils.createEtag(data))
                    .isEqualTo(InfernoGamesUtils.createEtag(data));
        }

        @Test
        @DisplayName("differs for different input")
        void differsForDifferentInput() {
            assertThat(InfernoGamesUtils.createEtag("a".getBytes()))
                    .isNotEqualTo(InfernoGamesUtils.createEtag("b".getBytes()));
        }
    }

    @Nested
    @DisplayName("truncateString")
    class TruncateString {

        @Test
        @DisplayName("returns null for null")
        void nullReturnsNull() {
            assertThat(InfernoGamesUtils.truncateString(null, 5)).isNull();
        }

        @Test
        @DisplayName("returns the original string when within the limit")
        void withinLimit() {
            assertThat(InfernoGamesUtils.truncateString("abc", 5)).isEqualTo("abc");
        }

        @Test
        @DisplayName("truncates and appends ellipsis when over the limit")
        void overLimit() {
            assertThat(InfernoGamesUtils.truncateString("abcdef", 3)).isEqualTo("abc...");
        }
    }

    @Nested
    @DisplayName("sanitizeForSearch")
    class SanitizeForSearch {

        @Test
        @DisplayName("returns empty string for null")
        void nullReturnsEmpty() {
            assertThat(InfernoGamesUtils.sanitizeForSearch(null)).isEmpty();
        }

        @Test
        @DisplayName("strips special characters and lowercases")
        void stripsAndLowercases() {
            assertThat(InfernoGamesUtils.sanitizeForSearch("  Spider-Man 2099!  "))
                    .isEqualTo("spiderman 2099");
        }
    }
}
