import csv
import requests
import io
import os
import json # JSON 라이브러리 추가
import uuid # 파일명 생성용 UUID 추가
import re   # Content-Disposition 파싱용 정규식 추가
from urllib.parse import urlparse, unquote

# --- 설정 변수 ---
ITEM_CSV_FILE_PATH = 'new_item_data.csv' # 입력 파일명 확인
IMAGE_CSV_FILE_PATH = 'img_data.csv'    # 입력 파일명 확인
API_ENDPOINT_URL = 'https://j12d211.p.ssafy.io/api/items'  # API 엔드포인트 URL 확인

# API에서 요구하는 RequestPart 이름
API_ITEM_PART_NAME = 'item'
API_IMAGES_PART_NAME = 'images'

# --- Helper 함수: 이미지 다운로드 (파일명 추출 로직 개선) ---
def download_image(url):
    """주어진 URL에서 이미지를 다운로드하고 파일 이름, 내용, 타입을 반환합니다."""
    if not url:
        return None, None, None
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
        response = requests.get(url, stream=True, timeout=20, headers=headers)
        response.raise_for_status()

        content_type = response.headers.get('content-type', 'application/octet-stream')
        image_content = response.content
        filename = ""

        # 1. Content-Disposition 헤더에서 파일명 시도
        content_disposition = response.headers.get('Content-Disposition')
        if content_disposition:
            fname = re.findall('filename="?([^"]+)"?', content_disposition)
            if fname:
                filename = unquote(fname[0]) # URL 디코딩 포함

        # 2. Content-Disposition이 없으면 URL 경로에서 파일명 시도
        if not filename:
            parsed_url = urlparse(url)
            path_part = unquote(parsed_url.path) # 경로 디코딩
            potential_filename = os.path.basename(path_part) if path_part else ""
            # 확장자 확인 (간단히 . 뒤 1~4 글자)
            if '.' in potential_filename and 1 <= len(potential_filename.rsplit('.', 1)[1]) <= 4:
                filename = potential_filename

        # 3. 그래도 없으면 Content-Type과 UUID로 생성
        if not filename:
            # MIME 타입에서 확장자 추출 (예: image/png -> png)
            extension = content_type.split('/')[-1].split(';')[0].lower()
            # 알려진 이미지 확장자가 아니면 기본값 사용
            if extension not in ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp']:
                extension = 'jpg' # 기본 확장자

            # 고유성을 위해 UUID 사용
            filename = f"{uuid.uuid4()}.{extension}"
            print(f"    Warning: Could not determine filename from URL or headers. Generated filename: {filename}")

        # 최종 파일명 정리 (예: 경로 문자 제거 - 필요시)
        # filename = os.path.basename(filename) # 혹시 경로 포함 시 대비

        return filename, image_content, content_type

    except requests.exceptions.RequestException as e:
        print(f"  Error downloading image from {url}: {e}")
        return None, None, None
    except Exception as e:
        print(f"  An unexpected error occurred while downloading {url}: {e}")
        return None, None, None

