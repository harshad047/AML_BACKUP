package com.tss.aml.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.tss.aml.entity.Customer;
import com.tss.aml.entity.User;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.UserRepository;

import java.util.Collections;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        // First, try to find a user in the users table (admins, officers)
        Optional<User> userOptional = userRepository.findByEmail(usernameOrEmail);
        if (!userOptional.isPresent()) {
            // Try by username if email lookup failed
            userOptional = userRepository.findByUsername(usernameOrEmail);
        }
        if (userOptional.isPresent()) {
            return userOptional.get();
        }

        // If not found, try to find a user in the customers table
        Optional<Customer> customerOptional = customerRepository.findByEmail(usernameOrEmail);
        if (customerOptional.isPresent()) {
            Customer customer = customerOptional.get();
            return new CustomerUserDetails(customer);
        }

        throw new UsernameNotFoundException("User not found with email/username: " + usernameOrEmail);
    }
}
