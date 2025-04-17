# 1. Java 베이스 이미지 사용 (JDK 17 Slim 버전)
FROM openjdk:17-jdk-slim

# 2. 작업 디렉토리 생성 및 설정
WORKDIR /app

# 3. 빌드된 JAR 파일 복사
ARG JAR_FILE=build/libs/*.jar
COPY ${JAR_FILE} app.jar

# 4. (필요하다면) 포트 노출
#EXPOSE 8080

# 5. 애플리케이션 실행 명령어
ENTRYPOINT ["java", "-Duser.timezone=UTC", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
