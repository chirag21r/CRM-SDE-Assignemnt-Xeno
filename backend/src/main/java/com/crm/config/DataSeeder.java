package com.crm.config;

import com.crm.model.Customer;
import com.crm.repository.CustomerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class DataSeeder {
    @Bean
    public CommandLineRunner seedCustomers(CustomerRepository customerRepository) {
        return args -> {
            if (customerRepository.count() > 0) return;
            Customer a = new Customer();
            a.setName("Mohit Sharma"); a.setEmail("mohit@example.com"); a.setTotalSpend(12000.0); a.setTotalVisits(4); a.setLastActiveAt(LocalDateTime.now().minusDays(10));
            Customer b = new Customer();
            b.setName("Ananya Gupta"); b.setEmail("ananya@example.com"); b.setTotalSpend(3000.0); b.setTotalVisits(2); b.setLastActiveAt(LocalDateTime.now().minusDays(95));
            Customer c = new Customer();
            c.setName("Rohit Verma"); c.setEmail("rohit@example.com"); c.setTotalSpend(22000.0); c.setTotalVisits(8); c.setLastActiveAt(LocalDateTime.now().minusDays(3));
            customerRepository.save(a);
            customerRepository.save(b);
            customerRepository.save(c);
        };
    }
}


