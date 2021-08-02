import React, { VFC, memo, useMemo } from 'react';
import gravatar from 'gravatar';
import dayjs from 'dayjs';
import regexifyString from 'regexify-string';
import { Link, useParams } from 'react-router-dom';

import { IDM, IChat } from '@typings/db';
import {ChatWrapper} from '@components/Chat/styles';

interface Props {
  data: (IDM | IChat);
}

const BACK_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:3095' : '';
const Chat: VFC<Props> = ({ data }) => {

  const { workspace } = useParams<{ workspace: string; channel: string }>();
  //const user = data.Sender;
  const user = 'Sender' in data ? data.Sender : data.User; //DM 에 들어 있을 경우 sender 아니면 User 타입가드

  //@[유저1](1)
  const result = useMemo(()=> 
    data.content.startsWith('uploads\\') ? (
      <img src={`${BACK_URL}/${data.content}`} style={{maxHeight: 200}} />
    ) : ( 
      regexifyString({ 
    input: data.content, 
    pattern: /@\[(.+?)\]\((\d+?)\)|\n/g, //아이디 + 줄바꿈
    decorator(match, index){
      const arr: string[] | null = match.match( /@\[(.+?)\]\((\d+?)\)/ )!; //아이디 부분
      if(arr){
        return (
          <Link key={match + index} to={`/workspace/${workspace}/dm/${arr[2]}`}>
            @{arr[1]}
          </Link>
        )
      }
      return <br key={index} /> //아이디가 아니면 줄바꿈
    },
  })),[workspace, data.content]);

  return (
    <ChatWrapper>
      <div className="chat-img">
        <img src={gravatar.url(user.email, { s: '36px', d: 'retro' })} alt={user.nickname} />
      </div>
      <div className="chat-text">
        <div className="chat-user">
          <b>{user.nickname}</b>{'\u00A0'}
          {/* <span>{dayjs(data.createdAt).format('h:mm A')}</span> */}
          <span>{dayjs(data.createdAt).format('h:mm A')}</span>
        </div>
        {/* <p>{result}</p> */}
        <p>{result}</p>
      </div>
    </ChatWrapper>
  );
};

export default memo(Chat);

