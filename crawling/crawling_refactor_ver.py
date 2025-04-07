import time
from datetime import datetime

from selenium import webdriver
from selenium.common import NoSuchElementException, ElementClickInterceptedException
from selenium.webdriver import Keys
from selenium.webdriver.common.by import By

import pandas as pd

urls = [
    # 리빙 가전
    {
        "url": "https://www.samsung.com/sec/tvs/all-tvs/",
        "category_id": "1",
        "type": 0
    },
    {
        "url": "https://www.samsung.com/sec/washers-and-dryers/all-washers-and-dryers/",
        "category_id": "1",
        "type": 0
    },
    {
        "url": "https://www.samsung.com/sec/air-conditioners/all-air-conditioners/",
        "category_id": "1",
        "type": 0
    },
    {
        "url": "https://www.samsung.com/sec/vacuum-cleaners/all-vacuum-cleaners/",
        "category_id": "1",
        "type": 0
    },
    {
        "url": "https://www.samsung.com/sec/airdressers-and-shoedressers/all-airdressers-and-shoedressers/",
        "category_id": "1",
        "type": 0
    },
    {
        "url": "https://www.samsung.com/sec/small-appliances/all-small-appliances/",
        "category_id": "1",
        "type": 0
    },

    # 주방 가전
    {
        "url": "https://www.samsung.com/sec/refrigerators/all-refrigerators/",
        "category_id": "2",
        "type": 0
    },
    {
        "url": "https://www.samsung.com/sec/kimchi-refrigerators/all-kimchi-refrigerators/",
        "category_id": "2",
        "type": 0
    },
    {
        "url": "https://www.samsung.com/sec/cooking-appliances/all-cooking-appliances/",
        "category_id": "2",
        "type": 0
    },
    {
        "url": "https://www.samsung.com/sec/dishwashers/all-dishwashers/",
        "category_id": "2",
        "type": 0
    },
    {
        "url": "https://www.samsung.com/sec/water-purifier/all-water-purifier/",
        "category_id": "2",
        "type": 0
    },
    {
        "url": "https://www.samsung.com/sec/kitchen-small-appliance/all-kitchen-small-appliance/",
        "category_id": "2",
        "type": 0
    },

    # 뷰티
    {
        "url": "https://www.oliveyoung.co.kr/store/main/getBestList.do?t_page=3%EC%9B%94%20%EC%98%AC%EC%98%81PICK%20%EA%B8%B0%ED%9A%8D%EC%A0%84%20%EC%83%81%EC%84%B8&t_click=GNB&t_gnb_type=%EB%9E%AD%ED%82%B9&t_swiping_type=N",
        "category_id": "3",
        "type": 1
    },

    # 패션의류/잡화
    {
        "url": "https://www.ssfshop.com/Galaxy-Lifestyle/MEN/list?dspCtgryNo=SFMA42&brandShopNo=BDMA04A02&brndShopId=HMBGC",
        "category_id": "4",
        "type": 2
    },

    # 키즈
    {
        "url": "https://www.daisomall.co.kr/ds/dst/SCR_DST_0015?searchTerm=%EC%9C%A0%EC%95%84%EC%9A%A9%ED%92%88",
        "category_id": "8",
        "type": 3
    },

    # 식품
    {
        "url": "https://www.daisomall.co.kr/ds/dst/SCR_DST_0015?searchTerm=%EC%8B%9D%ED%92%88",
        "category_id": "7",
        "type": 3
    },

    # 생활용품
    {
        "url": "https://www.daisomall.co.kr/ds/dst/SCR_DST_0015?searchTerm=%EC%83%9D%ED%99%9C%EC%9A%A9%ED%92%88",
        "category_id": "6",
        "type": 3
    },

    # 문화/여가
    {
        "url": "https://store.kyobobook.co.kr/bestseller/total/annual?page=1&per=50",
        "category_id": "5",
        "type": 4
    },
]

