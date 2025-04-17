package com.otoki.uptention.global.listener;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.otoki.uptention.application.payment.service.PaymentProcessService;
import com.otoki.uptention.global.config.RabbitMQConfig;
import com.otoki.uptention.global.event.PaymentFailedEvent;
import com.otoki.uptention.global.event.PaymentSuccessEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class PaymentEventListener {

	private final PaymentProcessService paymentProcessService;

	@RabbitListener(queues = RabbitMQConfig.PAYMENT_COMPLETED_QUEUE)
	public void handlePaymentCompletedEvent(PaymentSuccessEvent event) {
		log.info("결제 성공 이벤트 수신: 주문 ID={}, 사용자 ID={}, 금액={}",
			event.getOrderId(), event.getUserId(), event.getTotalAmount());

		try {
			boolean processed = paymentProcessService.processPaymentSuccess(event.getOrderId().toString());

			if (processed) {
				log.info("주문 ID({})의 결제가 성공적으로 처리되었습니다.", event.getOrderId());
			} else {
				log.error("주문 ID({})의 결제 처리에 실패했습니다.", event.getOrderId());
			}
		} catch (Exception e) {
			log.error("결제 완료 이벤트 처리 중 오류 발생: 주문 ID={}", event.getOrderId(), e);
		}
	}

	@RabbitListener(queues = RabbitMQConfig.PAYMENT_FAILED_QUEUE)
	public void handlePaymentFailedEvent(PaymentFailedEvent event) {
		log.info("결제 실패 이벤트 수신: 주문 ID={}, 사유={}",
			event.getOrderId(), event.getReason());

		try {
			boolean processed = paymentProcessService.processPaymentFailure(
				event.getOrderId().toString(), event.getReason());

			if (processed) {
				log.info("주문 ID({})의 결제 실패가 성공적으로 처리되었습니다.", event.getOrderId());
			} else {
				log.error("주문 ID({})의 결제 실패 처리에 실패했습니다.", event.getOrderId());
			}
		} catch (Exception e) {
			log.error("결제 실패 이벤트 처리 중 오류 발생: 주문 ID={}", event.getOrderId(), e);
		}
	}
}
