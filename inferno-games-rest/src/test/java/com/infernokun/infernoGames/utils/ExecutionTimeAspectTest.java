package com.infernokun.infernoGames.utils;

import com.infernokun.infernoGames.models.ApiResponse;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ExecutionTimeAspect Tests")
class ExecutionTimeAspectTest {

    @Mock private ProceedingJoinPoint joinPoint;
    @Mock private Signature signature;

    private ExecutionTimeAspect aspect;

    @BeforeEach
    void setUp() {
        aspect = new ExecutionTimeAspect();
    }

    @Test
    @DisplayName("adds execution time to an ApiResponse body")
    @SuppressWarnings("unchecked")
    void addsTimeToApiResponse() throws Throwable {
        ApiResponse<String> body = ApiResponse.success("data", "ok");
        when(joinPoint.proceed()).thenReturn(ResponseEntity.ok(body));

        Object result = aspect.measureExecutionTime(joinPoint);

        assertThat(result).isInstanceOf(ResponseEntity.class);
        ApiResponse<String> updated = (ApiResponse<String>) ((ResponseEntity<?>) result).getBody();
        assertThat(updated).isNotNull();
        assertThat(updated.getData()).isEqualTo("data");
        assertThat(updated.getTimeMs()).isNotNull();
        assertThat(updated.getTimeMs()).isGreaterThanOrEqualTo(0L);
    }

    @Test
    @DisplayName("passes through results that are not ResponseEntity")
    void passesThroughNonResponseEntity() throws Throwable {
        when(joinPoint.proceed()).thenReturn("plain-string");
        assertThat(aspect.measureExecutionTime(joinPoint)).isEqualTo("plain-string");
    }

    @Test
    @DisplayName("passes through a ResponseEntity whose body is not an ApiResponse")
    void passesThroughNonApiResponseBody() throws Throwable {
        ResponseEntity<String> plain = ResponseEntity.ok("hello");
        when(joinPoint.proceed()).thenReturn(plain);
        assertThat(aspect.measureExecutionTime(joinPoint)).isSameAs(plain);
    }

    @Test
    @DisplayName("logs and rethrows exceptions from the wrapped method")
    void rethrowsExceptions() throws Throwable {
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("someMethod");
        when(joinPoint.proceed()).thenThrow(new RuntimeException("boom"));

        assertThatThrownBy(() -> aspect.measureExecutionTime(joinPoint))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("boom");
    }
}