# 상품 테이블 컬럼 리스트
item_id_list = []
item_name_list = []
item_detail_list = []
item_price_list = []
item_brand_list = []
item_category_id_list = []
item_quantity_list = []
item_sales_count_list = []
item_status_list = []
item_created_at_list = []
item_updated_at_list = []

# 이미지 테이블 컬럼 리스트
img_id_list = []
img_url_list = []
img_item_id_list = []
img_created_at_list = []
img_updated_at_list = []

# 상품 기본 정보
item_detail = "상품 상세 정보가 없습니다."  # 상품 설명
item_price = 0  # 상품 가격
item_quantity = 10  # 상품 개수
item_sales_count = 0  # 판매 개수
item_status = 0  # 논리 삭제 여부

# 상품 정보를 출력하는 함수
def print_item_info(_id, name, detail, price, brand, category_id, quantity, sales_count, status):
    print(
        str(_id),
        name,
        detail,
        price,
        brand,
        category_id,
        str(quantity),
        str(sales_count),
        str(status), sep=" | "
    )

# 상품 정보를 리스트에 담는 함수
def append_item_info(_id, name, detail, price, brand, category_id, quantity, sales_count, status):
    item_id_list.append(_id)
    item_name_list.append(name)
    item_detail_list.append(detail)
    item_price_list.append(price)
    item_brand_list.append(brand)
    item_category_id_list.append(category_id)
    item_quantity_list.append(quantity)
    item_sales_count_list.append(sales_count)
    item_status_list.append(status)
    item_created_at_list.append(datetime.now())
    item_updated_at_list.append(datetime.now())

# 이미지 정보를 출력하는 함수
def print_img_info(_id, url, item_id):
    print(
        str(_id),
        str(item_id),
        url, sep=" : "
    )

# 이미지 정보를 리스트에 담는 함수
def append_img_info(_id, url, item_id):
    img_id_list.append(_id)
    img_url_list.append(url)
    img_item_id_list.append(item_id)
    img_created_at_list.append(datetime.now())
    img_updated_at_list.append(datetime.now())

# crawl_type이 0에 해당하는 함수
def crawl_type_0(driver, item_id, category_id, img_id):
    idx = 1
    cnt = 1
    while cnt < 6:
        time.sleep(3)
        # 상품 선택
        try:
            item = driver.find_element(By.XPATH, '/html/body/div[2]/div[7]/div[4]/div[6]/div[2]/div[2]/ul/li[' + str(idx) + ']/div/div[4]/a/span')
        except NoSuchElementException:
            try:
                item = driver.find_element(By.XPATH, '/html/body/div[2]/div[7]/div[4]/div[5]/div[2]/div[2]/ul/li[' + str(idx) + ']/div/div[4]/a/span')
            except NoSuchElementException as e:
                # print(e)
                idx += 1
                continue

        # 상품 이름
        item_name = item.text
        # 상품 브랜드
        item_brand = "삼성"

        item.click()

        for z in range(1, 4):
            time.sleep(3)
            item_image_url = None
            try:
                item_image = driver.find_element(By.XPATH, '/html/body/div[2]/div[7]/div[3]/section[1]/div/div/div[1]/div[2]/div[3]/ol/div/div/li[' + str(z) + ']/span/a/img')
                item_image.click()

                time.sleep(3)

                item_image_url = driver.find_element(By.XPATH, '/html/body/div[2]/div[7]/div[3]/section[1]/div/div/div[1]/div[2]/div[2]/div/div/div[' + str(z) + ']/img').get_attribute('src')

            except NoSuchElementException as e:
                # print(e)
                pass

            if item_image_url is not None:
                print_img_info(img_id, item_image_url, item_id)
                append_img_info(img_id, item_image_url, item_id)
                img_id += 1

        print_item_info(item_id, item_name, item_detail, item_price, item_brand, category_id, item_quantity, item_sales_count, item_status)
        append_item_info(item_id, item_name, item_detail, item_price, item_brand, category_id, item_quantity, item_sales_count, item_status)

        cnt += 1
        idx += 1
        item_id += 1

        # 뒤로가기
        driver.back()

    return item_id, img_id

