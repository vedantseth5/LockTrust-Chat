package com.locktrust.chat.security;

import com.locktrust.chat.model.User;
import com.locktrust.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        User user = userRepository.findByPhone(phone)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + phone));

        return new org.springframework.security.core.userdetails.User(
            user.getPhone(),
            "",
            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}
