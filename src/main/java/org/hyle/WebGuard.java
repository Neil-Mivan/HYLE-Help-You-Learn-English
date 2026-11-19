package org.hyle;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.net.URI;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
class WebGuard extends OncePerRequestFilter {
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader("Permissions-Policy", "translator=(self), language-detector=(self)");
        response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
        String origin = request.getHeader("Origin");
        if (origin != null && !sameOrigin(origin, request)) {
            response.setStatus(403);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"请求来源不受信任。\"}");
            return;
        }
        chain.doFilter(request, response);
    }
    private boolean sameOrigin(String origin, HttpServletRequest request) {
        try {
            URI uri = URI.create(origin);
            return request.getScheme().equalsIgnoreCase(uri.getScheme()) && uri.getRawAuthority() != null
                && uri.getRawAuthority().equalsIgnoreCase(request.getHeader("Host"));
        } catch (IllegalArgumentException e) { return false; }
    }
}
