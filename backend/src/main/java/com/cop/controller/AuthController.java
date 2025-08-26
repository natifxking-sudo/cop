package com.cop.controller;

import com.cop.dto.AuthRequest;
import com.cop.dto.AuthResponse;
import com.cop.dto.UserResponse;
import com.cop.entity.User;
import com.cop.security.JwtTokenProvider;
import com.cop.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody AuthRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        // Update last login time
        User user = userService.findByUsername(loginRequest.getUsername());
        user.setLastLoginAt(LocalDateTime.now());
        userService.save(user);

        UserResponse userResponse = new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getClearanceLevel(),
                user.getActive()
        );

        return ResponseEntity.ok(new AuthResponse(jwt, userResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.unauthorized().build();
        }

        User user = userService.findByUsername(authentication.getName());
        UserResponse userResponse = new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getClearanceLevel(),
                user.getActive()
        );

        return ResponseEntity.ok(userResponse);
    }
}
