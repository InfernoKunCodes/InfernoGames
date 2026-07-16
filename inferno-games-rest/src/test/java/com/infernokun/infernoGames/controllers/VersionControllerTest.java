package com.infernokun.infernoGames.controllers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("VersionController Tests")
class VersionControllerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        VersionController controller = new VersionController();
        ReflectionTestUtils.setField(controller, "appVersion", "1.2.3");
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/version returns version metadata")
    void getVersion() throws Exception {
        mockMvc.perform(get("/api/version"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("SUCCESS"))
                .andExpect(jsonPath("$.data.version").value("1.2.3"))
                .andExpect(jsonPath("$.data.application").value("Inferno Games REST API"))
                .andExpect(jsonPath("$.data.java").exists());
    }

    @Test
    @DisplayName("GET /api/version/simple returns the raw version string")
    void getSimpleVersion() throws Exception {
        mockMvc.perform(get("/api/version/simple"))
                .andExpect(status().isOk())
                .andExpect(content().string("1.2.3"));
    }
}
