package com.tss.aml.config;

import java.util.concurrent.Executor;

import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class AsyncConfig {

    /**
     * Primary executor used by @Async("taskExecutor").
     * Tune pool sizes to your deployment characteristics.
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // sensible defaults — adjust as needed for your hardware / load
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(200);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("AsyncExec-");
        executor.initialize();
        return executor;
    }

    /**
     * Simple in-memory cache manager (no extra dependencies).
     * Replace with Caffeine/Redis for production.
     */
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("userDetails", "someOtherCache");
    }
}
