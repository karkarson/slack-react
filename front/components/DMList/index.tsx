import React, { FC, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import useSWR from 'swr';

import { CollapseButton } from '@components/DMList/styles';
import { IUser, IUserWithOnline } from '@typings/db';
import fetcher from '@utils/fetcher';
import useSocket from '@hooks/useSocket';
import EachDM from '@components/EachDM';

const DMList: FC = () => {
  const { workspace } = useParams<{ workspace?: string }>();
  const { data: userData, error, revalidate, mutate } = useSWR<IUser>('/api/users', fetcher, { dedupingInterval: 2000 });
  const { data: memberData } = useSWR<IUserWithOnline[]>(userData ? `/api/workspaces/${workspace}/members` : null, fetcher );
  const [socket] = useSocket(workspace);
  const [channelCollapse, setChannelCollapse] = useState(false); //목록들
  const [onlineList, setOnlineList] = useState<number[]>([]); //현재 온라인인 사람들 아이디 목록
 
  const toggleChannelCollapse = useCallback(() => {
    setChannelCollapse((prev) => !prev);
  }, []);

  useEffect(() => {
    console.log('DMList: workspace 변경', workspace);
    setOnlineList([]);
  }, [workspace]);

  useEffect(() => { 
    socket?.on('onlineList', (data: number[]) => {
      setOnlineList(data);
    });
    // socket?.on('dm', onMessage);
    // console.log('socket on dm', socket?.hasListeners('dm'), socket);
    return () => {
      // socket?.off('dm', onMessage);
      // console.log('socket off dm', socket?.hasListeners('dm'));
      socket?.off('onlineList');
    };
  }, [socket]);

  return (
    <>
      <h2>
        <CollapseButton collapse={channelCollapse} onClick={toggleChannelCollapse}>
          <i
            className="c-icon p-channel_sidebar__section_heading_expand p-channel_sidebar__section_heading_expand--show_more_feature c-icon--caret-right c-icon--inherit c-icon--inline"
            data-qa="channel-section-collapse"
            aria-hidden="true"
          />
        </CollapseButton>
        <span>Direct Messages</span>
      </h2>
      <div>
        {!channelCollapse &&
          memberData?.map((member) => {
            const isOnline = onlineList.includes(member.id);
            return (
              <EachDM key={member.id} member={member} isOnline={isOnline} />
            );
          })}
      </div>
    </>
  );
};

export default DMList;