# --- 메인 로직 ---
def main():
    processed_count = 0
    error_count = 0
    skipped_items = 0
    total_items = 0

    # 1. 이미지 CSV 읽어서 item_id 별 URL 리스트 생성
    item_images = {}
    try:
        with open(IMAGE_CSV_FILE_PATH, mode='r', encoding='utf-8') as img_csvfile:
            reader = csv.DictReader(img_csvfile, delimiter=';')
            print(f"Loading image data from {IMAGE_CSV_FILE_PATH}...")
            for row in reader:
                item_id_str = row.get('item_id')
                url = row.get('url')
                if item_id_str and url:
                    try:
                        item_id = int(item_id_str)
                        if item_id not in item_images:
                            item_images[item_id] = []
                        item_images[item_id].append(url)
                    except ValueError:
                        print(f"  Warning: Invalid item_id '{item_id_str}' in image CSV row: {row}")
            print(f"Image data loaded. Found images for {len(item_images)} items.")
    except FileNotFoundError:
        print(f"Error: Image CSV file not found at {IMAGE_CSV_FILE_PATH}")
        return
    except Exception as e:
        print(f"An error occurred while reading image CSV: {e}")
        return

    # 2. 상품 CSV 읽고 처리
    try:
        with open(ITEM_CSV_FILE_PATH, mode='r', encoding='utf-8') as item_csvfile:
            reader = csv.DictReader(item_csvfile, delimiter=';')
            item_rows = list(reader)
            total_items = len(item_rows)
            print(f"\nStarting product registration for {total_items} items from {ITEM_CSV_FILE_PATH}...")

            for row_num, item_row in enumerate(item_rows, start=1):
                item_id_str = item_row.get('id')
                item_name_raw = item_row.get('name', 'N/A') # 원본 이름 로깅용
                print(f"\nProcessing item {row_num}/{total_items}: ID={item_id_str}, Name={item_name_raw}")

                if not item_id_str:
                    print("  Skipping row: Missing item ID.")
                    skipped_items += 1
                    continue

                try:
                    item_id = int(item_id_str)
                except ValueError:
                    print(f"  Skipping row: Invalid item ID '{item_id_str}'.")
                    skipped_items += 1
                    continue

                # 3. ItemCreateRequestDto 생성 및 유효성 검사
                item_dto_dict = {}
                try:
                    # 이름 길이 처리
                    raw_name = item_row.get('name', '').strip()
                    if len(raw_name) > 30:
                        print(f"  Warning: Truncating product name for item ID {item_id} from {len(raw_name)} to 30 characters.")
                        item_dto_dict['name'] = raw_name[:30]
                    else:
                        item_dto_dict['name'] = raw_name

                    # 나머지 필드 매핑 및 타입 변환
                    item_dto_dict['categoryId'] = int(item_row.get('category_id', 0))
                    item_dto_dict['brand'] = item_row.get('brand', '').strip()
                    item_dto_dict['price'] = int(item_row.get('price', 0)) # 가격 고정
                    item_dto_dict['detail'] = item_row.get('detail', '').strip()
                    item_dto_dict['quantity'] = int(item_row.get('quantity', 0))

                    # 기본 유효성 검사
                    if not all([item_dto_dict['name'], item_dto_dict['brand'], item_dto_dict['detail']]):
                        raise ValueError("Missing required fields (name, brand, or detail)")
                    if item_dto_dict['categoryId'] <= 0 or item_dto_dict['quantity'] <= 0:
                        # 가격 검사는 제거 (10으로 고정했으므로)
                        raise ValueError("categoryId and quantity must be positive integers")

                except (ValueError, TypeError) as e:
                    print(f"  Skipping item ID {item_id}: Invalid data format in item CSV - {e}. Row: {item_row}")
                    skipped_items += 1
                    continue

                # DTO 객체를 JSON 문자열로 변환
                item_json_string = json.dumps(item_dto_dict, ensure_ascii=False)

                # 4. 이미지 다운로드 및 multipart 리스트 준비
                image_urls = item_images.get(item_id, [])
                files_for_request = []
                # JSON 파트 추가 ('item')
                files_for_request.append((API_ITEM_PART_NAME, (None, item_json_string, 'application/json')))

                downloaded_image_count = 0
                if not image_urls:
                    print(f"  Warning: No images listed for item ID {item_id}. Attempting API call without images.")

                for img_idx, url in enumerate(image_urls):
                    print(f"  Downloading image {img_idx + 1}/{len(image_urls)} from: {url}")
                    filename, image_content, content_type = download_image(url)

                    if filename and image_content:
                        print(f"    Image downloaded: {filename}, size: {len(image_content)} bytes, type: {content_type}")
                        image_file_like = io.BytesIO(image_content)

                        # MIME 타입 정규화 (image/jpg -> image/jpeg)
                        reported_content_type = content_type or 'application/octet-stream'
                        actual_content_type = 'image/jpeg' if reported_content_type.lower() == 'image/jpg' else reported_content_type

                        # 이미지 파트 추가 ('images') - 동일 이름으로 여러 개 추가
                        files_for_request.append((API_IMAGES_PART_NAME, (filename, image_file_like, actual_content_type)))
                        downloaded_image_count += 1
                    else:
                        print(f"    Failed to download image {img_idx + 1} for item ID {item_id}.")

                # 이미지 다운로드 실패 시 처리 (500 에러 방지)
                # 이미지 URL이 있었는데도 불구하고 다운로드를 하나도 성공 못했다면 API 호출 건너뛰기
                if downloaded_image_count == 0 and len(image_urls) > 0:
                    print(f"  Skipping item ID {item_id}: Failed to download any images associated with it.")
                    skipped_items += 1
                    continue # 다음 아이템으로 넘어감

                # 5. Spring Boot API 호출 (POST 요청)
                try:
                    print(f"  Calling API: {API_ENDPOINT_URL} for item ID {item_id}")
                    response = requests.post(API_ENDPOINT_URL, files=files_for_request, timeout=60)

                    if 200 <= response.status_code < 300:
                        print(f"  API call successful (Status: {response.status_code}). Response: {response.text[:100]}...")
                        processed_count += 1
                    else:
                        # 실패 시 응답 내용을 포함하여 로그 출력
                        print(f"  API call failed (Status: {response.status_code}). Response: {response.text}")
                        error_count += 1
                        # 여기에 특정 에러 코드(예: FILE_007 매직넘버)에 대한 추가 로깅 가능

                except requests.exceptions.RequestException as e:
                    print(f"  API call failed for item ID {item_id}: Network or request error - {e}")
                    error_count += 1
                except Exception as e:
                    print(f"  An unexpected error occurred during API call for item ID {item_id}: {e}")
                    import traceback
                    traceback.print_exc()
                    error_count += 1

    except FileNotFoundError:
        print(f"Error: Item CSV file not found at {ITEM_CSV_FILE_PATH}")
        return
    except Exception as e:
        print(f"An critical error occurred during CSV processing: {e}")
        import traceback
        traceback.print_exc()
        return

    # 6. 최종 결과 요약 출력
    print(f"\n--- Processing Summary ---")
    print(f"Total items in CSV: {total_items}")
    print(f"Items skipped before API call (missing data, download failure, etc.): {skipped_items}")
    print(f"API calls attempted: {processed_count + error_count}")
    print(f"Successfully registered via API: {processed_count}")
    print(f"API call errors: {error_count}")


if __name__ == "__main__":
    main()