# crawl_type이 1에 해당하는 함수
def crawl_type_1(driver, item_id, category_id, img_id):
    h = 1
    idx = 1
    cnt = 1
    while cnt < 31:
        time.sleep(1)
        # 상품 선택
        try:
            item = driver.find_element(By.XPATH, '/html/body/div[3]/div[8]/div[2]/div[2]/ul[' + str(h) + ']/li[' + str(idx) + ']/div/a/img')
        except NoSuchElementException:
            h += 1
            idx = 1
            item = driver.find_element(By.XPATH, '/html/body/div[3]/div[8]/div[2]/div[2]/ul[' + str(h) + ']/li[' + str(idx) + ']/div/a/img')

        # 상품 이름
        item_name = driver.find_element(By.XPATH, '/html/body/div[3]/div[8]/div[2]/div[2]/ul[' + str(h) + ']/li[' + str(idx) + ']/div/div/a/p').text
        item_name = item_name.split("]")[-1].strip()
        # 상품 브랜드
        item_brand = driver.find_element(By.XPATH, '/html/body/div[3]/div[8]/div[2]/div[2]/ul[' + str(h) + ']/li[' + str(idx) + ']/div/div/a/span').text

        item.click()

        for z in range(1, 4):
            time.sleep(3)
            item_image_url = None
            try:
                item_image = driver.find_element(By.XPATH, '/html/body/div[3]/div[8]/div/div[2]/div[1]/ul/li[' + str(z) + ']/a/img')
                item_image.click()

                time.sleep(3)

                item_image_url = driver.find_element(By.XPATH, '/html/body/div[3]/div[8]/div/div[2]/div[1]/div[1]/img').get_attribute('src')

            except NoSuchElementException as e:
                # print(e)
                pass

            if item_image_url is not None:
                print_img_info(img_id, item_image_url, item_id)
                append_img_info(img_id, item_image_url, item_id)
                img_id += 1

        print_item_info(item_id, item_name, item_detail, item_price, item_brand, category_id, item_quantity, item_sales_count, item_status)
        append_item_info(item_id, item_name, item_detail, item_price, item_brand, category_id, item_quantity, item_sales_count, item_status)

        cnt += 1
        idx += 1
        item_id += 1

        # 뒤로가기
        driver.back()

    return item_id, img_id

# crawl_type이 2에 해당하는 함수
def crawl_type_2(driver, item_id, category_id, img_id):
    idx = 1
    cnt = 1
    while cnt < 31:
        time.sleep(3)

        # 상품 선택
        item = driver.find_element(By.XPATH, '/html/body/div[5]/main/section/div[3]/div[1]/ul/li[' + str(idx) + ']/a/div[1]')

        # 상품 이름
        item_name = driver.find_element(By.XPATH, '/html/body/div[5]/main/section/div[3]/div[1]/ul/li[' + str(idx) + ']/a/div[2]/span[2]').text
        item_name = item_name.split("]")[-1].strip()

        # 상품 브랜드
        item_brand = "GALAXY LIFESTYLE"

        item.click()

        for z in range(1, 4):
            time.sleep(3)
            item_image_url = None
            try:
                item_image = driver.find_element(By.XPATH, '/html/body/div[5]/main/section/div[2]/div[1]/div[1]/div[' + str(z) + ']/button')
                item_image.click()

                time.sleep(3)

                item_image_url = driver.find_element(By.XPATH, '/html/body/div[5]/main/section/div[2]/div[1]/div[2]/div[2]/div[' + str(z) + ']/img').get_attribute('src')

            except NoSuchElementException as e:
                # print(e)
                pass

            if item_image_url is not None:
                print_img_info(img_id, item_image_url, item_id)
                append_img_info(img_id, item_image_url, item_id)
                img_id += 1

        print_item_info(item_id, item_name, item_detail, item_price, item_brand, category_id, item_quantity, item_sales_count, item_status)
        append_item_info(item_id, item_name, item_detail, item_price, item_brand, category_id, item_quantity, item_sales_count, item_status)

        cnt += 1
        idx += 1
        item_id += 1

        # 뒤로가기
        driver.back()

    return item_id, img_id

