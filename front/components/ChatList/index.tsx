import React, { VFC, useCallback, useRef, forwardRef, RefObject, MutableRefObject } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import { ChatZone, Section, StickyHeader } from '@components/ChatList/styles';
import { IDM, IChat, IUser } from '@typings/db';
import Chat from '@components/Chat';

interface Props {
  chatSections: {[key: string]: (IDM | IChat)[]};
  setSize: (f: (size: number) => number) => Promise<(IDM | IChat)[][] | undefined>
  isReachingEnd: boolean;
}

const ChatList = forwardRef<Scrollbars, Props>(({ chatSections, setSize, isReachingEnd }, ref) => {

  const onScroll = useCallback((values) => {
    if(values.scrollTop === 0 && !isReachingEnd){//끝에 도달하면
      console.log('가장 위');
      setSize((prevSize) => prevSize + 1) //페이지 하나 추가
        .then(()=> {
          //스크롤 위치 유지
          const current = (ref as MutableRefObject<Scrollbars>)?.current;
          console.log(current?.getScrollHeight(), values.scrollHeight);
          if (current) {
            current.scrollTop(current.getScrollHeight() - values.scrollHeight);
          }
        });
    }
  },[ref, isReachingEnd, setSize]);

  return (
    <ChatZone>
      <Scrollbars autoHide ref={ref} onScrollFrame={onScroll}>
        
          {Object.entries(chatSections).map(([date, chats])=> {
            return(
              <Section className={`section-${date}`} key={date} >
                <StickyHeader>
                  <button>{date}</button>
                </StickyHeader>
                {chats?.map((chat) => (
                  <Chat key={chat.id} data={chat} />
                ))}
              </Section>
            )
          })}
      </Scrollbars>
    </ChatZone>
  );
})

export default ChatList;
