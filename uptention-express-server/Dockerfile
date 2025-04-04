# 베이스 이미지 선택
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# package.json 및 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 애플리케이션 소스 코드 전체 복사
COPY . .

# 애플리케이션이 사용할 포트 노출
EXPOSE 3000

# 실행
CMD [ "npm", "start" ]
