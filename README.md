Issues 탭에 간략한 프로젝트 기능 캡쳐있습니다.
제가 한 부분은 front 폴더 입니다.
## 기술스택
1. React
2. SWR
3. Socket.io
4. Emotion
5. TypeScript
6. Webpack+Babel

## 실행방법
1. npm i
2. back폴더 .env 생성 후 작성 (COOKIE_SECRET과 MYSQL_PASSWORD 비밀번호 설정)
3. config/config.json 설정(MYSQL 접속 설정)
4. npx sequelize db:create(스키마 생성)
5. npm run dev (테이블 row 생성)
6. npx sequelize db:seed:all
7. npm run dev (데이블 데이터 생성, localhost:3095)
```text
p@Login - page폴더 Login
c@ChannelList - components폴더 ChannelList

front(코드 흐름)
├─ p@Login(c@Workspace 이동)
│     └─ p@SignUp
├─ l@Workspace
│      ├─ c@Menu(우측 상단 아이콘 개인정보/로그아웃)
│      ├─ 좌측 워크스페이스 존재여부/생성
│      │                            └─ c@CreateWorkspaceModal
│      ├─ c@Menu(워크스페이스 사용자 초대/ 채널만들기/ 로그아웃)      
│      │               │                     └─ c@CreateChannelModal
│      │               └─ c@InviteWorkspaceModal
│      ├─ c@ChannelList
│      │        └─ c@EachChannel
│      ├─ c@DMList
│      │        └─ c@EachDM
│      ├─ p@Channel
│      │        ├─ c@ChatList
│      │        │       └─ c@Chat
│      │        ├─ c@ChatBox
│      │        └─ c@InviteChannelModal
│      ├─ p@DirectMessage
│      │        ├─ c@ChatList
│      │        │       └─ c@Chat
│      │        └─ c@ChatBox

```
