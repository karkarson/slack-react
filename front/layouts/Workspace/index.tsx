import React, {VFC, useCallback, useState, useEffect} from 'react';
import { Redirect, useParams } from 'react-router';
import { Switch, Route, Link } from 'react-router-dom'
import useSWR from 'swr';
import axios from 'axios';
import gravatar from 'gravatar';

import {AddButton, Channels, Chats, Header, LogOutButton, MenuScroll, ProfileImg, ProfileModal, RightMenu,
    WorkspaceButton, WorkspaceModal, WorkspaceName,  Workspaces, WorkspaceWrapper,} 
    from '@layouts/Workspace/styles';
import fetcher from '@utils/fetcher';
import { IChannel, IUser } from '@typings/db';
import Menu from '@components/Menu';
import CreateWorkspaceModal from '@components/CreateWorkspaceModal';
import CreateChannelModal from '@components/CreateChannelModal';
import InviteWorkspaceModal from '@components/InviteWorkspaceModal';
import ChannelList from '@components/ChannelList';
import DMList from '@components/DMList';
import useSocket from '@hooks/useSocket';
import loadable from '@loadable/component';

const Channel = loadable(() => import('@pages/Channel'));
const DirectMessage = loadable(() => import('@pages/DirectMessage'));

const Workspace: VFC = () => {
    
    const { workspace, channels } = useParams<{workspace: string, channels: string}>();
    const { data: userData, error, mutate, revalidate } = useSWR<IUser | false>('/api/users', fetcher, {dedupingInterval: 2000});
    const { data: channelData } = useSWR<IChannel[]>(userData ? `/api/workspaces/${workspace}/channels` : null, fetcher);

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
    const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
    const [showInviteWorkspaceModal, setShowInviteWorkspaceModal] = useState(false);

    const [socket, disconnect] = useSocket(workspace);
    useEffect(() => {
        if(channelData && userData && socket){
            console.log(socket);
            socket.emit('login', { id: userData.id, channels: channelData.map((v) => v.id) });
        }
    },[socket, channelData, userData]);

    useEffect(() => { //workspace 변경 시 socket 종료
        return () => {
            disconnect();
        }
    },[workspace, disconnect]);

    const onLogout = useCallback(() => {
        console.log('로그아웃');
        axios.post('/api/users/logout', null, {withCredentials: true})
            .then(() => {
                mutate(false, false);
            })
            .catch(()=> {})
            .finally(()=> {});
    },[]);

    const onClickUserProfile = useCallback((e) => { 
        e.stopPropagation();
        setShowUserMenu((prev) => !prev);
    },[]);

    const onClickCreateWorkspace = useCallback(() => { 
        setShowCreateWorkspaceModal(true);
    },[]);

    const toggleWorkspaceModal = useCallback(() => {
        setShowWorkspaceModal((prev) => !prev);
    },[]);

    const onClickAddChannel = useCallback(() => {
        setShowCreateChannelModal(true);
    },[]);

    const onClickInviteWorkspace = useCallback(() => {
        setShowInviteWorkspaceModal((prev) => !prev);
        setShowInviteWorkspaceModal(true);
    },[]);

    const onCloseModal = useCallback(() => {
        setShowCreateWorkspaceModal(false);
        setShowCreateChannelModal(false);
        setShowInviteWorkspaceModal(false);
    },[]);

    if(!userData){
        return <Redirect to="/login" />
    }

    return (
        <div>
            <Header>
                <RightMenu>
                    <span onClick={onClickUserProfile}>
                        <ProfileImg src={gravatar.url(userData.email, { s: '20px', d: 'retro' })} alt={userData.email} />
                        { showUserMenu &&
                            <Menu style={{ right: 0, top: 30 }} show={showUserMenu} onCloseModal={onClickUserProfile}> 
                                <ProfileModal>
                                    <img src={gravatar.url(userData.email, { s: '36px', d: 'retro' })} alt={userData.email} />
                                    <div>
                                        <span id="profile-name">{userData.email}</span>
                                        <span id="profile-active">Active</span>
                                    </div>
                                </ProfileModal>
                                <LogOutButton onClick={onLogout}> 로그아웃 </LogOutButton>
                            </Menu> 
                        }
                    </span>
                </RightMenu>
            </Header>

            <WorkspaceWrapper>
                <Workspaces>
                    {userData?.Workspaces.map((ws) => {
                        return (
                            <Link key={ws.id} to={`/workspace/${ws.url}/channel/일반`}>
                                <WorkspaceButton>{ws.name.slice(0, 1).toUpperCase()}</WorkspaceButton>
                            </Link>
                            );
                    })}
                    <AddButton onClick={onClickCreateWorkspace}>+</AddButton>
                </Workspaces>

                <Channels>
                    <WorkspaceName onClick={toggleWorkspaceModal}>
                        Sleact
                    </WorkspaceName>
                    <MenuScroll>
                        <Menu style={{ top:95, left: 80}} show={showWorkspaceModal} onCloseModal={toggleWorkspaceModal}>
                            <WorkspaceModal>
                                <h2>Sleact</h2>
                                <button onClick={onClickInviteWorkspace}>워크스페이스에 사용자 초대</button>
                                <button onClick={onClickAddChannel}>채널 만들기</button>
                                <button onClick={onLogout}>로그아웃</button>
                            </WorkspaceModal>
                        </Menu>
                        <ChannelList />
                        <DMList />
                        {/* {channelData?.map((v) => (<div>{v.name}</div>))} */}
                    </MenuScroll>
                </Channels>

                <Chats>
                    <Switch>
                        <Route path="/workspace/:workspace/channel/:channel" component={Channel} />
                        <Route path="/workspace/:workspace/dm/:id" component={DirectMessage} />
                    </Switch>
                </Chats>
            </WorkspaceWrapper>

            <CreateWorkspaceModal show={showCreateWorkspaceModal} setShowCreateWorkspaceModal={setShowCreateWorkspaceModal} onCloseModal={onCloseModal} />
            <InviteWorkspaceModal show={showInviteWorkspaceModal} setShowInviteWorkspaceModal={setShowInviteWorkspaceModal} onCloseModal={onCloseModal} />
            <CreateChannelModal show={showCreateChannelModal} setShowCreateChannelModal={setShowCreateChannelModal} onCloseModal={onCloseModal} />
        </div>
    )
}

export default Workspace;