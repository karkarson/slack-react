import React, {useCallback, useRef, useEffect, useState} from 'react';
import useSWR, {useSWRInfinite} from 'swr';
import { useParams } from 'react-router';
import axios from 'axios';
import gravatar from 'gravatar';
import Scrollbars from 'react-custom-scrollbars';

import useInput from '@hooks/useInput';
import { Container, Header, DragOver } from '@pages/Channel/styles';
import { IDM, IChannel, IUser, IChat } from '@typings/db';
import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import makeSection from '@utils/makeSection';
import fetcher from '@utils/fetcher';
import useSocket from '@hooks/useSocket';
import InviteChannelModal from '@components/InviteChannelModal';

const Channel = () => {
  
  const { workspace, channel } = useParams<{ workspace: string, channel: string }>();
  const [ chat, onChangeChat, setChat ] = useInput('');

  const { data: myData } = useSWR(`/api/users`, fetcher);
  const { data: chatData, mutate: mutateChat, revalidate, setSize } = useSWRInfinite<IChat[]>(
    (index) => `/api/workspaces/${workspace}/channels/${channel}/chats?perPage=20&page=${index + 1}`, fetcher ); //채팅 받아옴
  // [ [{id: 1}, {id: 2}], [{id: 3}, {id: 4}] ]
  const { data: channelData} = useSWR<IChannel>(`/api/workspaces/${workspace}/channels/${channel}`, fetcher);
  const { data: channelMembersData } = useSWR<IUser[]>(
    myData ? `/api/workspaces/${workspace}/channels/${channel}/members` : null, fetcher );

  const [socket] = useSocket(workspace);
  const [showInviteChannelModal, setShowInviteChannelModal] = useState(false);
  const isEmpty = chatData?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (chatData && chatData[chatData.length - 1]?.length < 20) || false;
  const scrollbarRef = useRef<Scrollbars>(null); //forwardRef
  const [dragOver, setDragOver] = useState(false);

  const onSubmitForm = useCallback((e) => {
    e.preventDefault();
    if(chat?.trim() && chatData && channelData){ //채팅등록
      //optimistic ui
      const savedChat = chat;
      mutateChat((prevChatData) => { 
        prevChatData?.[0].unshift({  //2차원 배열 
          id: (chatData[0][0]?.id || 0) + 1,
          content: savedChat,
          UserId: myData.id,
          User: myData,
          ChannelId: channelData.id,
          Channel: channelData,
          createdAt: new Date(),
        });
        return prevChatData;
      }, false)
        .then(() => {
          setChat('');
          localStorage.setItem(`${workspace}-${channel}`, new Date().getTime().toString());
          scrollbarRef.current?.scrollToBottom();
        });
      axios.post(`/api/workspaces/${workspace}/channels/${channel}/chats`, { content: chat }, {withCredentials: true})
        .then((response)=> {
          revalidate();
          setChat('');
        })
        .catch((error)=> {
          console.dir(error.response);
        })
        .finally(()=> {});
  }},[chat, chatData, myData, channelData, workspace, Channel]);

  const onMessage = useCallback((data: IChat)=> {
    // id는 상대방 아이디 ( 이미지는 옵티미스틱 영향 X -> 허용시킴)
    if (data.Channel.name === channel && (data.content.startsWith('uploads\\') || data.UserId !== myData?.id)) { //내 아이디 아닌 것만 위쪽에 mutate 또 있음
      mutateChat((chatData) => {
        chatData?.[0].unshift(data);
        return chatData;
      }, false).then(() => {
        if (scrollbarRef.current) { // 내가 250px올렸을 때는 남이 채팅을 쳐도 내려가지 않음
          if (
            scrollbarRef.current.getScrollHeight() <
            scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 250
          ) {
            // console.log('scrollToBottom!', scrollbarRef.current?.getValues());
            setTimeout(() => {
              scrollbarRef.current?.scrollToBottom();
            }, 50);
          }
        }
      });
    }
  },[channel, myData]);

  //Channel채팅
  useEffect(()=> {
    socket?.on('message', onMessage);

    return () => {
      socket?.off('message', onMessage);
    }
  },[socket, onMessage]);
  
  useEffect(()=> { //로딩 시 스크롤바 제일 아래로
    if(chatData?.length === 1){
      scrollbarRef.current?.scrollToBottom();
    }
  },[chatData])
  
  const onClickInviteChannel = useCallback(()=> {
    setShowInviteChannelModal(true);
  },[]);

  const onCloseModal = useCallback(()=> {
    setShowInviteChannelModal(false);
  },[]);

  useEffect(() => { //안 읽은 메시지 - 시간 기록
    localStorage.setItem(`${workspace}-${channel}`, new Date().getTime().toString());
  }, [workspace, channel]);

  const onChangeFile = useCallback((e)=> { //이미지 file click
    e.preventDefault();
    console.log("이미지", e);
    const formData = new FormData();
    if (e.target.files) {
      // Use DataTransferItemList interface to access the file(s)
      for (let i = 0; i < e.target.files.length; i++) {
        // If dropped items aren't files, reject them
          const file = e.target.files[i]
          console.log('... file[' + i + '].name = ' + file.name);
          formData.append('image', file);
      }
    }
    axios.post(`/api/workspaces/${workspace}/channels/${channel}/images`, formData).then(() => {
      localStorage.setItem(`${workspace}-${channel}`, new Date().getTime().toString());
      revalidate();
    });
  },[revalidate, workspace, channel])

  const onDrop = useCallback((e) => { //이미지 drag & drop
      e.preventDefault();
      console.log(e);
      const formData = new FormData();
      if (e.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          if (e.dataTransfer.items[i].kind === 'file') {
            const file = e.dataTransfer.items[i].getAsFile();
            console.log(e, '.... file[' + i + '].name = ' + file.name);
            formData.append('image', file);
          }
        }
      } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          console.log(e, '... file[' + i + '].name = ' + e.dataTransfer.files[i].name);
          formData.append('image', e.dataTransfer.files[i]);
        }
      }
      axios.post(`/api/workspaces/${workspace}/channels/${channel}/images`, formData).then(() => {
        setDragOver(false);
        revalidate();
      });
    },[workspace, channel]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    // console.log(e);
    setDragOver(true);
    setTimeout(() => {setDragOver(false)}, 2000);
  },[]);

  if(!myData || !myData) {
    return null;
  }
  
  //immutable chatDate
  const chatSections = makeSection(chatData ? chatData.flat().reverse() : []);
    
  return (
    <Container onDrop={onDrop} onDragOver={onDragOver}>
      <Header>
        <span>#{channel}</span>
          <div className="header-right">
            <span>{channelMembersData?.length}</span>
            <button
              onClick={onClickInviteChannel}
              className="c-button-unstyled p-ia__view_header__button"
              aria-label="Add people to #react-native"
              data-sk="tooltip_parent"
              type="button"
            >
              <i className="c-icon p-ia__view_header__button_icon c-icon--add-user" aria-hidden="true" />
            </button>
          </div>
      </Header>
      <ChatList 
        chatSections={chatSections} 
        ref={scrollbarRef} 
        setSize={setSize} 
        isReachingEnd={isReachingEnd} 
      />
      <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitForm} onChangeFile={onChangeFile}/>
      <InviteChannelModal
        show={showInviteChannelModal}
        onCloseModal={onCloseModal}
        setShowInviteChannelModal={setShowInviteChannelModal}
      />
      {dragOver && <DragOver>업로드</DragOver>}
    </Container>
  );
}

export default Channel;