# crawl_type이 3에 해당하는 함수
def crawl_type_3(driver, item_id, category_id, img_id):
    idx = 1
    cnt = 1
    while cnt < 31:
        time.sleep(3)

        # 상품 선택
        try:
            item = driver.find_element(By.XPATH, '/html/body/div[1]/div/section/div[1]/div/div[4]/div[2]/div/div[2]/div[2]/div[' + str(idx) + ']/div[2]/a/div[2]')

        except NoSuchElementException as e:
            # print(e)
            driver.execute_script("window.scrollBy(0, 100);")
            idx += 1
            continue

        # 상품 이름
        item_name = item.text

        # 상품 브랜드
        item_brand = "다이소"

        item.click()

        time.sleep(5)

        for z in range(1, 4):
            item_image_url = None
            try:
                item_image = driver.find_element(By.XPATH, '/html/body/div[1]/div/section/div[1]/div/div[2]/div[1]/div[2]/div[1]/div[' + str(z) + ']')
                item_image.click()

                time.sleep(3)

                item_image_url = driver.find_element(By.XPATH, '/html/body/div[1]/div/section/div[1]/div/div[2]/div[1]/div[1]/div[1]/div[1]/div[' + str(z) + ']/img').get_attribute('src')
            except (ElementClickInterceptedException, NoSuchElementException):
                try:
                    item_image_url = driver.find_element(By.XPATH, '/html/body/div[1]/div/section/div[1]/div/div[2]/div[1]/div[1]/div[1]/div[1]/div[' + str(z) + ']/img').get_attribute('src')
                except (ElementClickInterceptedException, NoSuchElementException):
                    pass

            if item_image_url is not None:
                print_img_info(img_id, item_image_url, item_id)
                append_img_info(img_id, item_image_url, item_id)
                img_id += 1

        print_item_info(item_id, item_name, item_detail, item_price, item_brand, category_id, item_quantity, item_sales_count, item_status)
        append_item_info(item_id, item_name, item_detail, item_price, item_brand, category_id, item_quantity, item_sales_count, item_status)

        cnt += 1
        idx += 1
        item_id += 1

        # 뒤로가기
        driver.back()

    return item_id, img_id

# crawl_type이 4에 해당하는 함수
def crawl_type_4(driver, item_id, category_id, img_id):
    h = 1
    idx = 1
    cnt = 1

    driver.maximize_window()

    try:
        driver.find_element(By.XPATH, '/html/body/div[1]/div[3]/div/button/img').click()
        element = driver.find_element(By.XPATH, '/html/body/div[1]/div/div[2]/button[2]')
        element.send_keys(Keys.ENTER)
    except NoSuchElementException as e:
        pass

    while cnt < 31:
        time.sleep(5)

        # 상품 선택
        try:
            item = driver.find_element(By.XPATH, '/html/body/div[1]/main/section/div/div/section/ol[' + str(h) + ']/li[' + str(idx) + ']/div/div[2]/div[2]/a')
        except NoSuchElementException:
            h += 1
            idx = 1
            continue

        # 상품 이름
        item_name = item.text

        # 상품 브랜드
        item_brand = driver.find_element(By.XPATH, '/html/body/div[1]/main/section/div/div/section/ol[' + str(h) + ']/li[' + str(idx) + ']/div/div[2]/div[2]/div[2]').text
        item_brand = item_brand.split("·")[1].strip()

        item.click()

        time.sleep(5)

        try:
            item_image = driver.find_element(By.XPATH, '/html/body/div[3]/main/section[2]/div[1]/div/div[2]/div[2]/div[2]/div[1]/div[1]/ul/li[1]/div/div[2]/img')
        except NoSuchElementException:
            try:
                item_image = driver.find_element(By.XPATH, '/html/body/div[3]/main/section[2]/div[1]/div/div[2]/div/div[2]/div[1]/div[1]/ul/li[1]/div/div[2]/img')
            except NoSuchElementException:
                try:
                    item_image = driver.find_element(By.XPATH, '/html/body/div[4]/main/section[2]/div[1]/div/div[2]/div[2]/div[2]/div[1]/div[1]/ul/li[1]/div/div[2]/img')
                except NoSuchElementException:
                    item_image = driver.find_element(By.XPATH, '/html/body/div[5]/main/section[2]/div[1]/div/div[2]/div[2]/div[2]/div[1]/div[1]/ul/li[1]/div/div[2]/img')

        item_image_url = item_image.get_attribute('src')

        if item_image_url is not None:
            print_img_info(img_id, item_image_url, item_id)
            append_img_info(img_id, item_image_url, item_id)
            img_id += 1

        print_item_info(item_id, item_name, item_detail, item_price, item_brand, category_id, item_quantity, item_sales_count, item_status)
        append_item_info(item_id, item_name, item_detail, item_price, item_brand, category_id, item_quantity, item_sales_count, item_status)

        cnt += 1
        idx += 1
        item_id += 1

        # 뒤로가기
        driver.back()

    return item_id, img_id

