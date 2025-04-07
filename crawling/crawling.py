import time
from datetime import datetime

from selenium import webdriver
from selenium.common import NoSuchElementException, ElementClickInterceptedException
from selenium.webdriver import Keys
from selenium.webdriver.common.by import By

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

# 상품 아이디
item_id = 1

# 상품 테이블 컬럼 리스트
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

# 이미지 아이디
img_id = 1

# 이미지 테이블 컬럼 리스트
img_url_list = []
img_item_id_list = []
img_created_at_list = []
img_updated_at_list = []

# 상품 기본 정보
item_detail = "상품 상세 정보가 없습니다."  # 상품 설명
item_price = 0  # 상품 가격
item_quantity = 10  # 상품 개수
item_sales_count = 0  # 판매 개수
item_status = False  # 논리 삭제 여부

# WebDriver 실행
driver = webdriver.Chrome()

for x in range(len(urls)):
    driver.get(urls[x].get("url"))
    item_category_id = urls[x].get("category_id")
    crawling_type = urls[x].get("type")

    if crawling_type == 0:
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
                print(z, end=' : ')
                try:
                    item_image = driver.find_element(By.XPATH, '/html/body/div[2]/div[7]/div[3]/section[1]/div/div/div[1]/div[2]/div[3]/ol/div/div/li[' + str(z) + ']/span/a/img')
                    item_image.click()

                    time.sleep(3)

                    item_image_url = driver.find_element(By.XPATH, '/html/body/div[2]/div[7]/div[3]/section[1]/div/div/div[1]/div[2]/div[2]/div/div/div[' + str(z) + ']/img').get_attribute('src')

                    print(item_image_url)
                except NoSuchElementException as e:
                    # print(e)
                    pass
            print(
                str(item_id),
                item_name,
                item_detail,
                item_price,
                item_brand,
                item_category_id,
                str(item_quantity),
                str(item_sales_count),
                str(item_status), sep=" | "
            )

            cnt += 1
            idx += 1
            item_id += 1
            driver.back()

    if crawling_type == 1:
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
            # 상품 브랜드
            item_brand = driver.find_element(By.XPATH, '/html/body/div[3]/div[8]/div[2]/div[2]/ul[' + str(h) + ']/li[' + str(idx) + ']/div/div/a/span').text

            item.click()

            for z in range(1, 4):
                time.sleep(3)
                print(z, end=' : ')
                try:
                    item_image = driver.find_element(By.XPATH, '/html/body/div[3]/div[8]/div/div[2]/div[1]/ul/li[' + str(z) + ']/a/img')
                    item_image.click()

                    time.sleep(3)

                    item_image_url = driver.find_element(By.XPATH, '/html/body/div[3]/div[8]/div/div[2]/div[1]/div[1]/img').get_attribute('src')

                    print(item_image_url)
                except NoSuchElementException as e:
                    # print(e)
                    pass

            print(
                str(item_id),
                item_name,
                item_detail,
                item_price,
                item_brand,
                item_category_id,
                str(item_quantity),
                str(item_sales_count),
                str(item_status), sep=" | "
            )

            cnt += 1
            idx += 1
            item_id += 1
            driver.back()

    if crawling_type == 2:
        idx = 1
        cnt = 1
        while cnt < 31:
            time.sleep(3)

            # 상품 선택
            item = driver.find_element(By.XPATH, '/html/body/div[5]/main/section/div[3]/div[1]/ul/li[' + str(idx) + ']/a/div[1]')

            # 상품 이름
            item_name = driver.find_element(By.XPATH, '/html/body/div[5]/main/section/div[3]/div[1]/ul/li[' + str(idx) + ']/a/div[2]/span[2]').text

            # 상품 브랜드
            item_brand = "GALAXY LIFESTYLE"

            item.click()

            for z in range(1, 4):
                time.sleep(3)
                print(z, end=' : ')
                try:
                    item_image = driver.find_element(By.XPATH, '/html/body/div[5]/main/section/div[2]/div[1]/div[1]/div[' + str(z) + ']/button')
                    item_image.click()

                    time.sleep(3)

                    item_image_url = driver.find_element(By.XPATH, '/html/body/div[5]/main/section/div[2]/div[1]/div[2]/div[2]/div[' + str(z) + ']/img').get_attribute('src')

                    print(item_image_url)
                except NoSuchElementException as e:
                    # print(e)
                    pass

            print(
                str(item_id),
                item_name,
                item_detail,
                item_price,
                item_brand,
                item_category_id,
                str(item_quantity),
                str(item_sales_count),
                str(item_status), sep=" | "
            )

            cnt += 1
            idx += 1
            item_id += 1
            driver.back()

    if crawling_type == 3:
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
                print(z, end=' : ')
                try:
                    item_image = driver.find_element(By.XPATH, '/html/body/div[1]/div/section/div[1]/div/div[2]/div[1]/div[2]/div[1]/div[' + str(z) + ']')
                    item_image.click()

                    time.sleep(3)

                    item_image_url = driver.find_element(By.XPATH, '/html/body/div[1]/div/section/div[1]/div/div[2]/div[1]/div[1]/div[1]/div[1]/div[' + str(z) + ']/img').get_attribute('src')
                    print(item_image_url)
                except (ElementClickInterceptedException, NoSuchElementException):
                    try:
                        item_image_url = driver.find_element(By.XPATH, '/html/body/div[1]/div/section/div[1]/div/div[2]/div[1]/div[1]/div[1]/div[1]/div[' + str(z) + ']/img').get_attribute('src')
                        print(item_image_url)
                    except (ElementClickInterceptedException, NoSuchElementException):
                        pass

            print(
                str(item_id),
                item_name,
                item_detail,
                item_price,
                item_brand,
                item_category_id,
                str(item_quantity),
                str(item_sales_count),
                str(item_status), sep=" | "
            )

            cnt += 1
            idx += 1
            item_id += 1
            driver.back()

    if crawling_type == 4:
        h = 1
        idx = 1
        cnt = 1
        scroll_point = 0

        driver.maximize_window()

        try:
            driver.find_element(By.XPATH, '/html/body/div[1]/div[3]/div/button/img').click()
            element = driver.find_element(By.XPATH, '/html/body/div[1]/div/div[2]/button[2]')
            element.send_keys(Keys.ENTER)
        except NoSuchElementException as e:
            pass

        while cnt < 31:

            # if idx % 2 == 1:
            #     driver.execute_script(f'window.scrollBy({scroll_point}, {scroll_point + 500});')
            #     scroll_point += 500

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

            item.click()

            time.sleep(5)

            print(1, end=' : ')
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
            print(item_image_url)

            print(
                str(item_id),
                item_name,
                item_detail,
                item_price,
                item_brand,
                item_category_id,
                str(item_quantity),
                str(item_sales_count),
                str(item_status), sep=" | "
            )

            cnt += 1
            idx += 1
            item_id += 1
            driver.back()

driver.quit()
