package com.infernokun.infernoGames.utils;

import com.infernokun.infernoGames.models.enums.GamePlatform;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("List Converter Tests")
class ListConverterTest {

    @Nested
    @DisplayName("StringListConverter")
    class StringListConverterTests {

        private final StringListConverter converter = new StringListConverter();

        @Test
        @DisplayName("converts null and empty lists to '[]'")
        void nullOrEmptyToBrackets() {
            assertThat(converter.convertToDatabaseColumn(null)).isEqualTo("[]");
            assertThat(converter.convertToDatabaseColumn(List.of())).isEqualTo("[]");
        }

        @Test
        @DisplayName("round-trips a populated list")
        void roundTrip() {
            String json = converter.convertToDatabaseColumn(List.of("Action", "RPG"));
            assertThat(converter.convertToEntityAttribute(json)).containsExactly("Action", "RPG");
        }

        @Test
        @DisplayName("returns an empty list for null/blank/'null' db values")
        void emptyForBlank() {
            assertThat(converter.convertToEntityAttribute(null)).isEmpty();
            assertThat(converter.convertToEntityAttribute("")).isEmpty();
            assertThat(converter.convertToEntityAttribute("null")).isEmpty();
        }

        @Test
        @DisplayName("returns an empty list for malformed JSON instead of throwing")
        void emptyForMalformed() {
            assertThat(converter.convertToEntityAttribute("{not json}")).isEmpty();
        }
    }

    @Nested
    @DisplayName("GamePlatformListConverter")
    class GamePlatformListConverterTests {

        private final GamePlatformListConverter converter = new GamePlatformListConverter();

        @Test
        @DisplayName("converts null and empty lists to '[]'")
        void nullOrEmptyToBrackets() {
            assertThat(converter.convertToDatabaseColumn(null)).isEqualTo("[]");
            assertThat(converter.convertToDatabaseColumn(List.of())).isEqualTo("[]");
        }

        @Test
        @DisplayName("round-trips a populated platform list")
        void roundTrip() {
            String json = converter.convertToDatabaseColumn(
                    List.of(GamePlatform.PC, GamePlatform.STEAM_DECK));
            assertThat(converter.convertToEntityAttribute(json))
                    .containsExactly(GamePlatform.PC, GamePlatform.STEAM_DECK);
        }

        @Test
        @DisplayName("returns an empty list for blank db values")
        void emptyForBlank() {
            assertThat(converter.convertToEntityAttribute("null")).isEmpty();
            assertThat(converter.convertToEntityAttribute("")).isEmpty();
        }

        @Test
        @DisplayName("returns an empty list for malformed JSON instead of throwing")
        void emptyForMalformed() {
            assertThat(converter.convertToEntityAttribute("{bad}")).isEmpty();
        }
    }
}
