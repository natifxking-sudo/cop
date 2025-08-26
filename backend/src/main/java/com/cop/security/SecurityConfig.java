package com.cop.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.authority.mapping.SimpleAuthorityMapper;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		// Configure RBAC
		http
			.authorizeHttpRequests(auth -> auth
				.requestMatchers("/actuator/**").permitAll()
				.requestMatchers("/api/public/**", "/auth/**").permitAll()
				.requestMatchers("/api/hq/**").hasRole("HQ")
				.requestMatchers("/api/analyst/**").hasAnyRole("ANALYST_SOCMINT", "ANALYST_SIGINT", "ANALYST_HUMINT")
				.anyRequest().authenticated()
			)
			.oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
			.cors(Customizer.withDefaults())
			.csrf(csrf -> csrf.disable());

		return http.build();
	}

	private JwtAuthenticationConverter jwtAuthenticationConverter() {
		JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
		grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
		grantedAuthoritiesConverter.setAuthoritiesClaimName("realm_access.roles");

		JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
		converter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
		return converter;
	}
}