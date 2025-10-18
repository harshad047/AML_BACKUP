package com.tss.aml;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import com.fasterxml.jackson.core.StreamReadConstraints;
import com.fasterxml.jackson.core.StreamWriteConstraints;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootApplication
public class AntiMoneyLaunderingApplication {

	public static void main(String[] args) {
		SpringApplication.run(AntiMoneyLaunderingApplication.class, args);
	}

	@Bean
	public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
		ObjectMapper objectMapper = builder.build();

		// Configure increased nesting depth limits
		StreamReadConstraints readConstraints = StreamReadConstraints.builder()
			.maxNestingDepth(2000)
			.build();
		StreamWriteConstraints writeConstraints = StreamWriteConstraints.builder()
			.maxNestingDepth(2000)
			.build();

		objectMapper.getFactory().setStreamReadConstraints(readConstraints);
		objectMapper.getFactory().setStreamWriteConstraints(writeConstraints);

		return objectMapper;
	}
}