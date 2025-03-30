package com.otoki.uptention;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.otoki.uptention.global.config.AwsS3Properties;
import com.otoki.uptention.global.config.SolanaProperties;

@SpringBootApplication
@EnableConfigurationProperties({AwsS3Properties.class, SolanaProperties.class})
public class UptentionApplication {

	public static void main(String[] args) {
		SpringApplication.run(UptentionApplication.class, args);
	}

}
