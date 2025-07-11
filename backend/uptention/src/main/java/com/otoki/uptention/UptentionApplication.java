package com.otoki.uptention;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.otoki.uptention.global.config.AwsS3Properties;
import com.otoki.uptention.global.config.RedisProperties;
import com.otoki.uptention.global.config.SolanaProperties;

@SpringBootApplication
@EnableConfigurationProperties({AwsS3Properties.class, SolanaProperties.class, RedisProperties.class})
@EnableScheduling
public class UptentionApplication {

	public static void main(String[] args) {
		SpringApplication.run(UptentionApplication.class, args);
	}

}
