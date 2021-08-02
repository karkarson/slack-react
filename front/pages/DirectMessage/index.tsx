import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import gravatar from 'gravatar';
import useSWR, { useSWRInfinite } from 'swr';
import axios from 'axios';
import Scrollbars from 'react-custom-scrollbars';

import { IDM } from '@typings/db';
import { Container, Header, DragOver } from '@pages/DirectMessage/styles';
import useInput from '@hooks/useInput';
import fetcher from '@utils/fetcher';
import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import makeSection from '@utils/makeSection';
import useSocket from '@hooks/useSocket';

const DirectMessage = () => {
  
  const { workspace, id } = useParams<{ workspace: string, id: string }>();
  const [ chat, onChangeChat, setChat ] = useInput('');

  const { data: userData } = useSWR(`/api/workspaces/${workspace}/users/${id}`, fetcher ); //해당 아이디 유저
  const { data: myData } = useSWR(`/api/users`, fetcher);
  const { data: chatData, mutate: mutateChat, revalidate, setSize } = useSWRInfinite<IDM[]>(
    (index) => `/api/workspaces/${workspace}/dms/${id}/chats?perPage=20&page=${index + 1}`, fetcher ); //채팅 받아옴
  // [ [{id: 1}, {id: 2}], [{id: 3}, {id: 4}] ]
  const [socket] = useSocket(workspace);
  
  const isEmpty = chatData?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (chatData && chatData[chatData.length - 1]?.length < 20) || false;
  const scrollbarRef = useRef<Scrollbars>(null); //forwardRef
  const [dragOver, setDragOver] = useState(false);

  const onSubmitForm = useCallback((e) => {
    e.preventDefault();
    if(chat?.trim() && chatData){ //채팅등록
      //optimistic ui
      const savedChat = chat;
      mutateChat((prevChatData) => { 
        prevChatData?.[0].unshift({  //2차원 배열 
          id: (chatData[0][0]?.id || 0) + 1,
          content: savedChat,
          SenderId: myData.id,
          Sender: myData,
          ReceiverId: userData.id,
          Receiver: userData,
          createdAt: new Date(),
        });
        return prevChatData;
      }, false)
        .then(() => {
          setChat('');
          localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
          scrollbarRef.current?.scrollToBottom();
        });
      axios.post(`/api/workspaces/${workspace}/dms/${id}/chats`, { content: chat }, {withCredentials: true})
        .then((response)=> {
          revalidate();
        })
        .catch((error)=> {
          console.dir(error.response);
        })
        .finally(()=> {});
  }},[chat, chatData, myData, userData, workspace, id]);

  const onMessage = useCallback((data: IDM)=> {
    // id는 상대방 아이디
    if (data.SenderId === Number(id) && myData.id !== Number(id)) { //내 아이디 아닌 것만 위쪽에 mutate 또 있음
      mutateChat((chatData) => {
        chatData?.[0].unshift(data);
        return chatData;
      }, false).then(() => {
        if (scrollbarRef.current) { // 내가 150px올렸을 때는 남이 채팅을 쳐도 내려가지 않음
          if (
            scrollbarRef.current.getScrollHeight() <
            scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 150
          ) {
            console.log('scrollToBottom!', scrollbarRef.current?.getValues());
            setTimeout(() => {
              scrollbarRef.current?.scrollToBottom();
            }, 50);
          }
        }
      });
    }
  },[]);

  //DM채팅
  useEffect(()=> {
    socket?.on('dm', onMessage);

    return () => {
      socket?.off('dm', onMessage);
    }
  },[socket, id, onMessage]);

  //로딩 시 스크롤바 제일 아래로
  useEffect(()=> {
    if(chatData?.length === 1){
      scrollbarRef.current?.scrollToBottom();
    }
  },[chatData])

  useEffect(() => { //안 읽은 메시지 - 시간 기록
    localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
  }, [workspace, id]);

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
    axios.post(`/api/workspaces/${workspace}/dms/${id}/images`, formData).then(() => {
      localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
      revalidate();
    });
  },[revalidate, workspace, id])

  const onDrop = useCallback((e)=> { //이미지 drag & drop
    e.preventDefault();
    console.log(e);
    const formData = new FormData();
    if (e.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (e.dataTransfer.items[i].kind === 'file') {
          const file = e.dataTransfer.items[i].getAsFile();
          console.log('... file[' + i + '].name = ' + file.name);
          formData.append('image', file);
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        console.log('... file[' + i + '].name = ' + e.dataTransfer.files[i].name);
        formData.append('image', e.dataTransfer.files[i]);
      }
    }
    axios.post(`/api/workspaces/${workspace}/dms/${id}/images`, formData).then(() => {
      localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
      setDragOver(false);
      revalidate();
    });
  },[revalidate, workspace, id]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    // console.log(e);
    setDragOver(true);
    setTimeout(() => {setDragOver(false)}, 2000);
  },[]);

  if(!userData || !myData) {
    return null;
  }
  
  //immutable chatDate
  const chatSections = makeSection(chatData ? [...chatData].flat().reverse() : []);

  return (
    <Container onDrop={onDrop} onDragOver={onDragOver}>
      <Header>
        <img src={gravatar.url(userData.email, { s: '24px', d: 'retro' })} alt={userData.nickname} />
        <span>{userData.nickname}</span>
      </Header>
      <ChatList 
        chatSections={chatSections} 
        ref={scrollbarRef} 
        setSize={setSize} 
        isReachingEnd={isReachingEnd} 
      />
      <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitForm} onChangeFile={onChangeFile}/>
      {dragOver && <DragOver>업로드</DragOver>}
    </Container>
  );
};

export default DirectMessage;
