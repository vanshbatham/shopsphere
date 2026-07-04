package com.shopsphere.apigateway.filter;

import com.shopsphere.apigateway.util.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private final JwtUtil jwtUtil;

    public AuthenticationFilter(JwtUtil jwtUtil) {
        super(Config.class);
        this.jwtUtil = jwtUtil;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return ((exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();

            // 1. Allow CORS Preflight requests to pass without a token
            if (request.getMethod().name().equals("OPTIONS")) {
                return chain.filter(exchange);
            }

            // 2. Public Endpoints bypass the filter
            if (path.contains("/v3/api-docs") || path.contains("/swagger-ui")
                    || (path.startsWith("/api/v1/reviews/product/") && request.getMethod().name().equals("GET"))) {
                return chain.filter(exchange);
            }

            // 3. Ensure Authorization header exists
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // 4. Extract the token
            String authHeader = request.getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                authHeader = authHeader.substring(7);
            } else {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            try {
                // 5. Validate token and extract claims
                jwtUtil.validateToken(authHeader);
                Claims claims = jwtUtil.getClaims(authHeader);

                String userId = claims.get("userId").toString();
                String role = claims.get("role").toString();
                String shopName = claims.containsKey("shopName") ? claims.get("shopName").toString() : null;

                // 6. Mutate the request to inject our custom headers
                ServerHttpRequest.Builder requestBuilder = exchange.getRequest()
                        .mutate()
                        .header("X-User-Id", userId)
                        .header("X-User-Role", role);

                // Conditionally attach the Shop Name header if it exists
                if (shopName != null) {
                    requestBuilder.header("X-Shop-Name", shopName);
                }

                request = requestBuilder.build();

            } catch (Exception e) {
                // If token is expired or forged, reject the request
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                return exchange.getResponse().setComplete();
            }

            // 7. Forward the mutated request downstream
            return chain.filter(exchange.mutate().request(request).build());
        });
    }

    public static class Config {

    }
}