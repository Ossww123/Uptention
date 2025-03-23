#!/bin/bash
# /build에 있는 파일을 Nginx 컨테이너에서 서빙하는 디렉터리로 복사
cp -r /build/. /usr/share/nginx/html
