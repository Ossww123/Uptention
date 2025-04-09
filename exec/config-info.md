# Uptention 프로젝트 포팅 매뉴얼
## 목차
1. [시스템 아키텍처](#시스템-아키텍처)
2. [기술 스택](#기술-스택)
3. [백엔드 설정](#백엔드-설정)
4. [프론트엔드 설정](#프론트엔드-설정)
5. [인프라 구축](#인프라-구축)
6. [CI/CD 설정](#cicd-설정)
7. [모니터링 설정](#모니터링-설정)
8. [시스템 구동 방법](#시스템-구동-방법)
9. [개발 환경 구성](#개발-환경-구성)
10. [배포 프로세스](#배포-프로세스)

## 시스템 아키텍처

Uptention 시스템은 다음과 같은 컴포넌트로 구성되어 있습니다:

- **Spring Boot 백엔드**: RESTful API 서비스 제공 (Blue/Green 배포 구성)
- **React 웹 프론트엔드**: 웹 클라이언트 제공
- **React Native 모바일 앱**: 모바일 클라이언트 제공
- **Express 서버**: Solana 블록체인 연동을 위한 서버
- **Nginx**: 리버스 프록시 및 정적 파일 서빙
- **MySQL**: 주 데이터베이스
- **Redis**: 캐싱 및 세션 관리
- **RabbitMQ**: 메시지 큐
- **Jenkins**: CI/CD 파이프라인
- **Prometheus & Grafana**: 모니터링
- **Loki & Promtail**: 로그 관리

## 기술 스택

### 버전 정보

| 구성 요소 | 버전 |
|---------|------|
| Spring Boot | 3.4.3 |
| Java | 17 |
| MySQL | 8.0.36 |
| Redis | 7.4.2 |
| RabbitMQ | 3-management |
| Nginx | 1.25.4 |
| Jenkins | 2.502 |
| React | 19.0.0 |
| React Native | 0.76.7 |
| Expo | 52.0.40 |
| Docker Compose | 3.8 |

### 개발 도구

| 개발 도구 | 버전 |
|----------|------|
| IntelliJ IDEA | 2024.3.1.1 |
| Visual Studio Code | 1.97.2 |
| Android Studio | Arctic Fox 2024.1.1 |

## 백엔드 설정

### Spring Boot 애플리케이션

백엔드는 Spring Boot 기반으로 구성되어 있으며, 다음 설정이 필요합니다:

#### build.gradle

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.4.3'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'com.otoki'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
    // Spring Boot 기본 로깅 제외
    all {
        exclude group: 'org.springframework.boot', module: 'spring-boot-starter-logging'
    }
}

repositories {
    mavenCentral()
    google()
}

// Querydsl 설정 추가
def querydslDir = "$buildDir/generated/querydsl"

dependencies {
    // 로깅 관련 의존성
    implementation 'org.springframework.boot:spring-boot-starter-log4j2'
    implementation 'org.apache.logging.log4j:log4j-layout-template-json:2.24.3'

    // 데이터베이스 관련 의존성
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    runtimeOnly 'com.mysql:mysql-connector-j'
    
    // Querydsl 의존성
    implementation 'com.querydsl:querydsl-jpa:5.0.0:jakarta'
    annotationProcessor 'com.querydsl:querydsl-apt:5.0.0:jakarta'
    annotationProcessor 'jakarta.annotation:jakarta.annotation-api'
    annotationProcessor 'jakarta.persistence:jakarta.persistence-api'

    // 유효성 검증 의존성
    implementation 'org.springframework.boot:spring-boot-starter-validation'

    // 보안 관련 의존성
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'io.jsonwebtoken:jjwt-api:0.12.3'
    implementation 'io.jsonwebtoken:jjwt-impl:0.12.3'
    implementation 'io.jsonwebtoken:jjwt-jackson:0.12.3'

    // 클라우드 스토리지 의존성
    implementation 'io.awspring.cloud:spring-cloud-aws-starter-s3:3.3.0'

    // 웹 의존성
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-websocket'

    // API 문서화 의존성
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.5'

    // 모니터링 의존성
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'io.micrometer:micrometer-registry-prometheus'

    // 유틸리티 의존성
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    
    // 테스트 데이터베이스
    runtimeOnly 'com.h2database:h2:2.2.224'

    // FCM 푸시 알림 의존성
    implementation 'com.google.firebase:firebase-admin:9.4.3'
    implementation 'com.google.firebase:firebase-messaging:24.1.1'

    // 메시지 큐 의존성
    implementation 'org.springframework.boot:spring-boot-starter-amqp'

    // 블록체인 의존성
    implementation 'com.mmorrell:solanaj:1.19.2'
    implementation 'com.squareup.okhttp3:okhttp:4.9.3'

    // 캐시 의존성
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.redisson:redisson-spring-boot-starter:3.24.1'
    implementation 'org.springframework.boot:spring-boot-starter-cache'

    // 테스트 의존성
    testCompileOnly 'org.projectlombok:lombok'
    testAnnotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

// Querydsl Q 클래스 생성 설정
tasks.withType(JavaCompile) {
    options.getGeneratedSourceOutputDirectory().set(file(querydslDir))
}

sourceSets {
    main.java.srcDirs += [querydslDir]
}

clean {
    delete file(querydslDir)
}

tasks.named('test') {
    useJUnitPlatform()
}
```

#### 배포 환경별 설정

**로컬 개발 환경**:
```yaml
# 로컬 개발 환경을 위한 docker-compose.yml 파일 구성
version: '3.8'
services:
  spring-app:
    build:
      context: .
      dockerfile: Dockerfile-local
    environment:
      SPRING_PROFILES_ACTIVE: local
    depends_on:
      - mysql
      - rabbitmq
      - redis
```

**프로덕션 환경**:
- Blue/Green 배포 방식 사용
- 환경 변수를 통한 설정 주입
- Jenkins를 통한 CI/CD

#### Dockerfile (프로덕션)
```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
ARG JAR_FILE=build/libs/*.jar
COPY ${JAR_FILE} app.jar
ENTRYPOINT ["java", "-Duser.timezone=UTC", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
```

#### Dockerfile-local (개발)
```dockerfile
# 빌드 스테이지
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app
COPY . .
RUN chmod +x gradlew
RUN ./gradlew --no-daemon clean build -x test

# 런타임 스테이지
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-Duser.timezone=UTC", "-jar", "app.jar"]
```

## 프론트엔드 설정

### 웹 프론트엔드 (React)

#### package.json
```json
{
  "name": "frontend_web",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.8.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.4.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

#### 배포 설정
- Jenkins를 통한 빌드 및 배포
- Nginx로 정적 파일 서빙

#### Dockerfile
```dockerfile
FROM busybox
WORKDIR /build
COPY build/. .
ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["sh", "/entrypoint.sh"]
```

### 모바일 앱 (React Native)

#### package.json
```json
{
  "name": "frontend_app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@actbase/react-daum-postcode": "^1.0.4",
    "@craftzdog/react-native-buffer": "^6.0.5",
    "@expo/vector-icons": "^14.0.4",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-native-firebase/app": "^21.13.0",
    "@react-native-firebase/messaging": "^21.13.0",
    "@react-navigation/bottom-tabs": "^7.2.1",
    "@react-navigation/native": "^7.0.15",
    "@react-navigation/native-stack": "^7.3.1",
    "@solana/spl-token": "0.3.9",
    "@solana/web3.js": "1.87.6",
    "axios": "^1.6.2",
    "base-64": "^1.0.0",
    "bs58": "^6.0.0",
    "buffer": "^6.0.3",
    "eas-cli": "^16.2.1",
    "expo": "~52.0.40",
    "expo-dev-client": "~5.0.14",
    "expo-image-manipulator": "^13.0.6",
    "expo-linking": "~7.0.5",
    "expo-status-bar": "~2.0.1",
    "react": "18.3.1",
    "react-native": "0.76.7",
    "react-native-background-timer": "^2.4.1",
    "react-native-chart-kit": "^6.12.0",
    "react-native-daum-postcode": "^1.0.11",
    "react-native-get-random-values": "^1.11.0",
    "react-native-image-picker": "^8.2.0",
    "react-native-pager-view": "^6.7.0",
    "react-native-safe-area-context": "^5.3.0",
    "react-native-screens": "^4.9.2",
    "react-native-svg": "^15.11.2",
    "react-native-url-polyfill": "^2.0.0",
    "react-native-webview": "13.12.5",
    "tweetnacl": "^1.0.3"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}
```

#### 안드로이드 설정 (build.gradle)
```gradle
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
    ext {
        buildToolsVersion = findProperty('android.buildToolsVersion') ?: '35.0.0'
        minSdkVersion = Integer.parseInt(findProperty('android.minSdkVersion') ?: '24')
        compileSdkVersion = Integer.parseInt(findProperty('android.compileSdkVersion') ?: '35')
        targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '34')
        kotlinVersion = findProperty('android.kotlinVersion') ?: '1.9.25'

        ndkVersion = "26.1.10909125"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath('com.android.tools.build:gradle')
        classpath('com.facebook.react:react-native-gradle-plugin')
        classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
        classpath 'com.google.gms:google-services:4.3.15'
    }
}

apply plugin: "com.facebook.react.rootproject"

allprojects {
    repositories {
        maven {
            // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm
            url(new File(['node', '--print', "require.resolve('react-native/package.json')"].execute(null, rootDir).text.trim(), '../android'))
        }
        maven {
            // Android JSC is installed from npm
            url(new File(['node', '--print', "require.resolve('jsc-android/package.json', { paths: [require.resolve('react-native/package.json')] })"].execute(null, rootDir).text.trim(), '../dist'))
        }

        google()
        mavenCentral()
        maven { url 'https://www.jitpack.io' }
    }
}

## 인프라 구축

### Docker Network 설정

모든 컨테이너는 `uptention_network`라는 외부 네트워크를 통해 통신합니다. 네트워크 생성 방법:

```bash
docker network create uptention_network
```

### MySQL 설정

```yaml
# mysql-docker-compose.yml
version: "3.8"
services:
  mysql:
    image: mysql:8.0.36
    restart: always
    ports:
      - "3300:3306"
    volumes:
      - uptention-mysql:/var/lib/mysql
    environment:
      MYSQL_DATABASE: uptention
      MYSQL_USER: uptention
      MYSQL_PASSWORD: <비밀번호>
      MYSQL_ROOT_PASSWORD: <루트비밀번호>
      TZ: UTC
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --default-time-zone=+00:00
volumes:
  uptention-mysql:
```

### Redis 설정

```yaml
# redis-docker-compose.yml
version: "3.8"
services:
  redis:
    container_name: uptention-redis
    image: redis:7.4.2
    restart: always
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - uptention_network
volumes:
  redis-data:
networks:
  uptention_network:
    external: true
```

### RabbitMQ 설정

```yaml
# rabbitmq-docker-compose.yml
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    restart: always
    environment:
      RABBITMQ_DEFAULT_USER: uptention
      RABBITMQ_DEFAULT_PASS: <비밀번호>
      TZ: UTC
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - uptention_network
volumes:
  rabbitmq-data:
networks:
  uptention_network:
    external: true
```

### Nginx 설정

```yaml
# nginx-docker-compose.yml
services:
  nginx:
    image: nginx:1.25.4
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    environment:
      TZ: "Asia/Seoul"
    volumes:
      - /home/ubuntu/uptention/nginx/conf:/etc/nginx/conf.d
      - /home/ubuntu/uptention/nginx/certbot/conf:/etc/letsencrypt
      - /home/ubuntu/uptention/nginx/certbot/www:/var/www/certbot
      - /home/ubuntu/uptention/frontend/build:/usr/share/nginx/html
      - /home/ubuntu/uptention/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /home/ubuntu/uptention/nginx/logs:/var/log/nginx
    depends_on:
      - certbot
    networks:
      - uptention_network

  certbot:
    image: certbot/certbot
    volumes:
      - /home/ubuntu/uptention/nginx/certbot/conf:/etc/letsencrypt
      - /home/ubuntu/uptention/nginx/certbot/www:/var/www/certbot
    networks:
      - uptention_network

networks:
  uptention_network:
    external: true
```

#### Nginx 설정 파일 (default.conf)

이 설정은 다음과 같은 기능을 제공합니다:
- HTTP를 HTTPS로 리디렉션
- 프론트엔드 정적 파일 서빙
- 백엔드 API 프록시
- Jenkins 웹 인터페이스 프록시
- RabbitMQ 관리 인터페이스 프록시
- Solana Express 서버 프록시
- 코드 리뷰 웹훅 처리

### Solana Express 서버

```yaml
# docker-compose.yml (Express 서버)
version: '3.8'
services:
  uptention_express_server:
    image: jaemoon99/uptention:express-server-v0.8
    container_name: uptention_express_server
    expose:
      - "4044"
    networks:
      - uptention_network
    volumes:
      - ./my-keypair.json:/usr/src/app/my-keypair.json:ro
networks:
  uptention_network:
    external: true
```

### 코드 리뷰 서버

```yaml
# review-docker-compose.yml
services:
  review-server:
    image: jodaeseong/gitlab-review-server:latest
    container_name: review-server
    environment:
      GPT_API_KEY: "<API_KEY>"
      GITLAB_TOKEN: "<TOKEN>"
    expose:
      - "5000"
    restart: always
    networks:
      - uptention_network
networks:
  uptention_network:
    external: true
```

## CI/CD 설정

### Jenkins 설정

```yaml
# jenkins-docker-compose.yml
version: "3.8"
services:
  jenkins:
    image: myjenkins-docker:2.502
    container_name: jenkins
    volumes:
      - /home/ubuntu/jenkins-data:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    expose:
      - "8080"
    group_add:
      - "999"
    networks:
      - uptention_network
    environment:
      - JENKINS_OPTS=--prefix=/jenkins
networks:
  uptention_network:
    external: true
```

#### 커스텀 Jenkins 이미지

```dockerfile
# Dockerfile
FROM jenkins/jenkins:2.502
USER root
RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*
RUN usermod -aG docker jenkins
USER jenkins
```

### 백엔드 CI/CD 파이프라인 (Jenkinsfile)

주요 단계:
1. 저장소 클론
2. Firebase 서비스 계정 키 파일 주입
3. Gradle로 애플리케이션 빌드
4. Docker 이미지 빌드
5. Docker Hub에 이미지 푸시
6. Blue/Green 방식으로 EC2에 배포

### 프론트엔드 CI/CD 파이프라인 (Jenkinsfile)

주요 단계:
1. 저장소 클론
2. npm으로 프론트엔드 빌드
3. 정적 파일 업데이트용 Docker 이미지 빌드
4. EC2의 Nginx 볼륨에 정적 파일 업데이트

## 모니터링 설정

### Prometheus & Grafana

```yaml
# docker-compose.yml (모니터링)
version: "3"
networks:
  uptention_network:
    external: true
services:
  prometheus:
    image: prom/prometheus
    container_name: prometheus
    volumes:
      - ./prometheus/config:/etc/prometheus
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--storage.tsdb.path=/prometheus'
      - '--config.file=/etc/prometheus/prometheus.yml'
    restart: always
    networks:
      - uptention_network

  grafana:
    image: grafana/grafana
    container_name: grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning/:/etc/grafana/provisioning/
    restart: always
    depends_on:
      - prometheus
    networks:
      - uptention_network

  node_exporter:
    image: prom/node-exporter
    container_name: node_exporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - uptention_network

  nginx_exporter:
    image: nginx/nginx-prometheus-exporter:latest
    container_name: nginx_exporter
    command:
      - '--nginx.scrape-uri=http://nginx:8080/stub_status'
    ports:
      - "9113:9113"
    networks:
      - uptention_network

  loki:
    image: grafana/loki:2.8.2
    container_name: loki
    volumes:
      - ./loki-config:/etc/loki
    ports:
      - "3100:3100"
    networks:
      - uptention_network

  promtail:
    image: grafana/promtail:2.8.2
    container_name: promtail
    volumes:
      - /home/ubuntu/uptention/nginx/logs:/var/log/nginx:ro
      - ./promtail-config.yaml:/etc/promtail/config.yaml
      - /home/ubuntu/uptention/spring-logs:/var/log/spring:ro
    command:
      - -config.file=/etc/promtail/config.yaml
    networks:
      - uptention_network
volumes:
  grafana-data:
  prometheus-data:
```

### Prometheus 설정 (prometheus.yml)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 2m

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['prometheus:9090']

  - job_name: 'node_exporter'
    static_configs:
      - targets: ['node_exporter:9100']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx_exporter:9113']

  - job_name: 'spring_boot'
    metrics_path: '/actuator/prometheus'
    file_sd_configs:
      - files:
        - /etc/prometheus/active-spring-targets.json
```

### Loki & Promtail 설정

프로젝트에서는 Loki와 Promtail을 사용하여 로그를 수집 및 분석합니다:

**promtail-config.yaml**:
```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: nginx
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/access.log
  - job_name: spring-app
    static_configs:
      - targets:
          - localhost
        labels:
          job: spring-app
          __path__: /var/log/spring/application*.log
```

## 시스템 구동 방법

### 사전 준비사항

1. Docker 및 Docker Compose 설치
   ```bash
   # Docker 설치
   sudo apt-get update
   sudo apt-get install ca-certificates curl gnupg
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg
   
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   
   # Docker Compose 설치 (플러그인 외 독립 실행형 버전이 필요한 경우)
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. 필요한 환경 변수 설정
   ```bash
   # 환경 변수를 저장할 .env 파일 생성 (실제 값은 보안 정책에 맞게 설정)
   cat > .env << EOF
   # S3 관련 설정
   S3_ACCESS_TOKEN=your_access_token
   S3_SECRET_TOKEN=your_secret_token
   
   # 데이터베이스 관련 설정
   SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/uptention?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   SPRING_DATASOURCE_USERNAME=uptention
   SPRING_DATASOURCE_PASSWORD=your_password
   
   # JWT 관련 설정
   JWT_SECRET_KEY=your_jwt_secret_key
   
   # Solana 관련 설정
   SOLANA_COMPANY_WALLET=your_solana_wallet
   WORK_TOKEN_MINT=your_token_mint
   
   # RabbitMQ 관련 설정
   RABBITMQ_HOST=rabbitmq
   RABBITMQ_PORT=5672
   RABBITMQ_USERNAME=uptention
   RABBITMQ_PASSWORD=your_rabbitmq_password
   
   # Redis 관련 설정
   REDIS_HOST=redis
   REDIS_PORT=6379
   EOF
   ```

3. 외부 Docker 네트워크 생성
   ```bash
   docker network create uptention_network
   ```

### 서비스 시작

1. 디렉토리 구조 생성
   ```bash
   mkdir -p /home/ubuntu/uptention/{frontend/build,nginx/{conf,certbot/{conf,www},logs},spring-logs}
   ```

2. 각 서비스의 설정 파일 생성
   ```bash
   # Nginx 구성 파일 복사
   cp default.conf /home/ubuntu/uptention/nginx/conf/
   cp nginx_status.conf /home/ubuntu/uptention/nginx/conf/
   cp upstream-spring.conf /home/ubuntu/uptention/nginx/conf/
   cp nginx.conf /home/ubuntu/uptention/nginx/
   
   # Prometheus 설정 파일 복사
   mkdir -p /home/ubuntu/uptention/monitoring/prometheus/config
   cp prometheus.yml /home/ubuntu/uptention/monitoring/prometheus/config/
   cp active-spring-targets.json /home/ubuntu/uptention/monitoring/prometheus/config/
   
   # Loki 설정 파일 복사
   mkdir -p /home/ubuntu/uptention/monitoring/loki-config
   cp local-config.yaml /home/ubuntu/uptention/monitoring/loki-config/
   
   # Promtail 설정 파일 복사
   cp promtail-config.yaml /home/ubuntu/uptention/monitoring/
   ```

3. 각 서비스 시작
   ```bash
   # MySQL 서비스 시작
   docker-compose -f mysql-docker-compose.yml up -d
   
   # Redis 서비스 시작
   docker-compose -f redis-docker-compose.yml up -d
   
   # RabbitMQ 서비스 시작
   docker-compose -f rabbitmq-docker-compose.yml up -d
   
   # Jenkins 서비스 시작
   # 먼저 Jenkins 커스텀 이미지 빌드
   docker build -t myjenkins-docker:2.502 -f Dockerfile .
   docker-compose -f jenkins-docker-compose.yml up -d
   
   # Monitoring 서비스 시작
   docker-compose -f monitoring-docker-compose.yml up -d
   
   # Express 서버 시작
   docker-compose -f docker-compose.yml up -d uptention_express_server
   
   # Review 서버 시작
   docker-compose -f review-docker-compose.yml up -d
   
   # Nginx 서비스 시작 (SSL 인증서 획득 후)
   docker-compose -f nginx-docker-compose.yml up -d
   ```

4. SSL 인증서 설정 (Let's Encrypt)
   ```bash
   # SSL 인증서 초기 발급
   docker-compose -f nginx-docker-compose.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email your_email@example.com -d your_domain.com --agree-tos
   
   # SSL 인증서 자동 갱신 설정 (crontab)
   echo "0 12 * * * docker-compose -f /home/ubuntu/uptention/nginx-docker-compose.yml run --rm certbot renew --quiet && docker exec nginx nginx -s reload" | sudo tee -a /etc/crontab > /dev/null
   ```

5. 개발 환경 설정
   ```bash
   # 백엔드 개발 환경 시작 (로컬)
   cd backend/uptention
   docker-compose -f docker-compose-local.yml up -d
   
   # 프론트엔드 개발 환경 시작 (웹)
   cd frontend_web
   npm install
   npm start
   
   # 프론트엔드 개발 환경 시작 (모바일)
   cd frontend_app
   npm install
   npx expo start
   ```

6. Jenkins 파이프라인을 통해 백엔드 및 프론트엔드 배포
   ```bash
   # Jenkins 초기 비밀번호 확인
   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   
   # Jenkins 웹 인터페이스 접속 (https://your_domain.com/jenkins/)
   # 1. 권장 플러그인 설치
   # 2. 관리자 계정 생성
   # 3. Jenkins 자격 증명 설정 (Credentials > System > Global credentials)
   #    - S3_ACCESS_TOKEN, S3_SECRET_TOKEN, JWT_SECRET_KEY 등 환경 변수 추가
   #    - Docker Hub 자격 증명 추가
   #    - GitLab 접근 토큰 추가
   # 4. 파이프라인 작업 생성
   #    - Pipeline script from SCM 선택
   #    - SCM: Git
   #    - Repository URL: https://lab.ssafy.com/s12-blockchain-nft-sub1/S12P21D211.git
   #    - Credentials: GitLab 접근 토큰
   #    - Branch: */be (백엔드) 또는 */fe-web (프론트엔드)
   #    - Script Path: Jenkinsfile
   ```

## 주의사항

1. 보안 키 및 비밀번호는 환경 변수 또는 Jenkins Credentials를 통해 관리합니다.
2. Blue/Green 배포 방식을 사용하여 무중단 배포를 구현합니다.
3. 모든 컨테이너는 동일한 Docker 네트워크 내에서 통신합니다.
4. 타임존은, 특별한 언급이 없는 한, UTC로 통일합니다.

## 개발 환경 구성

### 백엔드 개발 환경 설정 (IntelliJ IDEA)

1. IntelliJ IDEA 2024.3.1.1 설치
2. 프로젝트 불러오기
   - File > Open > `backend/uptention` 선택
   - Gradle 프로젝트로 열기
3. JDK 17 설정
   - File > Project Structure > Project > SDK > 17 선택
4. 실행 설정
   - Run > Edit Configurations > + > Spring Boot
   - Main class: `com.otoki.uptention.UptentionApplication`
   - Active profiles: `local`
   - JRE: 17
5. 로컬 서비스 시작
   ```bash
   cd backend/uptention
   docker-compose -f docker-compose-local.yml up -d
   ```
6. 애플리케이션 실행
   - Run > Run 'UptentionApplication'

### 웹 프론트엔드 개발 환경 설정 (VSCode)

1. Visual Studio Code 1.97.2 설치
2. 프로젝트 열기
   - File > Open Folder > `frontend_web` 선택
3. 필요한 익스텐션 설치
   - ESLint
   - Prettier
   - React Developer Tools
4. 종속성 설치 및 개발 서버 시작
   ```bash
   npm install
   npm start
   ```

### 모바일 앱 개발 환경 설정 (Android Studio)

1. Android Studio Arctic Fox 2024.1.1 설치
2. Node.js 및 npm 설치
3. Expo CLI 설치
   ```bash
   npm install -g expo-cli
   ```
4. 프로젝트 준비
   ```bash
   cd frontend_app
   npm install
   ```
5. Android 에뮬레이터 설정
   - Android Studio > Tools > Device Manager > Create Device
   - 적절한 디바이스 선택 (예: Pixel 5)
   - 시스템 이미지 선택 (API 34 이상)
6. 개발 서버 시작
   ```bash
   npx expo start
   ```
7. 안드로이드 에뮬레이터에서 실행
   - 개발 서버에서 'a' 키를 눌러 Android 에뮬레이터에서 실행

## 배포 프로세스

### 백엔드 배포 프로세스

1. 개발자가 GitLab 저장소의 `be` 브랜치에 코드 푸시
2. Jenkins가 웹훅을 통해 변경 감지
3. Jenkins 파이프라인 실행:
   - 코드 클론
   - Gradle로 빌드
   - Docker 이미지 생성
   - Docker Hub에 이미지 푸시
   - Blue/Green 방식으로 EC2에 배포
4. 배포 후 Nginx 설정 자동 업데이트
5. 이전 컨테이너 정리

### 프론트엔드 배포 프로세스

1. 개발자가 GitLab 저장소의 `fe-web` 브랜치에 코드 푸시
2. Jenkins가 웹훅을 통해 변경 감지
3. Jenkins 파이프라인 실행:
   - 코드 클론
   - npm으로 빌드
   - 정적 파일 생성
   - EC2의 Nginx가 서빙하는 디렉토리에 파일 복사
4. 배포 완료 알림