def main():
    item_id = 1
    img_id = 1
    global item_detail
    global item_price
    global item_quantity
    global item_sales_count
    global item_status
    global urls

    # 크롬 드라이버 생성
    driver = webdriver.Chrome()
    
    for url_info in urls:
        driver.get(url_info["url"])
        crawl_type = url_info["type"]
        category_id = url_info["category_id"]

        if crawl_type == 0:
            item_id, img_id = crawl_type_0(driver, item_id, category_id, img_id)

        if crawl_type == 1:
            item_id, img_id = crawl_type_1(driver, item_id, category_id, img_id)

        if crawl_type == 2:
            item_id, img_id = crawl_type_2(driver, item_id, category_id, img_id)

        if crawl_type == 3:
            item_id, img_id = crawl_type_3(driver, item_id, category_id, img_id)

        if crawl_type == 4:
            item_id, img_id = crawl_type_4(driver, item_id, category_id, img_id)

    # 드라이버 종료
    driver.quit()

    # 상품 데이터로 변환
    item_data = {
        "id": item_id_list,
        "name": item_name_list,
        "detail": item_detail_list,
        "price": item_price_list,
        "brand": item_brand_list,
        "category_id": item_category_id_list,
        "quantity": item_quantity_list,
        "sales_count": item_sales_count_list,
        "status": item_status_list,
        "created_at": item_created_at_list,
        "updated_at": item_updated_at_list,
    }

    # 이미지 데이터로 변환
    img_data = {
        "id": img_id_list,
        "url": img_url_list,
        "item_id": img_item_id_list,
        "created_at": img_created_at_list,
        "updated_at": img_updated_at_list,
    }

    # 데이터 프레임 생성
    item_df = pd.DataFrame(item_data)
    img_df = pd.DataFrame(img_data)

    # 데이터프레임을 csv파일로 변경(utf-8)
    item_df.to_csv('item_data_utf8.csv', index=False, encoding='utf-8', sep=';')
    img_df.to_csv('img_data_utf8.csv', index=False, encoding='utf-8', sep=';')

    # 데이터프레임을 csv파일로 변경(utf-8-sig)
    item_df.to_csv('item_data_utf8sig.csv', index=False, encoding='utf-8-sig', sep=';')
    img_df.to_csv('img_data_utf8sig.csv', index=False, encoding='utf-8-sig', sep=';')

    # 데이터프레임을 csv파일로 변경(cp949)
    item_df.to_csv('item_data.csv', index=False, encoding='cp949', sep=';')
    img_df.to_csv('img_data.csv', index=False, encoding='cp949', sep=';')


if __name__ == '__main__':
    main()
