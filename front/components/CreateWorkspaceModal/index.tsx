import React, {useCallback, VFC} from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {Label, Input, Button } from '@pages/SignUp/styles';
import { IUser, IChannel } from '@typings/db';
import fetcher from '@utils/fetcher';
import Modal from '@components/Modal';
import useInput from '@hooks/useInput';

interface Props {
    show: boolean;
    setShowCreateWorkspaceModal: (flag: boolean) => void;
    onCloseModal: () => void;
}

toast.configure();
const CreateWorkspaceMoal: VFC<Props> = ({show, setShowCreateWorkspaceModal, onCloseModal}) => {

    const { data: userData, error, revalidate, mutate } = useSWR<IUser>('/api/users' ,fetcher, {dedupingInterval: 2000});

    const [newWorkspace, onChangeNewWorkspace, setnewWorkspace] = useInput('');
    const [newUrl, onChangeNewUrl, setNewUrl] = useInput('');

    const onCreateWorkspace = useCallback((e)=> {
        e.preventDefault();
        if(!newWorkspace || !newWorkspace.trim()) 
            return toast.error('워크스페이스 이름을 입력해주세요', { position: 'top-center' });
        if(!newUrl || !newUrl.trim())
            return toast.warning('워크스페이스 URL을 입력해주세요', { position: 'top-center' });

        axios.post('/api/workspaces', {workspace: newWorkspace, url: newUrl}, {withCredentials: true})
            .then((response)=>{
                revalidate();
                setShowCreateWorkspaceModal(false);
                setnewWorkspace('');
                setNewUrl('');
            })
            .catch((error)=>{
                console.dir(error.response);
                toast.error(error.response?.data, { position: 'bottom-center' });
                setnewWorkspace('');
                setNewUrl('');
            })
            .finally(()=>{})
    },[newWorkspace, newUrl]);

    if(!show) return null;

    return(
        <Modal show={show} onCloseModal={onCloseModal}>
            <form onSubmit={onCreateWorkspace}>
                <Label id="workspace-label">
                    <span>워크스페이스 이름</span>
                    <Input id="workspace"  value={newWorkspace} onChange={onChangeNewWorkspace} />
                </Label>
                <Label id="workspace-url-label">
                    <span>워크스페이스 url</span>
                    <Input id="workspace"  value={newUrl} onChange={onChangeNewUrl} />
                </Label>
                <Button type="submit">생성하기</Button>
            </form>
        </Modal>
    )
    
}

export default CreateWorkspaceMoal;