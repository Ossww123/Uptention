package com.otoki.uptention.global.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ 설정
 * 결제 관련 이벤트를 처리하기 위한 설정
 */
@Configuration
public class RabbitMQConfig {

	// 교환기(Exchange) 이름
	public static final String PAYMENT_EXCHANGE = "payment.exchange";

	// 라우팅 키
	public static final String PAYMENT_COMPLETED_KEY = "payment.completed";
	public static final String PAYMENT_FAILED_KEY = "payment.failed";

	// 큐(Queue) 이름
	public static final String PAYMENT_COMPLETED_QUEUE = "payment.completed.queue";
	public static final String PAYMENT_FAILED_QUEUE = "payment.failed.queue";

	/**
	 * 결제 관련 토픽 교환기 생성
	 */
	@Bean
	public TopicExchange paymentExchange() {
		return new TopicExchange(PAYMENT_EXCHANGE);
	}

	/**
	 * 결제 완료 이벤트를 처리할 큐 생성
	 */
	@Bean
	public Queue paymentCompletedQueue() {
		return new Queue(PAYMENT_COMPLETED_QUEUE, true);
	}

	/**
	 * 결제 실패 이벤트를 처리할 큐 생성
	 */
	@Bean
	public Queue paymentFailedQueue() {
		return new Queue(PAYMENT_FAILED_QUEUE, true);
	}

	/**
	 * 결제 완료 큐와 교환기를 라우팅 키로 바인딩
	 */
	@Bean
	public Binding paymentCompletedBinding(Queue paymentCompletedQueue, TopicExchange paymentExchange) {
		return BindingBuilder.bind(paymentCompletedQueue)
			.to(paymentExchange)
			.with(PAYMENT_COMPLETED_KEY);
	}

	/**
	 * 결제 실패 큐와 교환기를 라우팅 키로 바인딩
	 */
	@Bean
	public Binding paymentFailedBinding(Queue paymentFailedQueue, TopicExchange paymentExchange) {
		return BindingBuilder.bind(paymentFailedQueue)
			.to(paymentExchange)
			.with(PAYMENT_FAILED_KEY);
	}

	/**
	 * JSON 메시지 변환기 설정
	 */
	@Bean
	public Jackson2JsonMessageConverter messageConverter() {
		return new Jackson2JsonMessageConverter();
	}

	/**
	 * RabbitTemplate 설정
	 */
	@Bean
	public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
		Jackson2JsonMessageConverter messageConverter) {
		RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
		rabbitTemplate.setMessageConverter(messageConverter);
		return rabbitTemplate;
	}
}