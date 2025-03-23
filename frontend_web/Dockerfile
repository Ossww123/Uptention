FROM busybox
WORKDIR /build
# 로컬의 build 폴더 내용을 컨테이너 내부 /build로 복사
COPY build/. .
ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["sh", "/entrypoint.sh"]
