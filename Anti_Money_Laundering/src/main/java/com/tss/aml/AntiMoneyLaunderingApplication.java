package com.tss.aml;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync          // enables @Async processing
@EnableCaching        // enables @Cacheable, @CachePut, @CacheEvict
public class AntiMoneyLaunderingApplication {

    public static void main(String[] args) {
        SpringApplication.run(AntiMoneyLaunderingApplication.class, args);
    }

}
