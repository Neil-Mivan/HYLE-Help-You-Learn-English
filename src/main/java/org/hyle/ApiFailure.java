package org.hyle;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

class ApiFailure extends RuntimeException {
    final int status;
    ApiFailure(int status, String message) { super(message); this.status = status; }
}

@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler(ApiFailure.class)
    ResponseEntity<Map<String,String>> apiFailure(ApiFailure e) {
        return ResponseEntity.status(e.status).body(Map.of("error", e.getMessage()));
    }
}
