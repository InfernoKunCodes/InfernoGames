package com.infernokun.infernoGames.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("GenericTextCleaner Tests")
class GenericTextCleanerTest {

    @Nested
    @DisplayName("makeReadable")
    class MakeReadable {

        @Test
        @DisplayName("returns empty string for null")
        void nullReturnsEmpty() {
            assertThat(GenericTextCleaner.makeReadable(null)).isEmpty();
        }

        @Test
        @DisplayName("removes HTML tags")
        void removesHtmlTags() {
            assertThat(GenericTextCleaner.makeReadable("<p>Hello</p>")).contains("Hello");
            assertThat(GenericTextCleaner.makeReadable("<b>Hi</b>")).doesNotContain("<b>");
        }

        @Test
        @DisplayName("decodes common HTML entities")
        void decodesEntities() {
            assertThat(GenericTextCleaner.makeReadable("Tom &amp; Jerry")).contains("Tom & Jerry");
            assertThat(GenericTextCleaner.makeReadable("a &lt;b&gt; c")).contains("<b>");
        }

        @Test
        @DisplayName("collapses excessive whitespace")
        void collapsesWhitespace() {
            assertThat(GenericTextCleaner.makeReadable("a     b")).isEqualTo("a b");
        }
    }

    @Nested
    @DisplayName("cleanOnly")
    class CleanOnly {

        @Test
        @DisplayName("returns empty string for null")
        void nullReturnsEmpty() {
            assertThat(GenericTextCleaner.cleanOnly(null)).isEmpty();
        }

        @Test
        @DisplayName("strips tags and entities without adding paragraph breaks")
        void stripsWithoutBreaks() {
            String result = GenericTextCleaner.cleanOnly("<div>One. Two.</div> &quot;q&quot;");
            assertThat(result).doesNotContain("<div>");
            assertThat(result).contains("\"q\"");
            assertThat(result).doesNotContain("\n");
        }
    }

    @Nested
    @DisplayName("addBasicParagraphs")
    class AddBasicParagraphs {

        @Test
        @DisplayName("inserts a paragraph break before dialogue")
        void breaksBeforeDialogue() {
            String result = GenericTextCleaner.addBasicParagraphs("He spoke. \"Hello there\"");
            assertThat(result).contains("\n\n\"");
        }

        @Test
        @DisplayName("collapses three or more newlines to two")
        void collapsesNewlines() {
            assertThat(GenericTextCleaner.addBasicParagraphs("a\n\n\n\nb")).doesNotContain("\n\n\n");
        }
    }
}
