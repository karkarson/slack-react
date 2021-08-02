## 실행방법

1. npm i
2. back폴더 .env 생성 후 작성 (COOKIE_SECRET과 MYSQL_PASSWORD 비밀번호 설정)
3. config/config.json 설정(MYSQL 접속 설정)
4. npx sequelize db:create(스키마 생성)
5. npm run dev (테이블 row 생성)
6. npx sequelize db:seed:all
7. npm run dev (데이블 데이터 생성, localhost:3095

Issues 탭에 전체적인 프로젝트 설명 있습니다.
