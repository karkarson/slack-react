import React, { useCallback, VFC } from 'react';
import { useParams } from 'react-router';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useSWR from 'swr'; 

import fetcher from '@utils/fetcher';
import { IUser, IChannel } from '@typings/db';
import {Label, Input, Button } from '@pages/SignUp/styles';
import useInput from '@hooks/useInput';
import Modal from '@components/Modal';

interface Props {
    show: boolean;
    onCloseModal: () => void;
    setShowCreateChannelModal: (flag: boolean) => void;
}

toast.configure();
const CreateChannelModal: VFC<Props> = ({ show, onCloseModal, setShowCreateChannelModal}) => {

    const { workspace, channel } = useParams<{ workspace: string; channel: string }>();
    const [newChannel, onChangeNewChannel, setNewChannel] = useInput('');
    const { data: userData, error, revalidate, mutate } = useSWR<IUser | false>('/api/users' ,fetcher, {dedupingInterval: 2000});
    const { data: channelData, revalidate: revalidateChannel } = useSWR<IChannel[]>(
        userData ? `/api/workspaces/${workspace}/channels`: null, fetcher );

    const onCreateChannel = useCallback((e) => {
        e.preventDefault();
        axios.post(`/api/workspaces/${workspace}/channels`, {name: newChannel}, {withCredentials: true})
            .then((response)=>{
                revalidateChannel();
                setShowCreateChannelModal(false);
                setNewChannel('');
            })
            .catch((error)=>{
                console.dir(error);
                toast.error(error.response?.data, { position: 'bottom-center' });
                setNewChannel('');
            })
            .finally(()=>{})
    },[newChannel])

    return(
        <Modal show={show} onCloseModal={onCloseModal}>
            <form onSubmit={onCreateChannel}>
                <Label id="channel-label">
                    <span>채널</span>
                    <Input id="channel" value={newChannel} onChange={onChangeNewChannel} />
                </Label>
                <Button type="submit">생성하기</Button>
            </form>
        </Modal>
    )
}

export default CreateChannelModal;